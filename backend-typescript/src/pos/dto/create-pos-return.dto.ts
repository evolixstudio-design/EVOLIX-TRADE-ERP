import { IsString, IsOptional, IsArray, ValidateNested, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePosSaleLineDto } from './create-pos-sale.dto';

export class CreatePosReturnDto {
  @IsString()
  branch_id: string;

  @IsString()
  @IsOptional()
  party_id?: string;

  @IsString()
  @IsOptional()
  original_invoice_id?: string;

  @IsDateString()
  document_date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePosSaleLineDto)
  lines: CreatePosSaleLineDto[];
}
