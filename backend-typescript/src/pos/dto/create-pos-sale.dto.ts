import { IsString, IsOptional, IsArray, ValidateNested, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePosSaleLineDto {
  @IsString()
  item_id: string;

  @IsString()
  godown_id: string;

  @IsString()
  unit_id: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  rate: number;

  @IsNumber()
  @IsOptional()
  discount_amount?: number;
}

export class CreatePosPaymentDto {
  @IsNumber()
  amount: number;

  @IsString()
  @IsEnum(['CASH', 'BANK'])
  payment_method: 'CASH' | 'BANK';
}

export class CreatePosSaleDto {
  @IsString()
  branch_id: string;

  @IsString()
  @IsOptional()
  party_id?: string;

  @IsString()
  @IsOptional()
  walkin_name?: string;

  @IsString()
  @IsOptional()
  walkin_phone?: string;

  @IsDateString()
  document_date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePosSaleLineDto)
  lines: CreatePosSaleLineDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePosPaymentDto)
  payments: CreatePosPaymentDto[];
}
