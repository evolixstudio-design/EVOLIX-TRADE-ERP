import { Controller, Post, Get, Body, Req, UseGuards, Query, Param } from '@nestjs/common';
import { BillingService } from './billing.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { SubscriptionGuard } from '../../common/guards/subscription.guard';
import { FeatureGuard, RequireFeature } from '../../common/guards/feature.guard';

@Controller('api/v1/retail/bills')
@UseGuards(AuthGuard, SubscriptionGuard, FeatureGuard)
@RequireFeature('RETAIL_POS')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  async getBills(@Req() req: any, @Query() query: any) {
    const { company_id, branch_id } = req.user;
    return this.billingService.getBills(company_id, branch_id, query);
  }

  @Get(':id')
  async getBillDetail(@Req() req: any, @Param('id') id: string) {
    const { company_id } = req.user;
    return this.billingService.getBillDetail(id, company_id);
  }

  @Post()
  async createBill(@Req() req: any, @Body() dto: any) {
    const { company_id, branch_id, id: userId } = req.user;
    return this.billingService.createBill(company_id, branch_id, userId, dto);
  }

  @Post('hold')
  async holdBill(@Req() req: any, @Body() dto: { items: any[] }) {
    const { company_id, branch_id, id: userId } = req.user;
    return this.billingService.holdBill(company_id, branch_id, userId, dto.items);
  }

  @Get('hold')
  async getHeldBills(@Req() req: any, @Query('branch_id') branchId: string) {
    const { company_id, id: userId } = req.user;
    return this.billingService.getHeldBills(company_id, branchId || req.user.branch_id, userId);
  }

  @Post('hold/:id/resume')
  async resumeBill(@Req() req: any, @Param('id') id: string) {
    const { company_id, id: userId } = req.user;
    return this.billingService.resumeBill(id, company_id, userId);
  }

  @Post('return')
  async postReturn(@Req() req: any, @Body() dto: any) {
    const { company_id, branch_id, id: userId } = req.user;
    return this.billingService.postReturn(company_id, branch_id, userId, dto);
  }
}
