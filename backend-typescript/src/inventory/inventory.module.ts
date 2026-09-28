import { Module } from '@nestjs/common';
import { InventoryPostingService } from './posting.service';
import { InventoryController } from './inventory.controller';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InventoryController],
  providers: [InventoryPostingService],
  exports: [InventoryPostingService],
})
export class InventoryModule {}
