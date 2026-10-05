import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { InventoryPostingService, PostMovementDto } from './posting.service';
import { Prisma } from '@prisma/client';

export interface CreateAdjustmentDto {
  company_id: string;
  branch_id: string;
  financial_year_id: string;
  user_id: string;
  document_date: Date;
  adjustment_type: 'IN' | 'OUT';
  narration?: string;
  lines: {
    item_id: string;
    godown_id: string;
    unit_id: string;
    quantity: number;
    cost_rate?: number;
    reason?: string;
  }[];
}

@Injectable()
export class StockAdjustmentService {
  constructor(
    private prisma: PrismaService,
    private postingService: InventoryPostingService,
  ) {}

  async createAndPost(data: CreateAdjustmentDto) {
    if (!data.lines || data.lines.length === 0) {
      throw new BadRequestException('Adjustment must have at least one line');
    }

    return await this.prisma.$transaction(async (tx) => {
      // Generate document number
      const count = await tx.stockAdjustment.count({
        where: { company_id: data.company_id, financial_year_id: data.financial_year_id }
      });
      const docNum = `ADJ-${data.financial_year_id.substring(0, 4)}-${(count + 1).toString().padStart(4, '0')}`;

      // Create Adjustment Header & Lines
      const adjustment = await tx.stockAdjustment.create({
        data: {
          company_id: data.company_id,
          branch_id: data.branch_id,
          financial_year_id: data.financial_year_id,
          document_number: docNum,
          document_date: data.document_date,
          adjustment_type: data.adjustment_type,
          status: 'POSTED',
          narration: data.narration,
          posted_at: new Date(),
          posted_by: data.user_id,
          lines: {
            create: data.lines.map(l => ({
              item_id: l.item_id,
              godown_id: l.godown_id,
              unit_id: l.unit_id,
              quantity: l.quantity,
              cost_rate: l.cost_rate || 0,
              reason: l.reason
            }))
          }
        },
        include: { lines: true }
      });

      // Post Movements
      const movementType = data.adjustment_type === 'IN' ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT';
      
      const movementDto: PostMovementDto = {
        company_id: data.company_id,
        branch_id: data.branch_id,
        movement_type: movementType,
        business_date: data.document_date,
        source_document_type: 'STOCK_ADJUSTMENT',
        source_document_id: adjustment.id,
        lines: adjustment.lines.map((l: any) => ({
          item_id: l.item_id,
          godown_id: l.godown_id,
          quantity: Number(l.quantity),
          unit_id: l.unit_id,
          source_line_id: l.id
        }))
      };

      await this.postingService.postMovement(tx, movementDto);

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          company_id: data.company_id,
          user_id: data.user_id,
          action: 'STOCK_ADJUSTMENT_POSTED',
          source_document_type: 'STOCK_ADJUSTMENT',
          source_document_id: adjustment.id,
          details: JSON.stringify({ type: data.adjustment_type, document_number: docNum })
        }
      });

      return adjustment;
    });
  }

  async reverseAdjustment(id: string, userId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const adjustment = await tx.stockAdjustment.findUnique({
        where: { id },
        include: { lines: true }
      });

      if (!adjustment) throw new BadRequestException('Adjustment not found');
      if (adjustment.status === 'REVERSED') throw new BadRequestException('Adjustment already reversed');
      if (adjustment.status !== 'POSTED') throw new BadRequestException('Can only reverse POSTED adjustments');

      // Post compensating movements
      const reversalType = adjustment.adjustment_type === 'IN' ? 'ADJUSTMENT_OUT' : 'ADJUSTMENT_IN';

      const movementDto: PostMovementDto = {
        company_id: adjustment.company_id,
        branch_id: adjustment.branch_id,
        movement_type: reversalType,
        business_date: new Date(),
        source_document_type: 'STOCK_ADJUSTMENT',
        source_document_id: adjustment.id,
        lines: adjustment.lines.map((l: any) => ({
          item_id: l.item_id,
          godown_id: l.godown_id,
          quantity: Number(l.quantity),
          unit_id: l.unit_id,
          source_line_id: l.id
        }))
      };

      await this.postingService.postMovement(tx, movementDto);

      const updated = await tx.stockAdjustment.update({
        where: { id },
        data: {
          status: 'REVERSED',
          updated_at: new Date()
        }
      });

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          company_id: adjustment.company_id,
          user_id: userId,
          action: 'STOCK_ADJUSTMENT_REVERSED',
          source_document_type: 'STOCK_ADJUSTMENT',
          source_document_id: adjustment.id,
          details: JSON.stringify({ original_document_number: adjustment.document_number })
        }
      });

      return updated;
    });
  }
}
