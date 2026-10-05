import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateRetailCustomerDto {
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
  @IsNumber()
  opening_balance?: number;

  @IsOptional()
  @IsNumber()
  credit_limit?: number;

  @IsOptional()
  @IsNumber()
  credit_days?: number;

  @IsOptional()
  @IsString()
  price_list_id?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  pan?: string;
}

export class ReceivePaymentDto {
  @IsNumber()
  amount: number;

  @IsString()
  payment_method: string; // CASH, UPI, BANK

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
