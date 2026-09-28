import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { PostingService } from './posting.service';
import { AccountingService } from './accounting.service';
import { AccountingController } from './accounting.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AccountingController],
  providers: [PostingService, AccountingService],
  exports: [PostingService, AccountingService],
})
export class AccountingModule {}
