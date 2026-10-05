import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from './storage/storage.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('StorageService') private readonly storage: StorageService
  ) {}

  async uploadAttachment(
    organizationId: string,
    companyId: string,
    branchId: string,
    userId: string,
    entityType: string,
    entityId: string,
    category: string,
    file: any
  ) {
    const ext = file.originalname.split('.').pop();
    const storedFileName = `${uuidv4()}.${ext}`;
    const storageKey = `${companyId}/${category}/${storedFileName}`;

    await this.storage.save(storageKey, file.buffer);

    return this.prisma.attachment.create({
      data: {
        organization_id: organizationId,
        company_id: companyId,
        branch_id: branchId,
        entity_type: entityType,
        entity_id: entityId,
        category: category,
        original_file_name: file.originalname,
        stored_file_name: storedFileName,
        mime_type: file.mimetype,
        file_size: file.size,
        storage_provider: 'local',
        storage_key: storageKey,
        created_by: userId
      }
    });
  }

  async getAttachment(companyId: string, id: string) {
    const attachment = await this.prisma.attachment.findFirst({
      where: { id, company_id: companyId }
    });
    if (!attachment) throw new NotFoundException('Attachment not found');

    const buffer = await this.storage.get(attachment.storage_key);
    return { attachment, buffer };
  }

  async deleteAttachment(companyId: string, id: string) {
    const attachment = await this.prisma.attachment.findFirst({
      where: { id, company_id: companyId }
    });
    if (!attachment) throw new NotFoundException('Attachment not found');

    await this.storage.delete(attachment.storage_key);
    await this.prisma.attachment.delete({ where: { id } });
  }
}
