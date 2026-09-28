import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';

import { PostingService as AccountingPostingService } from '../accounting/posting.service';
import { InventoryPostingService, PostMovementDto, MovementLine } from '../inventory/posting.service';

@Injectable()
export class PostingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountingPostingService: AccountingPostingService,
    private readonly inventoryPostingService: InventoryPostingService,
  ) {}

  // ── GRN POSTING & REVERSAL ────────────────────────────────────────────────

  async postGoodsReceipt(grnId: string, userId: string) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Fetch GRN with lines
      const grn = await tx.goodsReceipt.findUnique({
        where: { id: grnId },
        include: { lines: true },
      });

      if (!grn) throw new BadRequestException('GRN not found');
      if (grn.status === 'POSTED') throw new BadRequestException('GRN is already posted');
      if (grn.status === 'CANCELLED') throw new BadRequestException('Cannot post a cancelled GRN');
      if (grn.lines.length === 0) throw new BadRequestException('GRN must have at least one line');

      // Check PO if it exists
      let po = null;
      if (grn.purchase_order_id) {
        po = await tx.purchaseOrder.findUnique({
          where: { id: grn.purchase_order_id },
          include: { lines: true },
        });
        if (!po) throw new BadRequestException('Linked Purchase Order not found');
        if (po.status === 'CANCELLED' || po.status === 'CLOSED') {
          throw new BadRequestException(`Cannot receive against PO with status ${po.status}`);
        }
      }

      // 2. Process each line
      for (const line of grn.lines) {
        if (Number(line.received_quantity) <= 0) {
          throw new BadRequestException(`Invalid quantity on line ${line.id}. Must be > 0.`);
        }

        // Validate PO limits if linked
        if (line.purchase_order_line_id && po) {
          const poLine = po.lines.find((l: any) => l.id === line.purchase_order_line_id);
          if (!poLine) throw new BadRequestException('Linked PO Line not found');
          
          const newTotalReceived = Number(poLine.received_quantity) + Number(line.received_quantity);
          if (newTotalReceived > Number(poLine.ordered_quantity)) {
            throw new BadRequestException(`Over-receipt prevented. Cannot receive more than ordered for item ${line.item_id}`);
          }

          // Update PO Line
          await tx.purchaseOrderLine.update({
            where: { id: line.purchase_order_line_id },
            data: { received_quantity: { increment: line.received_quantity } },
          });
        }
      }

      const invLines: MovementLine[] = grn.lines.map((l: any) => ({
          item_id: l.item_id,
          godown_id: l.godown_id,
          quantity: l.received_quantity,
          unit_id: l.unit_id,
          source_line_id: l.id
        }));

        await this.inventoryPostingService.postMovement(tx, {
          company_id: grn.company_id,
          branch_id: grn.branch_id,
          movement_type: 'PURCHASE_IN',
          business_date: grn.document_date,
          source_document_type: 'GOODS_RECEIPT',
          source_document_id: grn.id,
          lines: invLines,
        });

      // Recalculate PO Status
      if (po) {
        // re-fetch lines since we just updated them
        const updatedPoLines = await tx.purchaseOrderLine.findMany({ where: { purchase_order_id: po.id } });
        let fullyReceived = true;
        for (const poline of updatedPoLines) {
          if (Number(poline.received_quantity) < Number(poline.ordered_quantity)) {
            fullyReceived = false;
          }
        }
        await tx.purchaseOrder.update({
          where: { id: po.id },
          data: { status: fullyReceived ? 'FULLY_RECEIVED' : 'PARTIALLY_RECEIVED' },
        });
      }

      // 3. Mark GRN POSTED
      return tx.goodsReceipt.update({
        where: { id: grn.id },
        data: { status: 'POSTED', posted_at: new Date(), posted_by: userId },
      });
    });
  }

  async reverseGoodsReceipt(grnId: string, userId: string) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const grn = await tx.goodsReceipt.findUnique({
        where: { id: grnId },
        include: { lines: true },
      });

      if (!grn) throw new BadRequestException('GRN not found');
      if (grn.status !== 'POSTED') throw new BadRequestException('Only POSTED GRNs can be reversed');

      // Reverse lines
      for (const line of grn.lines) {
        // Reverse PO Line receiving
        if (line.purchase_order_line_id) {
          await tx.purchaseOrderLine.update({
            where: { id: line.purchase_order_line_id },
            data: { received_quantity: { decrement: line.received_quantity } },
          });
        }
      }

      // Reverse Inventory
      await this.inventoryPostingService.reverseMovement(
        tx,
        grn.company_id,
        'GOODS_RECEIPT',
        grn.id,
        'GOODS_RECEIPT_REVERSAL'
      );

      // Recalculate PO Status
      if (grn.purchase_order_id) {
        const poLines = await tx.purchaseOrderLine.findMany({ where: { purchase_order_id: grn.purchase_order_id } });
        let totalReceived = 0;
        poLines.forEach((l: any) => totalReceived += Number(l.received_quantity));
        const status = totalReceived === 0 ? 'CONFIRMED' : 'PARTIALLY_RECEIVED';
        
        await tx.purchaseOrder.update({
          where: { id: grn.purchase_order_id },
          data: { status },
        });
      }

      // Mark GRN CANCELLED
      return tx.goodsReceipt.update({
        where: { id: grn.id },
        data: { status: 'CANCELLED' }, // Reversal is represented by status CANCELLED but we keep the audit trail intact.
      });
    });
  }

  // ── INVOICE POSTING & REVERSAL ────────────────────────────────────────────

  async postPurchaseInvoice(invoiceId: string, userId: string) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const invoice = await tx.purchaseInvoice.findUnique({
        where: { id: invoiceId },
        include: { lines: true },
      });

      if (!invoice) throw new BadRequestException('Invoice not found');
      if (invoice.status === 'POSTED') throw new BadRequestException('Invoice is already posted');
      if (invoice.status === 'CANCELLED') throw new BadRequestException('Cannot post cancelled invoice');

      // Validation
      if (Number(invoice.grand_total) < 0) throw new BadRequestException('Invoice total cannot be negative');

      // 1. Create Accounting Voucher via Centralized Accounting Core
      const getOrCreateLedger = async (code: string, name: string) => {
        let acc = await tx.ledgerAccount.findFirst({ where: { company_id: invoice.company_id, code } });
        if (!acc) acc = await tx.ledgerAccount.create({ data: { company_id: invoice.company_id, code, name, account_type: 'UNKNOWN', normal_balance: 'DEBIT' } });
        return acc;
      };

      const payableAccount = await getOrCreateLedger('2000', 'Accounts Payable');
      const purchaseAccount = await getOrCreateLedger('5000', 'Purchases');
      const taxAccount = await getOrCreateLedger('2200', 'Input Tax');

      const lines = [];

      // Credit Accounts Payable
      lines.push({
        ledger_account_id: payableAccount.id,
        party_id: invoice.party_id,
        credit: Number(invoice.grand_total),
        debit: 0,
      });

      // Debit Purchases
      if (Number(invoice.taxable_amount) > 0) {
        lines.push({
          ledger_account_id: purchaseAccount.id,
          debit: Number(invoice.taxable_amount),
          credit: 0,
        });
      }

      // Debit Tax
      if (Number(invoice.tax_amount) > 0) {
        lines.push({
          ledger_account_id: taxAccount.id,
          debit: Number(invoice.tax_amount),
          credit: 0,
        });
      }

      await this.accountingPostingService.postVoucher(tx, {
        company_id: invoice.company_id,
        branch_id: invoice.branch_id,
        financial_year_id: invoice.financial_year_id,
        voucher_type: 'PURCHASE',
        document_number: `JV-${invoice.document_number}`,
        voucher_date: invoice.document_date,
        source_document_type: 'PURCHASE_INVOICE',
        source_document_id: invoice.id,
        narration: `Purchase Invoice ${invoice.document_number}`,
        posted_by: userId,
        lines,
      });

      // 3. Mark Invoice POSTED
      return tx.purchaseInvoice.update({
        where: { id: invoice.id },
        data: {
          status: 'POSTED',
          posted_at: new Date(),
          posted_by: userId,
          outstanding_amount: invoice.grand_total, // Initializing payable balance
        },
      });
    });
  }

  async reversePurchaseInvoice(invoiceId: string, userId: string) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const invoice = await tx.purchaseInvoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) throw new BadRequestException('Invoice not found');
      if (invoice.status !== 'POSTED') throw new BadRequestException('Only POSTED invoices can be reversed');
      if (Number(invoice.paid_amount) > 0) throw new BadRequestException('Cannot reverse invoice with payments applied. Reverse payments first.');

      // Find the associated voucher
      const voucher = await tx.voucher.findFirst({
        where: { source_document_type: 'PURCHASE_INVOICE', source_document_id: invoice.id, status: 'POSTED' },
      });

      if (voucher) {
        await this.accountingPostingService.reverseVoucher(tx, voucher.id, userId, 'Invoice Cancelled');
      }

      // Mark Invoice CANCELLED
      return tx.purchaseInvoice.update({
        where: { id: invoice.id },
        data: {
          status: 'CANCELLED',
          outstanding_amount: 0,
        },
      });
    });
  }
}
