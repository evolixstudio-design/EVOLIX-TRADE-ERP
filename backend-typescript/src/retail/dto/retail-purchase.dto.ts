import { IsString, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseLineDto {
  @IsString()
  item_id: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  purchase_rate: number;
}

export class CreateRetailPurchaseDto {
  @IsString()
  supplier_id: string;

  @IsNumber()
  total_amount: number;

  @IsOptional()
  @IsString()
  bill_number?: string;

  @IsOptional()
  @IsString()
  purchase_date?: string;

  @IsString()
  payment_status: string; // PAID, CREDIT, PARTIAL

  @IsOptional()
  @IsNumber()
  paid_amount?: number;

  @IsOptional()
  @IsString()
  payment_method?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  photo_attachment_url?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseLineDto)
  lines?: PurchaseLineDto[];
}
