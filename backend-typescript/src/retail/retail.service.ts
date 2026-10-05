import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateRetailItemDto, UpdateRetailItemDto } from './dto/retail-item.dto';
import { CreateRetailCustomerDto, ReceivePaymentDto } from './dto/retail-customer.dto';
import { CreateRetailSupplierDto, PaySupplierDto } from './dto/retail-supplier.dto';
import { CreateRetailPurchaseDto } from './dto/retail-purchase.dto';
import { CreateNeedListDto, UpdateNeedStatusDto } from './dto/retail-need.dto';
import { AccountingService } from '../accounting/accounting.service';
import { PostingService as AccountingPostingService } from '../accounting/posting.service';
import { OpeningStockService } from '../inventory/opening-stock.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RetailService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountingService: AccountingService,
    private readonly accountingPostingService: AccountingPostingService,
    private readonly openingStockService: OpeningStockService,
  ) {}

  // ── ITEMS ──────────────────────────────────────────────────────────

  async getItems(companyId: string, search?: string) {
    const where: any = { company_id: companyId };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.item.findMany({
      where,
      include: {
        stock_balance_projection: {
          where: { company_id: companyId }
        }
      }
    });

    return items.map(item => {
      const stock = item.stock_balance_projection.reduce((sum, b) => sum + Number(b.quantity), 0);
      return {
        id: item.id,
        name: item.name,
        sku: item.sku,
        selling_price: item.default_sale_rate ? Number(item.default_sale_rate) : 0,
        purchase_price: item.purchase_rate ? Number(item.purchase_rate) : 0,
        unit: item.primary_unit_id,
        current_stock: stock,
        active: item.is_active
      };
    });
  }

  async createItem(companyId: string, userId: string, financialYearId: string, branchId: string, dto: CreateRetailItemDto) {
    const sku = dto.sku || `ITM-${Date.now().toString().slice(-6)}`;

    let unitId: string;
    if (dto.unit_id) {
      unitId = dto.unit_id;
    } else {
      const defaultUnit = await this.prisma.unit.findFirst({
        where: { company_id: companyId }
      });
      if (!defaultUnit) {
        throw new BadRequestException('No units configured. Please create at least one unit before adding items.');
      }
      unitId = defaultUnit.id;
    }

    const item = await this.prisma.item.create({
      data: {
        company_id: companyId,
        name: dto.name,
        sku,
        item_type: 'GOODS',
        primary_unit_id: unitId,
        default_sale_rate: dto.selling_price,
        purchase_rate: dto.purchase_price || 0,
        is_active: true,
      }
    });

    if (dto.opening_stock && dto.opening_stock > 0 && branchId) {
      const godown = await this.prisma.godown.findFirst({
        where: { branch_id: branchId }
      });
      
      if (godown) {
        await this.openingStockService.postOpeningStock({
          company_id: companyId,
          branch_id: branchId,
          financial_year_id: financialYearId,
          document_number: `OS-RETAIL-${Date.now()}`,
          document_date: new Date(),
          narration: 'Retail quick opening stock',
          lines: [{
            item_id: item.id,
            godown_id: godown.id,
            unit_id: unitId,
            quantity: dto.opening_stock,
            cost_rate: dto.purchase_price || 0
          }]
        }, userId);
      }
    }

    return this.getItems(companyId).then(items => items.find(i => i.id === item.id));
  }

  // ── CUSTOMERS ──────────────────────────────────────────────────────

  async getCustomers(companyId: string, search?: string) {
    const where: any = { company_id: companyId, party_type: 'CUSTOMER' };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const parties = await this.prisma.party.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        is_active: true,
      }
    });

    const newRefs = await this.prisma.billAllocation.groupBy({
      by: ['party_id'],
      where: { company_id: companyId, party_id: { in: parties.map(p => p.id) }, allocation_type: 'NEW_REFERENCE' },
      _sum: { amount: true }
    });

    const againstRefs = await this.prisma.billAllocation.groupBy({
      by: ['party_id'],
      where: { company_id: companyId, party_id: { in: parties.map(p => p.id) }, allocation_type: 'AGAINST_REFERENCE' },
      _sum: { amount: true }
    });

    return parties.map(p => {
      const newRef = newRefs.find(o => o.party_id === p.id);
      const againstRef = againstRefs.find(o => o.party_id === p.id);
      const balance = Number(newRef?._sum.amount || 0) - Number(againstRef?._sum.amount || 0);
      
      return {
        id: p.id,
        name: p.name,
        code: p.code,
        active: p.is_active,
        outstanding_amount: balance
      };
    });
  }

  async createCustomer(companyId: string, dto: CreateRetailCustomerDto) {
    const party = await this.prisma.party.create({
      data: {
        company_id: companyId,
        party_type: 'CUSTOMER',
        name: dto.name,
        code: `RC-${Date.now().toString().slice(-6)}`
      }
    });

    let parentGroup = await this.prisma.ledgerAccount.findFirst({
      where: { company_id: companyId, name: 'Sundry Debtors' }
    });
    
    if (!parentGroup) {
      parentGroup = await this.prisma.ledgerAccount.create({
        data: {
          company_id: companyId,
          name: 'Sundry Debtors',
          account_type: 'ASSET',
          code: 'SD'
        }
      });
    }

    await this.prisma.ledgerAccount.create({
      data: {
        company_id: companyId,
        parent_id: parentGroup.id,
        name: party.name,
        account_type: 'ASSET',
        code: party.code,
        party_id: party.id
      }
    });

    return { id: party.id, name: party.name, outstanding_amount: 0 };
  }

  async getCustomerKhata(companyId: string, partyId: string) {
    const party = await this.prisma.party.findFirst({
      where: { id: partyId, company_id: companyId }
    });
    if (!party) throw new NotFoundException('Customer not found');

    const allAllocations = await this.prisma.billAllocation.findMany({
      where: { company_id: companyId, party_id: partyId },
      orderBy: { due_date: 'asc' }
    });

    const newRefs = allAllocations.filter(b => b.allocation_type === 'NEW_REFERENCE');
    const againstRefs = allAllocations.filter(b => b.allocation_type === 'AGAINST_REFERENCE');

    const totalBilled = newRefs.reduce((sum, b) => sum + Number(b.amount), 0);
    const totalPaid = againstRefs.reduce((sum, b) => sum + Number(b.amount), 0);
    const outstanding = totalBilled - totalPaid;

    const transactions = allAllocations.map(b => ({
      id: b.id,
      type: b.allocation_type === 'NEW_REFERENCE' ? 'SALE' as const : 'PAYMENT' as const,
      date: b.due_date || new Date(),
      amount: Math.abs(Number(b.amount)),
      balance_after: 0,
      reference: b.reference_document_type
    }));

    let runningBalance = 0;
    for (const t of transactions) {
      if (t.type === 'SALE') runningBalance += t.amount;
      else runningBalance -= t.amount;
      t.balance_after = runningBalance;
    }

    return { customer: { id: party.id, name: party.name }, balance: outstanding, transactions };
  }

  async receivePayment(companyId: string, branchId: string, financialYearId: string, userId: string, partyId: string, dto: ReceivePaymentDto) {
    const accountName = dto.payment_method === 'CASH' ? 'Cash Account' : 'Bank Account';
    let cashAccount = await this.prisma.ledgerAccount.findFirst({
      where: { company_id: companyId, name: accountName }
    });
    if (!cashAccount) {
      const code = dto.payment_method === 'CASH' ? 'CASH_IN_HAND' : 'DEFAULT_BANK';
      cashAccount = await this.prisma.ledgerAccount.findFirst({
        where: { company_id: companyId, code }
      });
    }
    if (!cashAccount) throw new BadRequestException(`No ${accountName} found in chart of accounts`);

    const party = await this.prisma.party.findFirst({
      where: { id: partyId, company_id: companyId }
    });
    if (!party) throw new NotFoundException('Party not found');

    const partyLedger = await this.prisma.ledgerAccount.findFirst({
      where: { party_id: party.id, company_id: companyId }
    });
    if (!partyLedger) throw new BadRequestException('Party account not found');

    const voucher = await this.accountingPostingService.postVoucherWithIsolationChecks({
      company_id: companyId,
      branch_id: branchId,
      financial_year_id: financialYearId,
      voucher_type: 'RECEIPT',
      document_number: `RCPT-RETAIL-${Date.now()}`,
      voucher_date: dto.date ? new Date(dto.date) : new Date(),
      narration: dto.note || `Retail payment receipt - ${dto.payment_method}`,
      posted_by: userId,
      lines: [
        { ledger_account_id: cashAccount.id, debit: dto.amount, credit: 0 },
        { ledger_account_id: partyLedger.id, debit: 0, credit: dto.amount, party_id: party.id }
      ]
    });

    const openBills = await this.prisma.billAllocation.findMany({
      where: { company_id: companyId, party_id: partyId, allocation_type: 'NEW_REFERENCE' }
    });
    const existingAllocations = await this.prisma.billAllocation.findMany({
      where: { company_id: companyId, party_id: partyId, allocation_type: 'AGAINST_REFERENCE' }
    });

    const allocatedByDoc: Record<string, number> = {};
    for (const alloc of existingAllocations) {
      const key = alloc.reference_document_id;
      allocatedByDoc[key] = (allocatedByDoc[key] || 0) + Number(alloc.amount);
    }

    const receiptPartyLine = voucher.lines.find(l => l.ledger_account_id === partyLedger.id);
    let remainingToAllocate = dto.amount;
    for (const bill of openBills) {
      if (remainingToAllocate <= 0) break;
      const openAmount = Number(bill.amount) - (allocatedByDoc[bill.reference_document_id] || 0);
      if (openAmount > 0) {
        const allocateAmt = Math.min(openAmount, remainingToAllocate);
        await this.prisma.billAllocation.create({
          data: {
            company_id: companyId,
            party_id: partyId,
            voucher_line_id: receiptPartyLine ? receiptPartyLine.id : partyLedger.id,
            reference_document_type: bill.reference_document_type,
            reference_document_id: bill.reference_document_id,
            allocation_type: 'AGAINST_REFERENCE',
            amount: allocateAmt
          }
        });
        remainingToAllocate -= allocateAmt;
      }
    }

    return { success: true, payment_id: voucher.id, amount_received: dto.amount };
  }

  // ── SUPPLIERS ────────────────────────────────────────────────────────
  
  async getSuppliers(companyId: string, search?: string) {
    const where: any = { company_id: companyId, party_type: 'SUPPLIER' };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }
    const parties = await this.prisma.party.findMany({ where, select: { id: true, name: true, code: true, is_active: true } });
    
    const newRefs = await this.prisma.billAllocation.groupBy({
      by: ['party_id'],
      where: { company_id: companyId, party_id: { in: parties.map(p => p.id) }, allocation_type: 'NEW_REFERENCE' },
      _sum: { amount: true }
    });
    const againstRefs = await this.prisma.billAllocation.groupBy({
      by: ['party_id'],
      where: { company_id: companyId, party_id: { in: parties.map(p => p.id) }, allocation_type: 'AGAINST_REFERENCE' },
      _sum: { amount: true }
    });

    return parties.map(p => {
      const newRef = newRefs.find(o => o.party_id === p.id);
      const againstRef = againstRefs.find(o => o.party_id === p.id);
      const balance = Number(newRef?._sum.amount || 0) - Number(againstRef?._sum.amount || 0);
      return { id: p.id, name: p.name, code: p.code, active: p.is_active, outstanding_amount: balance };
    });
  }

  async createSupplier(companyId: string, dto: CreateRetailSupplierDto) {
    const party = await this.prisma.party.create({
      data: { company_id: companyId, party_type: 'SUPPLIER', name: dto.name, code: "RS-" + Date.now().toString().slice(-6) }
    });
    let parentGroup = await this.prisma.ledgerAccount.findFirst({ where: { company_id: companyId, name: 'Sundry Creditors' } });
    if (!parentGroup) {
      parentGroup = await this.prisma.ledgerAccount.create({ data: { company_id: companyId, name: 'Sundry Creditors', account_type: 'LIABILITY', code: 'SC' } });
    }
    await this.prisma.ledgerAccount.create({ data: { company_id: companyId, parent_id: parentGroup.id, name: party.name, account_type: 'LIABILITY', code: party.code, party_id: party.id } });
    return { id: party.id, name: party.name, outstanding_amount: 0 };
  }

  async getSupplierKhata(companyId: string, partyId: string) {
    const party = await this.prisma.party.findFirst({ where: { id: partyId, company_id: companyId, party_type: 'SUPPLIER' } });
    if (!party) throw new NotFoundException('Supplier not found');

    const allAllocations = await this.prisma.billAllocation.findMany({ where: { company_id: companyId, party_id: partyId }, orderBy: { due_date: 'asc' } });
    const newRefs = allAllocations.filter(b => b.allocation_type === 'NEW_REFERENCE');
    const againstRefs = allAllocations.filter(b => b.allocation_type === 'AGAINST_REFERENCE');

    const totalBilled = newRefs.reduce((sum, b) => sum + Number(b.amount), 0);
    const totalPaid = againstRefs.reduce((sum, b) => sum + Number(b.amount), 0);
    const outstanding = totalBilled - totalPaid;

    const transactions = allAllocations.map(b => ({
      id: b.id,
      type: b.allocation_type === 'NEW_REFERENCE' ? 'PURCHASE' as const : 'PAYMENT' as const,
      date: b.due_date || new Date(),
      amount: Math.abs(Number(b.amount)),
      balance_after: 0,
      reference: b.reference_document_type,
      reference_id: b.reference_document_id
    }));

    const referenceIds = transactions.map(t => t.reference_id);
    const attachments = await this.prisma.attachment.findMany({
      where: { company_id: companyId, entity_id: { in: referenceIds } },
      select: { entity_id: true, id: true, mime_type: true }
    });
    const attachmentMap = new Map(attachments.map(a => [a.entity_id, a]));

    let runningBalance = 0;
    for (const t of transactions) {
      if (t.type === 'PURCHASE') runningBalance += t.amount;
      else runningBalance -= t.amount;
      t.balance_after = runningBalance;
      (t as any).attachment = attachmentMap.get(t.reference_id) || null;
    }
    return { supplier: { id: party.id, name: party.name }, balance: outstanding, transactions };
  }

  async paySupplier(companyId: string, branchId: string, financialYearId: string, userId: string, partyId: string, dto: PaySupplierDto) {
    const accountName = dto.payment_method === 'CASH' ? 'Cash Account' : 'Bank Account';
    let cashAccount = await this.prisma.ledgerAccount.findFirst({ where: { company_id: companyId, name: accountName } });
    if (!cashAccount) {
      const code = dto.payment_method === 'CASH' ? 'CASH_IN_HAND' : 'DEFAULT_BANK';
      cashAccount = await this.prisma.ledgerAccount.findFirst({ where: { company_id: companyId, code } });
    }
    if (!cashAccount) throw new BadRequestException("No " + accountName + " found");
    const party = await this.prisma.party.findFirst({ where: { id: partyId, company_id: companyId, party_type: 'SUPPLIER' } });
    if (!party) throw new NotFoundException('Supplier not found');
    const partyLedger = await this.prisma.ledgerAccount.findFirst({ where: { party_id: party.id, company_id: companyId } });
    if (!partyLedger) throw new BadRequestException('Party account not found');

    const voucher = await this.accountingPostingService.postVoucherWithIsolationChecks({
      company_id: companyId,
      branch_id: branchId,
      financial_year_id: financialYearId,
      voucher_type: 'PAYMENT',
      document_number: "PMT-RETAIL-" + Date.now(),
      voucher_date: dto.date ? new Date(dto.date) : new Date(),
      narration: dto.note || "Retail payment to supplier - " + dto.payment_method,
      posted_by: userId,
      lines: [
        { ledger_account_id: partyLedger.id, debit: dto.amount, credit: 0, party_id: party.id },
        { ledger_account_id: cashAccount.id, debit: 0, credit: dto.amount }
      ]
    });

    const openBills = await this.prisma.billAllocation.findMany({ where: { company_id: companyId, party_id: partyId, allocation_type: 'NEW_REFERENCE' } });
    const existingAllocations = await this.prisma.billAllocation.findMany({ where: { company_id: companyId, party_id: partyId, allocation_type: 'AGAINST_REFERENCE' } });
    const allocatedByDoc: Record<string, number> = {};
    for (const alloc of existingAllocations) allocatedByDoc[alloc.reference_document_id] = (allocatedByDoc[alloc.reference_document_id] || 0) + Number(alloc.amount);

    const receiptPartyLine = voucher.lines.find(l => l.ledger_account_id === partyLedger.id);
    let remainingToAllocate = dto.amount;
    for (const bill of openBills) {
      if (remainingToAllocate <= 0) break;
      const openAmount = Number(bill.amount) - (allocatedByDoc[bill.reference_document_id] || 0);
      if (openAmount > 0) {
        const allocateAmt = Math.min(openAmount, remainingToAllocate);
        await this.prisma.billAllocation.create({
          data: {
            company_id: companyId, party_id: partyId, voucher_line_id: receiptPartyLine ? receiptPartyLine.id : partyLedger.id,
            reference_document_type: bill.reference_document_type, reference_document_id: bill.reference_document_id,
            allocation_type: 'AGAINST_REFERENCE', amount: allocateAmt
          }
        });
        remainingToAllocate -= allocateAmt;
      }
    }
    return { success: true, payment_id: voucher.id, amount_paid: dto.amount };
  }

  // ── PURCHASES ────────────────────────────────────────────────────────

  async getPurchases(companyId: string) {
    const purchases = await this.prisma.purchaseInvoice.findMany({
      where: { company_id: companyId },
      include: { party: { select: { id: true, name: true } } },
      orderBy: { document_date: 'desc' }
    });

    const attachments = await this.prisma.attachment.findMany({
      where: { company_id: companyId, entity_type: 'PURCHASE' },
      select: { entity_id: true, id: true, mime_type: true }
    });
    const attachmentMap = new Map(attachments.map(a => [a.entity_id, a]));

    return purchases.map(p => ({
      ...p,
      attachment: attachmentMap.get(p.id) || null
    }));
  }

  async createPurchase(companyId: string, branchId: string, financialYearId: string, userId: string, dto: CreateRetailPurchaseDto) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.purchaseInvoice.create({
        data: {
          company_id: companyId,
          branch_id: branchId,
          financial_year_id: financialYearId,
          party_id: dto.supplier_id,
          document_number: dto.bill_number || "PI-RET-" + Date.now(),
          document_date: dto.purchase_date ? new Date(dto.purchase_date) : new Date(),
          status: 'POSTED',
          grand_total: dto.total_amount,
          paid_amount: dto.paid_amount || 0,
          outstanding_amount: dto.total_amount - (dto.paid_amount || 0),
          posted_at: new Date(),
          posted_by: userId
        }
      });

      if (dto.lines && dto.lines.length > 0) {
        const godown = await tx.godown.findFirst({ where: { branch_id: branchId } });
        if (godown) {
          for (const line of dto.lines) {
            const item = await tx.item.findUnique({ where: { id: line.item_id } });
            if (item) {
              await tx.stockMovement.create({
                data: {
                  company_id: companyId, branch_id: branchId, godown_id: godown.id, item_id: line.item_id,
                  business_date: new Date(), movement_type: 'PURCHASE_IN',
                  quantity_delta: line.quantity, base_quantity_delta: line.quantity, unit_id: item.primary_unit_id,
                  source_document_type: 'PURCHASE_INVOICE', source_document_id: invoice.id,
                  cost_rate: line.purchase_rate, value_delta: line.quantity * line.purchase_rate
                }
              });
              const proj = await tx.stockBalanceProjection.findFirst({ where: { company_id: companyId, godown_id: godown.id, item_id: line.item_id } });
              if (proj) {
                await tx.stockBalanceProjection.update({ where: { id: proj.id }, data: { quantity: { increment: line.quantity } } });
              } else {
                await tx.stockBalanceProjection.create({ data: { company_id: companyId, branch_id: branchId, godown_id: godown.id, item_id: line.item_id, quantity: line.quantity } });
              }
            }
          }
        }
      }

      if (dto.payment_status === 'CREDIT' || dto.payment_status === 'PARTIAL') {
        const partyLedger = await tx.ledgerAccount.findFirst({ where: { party_id: dto.supplier_id, company_id: companyId } });
        
        let purchaseLedger = await tx.ledgerAccount.findFirst({ where: { name: 'Purchase Account', company_id: companyId } });
        if(!purchaseLedger) {
           const parentDir = await tx.ledgerAccount.findFirst({ where: { name: 'Direct Expenses', company_id: companyId } });
           if(parentDir) {
               purchaseLedger = await tx.ledgerAccount.create({ data: { company_id: companyId, name: 'Purchase Account', account_type: 'EXPENSE', code: 'PURCH', parent_id: parentDir.id } });
           }
        }

        if (partyLedger && purchaseLedger) {
          const voucher = await tx.voucher.create({
            data: {
              company_id: companyId, branch_id: branchId, financial_year_id: financialYearId,
              voucher_type: 'JOURNAL', document_number: "JRNL-RET-" + Date.now(), voucher_date: new Date(), status: 'POSTED',
              posted_by: userId,
              lines: {
                create: [
                  { ledger_account_id: purchaseLedger.id, debit: dto.total_amount, credit: 0 },
                  { ledger_account_id: partyLedger.id, debit: 0, credit: dto.total_amount, party_id: dto.supplier_id }
                ]
              }
            }, include: { lines: true }
          });
          const pline = (voucher as any).lines.find((l: any) => l.ledger_account_id === partyLedger.id);
          await tx.billAllocation.create({
            data: {
              company_id: companyId, party_id: dto.supplier_id, voucher_line_id: pline!.id,
              reference_document_type: 'PURCHASE_INVOICE', reference_document_id: invoice.id,
              allocation_type: 'NEW_REFERENCE', amount: dto.total_amount, due_date: new Date()
            }
          });
        }
      }

      if ((dto.payment_status === 'PAID' || dto.payment_status === 'PARTIAL') && (dto.paid_amount || 0) > 0) {
        const accountName = dto.payment_method === 'BANK' ? 'Bank Account' : 'Cash Account';
        let cashAccount = await tx.ledgerAccount.findFirst({ where: { company_id: companyId, name: accountName } });
        if(!cashAccount) {
            cashAccount = await tx.ledgerAccount.findFirst({ where: { company_id: companyId, code: dto.payment_method === 'BANK' ? 'DEFAULT_BANK' : 'CASH_IN_HAND' } });
        }
        const partyLedger = await tx.ledgerAccount.findFirst({ where: { party_id: dto.supplier_id, company_id: companyId } });
        
        if (cashAccount && partyLedger) {
          const voucher = await tx.voucher.create({
            data: {
              company_id: companyId, branch_id: branchId, financial_year_id: financialYearId,
              voucher_type: 'PAYMENT', document_number: "PMT-RET-" + Date.now(), voucher_date: new Date(), status: 'POSTED',
              posted_by: userId,
              lines: {
                create: [
                  { ledger_account_id: partyLedger.id, debit: dto.paid_amount!, credit: 0, party_id: dto.supplier_id },
                  { ledger_account_id: cashAccount.id, debit: 0, credit: dto.paid_amount! }
                ]
              }
            }, include: { lines: true }
          });
          
          const pline = (voucher as any).lines.find((l: any) => l.ledger_account_id === partyLedger.id);
          await tx.billAllocation.create({
            data: {
              company_id: companyId, party_id: dto.supplier_id, voucher_line_id: pline!.id,
              reference_document_type: 'PAYMENT', reference_document_id: voucher.id,
              allocation_type: 'AGAINST_REFERENCE', amount: dto.paid_amount!, due_date: new Date()
            }
          });
        }
      }

      return invoice;
    });
  }

  // ── NEED LIST ────────────────────────────────────────────────────────

  async getNeeds(companyId: string) {
    const needs = await this.prisma.needList.findMany({
      where: { company_id: companyId },
      include: { customer: { select: { name: true } }, preferred_supplier: { select: { name: true } } },
      orderBy: { created_at: 'desc' }
    });
    
    const attachments = await this.prisma.attachment.findMany({
      where: { company_id: companyId, entity_type: 'NEED' },
      select: { entity_id: true, id: true, mime_type: true }
    });
    const attachmentMap = new Map(attachments.map(a => [a.entity_id, a]));

    return needs.map(n => ({
      ...n,
      attachment: attachmentMap.get(n.id) || null
    }));
  }

  async createNeed(companyId: string, branchId: string, userId: string, dto: CreateNeedListDto) {
    let org = await this.prisma.company.findUnique({ where: { id: companyId }, select: { organization_id: true } });
    return this.prisma.needList.create({
      data: {
        organization_id: org!.organization_id,
        company_id: companyId,
        branch_id: branchId,
        name: dto.name,
        quantity: dto.quantity,
        customer_id: dto.customer_id,
        customer_phone: dto.customer_phone,
        preferred_supplier_id: dto.preferred_supplier_id,
        needed_by: dto.needed_by ? new Date(dto.needed_by) : null,
        priority: dto.priority || 'NORMAL',
        note: dto.note,
        created_by: userId,
      }
    });
  }

  async updateNeedStatus(id: string, companyId: string, dto: UpdateNeedStatusDto) {
    return this.prisma.needList.update({
      where: { id, company_id: companyId },
      data: { status: dto.status }
    });
  }

  // ── HOME ───────────────────────────────────────────────────────────

  async getHomeDashboard(companyId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayInvoices = await this.prisma.salesInvoice.findMany({
      where: { company_id: companyId, document_date: { gte: startOfDay }, status: 'POSTED' },
      select: { grand_total: true }
    });

    const todaySales = todayInvoices.reduce((sum, inv) => sum + Number(inv.grand_total), 0);

    const partyCustomers = await this.prisma.party.findMany({ where: { company_id: companyId, party_type: 'CUSTOMER' }, select: { id: true } });
    const customerIds = partyCustomers.map(p => p.id);

    let customerDue = 0;
    if(customerIds.length > 0) {
        const newRefs = await this.prisma.billAllocation.aggregate({
        where: { company_id: companyId, allocation_type: 'NEW_REFERENCE', party_id: { in: customerIds } },
        _sum: { amount: true }
        });
        const againstRefs = await this.prisma.billAllocation.aggregate({
        where: { company_id: companyId, allocation_type: 'AGAINST_REFERENCE', party_id: { in: customerIds } },
        _sum: { amount: true }
        });
        customerDue = Number(newRefs._sum.amount || 0) - Number(againstRefs._sum.amount || 0);
    }

    const partySuppliers = await this.prisma.party.findMany({ where: { company_id: companyId, party_type: 'SUPPLIER' }, select: { id: true } });
    const supplierIds = partySuppliers.map(p => p.id);
    let supplierDue = 0;
    if(supplierIds.length > 0) {
        const newRefsSupp = await this.prisma.billAllocation.aggregate({
        where: { company_id: companyId, allocation_type: 'NEW_REFERENCE', party_id: { in: supplierIds } },
        _sum: { amount: true }
        });
        const againstRefsSupp = await this.prisma.billAllocation.aggregate({
        where: { company_id: companyId, allocation_type: 'AGAINST_REFERENCE', party_id: { in: supplierIds } },
        _sum: { amount: true }
        });
        supplierDue = Number(newRefsSupp._sum.amount || 0) - Number(againstRefsSupp._sum.amount || 0);
    }

    const lowStockItems = await this.prisma.stockBalanceProjection.count({
      where: { company_id: companyId, quantity: { lte: 0 } }
    });
    
    const needsPending = await this.prisma.needList.count({
      where: { company_id: companyId, status: 'NEED' }
    });

    return {
      today_sales: todaySales,
      customer_due: customerDue,
      low_stock_count: lowStockItems,
      today_expenses: null,
      bills_today: todayInvoices.length,
      supplier_due: supplierDue,
      needs_pending: needsPending
    };
  }
}
