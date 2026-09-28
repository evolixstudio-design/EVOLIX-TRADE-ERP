import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { InventoryPostingService, PostMovementDto } from './posting.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RequirePermissions } from '../common/guards/auth.guard';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';

@Controller('api/v1/inventory')
@UseGuards(AuthGuard)
export class InventoryController {
  constructor(
    private readonly inventoryPostingService: InventoryPostingService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('stock')
  @RequirePermissions('inventory.read')
  async getStockSummary(
    @Request() req: any,
    @Query('godown_id') godownId?: string,
    @Query('item_id') itemId?: string,
  ) {
    const where: any = { company_id: req.user.company_id };
    if (godownId) where.godown_id = godownId;
    if (itemId) where.item_id = itemId;

    const balances = await this.prisma.stockBalanceProjection.findMany({
      where,
      include: {
        item: { select: { sku: true, name: true, primary_unit_id: true } },
        godown: { select: { code: true, name: true } },
      },
    });

    return balances.map(b => ({
      godown: b.godown.name,
      item: b.item.name,
      sku: b.item.sku,
      quantity: b.quantity.toString(),
      unit: b.item.primary_unit_id,
    }));
  }

  @Get('movements')
  @RequirePermissions('inventory.read')
  async getStockLedger(
    @Request() req: any,
    @Query('godown_id') godownId?: string,
    @Query('item_id') itemId?: string,
  ) {
    const where: any = { company_id: req.user.company_id };
    if (godownId) where.godown_id = godownId;
    if (itemId) where.item_id = itemId;

    const movements = await this.prisma.stockMovement.findMany({
      where,
      orderBy: { business_date: 'asc' },
      include: {
        item: { select: { name: true } },
      },
      take: 100,
    });

    return movements;
  }

  @Post('adjustments')
  @RequirePermissions('inventory.adjust')
  async postAdjustment(@Request() req: any, @Body() body: any) {
    // Expected body: { godown_id, item_id, quantity, type: 'IN' | 'OUT', reason, date }
    return this.prisma.$transaction(async (tx) => {
      // In a real app we'd create a StockAdjustment document header first.
      // For brevity, we pass direct to movement.
      const docId = `ADJ-${Date.now()}`;
      const type = body.type === 'IN' ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT';
      
      const dto: PostMovementDto = {
        company_id: req.user.company_id,
        branch_id: req.user.branch_id,
        movement_type: type,
        business_date: new Date(body.date || Date.now()),
        source_document_type: 'STOCK_ADJUSTMENT',
        source_document_id: docId,
        lines: [{
          item_id: body.item_id,
          godown_id: body.godown_id,
          quantity: body.quantity,
          unit_id: 'PCS', // Defaulting for simplicity in demo
        }],
      };

      await this.inventoryPostingService.postMovement(tx, dto);

      // Audit log
      await tx.auditLog.create({
        data: {
          company_id: req.user.company_id,
          user_id: req.user.id,
          action: 'STOCK_ADJUSTMENT_POSTED',
          source_document_type: 'STOCK_ADJUSTMENT',
          source_document_id: docId,
          details: JSON.stringify({ reason: body.reason, quantity: body.quantity }),
        }
      });

      return { success: true, document_id: docId };
    });
  }

  @Post('transfers')
  @RequirePermissions('inventory.transfer')
  async postTransfer(@Request() req: any, @Body() body: any) {
    // Expected body: { from_godown_id, to_godown_id, item_id, quantity, date }
    return this.prisma.$transaction(async (tx) => {
      const docId = `TRF-${Date.now()}`;
      
      const outDto: PostMovementDto = {
        company_id: req.user.company_id,
        branch_id: req.user.branch_id,
        movement_type: 'TRANSFER_OUT',
        business_date: new Date(body.date || Date.now()),
        source_document_type: 'STOCK_TRANSFER',
        source_document_id: docId,
        lines: [{ item_id: body.item_id, godown_id: body.from_godown_id, quantity: body.quantity, unit_id: 'PCS', source_line_id: 'OUT' }],
      };

      const inDto: PostMovementDto = {
        company_id: req.user.company_id,
        branch_id: req.user.branch_id,
        movement_type: 'TRANSFER_IN',
        business_date: new Date(body.date || Date.now()),
        source_document_type: 'STOCK_TRANSFER',
        source_document_id: docId,
        lines: [{ item_id: body.item_id, godown_id: body.to_godown_id, quantity: body.quantity, unit_id: 'PCS', source_line_id: 'IN' }],
      };

      // Atomic execution
      await this.inventoryPostingService.postMovement(tx, outDto);
      await this.inventoryPostingService.postMovement(tx, inDto);

      // Audit log
      await tx.auditLog.create({
        data: {
          company_id: req.user.company_id,
          user_id: req.user.id,
          action: 'STOCK_TRANSFER_POSTED',
          source_document_type: 'STOCK_TRANSFER',
          source_document_id: docId,
        }
      });

      return { success: true, document_id: docId };
    });
  }
}
