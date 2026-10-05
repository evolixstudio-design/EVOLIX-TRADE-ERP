import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PostingService } from './posting.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PurchaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postingService: PostingService,
  ) {}

  // ── Purchase Orders ────────────────────────────────────────────────────────

  async createPurchaseOrder(data: Prisma.PurchaseOrderCreateInput) {
    return this.prisma.purchaseOrder.create({
      data,
      include: { lines: true, party: true },
    });
  }

  async getPurchaseOrders(companyId: string) {
    return this.prisma.purchaseOrder.findMany({
      where: { company_id: companyId },
      include: { party: true },
      orderBy: { document_date: 'desc' },
    });
  }

  async getPurchaseOrderById(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        party: true,
        lines: {
          include: { item: true, unit: true },
        },
        goods_receipts: true,
      },
    });
    if (!po) throw new NotFoundException('PO not found');
    return po;
  }

  // ── Goods Receipts ─────────────────────────────────────────────────────────

  async createGoodsReceipt(data: Prisma.GoodsReceiptCreateInput) {
    return this.prisma.goodsReceipt.create({
      data,
      include: { lines: true },
    });
  }

  async getGoodsReceipts(companyId: string) {
    return this.prisma.goodsReceipt.findMany({
      where: { company_id: companyId },
      include: { party: true, purchase_order: true },
      orderBy: { document_date: 'desc' },
    });
  }

  async getGoodsReceiptById(id: string) {
    const grn = await this.prisma.goodsReceipt.findUnique({
      where: { id },
      include: {
        party: true,
        purchase_order: true,
        lines: {
          include: { item: true, unit: true, godown: true },
        },
      },
    });
    if (!grn) throw new NotFoundException('GRN not found');
    return grn;
  }

  async postGoodsReceipt(id: string, userId: string) {
    return this.postingService.postGoodsReceipt(id, userId);
  }

  // ── Purchase Invoices & 3-Way Match ────────────────────────────────────────

  async createPurchaseInvoice(data: Prisma.PurchaseInvoiceCreateInput) {
    return this.prisma.purchaseInvoice.create({
      data,
      include: { lines: true },
    });
  }

  async perform3WayMatch(invoiceId: string) {
    const inv = await this.prisma.purchaseInvoice.findUnique({
      where: { id: invoiceId },
      include: { lines: { include: { purchase_order_line: true, goods_receipt_line: true } } },
    });

    if (!inv) throw new NotFoundException('Invoice not found');

    const discrepancies = [];
    let matchStatus = 'MATCHED';

    for (const line of inv.lines) {
      if (line.purchase_order_line) {
        const poLine = line.purchase_order_line;
        // Price check
        if (Number(line.rate) !== Number(poLine.rate)) {
          discrepancies.push(`Price variance on item ${line.item_id}: PO rate ${poLine.rate}, Invoice rate ${line.rate}`);
          matchStatus = 'PRICE_VARIANCE';
        }
        // Quantity check (Invoice vs PO)
        if (Number(line.quantity) > Number(poLine.ordered_quantity)) {
          discrepancies.push(`Quantity variance on item ${line.item_id}: Invoiced > Ordered`);
          matchStatus = matchStatus === 'MATCHED' ? 'QUANTITY_VARIANCE' : 'MULTIPLE_VARIANCES';
        }
      }
      if (line.goods_receipt_line) {
        const grnLine = line.goods_receipt_line;
        // Quantity check (Invoice vs Received)
        if (Number(line.quantity) > Number(grnLine.received_quantity)) {
           discrepancies.push(`Quantity variance on item ${line.item_id}: Invoiced > Received`);
           matchStatus = matchStatus === 'MATCHED' ? 'QUANTITY_VARIANCE' : 'MULTIPLE_VARIANCES';
        }
      }
    }

    return {
      status: matchStatus,
      discrepancies,
    };
  }

  async getPurchaseInvoices(companyId: string) {
    return this.prisma.purchaseInvoice.findMany({
      where: { company_id: companyId },
      include: { party: true },
      orderBy: { document_date: 'desc' },
    });
  }
  
  async getPurchaseInvoiceById(id: string) {
    const inv = await this.prisma.purchaseInvoice.findUnique({
      where: { id },
      include: {
        party: true,
        lines: { include: { item: true, unit: true } }
      }
    });
    if (!inv) throw new NotFoundException('Invoice not found');
    return inv;
  }

  async postPurchaseInvoice(id: string, userId: string) {
    return this.postingService.postPurchaseInvoice(id, userId);
  }

  // ── Dashboard KPIs ─────────────────────────────────────────────────────────

  async getPurchasingDashboard(companyId: string) {
    const pos = await this.prisma.purchaseOrder.findMany({ where: { company_id: companyId } });
    const grns = await this.prisma.goodsReceipt.findMany({ where: { company_id: companyId } });
    const invoices = await this.prisma.purchaseInvoice.findMany({ where: { company_id: companyId } });

    const openPOs = pos.filter((po: any) => po.status !== 'CLOSED' && po.status !== 'CANCELLED' && po.status !== 'FULLY_RECEIVED').length;
    const pendingReceipts = pos.filter((po: any) => po.status === 'CONFIRMED' || po.status === 'PARTIALLY_RECEIVED').length;
    
    let totalPurchases = new Prisma.Decimal(0);
    let totalOutstanding = new Prisma.Decimal(0);

    for (const inv of invoices) {
      if (inv.status === 'POSTED') {
        totalPurchases = totalPurchases.plus(inv.grand_total);
        totalOutstanding = totalOutstanding.plus(inv.outstanding_amount);
      }
    }

    const recentPurchases = await this.prisma.purchaseOrder.findMany({
      where: { company_id: companyId },
      include: { party: true },
      orderBy: { document_date: 'desc' },
      take: 5,
    });

    return {
      openPOs,
      pendingReceipts,
      pendingInvoices: grns.filter((g: any) => g.status === 'POSTED').length, // simplified KPI
      totalPurchases: totalPurchases.toNumber(),
      totalOutstanding: totalOutstanding.toNumber(),
      recentPurchases,
    };
  }

  // ── Purchase Returns ───────────────────────────────────────────────────────

  async createPurchaseReturn(companyId: string, dto: any) {
    if (dto.branch_id) {
      const branch = await this.prisma.branch.findUnique({ where: { id: dto.branch_id } });
      if (!branch || branch.company_id !== companyId) throw new BadRequestException('Branch does not belong to the company');
    }

    return this.prisma.$transaction(async (tx) => {
      let invoice: any = null;
      if (dto.original_invoice_id) {
        invoice = await tx.purchaseInvoice.findUnique({
          where: { id: dto.original_invoice_id },
          include: { lines: true }
        });
        if (!invoice || invoice.company_id !== companyId) throw new BadRequestException('Invalid original invoice reference');
        if (invoice.branch_id !== dto.branch_id) throw new BadRequestException('Cannot return an invoice from a different branch');

        for (const line of dto.lines) {
          const invoiceLine = invoice.lines.find((l: any) => l.item_id === line.item_id && l.unit_id === line.unit_id);
          if (!invoiceLine) {
            throw new BadRequestException(`Item ${line.item_id} not found in the original invoice`);
          }

          const existingReturns = await tx.purchaseReturnLine.aggregate({
            where: {
              item_id: line.item_id,
              unit_id: line.unit_id,
              purchase_return: { original_invoice_id: dto.original_invoice_id, status: { not: 'CANCELLED' } }
            },
            _sum: { quantity: true }
          });

          const returnedQty = existingReturns._sum.quantity || new Prisma.Decimal(0);
          const returningQty = new Prisma.Decimal(line.quantity);
          const maxAllowed = new Prisma.Decimal(invoiceLine.quantity).sub(returnedQty);

          if (returningQty.gt(maxAllowed)) {
            throw new BadRequestException(`Cannot return more than purchased quantity. Max allowed for item ${line.item_id} is ${maxAllowed.toString()}`);
          }
        }
      }

      let taxableAmount = new Prisma.Decimal(0);
      let taxAmount = new Prisma.Decimal(0);
      let grandTotal = new Prisma.Decimal(0);

      const lines = dto.lines.map((line: any) => {
        const lineQty = new Prisma.Decimal(line.quantity);
        let lineRate = new Prisma.Decimal(line.rate);
        let lineTax = new Prisma.Decimal(0);
        
        if (invoice) {
          const invLine = invoice.lines.find((l: any) => l.item_id === line.item_id && l.unit_id === line.unit_id);
          if (invLine) {
            lineRate = new Prisma.Decimal(invLine.rate);
            if (new Prisma.Decimal(invLine.quantity).gt(0)) {
              const taxPerUnit = new Prisma.Decimal(invLine.tax_amount).div(invLine.quantity);
              lineTax = taxPerUnit.mul(lineQty);
            }
          }
        }

        const taxableValue = lineQty.mul(lineRate);
        const lineTotal = taxableValue.add(lineTax);

        taxableAmount = taxableAmount.add(taxableValue);
        taxAmount = taxAmount.add(lineTax);
        grandTotal = grandTotal.add(lineTotal);

        return {
          item_id: line.item_id,
          godown_id: line.godown_id,
          unit_id: line.unit_id,
          quantity: lineQty,
          rate: lineRate,
          taxable_value: taxableValue,
          tax_amount: lineTax,
          line_total: lineTotal,
        };
      });

      return tx.purchaseReturn.create({
        data: {
          company_id: companyId,
          branch_id: dto.branch_id,
          party_id: dto.party_id,
          financial_year_id: dto.financial_year_id,
          original_invoice_id: dto.original_invoice_id,
          document_number: dto.document_number,
          document_date: new Date(dto.document_date),
          status: 'DRAFT',
          reason_id: dto.reason_id,
          notes: dto.notes,
          taxable_amount: taxableAmount,
          tax_amount: taxAmount,
          grand_total: grandTotal,
          lines: { create: lines }
        },
        include: { lines: true }
      });
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    });
  }

  async getPurchaseReturns(companyId: string) {
    return this.prisma.purchaseReturn.findMany({
      where: { company_id: companyId },
      include: { party: true },
      orderBy: { document_date: 'desc' },
    });
  }

  async getPurchaseReturnById(id: string) {
    const ret = await this.prisma.purchaseReturn.findUnique({
      where: { id },
      include: {
        party: true,
        lines: { include: { item: true, unit: true } }
      }
    });
    if (!ret) throw new NotFoundException('Purchase Return not found');
    return ret;
  }

  async postPurchaseReturn(id: string, userId: string) {
    return this.postingService.postPurchaseReturn(id, userId);
  }

  async createReplacement(companyId: string, returnId: string, userId: string, dto: any) {
    return this.prisma.$transaction(async (tx) => {
      const purchaseReturn = await tx.purchaseReturn.findUnique({
        where: { id: returnId },
        include: { lines: true }
      });
      if (!purchaseReturn || purchaseReturn.company_id !== companyId) throw new NotFoundException('Purchase Return not found');
      if (purchaseReturn.status !== 'POSTED') throw new BadRequestException('Can only replace a POSTED Purchase Return');

      const lines = [];
      for (const line of dto.lines) {
        const returnLine = purchaseReturn.lines.find((l: any) => l.item_id === line.item_id && l.unit_id === line.unit_id);
        if (!returnLine) throw new BadRequestException(`Item ${line.item_id} not found in the original return`);

        const lineQty = new Prisma.Decimal(line.quantity);

        const existingReplacements = await tx.purchaseInvoiceLine.aggregate({
          where: {
            item_id: line.item_id,
            unit_id: line.unit_id,
            purchase_invoice: { replaced_return_id: returnId, status: { not: 'CANCELLED' } }
          },
          _sum: { quantity: true }
        });

        const replacedQty = existingReplacements._sum.quantity || new Prisma.Decimal(0);
        const maxAllowed = new Prisma.Decimal(returnLine.quantity).sub(replacedQty);

        if (lineQty.gt(maxAllowed)) {
          throw new BadRequestException(`Replacement quantity for item ${line.item_id} exceeds returned quantity`);
        }

        lines.push({
          item_id: line.item_id,
          godown_id: line.godown_id,
          unit_id: line.unit_id,
          quantity: lineQty,
          rate: new Prisma.Decimal(0),
          taxable_value: new Prisma.Decimal(0),
          tax_amount: new Prisma.Decimal(0),
          line_total: new Prisma.Decimal(0),
        });
      }

      return tx.purchaseInvoice.create({
        data: {
          company_id: companyId,
          branch_id: dto.branch_id,
          party_id: purchaseReturn.party_id,
          financial_year_id: dto.financial_year_id,
          document_number: dto.document_number,
          document_date: new Date(dto.document_date),
          status: 'DRAFT',
          replaced_return_id: purchaseReturn.id,
          taxable_amount: 0,
          tax_amount: 0,
          discount_amount: 0,
          grand_total: 0,
          paid_amount: 0,
          outstanding_amount: 0,
          lines: { create: lines }
        },
        include: { lines: true }
      });
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    });
  }
}
