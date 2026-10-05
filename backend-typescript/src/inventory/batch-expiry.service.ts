import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class BatchExpiryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves batches (from Goods Receipts) that are expiring within the specified number of days.
   */
  async getExpiringBatches(companyId: string, daysOut: number) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysOut);

    const lines = await this.prisma.goodsReceiptLine.findMany({
      where: {
        goods_receipt: {
          company_id: companyId
        },
        expiry_date: {
          gte: today,
          lte: futureDate
        },
        batch_number: {
          not: null
        }
      },
      include: {
        item: true,
        goods_receipt: {
          select: { document_number: true, document_date: true }
        }
      },
      orderBy: { expiry_date: 'asc' }
    });

    return lines.map(line => ({
      item_id: line.item_id,
      item_name: line.item.name,
      batch_number: line.batch_number,
      expiry_date: line.expiry_date,
      received_quantity: line.received_quantity,
      document_number: line.goods_receipt.document_number
    }));
  }
}
