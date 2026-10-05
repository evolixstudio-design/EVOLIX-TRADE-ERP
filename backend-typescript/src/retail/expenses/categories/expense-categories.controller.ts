import { Controller, Get, Post, Body, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { ExpenseCategoriesService } from './expense-categories.service';
import { CreateExpenseCategoryDto, UpdateExpenseCategoryDto } from '../dto/expense.dto';
import { AuthGuard } from '../../../common/guards/auth.guard';

@Controller('retail/expense-categories')
@UseGuards(AuthGuard)
export class ExpenseCategoriesController {
  constructor(private readonly expenseCategoriesService: ExpenseCategoriesService) {}

  @Post()
  async create(@Req() req: any, @Body() createDto: CreateExpenseCategoryDto) {
    return this.expenseCategoriesService.create(
      req.user.organization_id,
      req.user.company_id,
      req.user.branch_id,
      createDto
    );
  }

  @Get()
  async findAll(@Req() req: any) {
    return this.expenseCategoriesService.findAll(req.user.company_id);
  }

  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() updateDto: UpdateExpenseCategoryDto) {
    return this.expenseCategoriesService.update(req.user.company_id, id, updateDto);
  }
}
