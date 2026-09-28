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
}
