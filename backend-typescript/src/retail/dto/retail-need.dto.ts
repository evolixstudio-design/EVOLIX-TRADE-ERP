import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateNeedListDto {
  @IsString()
  name: string;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  customer_id?: string;

  @IsOptional()
  @IsString()
  customer_phone?: string;

  @IsOptional()
  @IsString()
  preferred_supplier_id?: string;

  @IsOptional()
  @IsString()
  priority?: string; // NORMAL, URGENT

  @IsOptional()
  @IsString()
  needed_by?: string;

  @IsOptional()
  @IsString()
  note?: string;
  
  @IsOptional()
  @IsString()
  photo_attachment_url?: string;
}

export class UpdateNeedStatusDto {
  @IsString()
  status: string; // ORDERED, RECEIVED, CANCELLED
}
