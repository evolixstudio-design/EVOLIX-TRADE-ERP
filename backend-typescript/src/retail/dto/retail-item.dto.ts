import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateRetailItemDto {
  @IsString()
  name: string;

  @IsNumber()
  selling_price: number;

  @IsOptional()
  @IsNumber()
  opening_stock?: number;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  unit_id?: string;

  @IsOptional()
  @IsNumber()
  purchase_price?: number;

  @IsOptional()
  @IsNumber()
  mrp?: number;

  @IsOptional()
  @IsString()
  tax_class_id?: string;

  @IsOptional()
  @IsString()
  hsn_sac?: string;

  @IsOptional()
  @IsNumber()
  low_stock_threshold?: number;

  @IsOptional()
  @IsString()
  preferred_supplier_id?: string;
}

export class UpdateRetailItemDto extends CreateRetailItemDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
