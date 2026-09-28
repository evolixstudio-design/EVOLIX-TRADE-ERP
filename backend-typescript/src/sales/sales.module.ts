import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { SalesPostingService } from './posting.service';
import { PrismaModule } from '../database/prisma.module';
import { InventoryModule } from '../inventory/inventory.module';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [PrismaModule, InventoryModule, AccountingModule],
  controllers: [SalesController],
  providers: [SalesService, SalesPostingService],
  exports: [SalesService, SalesPostingService],
})
export class SalesModule {}
