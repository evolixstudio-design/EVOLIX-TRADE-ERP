import { Module } from '@nestjs/common';
import { RetailController } from './retail.controller';
import { RetailService } from './retail.service';
import { AccountingModule } from '../accounting/accounting.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PrismaService } from '../database/prisma.service';

@Module({
  imports: [AccountingModule, InventoryModule],
  controllers: [RetailController],
  providers: [RetailService, PrismaService],
})
export class RetailModule {}
