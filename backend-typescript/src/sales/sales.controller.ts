import { Controller, Post, Body, Get, Param, Request, UseGuards, Query } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesPostingService } from './posting.service';
import { CreateSalesInvoiceDto } from './dto/create-sales-invoice.dto';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { CreateDeliveryChallanDto } from './dto/create-delivery-challan.dto';
import { CreateSalesReturnDto } from './dto/create-sales-return.dto';
import { AuthGuard, RequirePermissions } from '../common/guards/auth.guard';
import { PrismaService } from '../database/prisma.service';

@Controller('api/v1/sales')
@UseGuards(AuthGuard)
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
    private readonly postingService: SalesPostingService,
    private readonly prisma: PrismaService,
  ) {}

  // --- Dashboard ---
  @Get('dashboard')
  @RequirePermissions('sales.read')
  async getDashboard(@Request() req: any) {
    const companyId = req.user.company_id;
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [todaySales, pendingOrders, unpostedInvoices] = await Promise.all([
      this.prisma.salesInvoice.aggregate({
        where: { company_id: companyId, status: 'POSTED', document_date: { gte: startOfDay } },
        _sum: { grand_total: true }
      }),
      this.prisma.salesOrder.count({
        where: { company_id: companyId, status: { in: ['CONFIRMED', 'PARTIALLY_DELIVERED'] } }
      }),
      this.prisma.salesInvoice.count({
        where: { company_id: companyId, status: 'DRAFT' }
      })
    ]);

    return {
      today_sales: todaySales._sum.grand_total || 0,
      pending_orders: pendingOrders,
      unposted_invoices: unpostedInvoices
    };
  }

  // --- Sales Order ---

  @Post('orders')
  @RequirePermissions('sales.create')
  async createOrder(@Request() req: any, @Body() dto: CreateSalesOrderDto) {
    return this.salesService.createSalesOrder(req.user.company_id, dto);
  }

  @Get('orders')
  @RequirePermissions('sales.read')
  async getOrders(@Request() req: any) {
    return this.prisma.salesOrder.findMany({ where: { company_id: req.user.company_id } });
  }

  @Get('orders/:id')
  @RequirePermissions('sales.read')
  async getOrder(@Request() req: any, @Param('id') id: string) {
    return this.salesService.getSalesOrder(req.user.company_id, id);
  }

  // --- Delivery Challan ---

  @Post('challans')
  @RequirePermissions('sales.create')
  async createChallan(@Request() req: any, @Body() dto: CreateDeliveryChallanDto) {
    return this.salesService.createDeliveryChallan(req.user.company_id, dto);
  }

  @Get('challans')
  @RequirePermissions('sales.read')
  async getChallans(@Request() req: any) {
    return this.prisma.deliveryChallan.findMany({ where: { company_id: req.user.company_id } });
  }

  @Get('challans/:id')
  @RequirePermissions('sales.read')
  async getChallan(@Request() req: any, @Param('id') id: string) {
    return this.salesService.getDeliveryChallan(req.user.company_id, id);
  }

  @Post('challans/:id/post')
  @RequirePermissions('sales.post')
  async postChallan(@Request() req: any, @Param('id') id: string) {
    return this.postingService.postDeliveryChallan(req.user.company_id, id, req.user.id);
  }

  // --- Sales Invoice ---

  @Post('invoices')
  @RequirePermissions('sales.create')
  async createInvoice(@Request() req: any, @Body() dto: CreateSalesInvoiceDto) {
    return this.salesService.createSalesInvoice(req.user.company_id, dto);
  }

  @Get('invoices')
  @RequirePermissions('sales.read')
  async getInvoices(@Request() req: any) {
    return this.prisma.salesInvoice.findMany({ where: { company_id: req.user.company_id } });
  }

  @Get('invoices/:id')
  @RequirePermissions('sales.read')
  async getInvoice(@Request() req: any, @Param('id') id: string) {
    return this.salesService.getSalesInvoice(req.user.company_id, id);
  }

  @Post('invoices/:id/post')
  @RequirePermissions('sales.post')
  async postInvoice(@Request() req: any, @Param('id') id: string) {
    return this.postingService.postSalesInvoice(req.user.company_id, id, req.user.id);
  }

  @Post('invoices/:id/reverse')
  @RequirePermissions('sales.reverse')
  async reverseInvoice(@Request() req: any, @Param('id') id: string) {
    return this.postingService.reverseSalesInvoice(req.user.company_id, id, req.user.id);
  }

  // --- Sales Return ---

  @Post('returns')
  @RequirePermissions('sales.return')
  async createReturn(@Request() req: any, @Body() dto: CreateSalesReturnDto) {
    return this.salesService.createSalesReturn(req.user.company_id, dto);
  }

  @Get('returns')
  @RequirePermissions('sales.read')
  async getReturns(@Request() req: any) {
    return this.prisma.salesReturn.findMany({ where: { company_id: req.user.company_id } });
  }

  @Get('returns/:id')
  @RequirePermissions('sales.read')
  async getReturn(@Request() req: any, @Param('id') id: string) {
    return this.salesService.getSalesReturn(req.user.company_id, id);
  }

  @Post('returns/:id/post')
  @RequirePermissions('sales.post')
  async postReturn(@Request() req: any, @Param('id') id: string) {
    return this.postingService.postSalesReturn(req.user.company_id, id, req.user.id);
  }
}
