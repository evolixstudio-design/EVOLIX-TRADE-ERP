import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreatePosSaleDto } from './dto/create-pos-sale.dto';
import { CreatePosReturnDto } from './dto/create-pos-return.dto';
import { OpenShiftDto, CloseShiftDto } from './dto/shift.dto';
import { HoldBillDto } from './dto/hold-bill.dto';
import { InventoryPostingService } from '../inventory/posting.service';
import { PostingService as AccountingPostingService } from '../accounting/posting.service';
import { PricingEngineService } from '../pricing/pricing-engine.service';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class PosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryPostingService,
    private readonly accounting: AccountingPostingService,
    private readonly pricingEngine: PricingEngineService,
  ) {}

  async lookupItemByBarcode(companyId: string, sku: string) {
    const code = (sku || '').trim();
    if (!code) throw new BadRequestException('Barcode or SKU cannot be empty');

    // 1. Check canonical ItemBarcode table first
    const barcodeRecord = await this.prisma.itemBarcode.findFirst({
      where: { company_id: companyId, barcode: code, is_active: true },
      include: {
        item: {
          include: { primary_unit: true, tax_class: true }
        }
      }
    });

    if (barcodeRecord && barcodeRecord.item) {
      if (!barcodeRecord.item.is_active) {
        throw new BadRequestException('Item not found or inactive');
      }
      return barcodeRecord.item;
    }

    // 2. Fallback to Item.sku for backward compatibility
    const item = await this.prisma.item.findFirst({
      where: { company_id: companyId, sku: code, is_active: true },
      include: { primary_unit: true, tax_class: true }
    });
    if (!item) throw new BadRequestException('Item not found or inactive');
    return item;
  }

  async postPosSale(companyId: string, userId: string, dto: CreatePosSaleDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Validation & Setup
      const branch = await tx.branch.findUnique({ where: { id: dto.branch_id } });
      if (!branch || branch.company_id !== companyId) {
        throw new BadRequestException('Branch not found or belongs to another company');
      }

      let partyId = dto.party_id;

      // Handle walk-in customer if party_id is not provided
      if (!partyId) {
        let walkInParty = await tx.party.findFirst({
          where: { company_id: companyId, is_walkin: true }
        });
        if (!walkInParty) {
          walkInParty = await tx.party.create({
            data: {
              company_id: companyId,
              code: 'WALKIN',
              party_type: 'CUSTOMER',
              name: 'Walk-in Customer',
              is_walkin: true,
              is_active: true
            }
          });
        }
        partyId = walkInParty.id;
      } else {
        const party = await tx.party.findUnique({ where: { id: partyId } });
        if (!party || party.company_id !== companyId) {
          throw new BadRequestException('Party not found or belongs to another company');
        }
      }

      // Configuration fallback for ledgers (optional but recommended for POS)
      const config = await tx.companyConfiguration.findUnique({ where: { company_id: companyId } });
      const defaultCashLedgerId = config?.default_cash_ledger_id;
      const defaultBankLedgerId = config?.default_bank_ledger_id;

      // Ensure idempotency - if a unique document number is passed, check it. (Assuming auto-gen if not passed)
      // Note: The UI might generate an idempotency key, but we'll use document_number here for simplicity.
      
      let taxableAmount = new Prisma.Decimal(0);
      let taxAmount = new Prisma.Decimal(0);
      let discountAmount = new Prisma.Decimal(0);
      let grandTotal = new Prisma.Decimal(0);

      const invoiceLinesData = [];
      const inventoryLines = [];
      const linePricingResults: any[] = [];

      for (const line of dto.lines) {
        const item = await tx.item.findUnique({ where: { id: line.item_id } });
        if (!item || item.company_id !== companyId) throw new BadRequestException(`Item ${line.item_id} invalid`);

        const godown = await tx.godown.findUnique({ where: { id: line.godown_id } });
        if (!godown || godown.branch_id !== dto.branch_id) throw new BadRequestException(`Godown ${line.godown_id} invalid`);

        const lineQty = new Prisma.Decimal(line.quantity);
        const pricingRes = await this.pricingEngine.calculateLinePricing(
          companyId,
          partyId,
          {
            itemId: line.item_id,
            quantity: lineQty,
            unitId: line.unit_id,
            overrideRate: line.rate !== undefined && Number(line.rate) > 0 ? line.rate : undefined,
            overrideDiscountAmount: line.discount_amount !== undefined && Number(line.discount_amount) > 0 ? line.discount_amount : undefined,
          },
          { branchId: dto.branch_id, documentDate: dto.document_date, isPos: true },
          tx,
        );

        // Simple 0 tax implementation for now (could integrate tax service)
        const lineTax = new Prisma.Decimal(0); 
        const lineTotal = pricingRes.taxableValue.add(lineTax);

        taxableAmount = taxableAmount.add(pricingRes.taxableValue);
        taxAmount = taxAmount.add(lineTax);
        discountAmount = discountAmount.add(pricingRes.discountAmount);
        grandTotal = grandTotal.add(lineTotal);

        linePricingResults.push(pricingRes);

        const lineId = randomUUID();

        invoiceLinesData.push({
          id: lineId,
          item_id: line.item_id,
          godown_id: line.godown_id,
          unit_id: line.unit_id,
          quantity: lineQty,
          free_quantity: pricingRes.freeQuantity,
          rate: pricingRes.resolvedRate,
          discount_amount: pricingRes.discountAmount,
          taxable_value: pricingRes.taxableValue,
          tax_amount: lineTax,
          line_total: lineTotal,
          pricing_trace_json: JSON.stringify(pricingRes.pricingTrace),
        });

        // Add paid + free quantity for inventory deduction
        const totalQtyForInventory = lineQty.add(pricingRes.freeQuantity);
        inventoryLines.push({
          item_id: line.item_id,
          godown_id: line.godown_id,
          quantity: totalQtyForInventory.toString(),
          unit_id: line.unit_id,
          source_line_id: lineId,
          cost_rate: 0
        });

        if (pricingRes.promotionalLines) {
          for (const pline of pricingRes.promotionalLines) {
            const pLineId = randomUUID();
            invoiceLinesData.push({
              id: pLineId,
              item_id: pline.itemId,
              godown_id: line.godown_id, // Alternate item pulled from same godown by default
              unit_id: pline.unitId || line.unit_id,
              quantity: pline.originalQuantity,
              free_quantity: pline.freeQuantity,
              rate: pline.resolvedRate,
              discount_amount: pline.discountAmount,
              taxable_value: pline.taxableValue,
              tax_amount: new Prisma.Decimal(0),
              line_total: pline.lineTotal,
              pricing_trace_json: JSON.stringify(pline.pricingTrace),
            });
            linePricingResults.push(pline as any);

            // Free items must be deducted from inventory
            inventoryLines.push({
              item_id: pline.itemId,
              godown_id: line.godown_id,
              quantity: pline.freeQuantity.toString(),
              unit_id: pline.unitId || line.unit_id,
              source_line_id: pLineId,
              cost_rate: 0
            });
          }
        }
      }

      // Check payment matches
      const paymentTotal = dto.payments.reduce((acc, p) => acc.add(new Prisma.Decimal(p.amount)), new Prisma.Decimal(0));
      if (paymentTotal.gt(grandTotal)) {
        throw new BadRequestException(`Payment total (${paymentTotal.toString()}) exceeds invoice total (${grandTotal.toString()}).`);
      }
      // Find active financial year (or just first one for simplicity in this POS context)
      const fy = await tx.financialYear.findFirst({ where: { company_id: companyId } });
      if (!fy) throw new BadRequestException('No financial year found');

      // 2. Create POS SalesInvoice
      const docDate = new Date(dto.document_date);
      const invoicePayload = {
        data: {
          company_id: companyId,
          branch_id: dto.branch_id,
          financial_year_id: fy.id,
          party_id: partyId,
          document_number: `POS-${Date.now()}`,
          document_date: docDate,
          status: 'POSTED',
          is_pos: true,
          walkin_name: dto.walkin_name,
          walkin_phone: dto.walkin_phone,
          taxable_amount: taxableAmount,
          tax_amount: taxAmount,
          discount_amount: discountAmount,
          grand_total: grandTotal,
          paid_amount: paymentTotal,
          posted_at: new Date(),
          posted_by: userId,
          lines: {
            create: invoiceLinesData
          }
        },
        include: { lines: true }
      };
      const invoice = await tx.salesInvoice.create(invoicePayload as any);

      // Record immutable pricing traces
      await tx.pricingTrace.createMany({
        data: invoiceLinesData.map((il: any, idx: number) => {
          const t = linePricingResults[idx].pricingTrace;
          return {
            company_id: companyId,
            document_type: 'POS_SALE',
            document_id: invoice.id,
            line_id: il.id,
            item_id: t.itemId,
            party_id: t.partyId ?? null,
            pricing_engine_version: t.pricingEngineVersion,
            base_price: new Prisma.Decimal(t.basePrice),
            resolved_rate: new Prisma.Decimal(t.resolvedRate),
            price_list_id: t.priceListId ?? null,
            price_list_item_id: t.priceListItemId ?? null,
            customer_rate_id: t.customerRateId ?? null,
            quantity_slab_id: t.quantitySlabId ?? null,
            promotion_id: t.promotionId ?? null,
            original_quantity: new Prisma.Decimal(t.originalQuantity),
            charged_quantity: new Prisma.Decimal(t.chargedQuantity),
            free_quantity: new Prisma.Decimal(t.freeQuantity),
            discount_amount: new Prisma.Decimal(t.discountAmount),
            discount_percent: new Prisma.Decimal(t.discountPercent),
            final_unit_price: new Prisma.Decimal(t.finalUnitPrice),
            final_line_amount: new Prisma.Decimal(t.finalLineAmount),
            precedence_reason: t.precedenceReason,
            trace_details_json: JSON.stringify(t),
          };
        }),
      });

      // 3. Post Inventory
      await this.inventory.postMovement(tx, {
        company_id: invoice.company_id,
        branch_id: invoice.branch_id,
        movement_type: 'SALES_OUT',
        business_date: invoice.document_date,
        source_document_type: 'SALES_INVOICE',
        source_document_id: invoice.id,
        lines: inventoryLines
      });

      // 4. Post Accounting for Sale
      let partyAccount = await tx.ledgerAccount.findFirst({
        where: { party_id: partyId, company_id: companyId }
      });
      if (!partyAccount) {
        // If it was dynamically created walk-in or missing, create one
        partyAccount = await tx.ledgerAccount.create({
          data: {
            company_id: companyId,
            branch_id: invoice.branch_id,
            party_id: partyId,
            code: `WALKIN_AR_${Date.now()}`,
            name: 'Walk-in Customer AR',
            account_type: 'ASSET',
            normal_balance: 'DEBIT',
            is_active: true
          }
        });
      }

      let salesAccount = await tx.ledgerAccount.findFirst({
        where: { code: 'SALES_REVENUE', company_id: companyId }
      });
      if (!salesAccount) {
        salesAccount = await tx.ledgerAccount.create({
          data: {
            company_id: companyId,
            branch_id: invoice.branch_id,
            code: 'SALES_REVENUE',
            name: 'Sales Revenue',
            account_type: 'REVENUE',
            normal_balance: 'CREDIT',
            is_system: true,
            is_active: true
          }
        });
      }

      const salesVoucherLines = [];
      salesVoucherLines.push({
        ledger_account_id: partyAccount.id,
        party_id: partyId,
        debit: grandTotal.toNumber(),
        credit: 0
      });
      salesVoucherLines.push({
        ledger_account_id: salesAccount.id,
        debit: 0,
        credit: taxableAmount.toNumber()
      });
      
      if (Number(invoice.tax_amount) > 0) {
        let taxAccount = await tx.ledgerAccount.findFirst({
          where: { code: 'OUTPUT_GST', company_id: companyId }
        });
        if (!taxAccount) {
          taxAccount = await tx.ledgerAccount.create({
            data: {
              company_id: companyId,
              branch_id: invoice.branch_id,
              code: 'OUTPUT_GST',
              name: 'Output GST',
              account_type: 'LIABILITY',
              normal_balance: 'CREDIT',
              is_system: true,
              is_active: true
            }
          });
        }
        salesVoucherLines.push({
          ledger_account_id: taxAccount.id,
          debit: 0,
          credit: Number(invoice.tax_amount)
        });
      }

      const salesVoucher = await this.accounting.postVoucher(tx, {
        company_id: invoice.company_id,
        branch_id: invoice.branch_id,
        financial_year_id: invoice.financial_year_id,
        voucher_type: 'SALES',
        document_number: invoice.document_number,
        voucher_date: invoice.document_date,
        source_document_type: 'SALES_INVOICE',
        source_document_id: invoice.id,
        narration: `POS Sale ${invoice.document_number}`,
        posted_by: userId,
        lines: salesVoucherLines
      });

      const customerSalesVoucherLine = salesVoucher.lines.find(l => l.ledger_account_id === partyAccount.id);
      
      let billAllocation;
      if (customerSalesVoucherLine) {
        billAllocation = await tx.billAllocation.create({
          data: {
            company_id: invoice.company_id,
            party_id: invoice.party_id,
            voucher_line_id: customerSalesVoucherLine.id,
            reference_document_type: 'SALES_INVOICE',
            reference_document_id: invoice.id,
            allocation_type: 'NEW_REFERENCE',
            amount: invoice.grand_total,
            due_date: invoice.document_date
          }
        });
      }

      // 5. Post Payments (Receipt Voucher)
      const receiptVoucherLines = [];
      for (const payment of dto.payments) {
        let paymentLedgerId;
        if (payment.payment_method === 'CASH') {
          if (defaultCashLedgerId) {
            paymentLedgerId = defaultCashLedgerId;
          } else {
            let cashAcc = await tx.ledgerAccount.findFirst({ where: { code: 'CASH_IN_HAND', company_id: companyId } });
            if (!cashAcc) cashAcc = await tx.ledgerAccount.create({ data: { company_id: companyId, branch_id: invoice.branch_id, code: 'CASH_IN_HAND', name: 'Cash in Hand', account_type: 'ASSET', normal_balance: 'DEBIT', is_system: true, is_active: true } });
            paymentLedgerId = cashAcc.id;
          }
        } else if (payment.payment_method === 'BANK') {
          if (defaultBankLedgerId) {
            paymentLedgerId = defaultBankLedgerId;
          } else {
            let bankAcc = await tx.ledgerAccount.findFirst({ where: { code: 'DEFAULT_BANK', company_id: companyId } });
            if (!bankAcc) bankAcc = await tx.ledgerAccount.create({ data: { company_id: companyId, branch_id: invoice.branch_id, code: 'DEFAULT_BANK', name: 'Default Bank', account_type: 'ASSET', normal_balance: 'DEBIT', is_system: true, is_active: true } });
            paymentLedgerId = bankAcc.id;
          }
        }

        if (!paymentLedgerId) throw new BadRequestException('Payment ledger not configured');

        receiptVoucherLines.push({
          ledger_account_id: paymentLedgerId,
          debit: Number(payment.amount),
          credit: 0
        });
      }

      if (paymentTotal.gt(0)) {
        receiptVoucherLines.push({
          ledger_account_id: partyAccount.id,
          party_id: partyId,
          debit: 0,
          credit: paymentTotal.toNumber()
        });

        const receiptVoucher = await this.accounting.postVoucher(tx, {
          company_id: invoice.company_id,
          branch_id: invoice.branch_id,
          financial_year_id: invoice.financial_year_id,
          voucher_type: 'RECEIPT',
          document_number: `RCPT-${Date.now()}`,
          voucher_date: invoice.document_date,
          source_document_type: 'POS_RECEIPT',
          source_document_id: invoice.id,
          narration: `POS Payment for ${invoice.document_number}`,
          posted_by: userId,
          lines: receiptVoucherLines
        });

        const customerReceiptVoucherLine = receiptVoucher.lines.find(l => l.ledger_account_id === partyAccount.id);

        // Allocate the receipt against the sales invoice
        if (customerReceiptVoucherLine) {
          await tx.billAllocation.create({
            data: {
              company_id: invoice.company_id,
              party_id: invoice.party_id,
              voucher_line_id: customerReceiptVoucherLine.id,
              reference_document_type: 'SALES_INVOICE',
              reference_document_id: invoice.id,
              allocation_type: 'AGAINST_REFERENCE',
              amount: paymentTotal,
              due_date: invoice.document_date
            }
          });
        }
      }

      await tx.auditLog.create({
        data: {
          company_id: invoice.company_id,
          branch_id: invoice.branch_id,
          user_id: userId,
          action: 'POS_SALE_POSTED',
          source_document_type: 'SALES_INVOICE',
          source_document_id: invoice.id,
          affected_voucher_id: salesVoucher.id,
        }
      });

      return invoice;
    });
  }

  async getCurrentShift(companyId: string, branchId: string, userId: string) {
    return this.prisma.posShift.findFirst({
      where: { company_id: companyId, branch_id: branchId, user_id: userId, status: 'OPEN' }
    });
  }

  async openShift(companyId: string, userId: string, dto: OpenShiftDto) {
    const existing = await this.getCurrentShift(companyId, dto.branch_id, userId);
    if (existing) throw new BadRequestException('A shift is already open for this user in this branch');

    return this.prisma.posShift.create({
      data: {
        company_id: companyId,
        branch_id: dto.branch_id,
        user_id: userId,
        status: 'OPEN',
        opening_balance: dto.opening_balance || 0,
        notes: dto.notes
      }
    });
  }

  async closeShift(shiftId: string, companyId: string, userId: string, dto: CloseShiftDto) {
    const shift = await this.prisma.posShift.findUnique({ where: { id: shiftId } });
    if (!shift || shift.company_id !== companyId || shift.user_id !== userId) {
      throw new ForbiddenException('Shift not found or unauthorized');
    }
    if (shift.status === 'CLOSED') {
      throw new BadRequestException('Shift is already closed');
    }

    // In a real scenario, expected_balance is calculated by summing cash sales during shift
    const expected_balance = shift.opening_balance;
    const closing_balance = dto.closing_balance || expected_balance;
    const variance = new Prisma.Decimal(closing_balance).sub(expected_balance);

    return this.prisma.posShift.update({
      where: { id: shiftId },
      data: {
        status: 'CLOSED',
        closed_at: new Date(),
        closing_balance,
        expected_balance,
        variance,
        notes: dto.notes
      }
    });
  }

  async getHeldBills(companyId: string, branchId: string, userId: string) {
    return this.prisma.posHeldBill.findMany({
      where: { company_id: companyId, branch_id: branchId, user_id: userId },
      include: { lines: true },
      orderBy: { created_at: 'desc' }
    });
  }

  async holdBill(companyId: string, userId: string, dto: HoldBillDto) {
    let grandTotal = new Prisma.Decimal(0);
    const lines = dto.lines.map(l => {
      const lineTotal = new Prisma.Decimal(l.quantity).mul(l.rate).sub(l.discount_amount || 0);
      grandTotal = grandTotal.add(lineTotal);
      return {
        item_id: l.item_id,
        godown_id: l.godown_id,
        unit_id: l.unit_id,
        quantity: l.quantity,
        rate: l.rate,
        discount_amount: l.discount_amount || 0
      };
    });

    return this.prisma.posHeldBill.create({
      data: {
        company_id: companyId,
        branch_id: dto.branch_id,
        user_id: userId,
        reference_name: dto.reference_name,
        grand_total: grandTotal,
        lines: {
          create: lines
        }
      },
      include: { lines: true }
    });
  }

  async resumeBill(heldBillId: string, companyId: string, userId: string) {
    const bill = await this.prisma.posHeldBill.findUnique({ where: { id: heldBillId }, include: { lines: true } });
    if (!bill || bill.company_id !== companyId || bill.user_id !== userId) {
      throw new ForbiddenException('Held bill not found or unauthorized');
    }

    await this.prisma.posHeldBill.delete({ where: { id: heldBillId } });
    return bill;
  }

  async postPosReturn(companyId: string, userId: string, dto: CreatePosReturnDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Setup & validation
      const docDate = new Date(dto.document_date);
      let taxableAmount = new Prisma.Decimal(0);
      let taxAmount = new Prisma.Decimal(0);
      let grandTotal = new Prisma.Decimal(0);
      const returnLinesData = [];
      const inventoryLines = [];

      for (const line of dto.lines) {
        const lineQty = new Prisma.Decimal(line.quantity);
        const lineRate = new Prisma.Decimal(line.rate);
        const taxableValue = lineQty.mul(lineRate).sub(line.discount_amount || 0);
        const lineTax = new Prisma.Decimal(0); // Assuming 0 tax for now
        const lineTotal = taxableValue.add(lineTax);

        taxableAmount = taxableAmount.add(taxableValue);
        taxAmount = taxAmount.add(lineTax);
        grandTotal = grandTotal.add(lineTotal);

        const lineId = randomUUID();
        returnLinesData.push({
          id: lineId,
          item_id: line.item_id,
          godown_id: line.godown_id,
          unit_id: line.unit_id,
          quantity: lineQty,
          rate: lineRate,
          taxable_value: taxableValue,
          tax_amount: lineTax,
          line_total: lineTotal
        });

        inventoryLines.push({
          item_id: line.item_id,
          godown_id: line.godown_id,
          quantity: lineQty.toString(),
          unit_id: line.unit_id,
          source_line_id: lineId,
          cost_rate: 0
        });
      }

      const fy = await tx.financialYear.findFirst({ where: { company_id: companyId } });
      if (!fy) throw new BadRequestException('No financial year found');

      let partyId = dto.party_id;
      if (!partyId) {
        let walkInParty = await tx.party.findFirst({ where: { company_id: companyId, is_walkin: true } });
        if (!walkInParty) {
          walkInParty = await tx.party.create({
            data: { company_id: companyId, code: 'WALKIN', party_type: 'CUSTOMER', name: 'Walk-in Customer', is_walkin: true, is_active: true }
          });
        }
        partyId = walkInParty.id;
      }

      // 2. Create Sales Return
      const sr = await tx.salesReturn.create({
        data: {
          company_id: companyId,
          branch_id: dto.branch_id,
          financial_year_id: fy.id,
          party_id: partyId,
          original_invoice_id: dto.original_invoice_id,
          document_number: `POS-RET-${Date.now()}`,
          document_date: docDate,
          status: 'POSTED',
          taxable_amount: taxableAmount,
          tax_amount: taxAmount,
          grand_total: grandTotal,
          posted_at: new Date(),
          posted_by: userId,
          lines: { create: returnLinesData }
        },
        include: { lines: true }
      });

      // 3. Post Inventory Return
      await this.inventory.postMovement(tx, {
        company_id: sr.company_id,
        branch_id: sr.branch_id,
        movement_type: 'SALES_RETURN_IN',
        business_date: sr.document_date,
        source_document_type: 'SALES_RETURN',
        source_document_id: sr.id,
        lines: inventoryLines
      });

      // 4. Accounting Reversal (CR Party, DR Sales Returns, DR Tax)
      const partyAccount = await tx.ledgerAccount.findFirst({ where: { party_id: partyId, company_id: companyId } });
      const salesAccount = await tx.ledgerAccount.findFirst({ where: { code: 'SALES_REVENUE', company_id: companyId } });
      if (!partyAccount || !salesAccount) throw new BadRequestException('Ledger accounts missing');

      const voucherLines = [];
      voucherLines.push({ ledger_account_id: partyAccount.id, party_id: partyId, debit: 0, credit: grandTotal.toNumber() });
      voucherLines.push({ ledger_account_id: salesAccount.id, debit: taxableAmount.toNumber(), credit: 0 });

      if (Number(sr.tax_amount) > 0) {
        const taxAccount = await tx.ledgerAccount.findFirst({ where: { code: 'OUTPUT_GST', company_id: companyId } });
        if (taxAccount) {
          voucherLines.push({ ledger_account_id: taxAccount.id, debit: Number(sr.tax_amount), credit: 0 });
        }
      }

      const returnVoucher = await this.accounting.postVoucher(tx, {
        company_id: sr.company_id,
        branch_id: sr.branch_id,
        financial_year_id: sr.financial_year_id,
        voucher_type: 'SALES_RETURN',
        document_number: sr.document_number,
        voucher_date: sr.document_date,
        source_document_type: 'SALES_RETURN',
        source_document_id: sr.id,
        narration: `POS Sales Return ${sr.document_number}`,
        posted_by: userId,
        lines: voucherLines
      });

      // 5. Bill Allocation
      const customerVoucherLine = returnVoucher.lines.find(l => l.ledger_account_id === partyAccount.id);
      if (customerVoucherLine) {
        await tx.billAllocation.create({
          data: {
            company_id: sr.company_id,
            party_id: sr.party_id,
            voucher_line_id: customerVoucherLine.id,
            reference_document_type: sr.original_invoice_id ? 'SALES_INVOICE' : 'SALES_RETURN',
            reference_document_id: sr.original_invoice_id || sr.id,
            allocation_type: sr.original_invoice_id ? 'AGAINST_REFERENCE' : 'NEW_REFERENCE',
            amount: sr.grand_total,
            due_date: sr.document_date
          }
        });
      }

      await tx.auditLog.create({
        data: {
          company_id: sr.company_id,
          branch_id: sr.branch_id,
          user_id: userId,
          action: 'POS_RETURN_POSTED',
          source_document_type: 'SALES_RETURN',
          source_document_id: sr.id,
          affected_voucher_id: returnVoucher.id,
        }
      });

      return sr;
    });
  }
}
