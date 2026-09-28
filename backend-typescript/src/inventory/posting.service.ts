import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';

export type MovementType = 
  | 'PURCHASE_IN' 
  | 'SALES_OUT' 
  | 'SALES_RETURN_IN' 
  | 'PURCHASE_RETURN_OUT' 
  | 'TRANSFER_OUT' 
  | 'TRANSFER_IN' 
  | 'ADJUSTMENT_IN' 
  | 'ADJUSTMENT_OUT' 
  | 'OPENING_IN';

export interface MovementLine {
  item_id: string;
  godown_id: string;
  quantity: string | number; // Strictly positive. Direction is derived from MovementType
  unit_id: string;
  source_line_id?: string;
  cost_rate?: string | number;
}

export interface PostMovementDto {
  company_id: string;
  branch_id: string;
  movement_type: MovementType;
  business_date: Date;
  source_document_type: string;
  source_document_id: string;
  lines: MovementLine[];
}

@Injectable()
export class InventoryPostingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Evaluates whether a movement type represents an inflow or outflow of physical stock.
   */
  private getMovementDirection(type: MovementType): 1 | -1 {
    switch (type) {
      case 'PURCHASE_IN':
      case 'SALES_RETURN_IN':
      case 'TRANSFER_IN':
      case 'ADJUSTMENT_IN':
      case 'OPENING_IN':
        return 1;
      case 'SALES_OUT':
      case 'PURCHASE_RETURN_OUT':
      case 'TRANSFER_OUT':
      case 'ADJUSTMENT_OUT':
        return -1;
      default:
        throw new BadRequestException(`Unknown movement type: ${type}`);
    }
  }

  /**
   * The canonical inventory engine. All business events mutating stock MUST pass through here.
   */
  async postMovement(
    tx: Prisma.TransactionClient,
    dto: PostMovementDto
  ): Promise<void> {
    if (!dto.lines || dto.lines.length === 0) {
      throw new BadRequestException('Cannot post inventory movement with zero lines');
    }

    const direction = this.getMovementDirection(dto.movement_type);

    for (const line of dto.lines) {
      const absQty = new Prisma.Decimal(line.quantity);

      if (absQty.lte(0)) {
        throw new BadRequestException(`Invalid inventory quantity: ${absQty.toString()}. Must be positive. Direction is determined by movement type.`);
      }

      // Security & Isolation Checks
      const item = await tx.item.findFirst({ where: { id: line.item_id, company_id: dto.company_id } });
      if (!item) {
        throw new BadRequestException(`Item ${line.item_id} not found or does not belong to company ${dto.company_id}`);
      }

      const godown = await tx.godown.findFirst({ where: { id: line.godown_id, branch_id: dto.branch_id } });
      if (!godown) {
        throw new BadRequestException(`Godown ${line.godown_id} not found or does not belong to branch ${dto.branch_id}`);
      }

      const quantityDelta = absQty.mul(direction);

      // 1. Check idempotency / double posting (Assuming a unique index exists on DB side too, but application logic first)
      const existingMovement = await tx.stockMovement.findFirst({
        where: {
          company_id: dto.company_id,
          source_document_type: dto.source_document_type,
          source_document_id: dto.source_document_id,
          source_line_id: line.source_line_id,
          movement_type: dto.movement_type,
        }
      });
      if (existingMovement) {
        throw new BadRequestException(`Duplicate inventory posting prevented for source: ${dto.source_document_id}`);
      }

      // 2. Insert authoritative movement
      await tx.stockMovement.create({
        data: {
          company_id: dto.company_id,
          branch_id: dto.branch_id,
          godown_id: line.godown_id,
          item_id: line.item_id,
          business_date: dto.business_date,
          movement_type: dto.movement_type,
          quantity_delta: quantityDelta,
          base_quantity_delta: quantityDelta, // Assume unit conversion handles this later
          unit_id: line.unit_id,
          source_document_type: dto.source_document_type,
          source_document_id: dto.source_document_id,
          source_line_id: line.source_line_id,
          cost_rate: line.cost_rate ? new Prisma.Decimal(line.cost_rate) : new Prisma.Decimal(0),
        },
      });

      // 3. Mutate derived StockBalanceProjection
      const balance = await tx.stockBalanceProjection.findFirst({
        where: { 
          company_id: dto.company_id, 
          branch_id: dto.branch_id, 
          godown_id: line.godown_id, 
          item_id: line.item_id 
        },
      });

      if (balance) {
        const newQty = new Prisma.Decimal(balance.quantity).plus(quantityDelta);
        if (newQty.lt(0)) {
           throw new BadRequestException(`Negative stock blocked for item ${line.item_id} in godown ${line.godown_id}. Current: ${balance.quantity}, Delta: ${quantityDelta}`);
        }

        await tx.stockBalanceProjection.update({
          where: { id: balance.id },
          data: { quantity: newQty },
        });
      } else {
        if (quantityDelta.lt(0)) {
           throw new BadRequestException(`Negative stock blocked for item ${line.item_id} in godown ${line.godown_id}. Current: 0, Delta: ${quantityDelta}`);
        }

        await tx.stockBalanceProjection.create({
          data: {
            company_id: dto.company_id,
            branch_id: dto.branch_id,
            godown_id: line.godown_id,
            item_id: line.item_id,
            quantity: quantityDelta,
          },
        });
      }
    }
  }

  /**
   * Reverses a stock movement transaction atomically.
   */
  async reverseMovement(
    tx: Prisma.TransactionClient,
    companyId: string,
    sourceDocumentType: string,
    sourceDocumentId: string,
    reversalDocumentType: string
  ): Promise<void> {
    const originalMovements = await tx.stockMovement.findMany({
      where: {
        company_id: companyId,
        source_document_type: sourceDocumentType,
        source_document_id: sourceDocumentId,
      }
    });

    if (originalMovements.length === 0) return; // Nothing to reverse

    // Check if already reversed
    const alreadyReversed = await tx.stockMovement.findFirst({
      where: {
        company_id: companyId,
        source_document_type: reversalDocumentType,
        source_document_id: sourceDocumentId,
      }
    });

    if (alreadyReversed) {
      throw new BadRequestException('Double reversal rejected. Inventory movement already reversed.');
    }

    for (const mov of originalMovements) {
      // Create opposite movement
      const reverseType = this.getReversalMovementType(mov.movement_type as MovementType);
      
      const reverseQtyDelta = new Prisma.Decimal(mov.quantity_delta).mul(-1);

      await tx.stockMovement.create({
        data: {
          company_id: mov.company_id,
          branch_id: mov.branch_id,
          godown_id: mov.godown_id,
          item_id: mov.item_id,
          business_date: new Date(),
          movement_type: reverseType,
          quantity_delta: reverseQtyDelta,
          base_quantity_delta: reverseQtyDelta,
          unit_id: mov.unit_id,
          source_document_type: reversalDocumentType,
          source_document_id: mov.source_document_id,
          source_line_id: mov.source_line_id,
        },
      });

      // Update projection
      const balance = await tx.stockBalanceProjection.findFirst({
        where: { 
          company_id: mov.company_id, 
          branch_id: mov.branch_id, 
          godown_id: mov.godown_id, 
          item_id: mov.item_id 
        },
      });

      if (balance) {
         const newQty = new Prisma.Decimal(balance.quantity).plus(reverseQtyDelta);
         if (newQty.lt(0)) {
           throw new BadRequestException(`Negative stock blocked during reversal for item ${mov.item_id} in godown ${mov.godown_id}.`);
         }
         await tx.stockBalanceProjection.update({
           where: { id: balance.id },
           data: { quantity: newQty },
         });
      }
    }
  }

  private getReversalMovementType(type: MovementType): MovementType {
    switch (type) {
      case 'PURCHASE_IN': return 'PURCHASE_RETURN_OUT';
      case 'PURCHASE_RETURN_OUT': return 'PURCHASE_IN';
      case 'SALES_OUT': return 'SALES_RETURN_IN';
      case 'SALES_RETURN_IN': return 'SALES_OUT';
      case 'TRANSFER_IN': return 'TRANSFER_OUT';
      case 'TRANSFER_OUT': return 'TRANSFER_IN';
      case 'ADJUSTMENT_IN': return 'ADJUSTMENT_OUT';
      case 'ADJUSTMENT_OUT': return 'ADJUSTMENT_IN';
      case 'OPENING_IN': return 'ADJUSTMENT_OUT';
      default: throw new BadRequestException(`Cannot map reversal type for ${type}`);
    }
  }
}
