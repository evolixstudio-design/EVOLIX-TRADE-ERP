import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { InventoryPostingService } from '../inventory/posting.service';
import { PostingService as AccountingPostingService } from '../accounting/posting.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SalesPostingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryPostingService,
    private readonly accounting: AccountingPostingService,
  ) {}

  // --- Delivery Challan ---

  async postDeliveryChallan(companyId: string, challanId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const challan = await tx.deliveryChallan.findUnique({
        where: { id: challanId },
        include: { lines: true }
      });

      if (!challan) throw new BadRequestException('Delivery Challan not found');
      if (challan.company_id !== companyId) throw new ForbiddenException('Isolation violation');
      if (challan.status === 'DISPATCHED') throw new BadRequestException('Challan is already posted');
      if (challan.status === 'CANCELLED') throw new BadRequestException('Cannot post cancelled challan');

      // Over-delivery check
      for (const line of challan.lines) {
        if (line.sales_order_line_id) {
          const dispatched = await tx.deliveryChallanLine.aggregate({
            where: {
              sales_order_line_id: line.sales_order_line_id,
              delivery_challan: { status: 'DISPATCHED' }
            },
            _sum: { dispatched_quantity: true }
          });
          const orderLine = await tx.salesOrderLine.findUnique({ where: { id: line.sales_order_line_id } });
          if (orderLine) {
            const alreadyDispatched = dispatched._sum.dispatched_quantity || new Prisma.Decimal(0);
            const total = new Prisma.Decimal(alreadyDispatched).add(new Prisma.Decimal(line.dispatched_quantity));
            if (total.gt(new Prisma.Decimal(orderLine.ordered_quantity))) {
              throw new BadRequestException('Cannot exceed ordered quantity');
            }
          }
        }
      }


      // Post Inventory (SALES_OUT)
      await this.inventory.postMovement(tx, {
        company_id: challan.company_id,
        branch_id: challan.branch_id,
        movement_type: 'SALES_OUT',
        business_date: challan.document_date,
        source_document_type: 'DELIVERY_CHALLAN',
        source_document_id: challan.id,
        lines: challan.lines.map(l => ({
          item_id: l.item_id,
          godown_id: l.godown_id,
          quantity: l.dispatched_quantity.toString(),
          unit_id: l.unit_id,
          source_line_id: l.id,
          cost_rate: 0
        }))
      });

      return tx.deliveryChallan.update({
        where: { id: challan.id },
        data: {
          status: 'DISPATCHED',
          posted_at: new Date(),
          posted_by: userId
        },
        include: { lines: true }
      });
    });
  }

  // --- Sales Invoice ---

  async postSalesInvoice(companyId: string, invoiceId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.salesInvoice.findUnique({
        where: { id: invoiceId },
        include: { lines: true }
      });

      if (!invoice) throw new BadRequestException('Invoice not found');
      if (invoice.company_id !== companyId) throw new ForbiddenException('Cannot access invoice from another company');
      if (invoice.status === 'POSTED') throw new BadRequestException('Invoice is already posted');
      if (invoice.status === 'CANCELLED') throw new BadRequestException('Cannot post cancelled invoice');

      // Post Inventory ONLY for lines not linked to a Challan
      const retailLines = invoice.lines.filter(l => !l.delivery_challan_line_id);
      if (retailLines.length > 0) {
        await this.inventory.postMovement(tx, {
          company_id: invoice.company_id,
          branch_id: invoice.branch_id,
          movement_type: 'SALES_OUT',
          business_date: invoice.document_date,
          source_document_type: 'SALES_INVOICE',
          source_document_id: invoice.id,
          lines: retailLines.map(l => ({
            item_id: l.item_id,
            godown_id: l.godown_id,
            quantity: l.quantity.toString(),
            unit_id: l.unit_id,
            source_line_id: l.id,
            cost_rate: 0
          }))
        });
      }

      // 3. Post Accounting
      const partyAccount = await tx.ledgerAccount.findFirst({
        where: { party_id: invoice.party_id, company_id: invoice.company_id }
      });
      if (!partyAccount) throw new BadRequestException(`Accounting integration failed: Customer does not have a linked LedgerAccount`);

      let salesAccount = await tx.ledgerAccount.findFirst({
        where: { code: 'SALES_REVENUE', company_id: invoice.company_id }
      });
      if (!salesAccount) {
        salesAccount = await tx.ledgerAccount.create({
          data: {
            company_id: invoice.company_id,
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

      const totalDebit = new Prisma.Decimal(invoice.grand_total);
      const lines: any[] = [];
      
      // Debit Customer (Receivable)
      lines.push({
        ledger_account_id: partyAccount.id,
        party_id: invoice.party_id,
        debit: totalDebit.toString(),
        credit: 0
      });
      
      // Credit Sales
      lines.push({
        ledger_account_id: salesAccount.id,
        debit: 0,
        credit: invoice.taxable_amount.toString()
      });

      // Credit Tax
      if (Number(invoice.tax_amount) > 0) {
        let taxAccount = await tx.ledgerAccount.findFirst({
          where: { code: 'OUTPUT_GST', company_id: invoice.company_id }
        });
        if (!taxAccount) {
          taxAccount = await tx.ledgerAccount.create({
            data: {
              company_id: invoice.company_id,
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
        lines.push({
          ledger_account_id: taxAccount.id,
          debit: 0,
          credit: invoice.tax_amount.toString()
        });
      }

      const voucher = await this.accounting.postVoucher(tx, {
        company_id: invoice.company_id,
        branch_id: invoice.branch_id,
        financial_year_id: invoice.financial_year_id,
        voucher_type: 'SALES',
        document_number: invoice.document_number,
        voucher_date: invoice.document_date,
        source_document_type: 'SALES_INVOICE',
        source_document_id: invoice.id,
        narration: `Sales Invoice ${invoice.document_number}`,
        posted_by: userId,
        lines
      });

      const postedInvoice = await tx.salesInvoice.update({
        where: { id: invoice.id },
        data: {
          status: 'POSTED',
          posted_at: new Date(),
          posted_by: userId,
          outstanding_amount: invoice.grand_total
        },
        include: { lines: true }
      });

      const customerVoucherLine = voucher.lines.find(l => l.ledger_account_id === partyAccount.id);
      if (customerVoucherLine) {
        await tx.billAllocation.create({
          data: {
            company_id: invoice.company_id,
            party_id: invoice.party_id,
            voucher_line_id: customerVoucherLine.id,
            reference_document_type: 'SALES_INVOICE',
            reference_document_id: invoice.id,
            allocation_type: 'NEW_REFERENCE',
            amount: invoice.grand_total,
            due_date: invoice.due_date
          }
        });
      }

      await tx.auditLog.create({
        data: {
          company_id: invoice.company_id,
          branch_id: invoice.branch_id,
          user_id: userId,
          action: 'SALES_INVOICE_POSTED',
          source_document_type: 'SALES_INVOICE',
          source_document_id: invoice.id,
          affected_voucher_id: voucher.id,
        }
      });

      return postedInvoice;
    });
  }

  // --- Sales Return ---

  async postSalesReturn(companyId: string, returnId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const sr = await tx.salesReturn.findUnique({
        where: { id: returnId },
        include: { lines: true }
      });

      if (!sr) throw new BadRequestException('Sales Return not found');
      if (sr.company_id !== companyId) throw new ForbiddenException('Isolation violation');
      if (sr.status === 'POSTED') throw new BadRequestException('Already posted');
      if (sr.status === 'CANCELLED') throw new BadRequestException('Cannot post cancelled');

      // Post Inventory (SALES_RETURN_IN)
      await this.inventory.postMovement(tx, {
        company_id: sr.company_id,
        branch_id: sr.branch_id,
        movement_type: 'SALES_RETURN_IN',
        business_date: sr.document_date,
        source_document_type: 'SALES_RETURN',
        source_document_id: sr.id,
        lines: sr.lines.map(l => ({
          item_id: l.item_id,
          godown_id: l.godown_id,
          quantity: l.quantity.toString(),
          unit_id: l.unit_id,
          source_line_id: l.id,
          cost_rate: l.rate.toString()
        }))
      });

      // Post Accounting (Reverse of Invoice)
      const partyAccount = await tx.ledgerAccount.findFirst({
        where: { party_id: sr.party_id, company_id: sr.company_id }
      });
      if (!partyAccount) throw new BadRequestException('Customer has no ledger account');

      let salesAccount = await tx.ledgerAccount.findFirst({
        where: { code: 'SALES_REVENUE', company_id: sr.company_id }
      });
      if (!salesAccount) throw new BadRequestException('Sales Revenue account missing');

      const lines: any[] = [];
      
      // Credit Customer (Reduce Receivable)
      lines.push({
        ledger_account_id: partyAccount.id,
        party_id: sr.party_id,
        debit: 0,
        credit: sr.grand_total.toString()
      });
      
      // Debit Sales
      lines.push({
        ledger_account_id: salesAccount.id,
        debit: sr.taxable_amount.toString(),
        credit: 0
      });

      if (Number(sr.tax_amount) > 0) {
        let taxAccount = await tx.ledgerAccount.findFirst({
          where: { code: 'OUTPUT_GST', company_id: sr.company_id }
        });
        if (!taxAccount) throw new BadRequestException('Output GST account missing');
        
        lines.push({
          ledger_account_id: taxAccount.id,
          debit: sr.tax_amount.toString(),
          credit: 0
        });
      }

      const voucher = await this.accounting.postVoucher(tx, {
        company_id: sr.company_id,
        branch_id: sr.branch_id,
        financial_year_id: sr.financial_year_id,
        voucher_type: 'SALES_RETURN',
        document_number: sr.document_number,
        voucher_date: sr.document_date,
        source_document_type: 'SALES_RETURN',
        source_document_id: sr.id,
        narration: `Sales Return ${sr.document_number}`,
        posted_by: userId,
        lines
      });

      const postedSr = await tx.salesReturn.update({
        where: { id: sr.id },
        data: {
          status: 'POSTED',
          posted_at: new Date(),
          posted_by: userId
        },
        include: { lines: true }
      });

      const customerVoucherLine = voucher.lines.find(l => l.ledger_account_id === partyAccount.id);
      if (customerVoucherLine) {
        await tx.billAllocation.create({
          data: {
            company_id: sr.company_id,
            party_id: sr.party_id,
            voucher_line_id: customerVoucherLine.id,
            reference_document_type: 'SALES_RETURN',
            reference_document_id: sr.id,
            allocation_type: 'AGAINST_REFERENCE',
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
          action: 'SALES_RETURN_POSTED',
          source_document_type: 'SALES_RETURN',
          source_document_id: sr.id,
          affected_voucher_id: voucher.id,
        }
      });

      return postedSr;
    });
  }

  // --- Invoice Reversal ---

  async reverseSalesInvoice(companyId: string, invoiceId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.salesInvoice.findUnique({
        where: { id: invoiceId },
        include: { lines: true }
      });

      if (!invoice) throw new BadRequestException('Invoice not found');
      if (invoice.company_id !== companyId) throw new ForbiddenException('Isolation violation');
      if (invoice.status !== 'POSTED') throw new BadRequestException('Only posted invoices can be reversed');

      // 1. Reverse Inventory (if there was any direct stock movement for this invoice)
      const retailLines = invoice.lines.filter(l => !l.delivery_challan_line_id);
      if (retailLines.length > 0) {
        await this.inventory.reverseMovement(
          tx,
          invoice.company_id,
          'SALES_INVOICE',
          invoice.id,
          'SALES_INVOICE_REVERSAL'
        );
      }

      // 2. Reverse Accounting
      const voucher = await tx.voucher.findFirst({
        where: { source_document_id: invoice.id, voucher_type: 'SALES' }
      });
      let reversedVoucherWithLines;
      if (voucher) {
        const rv = await this.accounting.reverseVoucher(tx, voucher.id, userId, 'Sales Invoice Reversal');
        reversedVoucherWithLines = await tx.voucher.findUnique({
          where: { id: rv.id },
          include: { lines: true }
        });
      }

      // 3. Reverse Bill Allocation
      const partyAccount = await tx.ledgerAccount.findFirst({
        where: { party_id: invoice.party_id, company_id: invoice.company_id }
      });
      if (partyAccount && reversedVoucherWithLines) {
        const customerReversalLine = reversedVoucherWithLines.lines.find(l => l.ledger_account_id === partyAccount.id);
        if (customerReversalLine) {
           await tx.billAllocation.create({
             data: {
               company_id: invoice.company_id,
               party_id: invoice.party_id,
               voucher_line_id: customerReversalLine.id,
               reference_document_type: 'SALES_INVOICE',
               reference_document_id: invoice.id,
               allocation_type: 'AGAINST_REFERENCE',
               amount: invoice.grand_total,

               due_date: invoice.due_date
             }
           });
        }
      }

      // 4. Update Invoice Status
      const reversedInvoice = await tx.salesInvoice.update({
        where: { id: invoice.id },
        data: {
          status: 'REVERSED',
          outstanding_amount: 0
        },
        include: { lines: true }
      });

      await tx.auditLog.create({
        data: {
          company_id: invoice.company_id,
          branch_id: invoice.branch_id,
          user_id: userId,
          action: 'SALES_INVOICE_REVERSED',
          source_document_type: 'SALES_INVOICE',
          source_document_id: invoice.id,
          affected_voucher_id: reversedVoucherWithLines?.id,
        }
      });

      return reversedInvoice;
    });
  }
}
