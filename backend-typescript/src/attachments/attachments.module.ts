import { Module } from '@nestjs/common';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { LocalStorageService } from './storage/local-storage.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [AttachmentsController],
  providers: [
    AttachmentsService,
    {
      provide: 'StorageService',
      useClass: LocalStorageService,
    }
  ],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}
