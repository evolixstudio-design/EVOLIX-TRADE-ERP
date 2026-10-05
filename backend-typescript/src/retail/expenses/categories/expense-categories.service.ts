import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateExpenseCategoryDto, UpdateExpenseCategoryDto } from '../dto/expense.dto';

@Injectable()
export class ExpenseCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, companyId: string, branchId: string, dto: CreateExpenseCategoryDto) {
    const existing = await this.prisma.expenseCategory.findFirst({
      where: { company_id: companyId, name: dto.name }
    });

    if (existing) throw new BadRequestException(`Category ${dto.name} already exists`);

    return this.prisma.$transaction(async (tx) => {
      // Create ledger account
      const safeName = dto.name.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      const code = `EXP-${safeName}-${Date.now().toString().slice(-4)}`;

      const ledger = await tx.ledgerAccount.create({
        data: {
          company_id: companyId,
          branch_id: branchId,
          code,
          name: `${dto.name} Expense`,
          account_type: 'EXPENSE',
          normal_balance: 'DEBIT',
          is_active: true
        }
      });

      return tx.expenseCategory.create({
        data: {
          organization_id: organizationId,
          company_id: companyId,
          name: dto.name,
          icon: dto.icon,
          ledger_id: ledger.id,
          is_active: true
        }
      });
    });
  }

  async findAll(companyId: string) {
    return this.prisma.expenseCategory.findMany({
      where: { company_id: companyId },
      orderBy: { name: 'asc' }
    });
  }

  async update(companyId: string, id: string, dto: UpdateExpenseCategoryDto) {
    const category = await this.prisma.expenseCategory.findFirst({
      where: { id, company_id: companyId }
    });

    if (!category) throw new NotFoundException('Category not found');

    if (dto.name && dto.name !== category.name) {
      const existing = await this.prisma.expenseCategory.findFirst({
        where: { company_id: companyId, name: dto.name, id: { not: id } }
      });
      if (existing) throw new BadRequestException(`Category ${dto.name} already exists`);
    }

    return this.prisma.expenseCategory.update({
      where: { id },
      data: dto
    });
  }
}
