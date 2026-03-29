import { IsString, IsEmail, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator';

export class CreateCustomerDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  code?: string;

  @IsString()
  @MinLength(2)
  company_name: string;

  @IsOptional()
  @IsString()
  siret?: string;

  @IsOptional()
  @IsString()
  vat_number?: string;

  @IsOptional()
  @IsString()
  contact_name?: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  postal_code?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsEnum(['30_days', '45_days', '60_days', 'cash', 'end_of_month'])
  payment_terms?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'prospect'])
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
