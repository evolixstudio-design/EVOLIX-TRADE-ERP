import { IsString, IsOptional, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class HoldBillLineDto {
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

export class HoldBillDto {
  @IsString()
  branch_id: string;

  @IsString()
  @IsOptional()
  reference_name?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HoldBillLineDto)
  lines: HoldBillLineDto[];
}
