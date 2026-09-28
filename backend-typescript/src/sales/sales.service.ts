import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateSalesInvoiceDto } from './dto/create-sales-invoice.dto';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { CreateDeliveryChallanDto } from './dto/create-delivery-challan.dto';
import { CreateSalesReturnDto } from './dto/create-sales-return.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  private async validateIsolation(companyId: string, payload: any, items: { item_id: string, godown_id?: string, unit_id: string }[]) {
    if (payload.branch_id) {
      const branch = await this.prisma.branch.findUnique({ where: { id: payload.branch_id } });
      if (!branch || branch.company_id !== companyId) throw new BadRequestException('Branch does not belong to the company');
    }

    if (payload.party_id) {
      const party = await this.prisma.party.findUnique({ where: { id: payload.party_id } });
      if (!party || party.company_id !== companyId) throw new BadRequestException('Party does not belong to the company');
    }

    for (const item of items) {
      const dbItem = await this.prisma.item.findUnique({ where: { id: item.item_id } });
      if (!dbItem || dbItem.company_id !== companyId) throw new BadRequestException(`Item ${item.item_id} does not belong to the company`);

      const dbUnit = await this.prisma.unit.findUnique({ where: { id: item.unit_id } });
      if (!dbUnit || dbUnit.company_id !== companyId) throw new BadRequestException(`Unit ${item.unit_id} does not belong to the company`);

      if (item.godown_id) {
        const dbGodown = await this.prisma.godown.findUnique({
          where: { id: item.godown_id },
          include: { branch: true }
        });
        if (!dbGodown || dbGodown.branch.company_id !== companyId) throw new BadRequestException(`Godown ${item.godown_id} does not belong to the company`);
      }
    }
  }

  // --- Sales Order ---

  async createSalesOrder(companyId: string, dto: CreateSalesOrderDto) {
    await this.validateIsolation(companyId, dto, dto.lines.map(l => ({ item_id: l.item_id, unit_id: l.unit_id })));

    let grandTotal = new Prisma.Decimal(0);
    const lines = dto.lines.map(line => {
      const lineQty = new Prisma.Decimal(line.ordered_quantity);
      const lineRate = new Prisma.Decimal(line.rate);
      const lineDiscount = new Prisma.Decimal(line.discount || 0);
      const taxableValue = lineQty.mul(lineRate).sub(lineDiscount);
      const lineTax = new Prisma.Decimal(0);
      const lineTotal = taxableValue.add(lineTax);

      grandTotal = grandTotal.add(lineTotal);

      return {
        item_id: line.item_id,
        unit_id: line.unit_id,
        ordered_quantity: lineQty,
        rate: lineRate,
        discount: lineDiscount,
        tax: lineTax,
        line_total: lineTotal,
      };
    });

    return this.prisma.salesOrder.create({
      data: {
        company_id: companyId,
        branch_id: dto.branch_id,
        party_id: dto.party_id,
        document_number: dto.document_number,
        document_date: new Date(dto.document_date),
        expected_delivery_date: dto.expected_delivery_date ? new Date(dto.expected_delivery_date) : undefined,
        notes: dto.notes,
        status: 'DRAFT',
        total: grandTotal,
        lines: { create: lines }
      },
      include: { lines: true }
    });
  }

  async getSalesOrder(companyId: string, id: string) {
    const order = await this.prisma.salesOrder.findUnique({ where: { id }, include: { lines: true } });
    if (!order || order.company_id !== companyId) throw new NotFoundException('Sales Order not found');
    return order;
  }

  // --- Delivery Challan ---

  async createDeliveryChallan(companyId: string, dto: CreateDeliveryChallanDto) {
    await this.validateIsolation(companyId, dto, dto.lines.map(l => ({ item_id: l.item_id, godown_id: l.godown_id, unit_id: l.unit_id })));

    if (dto.sales_order_id) {
      const order = await this.prisma.salesOrder.findUnique({ where: { id: dto.sales_order_id } });
      if (!order || order.company_id !== companyId) throw new BadRequestException('Invalid Sales Order reference');
    }

    const lines = dto.lines.map(line => ({
      item_id: line.item_id,
      godown_id: line.godown_id,
      unit_id: line.unit_id,
      dispatched_quantity: new Prisma.Decimal(line.dispatched_quantity),
      sales_order_line_id: line.sales_order_line_id,
    }));

    return this.prisma.deliveryChallan.create({
      data: {
        company_id: companyId,
        branch_id: dto.branch_id,
        party_id: dto.party_id,
        sales_order_id: dto.sales_order_id,
        document_number: dto.document_number,
        document_date: new Date(dto.document_date),
        status: 'DRAFT',
        lines: { create: lines }
      },
      include: { lines: true }
    });
  }

  async getDeliveryChallan(companyId: string, id: string) {
    const challan = await this.prisma.deliveryChallan.findUnique({ where: { id }, include: { lines: true } });
    if (!challan || challan.company_id !== companyId) throw new NotFoundException('Delivery Challan not found');
    return challan;
  }

  // --- Sales Invoice ---

  async createSalesInvoice(companyId: string, dto: CreateSalesInvoiceDto) {
    await this.validateIsolation(companyId, dto, dto.lines.map(l => ({ item_id: l.item_id, godown_id: l.godown_id, unit_id: l.unit_id })));

    let taxableAmount = new Prisma.Decimal(0);
    let taxAmount = new Prisma.Decimal(0);
    let discountAmount = new Prisma.Decimal(0);
    let grandTotal = new Prisma.Decimal(0);

    const lines = dto.lines.map(line => {
      const lineQty = new Prisma.Decimal(line.quantity);
      const lineRate = new Prisma.Decimal(line.rate);
      const lineDiscount = new Prisma.Decimal(line.discount_amount || 0);
      
      const taxableValue = lineQty.mul(lineRate).sub(lineDiscount);
      const lineTax = new Prisma.Decimal(0); // Tax implementation pending
      const lineTotal = taxableValue.add(lineTax);

      taxableAmount = taxableAmount.add(taxableValue);
      taxAmount = taxAmount.add(lineTax);
      discountAmount = discountAmount.add(lineDiscount);
      grandTotal = grandTotal.add(lineTotal);

      return {
        item_id: line.item_id,
        godown_id: line.godown_id,
        unit_id: line.unit_id,
        quantity: lineQty,
        rate: lineRate,
        discount_amount: lineDiscount,
        taxable_value: taxableValue,
        tax_amount: lineTax,
        line_total: lineTotal,
        sales_order_line_id: line.sales_order_line_id,
        delivery_challan_line_id: line.delivery_challan_line_id,
      };
    });

    return this.prisma.salesInvoice.create({
      data: {
        company_id: companyId,
        branch_id: dto.branch_id,
        party_id: dto.party_id,
        financial_year_id: dto.financial_year_id,
        document_number: dto.document_number,
        document_date: new Date(dto.document_date),
        due_date: dto.due_date ? new Date(dto.due_date) : undefined,
        payment_terms_days: dto.payment_terms_days,
        status: 'DRAFT',
        taxable_amount: taxableAmount,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        grand_total: grandTotal,
        lines: { create: lines }
      },
      include: { lines: true }
    });
  }

  async getSalesInvoice(companyId: string, id: string) {
    const invoice = await this.prisma.salesInvoice.findUnique({
      where: { id },
      include: { lines: true }
    });
    if (!invoice || invoice.company_id !== companyId) {
      throw new NotFoundException('Sales Invoice not found');
    }
    return invoice;
  }

  // --- Sales Return ---

  async createSalesReturn(companyId: string, dto: CreateSalesReturnDto) {
    await this.validateIsolation(companyId, dto, dto.lines.map(l => ({ item_id: l.item_id, godown_id: l.godown_id, unit_id: l.unit_id })));

    if (dto.original_invoice_id) {
      const invoice = await this.prisma.salesInvoice.findUnique({ where: { id: dto.original_invoice_id } });
      if (!invoice || invoice.company_id !== companyId) throw new BadRequestException('Invalid original invoice reference');
    }

    let taxableAmount = new Prisma.Decimal(0);
    let taxAmount = new Prisma.Decimal(0);
    let grandTotal = new Prisma.Decimal(0);

    const lines = dto.lines.map(line => {
      const lineQty = new Prisma.Decimal(line.quantity);
      const lineRate = new Prisma.Decimal(line.rate);
      
      const taxableValue = lineQty.mul(lineRate);
      const lineTax = new Prisma.Decimal(0); 
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

    return this.prisma.salesReturn.create({
      data: {
        company_id: companyId,
        branch_id: dto.branch_id,
        party_id: dto.party_id,
        financial_year_id: dto.financial_year_id,
        original_invoice_id: dto.original_invoice_id,
        document_number: dto.document_number,
        document_date: new Date(dto.document_date),
        status: 'DRAFT',
        taxable_amount: taxableAmount,
        tax_amount: taxAmount,
        grand_total: grandTotal,
        lines: { create: lines }
      },
      include: { lines: true }
    });
  }

  async getSalesReturn(companyId: string, id: string) {
    const sr = await this.prisma.salesReturn.findUnique({ where: { id }, include: { lines: true } });
    if (!sr || sr.company_id !== companyId) throw new NotFoundException('Sales Return not found');
    return sr;
  }
}
