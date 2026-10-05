import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateRetailSupplierDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  gstin?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  pan?: string;

  @IsOptional()
  @IsString()
  state?: string;
}

export class PaySupplierDto {
  @IsNumber()
  amount: number;

  @IsString()
  payment_method: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
