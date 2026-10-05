import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { RetailService } from './retail.service';
import { CreateRetailItemDto, UpdateRetailItemDto } from './dto/retail-item.dto';
import { CreateRetailCustomerDto, ReceivePaymentDto } from './dto/retail-customer.dto';
import { CreateRetailSupplierDto, PaySupplierDto } from './dto/retail-supplier.dto';
import { CreateRetailPurchaseDto } from './dto/retail-purchase.dto';
import { CreateNeedListDto, UpdateNeedStatusDto } from './dto/retail-need.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { SubscriptionGuard } from '../common/guards/subscription.guard';
import { FeatureGuard, RequireFeature } from '../common/guards/feature.guard';

@Controller('api/v1/retail')
@UseGuards(AuthGuard, SubscriptionGuard, FeatureGuard)
@RequireFeature('RETAIL_POS')
export class RetailController {
  constructor(private readonly retailService: RetailService) {}

  // ── ITEMS ──────────────────────────────────────────────────────────

  @Get('items')
  async getItems(@Req() req: any, @Query('search') search?: string) {
    const { company_id } = req.user;
    return this.retailService.getItems(company_id, search);
  }

  @Post('items')
  async createItem(@Req() req: any, @Body() dto: CreateRetailItemDto) {
    const { company_id, id: userId, branch_id } = req.user;
    const financialYearId = req.headers['x-financial-year-id'];
    return this.retailService.createItem(company_id, userId, financialYearId, branch_id, dto);
  }

  @Post('items/:id') // Using POST for simpler proxying or use PATCH
  async updateItem(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateRetailItemDto) {
    // Left for complete implementation
    return { success: true };
  }

  // ── CUSTOMERS ──────────────────────────────────────────────────────

  @Get('customers')
  async getCustomers(@Req() req: any, @Query('search') search?: string) {
    const { company_id } = req.user;
    return this.retailService.getCustomers(company_id, search);
  }

  @Post('customers')
  async createCustomer(@Req() req: any, @Body() dto: CreateRetailCustomerDto) {
    const { company_id } = req.user;
    return this.retailService.createCustomer(company_id, dto);
  }

  @Get('customers/:id/khata')
  async getCustomerKhata(@Req() req: any, @Param('id') id: string) {
    const { company_id } = req.user;
    return this.retailService.getCustomerKhata(company_id, id);
  }

  @Post('customers/:id/payments')
  async receivePayment(@Req() req: any, @Param('id') partyId: string, @Body() dto: ReceivePaymentDto) {
    const { company_id, branch_id, id: userId } = req.user;
    const financialYearId = req.headers['x-financial-year-id'];
    return this.retailService.receivePayment(company_id, branch_id, financialYearId, userId, partyId, dto);
  }

  // ── SUPPLIERS ──────────────────────────────────────────────────────

  @Get('suppliers')
  async getSuppliers(@Req() req: any, @Query('search') search?: string) {
    const { company_id } = req.user;
    return this.retailService.getSuppliers(company_id, search);
  }

  @Post('suppliers')
  async createSupplier(@Req() req: any, @Body() dto: CreateRetailSupplierDto) {
    const { company_id } = req.user;
    return this.retailService.createSupplier(company_id, dto);
  }

  @Get('suppliers/:id/khata')
  async getSupplierKhata(@Req() req: any, @Param('id') id: string) {
    const { company_id } = req.user;
    return this.retailService.getSupplierKhata(company_id, id);
  }

  @Post('suppliers/:id/payments')
  async paySupplier(@Req() req: any, @Param('id') partyId: string, @Body() dto: PaySupplierDto) {
    const { company_id, branch_id, id: userId } = req.user;
    const financialYearId = req.headers['x-financial-year-id'];
    return this.retailService.paySupplier(company_id, branch_id, financialYearId, userId, partyId, dto);
  }

  // ── PURCHASES ──────────────────────────────────────────────────────

  @Get('purchases')
  async getPurchases(@Req() req: any) {
    const { company_id } = req.user;
    return this.retailService.getPurchases(company_id);
  }

  @Post('purchases')
  async createPurchase(@Req() req: any, @Body() dto: CreateRetailPurchaseDto) {
    const { company_id, branch_id, id: userId } = req.user;
    const financialYearId = req.headers['x-financial-year-id'];
    return this.retailService.createPurchase(company_id, branch_id, financialYearId, userId, dto);
  }

  // ── NEED LIST ──────────────────────────────────────────────────────

  @Get('needs')
  async getNeeds(@Req() req: any) {
    const { company_id } = req.user;
    return this.retailService.getNeeds(company_id);
  }

  @Post('needs')
  async createNeed(@Req() req: any, @Body() dto: CreateNeedListDto) {
    const { company_id, branch_id, id: userId } = req.user;
    return this.retailService.createNeed(company_id, branch_id, userId, dto);
  }

  @Post('needs/:id/status')
  async updateNeedStatus(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateNeedStatusDto) {
    const { company_id } = req.user;
    return this.retailService.updateNeedStatus(id, company_id, dto);
  }

  // ── HOME ───────────────────────────────────────────────────────────

  @Get('home')
  async getHomeDashboard(@Req() req: any) {
    const { company_id } = req.user;
    return this.retailService.getHomeDashboard(company_id);
  }
}
