import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { InventoryPostingService, PostMovementDto } from './posting.service';
import { Prisma } from '@prisma/client';

export interface CreateStockCountDto {
  company_id: string;
  branch_id: string;
  financial_year_id: string;
  document_number: string;
  count_date: Date;
  godown_id: string;
  notes?: string;
  lines: {
    item_id: string;
    unit_id: string;
    counted_quantity: number;
  }[];
}

@Injectable()
export class StockCountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryPostingService: InventoryPostingService,
  ) {}

  async createStockCount(data: CreateStockCountDto, userId: string) {
    if (!data.lines || data.lines.length === 0) {
      throw new BadRequestException('Stock count must have at least one line');
    }

    const existing = await this.prisma.stockCount.findUnique({
      where: {
        company_id_document_number: {
          company_id: data.company_id,
          document_number: data.document_number,
        }
      }
    });

    if (existing) {
      throw new BadRequestException('Stock count document number already exists');
    }

    // Verify Godown Isolation (Tenant/Company/Branch)
    const godown = await this.prisma.godown.findUnique({ where: { id: data.godown_id } });
    if (!godown) {
      throw new NotFoundException(`Godown ${data.godown_id} not found`);
    }
    if (godown.branch_id !== data.branch_id) {
      throw new ForbiddenException(`Godown ${data.godown_id} does not belong to the specified branch`);
    }

    // Fetch current system quantities for the godown
    const itemIds = data.lines.map(l => l.item_id);
    const balances = await this.prisma.stockBalanceProjection.findMany({
      where: {
        company_id: data.company_id,
        godown_id: data.godown_id,
        item_id: { in: itemIds }
      }
    });

    const balanceMap = new Map<string, number>();
    for (const b of balances) {
      balanceMap.set(b.item_id, Number(b.quantity));
    }

    return this.prisma.$transaction(async (tx) => {
      const stockCount = await tx.stockCount.create({
        data: {
          company_id: data.company_id,
          branch_id: data.branch_id,
          financial_year_id: data.financial_year_id,
          document_number: data.document_number,
          count_date: data.count_date,
          godown_id: data.godown_id,
          status: 'COMPLETED',
          notes: data.notes,
          counted_by: userId,
          lines: {
            create: data.lines.map(line => {
              const system_quantity = balanceMap.get(line.item_id) || 0;
              const variance = line.counted_quantity - system_quantity;
              return {
                item_id: line.item_id,
                unit_id: line.unit_id,
                system_quantity: system_quantity,
                counted_quantity: line.counted_quantity,
                variance: variance,
              };
            })
          }
        },
        include: { lines: true }
      });

      return stockCount;
    });
  }

  async postStockCount(countId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const count = await tx.stockCount.findUnique({
        where: { id: countId },
        include: { lines: true }
      });

      if (!count) throw new NotFoundException('Stock count not found');
      if (count.status === 'POSTED') throw new BadRequestException('Stock count is already posted');

      // Post movements for variances
      const inLines = count.lines.filter((l: any) => Number(l.variance) > 0);
      const outLines = count.lines.filter((l: any) => Number(l.variance) < 0);

      if (inLines.length > 0) {
        const movementDto: PostMovementDto = {
          company_id: count.company_id,
          branch_id: count.branch_id,
          movement_type: 'ADJUSTMENT_IN',
          business_date: count.count_date,
          source_document_type: 'STOCK_COUNT',
          source_document_id: count.id,
          lines: inLines.map((l: any) => ({
            item_id: l.item_id,
            godown_id: count.godown_id,
            quantity: Number(l.variance),
            unit_id: l.unit_id,
            source_line_id: l.id
          }))
        };
        await this.inventoryPostingService.postMovement(tx as any, movementDto);
      }

      if (outLines.length > 0) {
        const movementDto: PostMovementDto = {
          company_id: count.company_id,
          branch_id: count.branch_id,
          movement_type: 'ADJUSTMENT_OUT',
          business_date: count.count_date,
          source_document_type: 'STOCK_COUNT',
          source_document_id: count.id,
          lines: outLines.map((l: any) => ({
            item_id: l.item_id,
            godown_id: count.godown_id,
            quantity: Math.abs(Number(l.variance)),
            unit_id: l.unit_id,
            source_line_id: l.id
          }))
        };
        await this.inventoryPostingService.postMovement(tx as any, movementDto);
      }

      const updated = await tx.stockCount.update({
        where: { id: countId },
        data: {
          status: 'POSTED',
          posted_by: userId,
        },
        include: { lines: true }
      });

      return updated;
    });
  }

  async getStockCounts(companyId: string, branchId?: string) {
    return this.prisma.stockCount.findMany({
      where: {
        company_id: companyId,
        ...(branchId ? { branch_id: branchId } : {}),
      },
      include: {
        lines: {
          include: { item: true, unit: true }
        },
        godown: true
      },
      orderBy: { created_at: 'desc' }
    });
  }
}
