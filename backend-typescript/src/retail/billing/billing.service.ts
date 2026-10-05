import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PosService } from '../../pos/pos.service';

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly posService: PosService,
  ) {}

  private async getGodownAndUnitMap(branchId: string, itemIds: string[]) {
    const godown = await this.prisma.godown.findFirst({ where: { branch_id: branchId } });
    if (!godown) throw new BadRequestException('No godown found for this branch');

    const itemsDb = await this.prisma.item.findMany({ where: { id: { in: itemIds } } });
    const itemMap = new Map(itemsDb.map(i => [i.id, i.primary_unit_id]));
    
    return { godownId: godown.id, itemMap };
  }

  async createBill(companyId: string, branchId: string, userId: string, dto: any) {
    const itemIds = dto.items.map((i: any) => i.item_id);
    const { godownId, itemMap } = await this.getGodownAndUnitMap(branchId, itemIds);

    const posDto = {
      branch_id: branchId,
      document_date: new Date().toISOString(),
      party_id: dto.customer_id,
      lines: dto.items.map((i: any) => ({
        item_id: i.item_id,
        godown_id: godownId,
        unit_id: itemMap.get(i.item_id)!,
        quantity: i.quantity,
        rate: i.rate,
        discount_amount: i.discount_amount || 0
      })),
      payments: dto.payment_splits.map((p: any) => ({
        amount: p.amount,
        payment_method: p.method
      }))
    };

    return this.posService.postPosSale(companyId, userId, posDto as any);
  }

  async getBills(companyId: string, branchId: string, query: any) {
    const take = query.limit ? parseInt(query.limit) : 50;
    const skip = query.offset ? parseInt(query.offset) : 0;
    
    const invoices = await this.prisma.salesInvoice.findMany({
      where: { company_id: companyId, branch_id: branchId },
      orderBy: { document_date: 'desc' },
      take,
      skip,
      include: {
        party: true,
      }
    });

    const total = await this.prisma.salesInvoice.count({
      where: { company_id: companyId, branch_id: branchId },
    });

    return {
      data: invoices,
      total
    };
  }

  async getBillDetail(id: string, companyId: string) {
    const invoice = await this.prisma.salesInvoice.findUnique({
      where: { id },
      include: {
        party: true,
        sales_invoice_line: {
          include: {
            item: {
              select: { id: true, name: true, sku: true }
            }
          }
        },
        bill_allocation: {
          include: {
            voucher: {
              include: {
                voucher_line: true
              }
            }
          }
        }
      }
    });

    if (!invoice || invoice.company_id !== companyId) {
      throw new BadRequestException('Invoice not found');
    }

    return invoice;
  }

  async holdBill(companyId: string, branchId: string, userId: string, items: any[]) {
    const itemIds = items.map((i: any) => i.item_id);
    const { godownId, itemMap } = await this.getGodownAndUnitMap(branchId, itemIds);

    const holdDto = {
      branch_id: branchId,
      lines: items.map((i: any) => ({
        item_id: i.item_id,
        godown_id: godownId,
        unit_id: itemMap.get(i.item_id)!,
        quantity: i.quantity,
        rate: i.rate,
        discount_amount: i.discount_amount || 0
      }))
    };

    return this.posService.holdBill(companyId, userId, holdDto as any);
  }

  async getHeldBills(companyId: string, branchId: string, userId: string) {
    return this.posService.getHeldBills(companyId, branchId, userId);
  }

  async resumeBill(id: string, companyId: string, userId: string) {
    return this.posService.resumeBill(id, companyId, userId);
  }

  async postReturn(companyId: string, branchId: string, userId: string, dto: any) {
    const itemIds = dto.lines.map((i: any) => i.item_id);
    const { godownId, itemMap } = await this.getGodownAndUnitMap(branchId, itemIds);

    const originalInvoice = await this.prisma.salesInvoice.findUnique({
      where: { id: dto.original_invoice_id }
    });

    const returnDto = {
      branch_id: branchId,
      document_date: new Date().toISOString(),
      party_id: originalInvoice?.party_id || undefined,
      original_invoice_id: dto.original_invoice_id,
      lines: dto.lines.map((i: any) => ({
        item_id: i.item_id,
        godown_id: godownId,
        unit_id: itemMap.get(i.item_id)!,
        quantity: i.quantity,
        rate: i.rate,
        discount_amount: i.discount_amount || 0
      }))
    };

    const returnResult = await this.posService.postPosReturn(companyId, userId, returnDto as any);

    // If refund_method is CASH, we need to create a payment voucher
    if (dto.refund_method === 'CASH' && returnResult.grand_total.toNumber() > 0) {
      // Find cash ledger
      let cashAcc = await this.prisma.ledgerAccount.findFirst({ where: { code: 'CASH_IN_HAND', company_id: companyId } });
      const partyAcc = await this.prisma.ledgerAccount.findFirst({ where: { party_id: returnResult.party_id!, company_id: companyId } });

      if (cashAcc && partyAcc) {
        await this.posService['accounting'].postVoucher(this.prisma, {
          company_id: companyId,
          branch_id: branchId,
          financial_year_id: returnResult.financial_year_id,
          voucher_type: 'PAYMENT',
          document_number: `REFUND-${Date.now()}`,
          voucher_date: returnResult.document_date,
          source_document_type: 'SALES_RETURN',
          source_document_id: returnResult.id,
          narration: `Cash Refund for POS Sales Return ${returnResult.document_number}`,
          posted_by: userId,
          lines: [
            { ledger_account_id: partyAcc.id, party_id: returnResult.party_id, debit: returnResult.grand_total.toNumber(), credit: 0 },
            { ledger_account_id: cashAcc.id, debit: 0, credit: returnResult.grand_total.toNumber() }
          ]
        });
      }
    }

    return returnResult;
  }
}
