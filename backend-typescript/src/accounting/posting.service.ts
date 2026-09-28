import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';

export interface CreateVoucherLineDto {
  ledger_account_id: string;
  debit: number | Prisma.Decimal;
  credit: number | Prisma.Decimal;
  party_id?: string;
  narration?: string;
}

export interface CreateVoucherDto {
  company_id: string;
  branch_id: string;
  financial_year_id: string;
  voucher_type: string;
  document_number: string;
  voucher_date: Date;
  source_document_type?: string;
  source_document_id?: string;
  narration?: string;
  lines: CreateVoucherLineDto[];
  posted_by: string;
}

@Injectable()
export class PostingService {
  constructor(private readonly prisma: PrismaService) {}

  async postVoucherWithIsolationChecks(dto: CreateVoucherDto) {
    return this.prisma.$transaction(async (tx) => {
      // Isolate ledger accounts: check if all accounts belong to this company
      for (const line of dto.lines) {
        const account = await tx.ledgerAccount.findUnique({
          where: { id: line.ledger_account_id }
        });
        if (!account) throw new BadRequestException(`Account ${line.ledger_account_id} not found`);
        if (account.company_id !== dto.company_id) {
          throw new ForbiddenException(`Cross-organization posting attempt rejected. Account ${account.name} belongs to ${account.company_id}, but request is for ${dto.company_id}`);
        }
        if (dto.branch_id && account.branch_id && account.branch_id !== dto.branch_id) {
          throw new ForbiddenException(`Cross-branch posting attempt rejected. Account ${account.name} belongs to ${account.branch_id}, but request is for ${dto.branch_id}`);
        }
      }

      return this.postVoucher(tx, dto);
    });
  }

  async postVoucher(tx: Prisma.TransactionClient, dto: CreateVoucherDto) {
    // 1. Validation
    let totalDebit = new Prisma.Decimal(0);
    let totalCredit = new Prisma.Decimal(0);
    
    if (!dto.lines || dto.lines.length < 2) {
      throw new BadRequestException('Voucher must have at least two lines');
    }

    for (const line of dto.lines) {
      const debitVal = new Prisma.Decimal(line.debit || 0);
      const creditVal = new Prisma.Decimal(line.credit || 0);
      
      if (debitVal.lessThan(0) || creditVal.lessThan(0)) {
        throw new BadRequestException('Negative amounts are not allowed in voucher lines');
      }
      
      totalDebit = totalDebit.plus(debitVal);
      totalCredit = totalCredit.plus(creditVal);
    }

    if (!totalDebit.equals(totalCredit)) {
      throw new BadRequestException(`Voucher must be balanced. Debit: ${totalDebit.toString()}, Credit: ${totalCredit.toString()}`);
    }

    if (totalDebit.equals(0)) {
      throw new BadRequestException('Voucher total must be greater than zero');
    }

    // Idempotency: Prevent duplicate posting of same source document
    if (dto.source_document_type && dto.source_document_id) {
      const existing = await tx.voucher.findFirst({
        where: {
          company_id: dto.company_id,
          source_document_type: dto.source_document_type,
          source_document_id: dto.source_document_id,
          status: 'POSTED',
        },
      });
      if (existing) {
        throw new BadRequestException(`Duplicate posting prevented. Source document ${dto.source_document_type} ${dto.source_document_id} already posted.`);
      }
    }

    // 2. Create Voucher
    const voucher = await tx.voucher.create({
      data: {
        company_id: dto.company_id,
        branch_id: dto.branch_id,
        financial_year_id: dto.financial_year_id,
        voucher_type: dto.voucher_type,
        document_number: dto.document_number,
        voucher_date: dto.voucher_date,
        status: 'POSTED',
        source_document_type: dto.source_document_type,
        source_document_id: dto.source_document_id,
        narration: dto.narration,
        posted_at: new Date(),
        posted_by: dto.posted_by,
        lines: {
          create: dto.lines.map(line => ({
            ledger_account_id: line.ledger_account_id,
            debit: line.debit,
            credit: line.credit,
            party_id: line.party_id,
            narration: line.narration,
          })),
        },
      },
      include: {
        lines: true
      }
    });

    // 3. Create Audit Trail
    await tx.auditLog.create({
      data: {
        company_id: dto.company_id,
        branch_id: dto.branch_id,
        user_id: dto.posted_by,
        action: 'VOUCHER_POSTED',
        source_document_type: dto.source_document_type,
        source_document_id: dto.source_document_id,
        affected_voucher_id: voucher.id,
      },
    });

    return voucher;
  }

  async reverseVoucherWithIsolationChecks(companyId: string, voucherId: string, reversedBy: string, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      const voucher = await tx.voucher.findUnique({
        where: { id: voucherId }
      });
      if (!voucher) throw new BadRequestException('Voucher not found');
      if (voucher.company_id !== companyId) {
        throw new ForbiddenException('Cannot reverse voucher from another organization');
      }

      return this.reverseVoucher(tx, voucherId, reversedBy, reason);
    });
  }

  async reverseVoucher(tx: Prisma.TransactionClient, voucherId: string, reversedBy: string, reason: string) {
    const voucher = await tx.voucher.findUnique({
      where: { id: voucherId },
      include: { lines: true },
    });

    if (!voucher) throw new BadRequestException('Voucher not found');
    if (voucher.status !== 'POSTED') throw new BadRequestException('Only POSTED vouchers can be reversed');
    if (voucher.reversed_voucher_id) throw new BadRequestException('Voucher is already reversed');
    if (voucher.voucher_type === 'REVERSAL') throw new BadRequestException('Cannot reverse a reversal voucher');

    // Create Reversal Voucher
    const reversalVoucher = await tx.voucher.create({
      data: {
        company_id: voucher.company_id,
        branch_id: voucher.branch_id,
        financial_year_id: voucher.financial_year_id,
        voucher_type: 'REVERSAL',
        document_number: `${voucher.document_number}-REV`,
        voucher_date: new Date(),
        status: 'POSTED',
        source_document_type: voucher.source_document_type,
        source_document_id: voucher.source_document_id,
        narration: `Reversal of ${voucher.document_number}: ${reason}`,
        posted_at: new Date(),
        posted_by: reversedBy,
        lines: {
          create: voucher.lines.map(line => ({
            ledger_account_id: line.ledger_account_id,
            debit: line.credit, // SWAP DEBIT AND CREDIT
            credit: line.debit,
            party_id: line.party_id,
            narration: `Reversal of ${line.id}`,
          })),
        },
      },
    });

    // Mark original voucher as reversed
    await tx.voucher.update({
      where: { id: voucher.id },
      data: {
        status: 'REVERSED',
        reversed_voucher_id: reversalVoucher.id,
        reversed_by: reversedBy,
        reversed_at: new Date(),
        reversal_reason: reason,
      },
    });

    // Create Audit Trail
    await tx.auditLog.create({
      data: {
        company_id: voucher.company_id,
        branch_id: voucher.branch_id,
        user_id: reversedBy,
        action: 'VOUCHER_REVERSED',
        affected_voucher_id: voucher.id,
        details: reason,
      },
    });

    return reversalVoucher;
  }
}
