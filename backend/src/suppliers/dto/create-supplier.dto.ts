import { IsString, IsEmail, IsOptional, IsEnum, IsArray, IsNumber, Min, Max, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AdditionalContactDto {
  @IsString()
  name: string;

  @IsString()
  position: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

class BankDetailsDto {
  @IsString()
  bank_name: string;

  @IsString()
  iban: string;

  @IsString()
  bic: string;

  @IsString()
  account_holder: string;
}

export class CreateSupplierDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  company_name: string;

  @IsString()
  @IsOptional()
  siret?: string;

  @IsString()
  @IsOptional()
  vat_number?: string;

  @IsString()
  @IsOptional()
  contact_name?: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  postal_code?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  speciality?: string;

  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: string;

  @IsEnum(['30_days', '45_days', '60_days', 'cash', 'end_of_month'])
  @IsOptional()
  payment_terms?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @Min(0)
  @Max(5)
  @IsOptional()
  reliability_score?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  product_categories?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  certifications?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdditionalContactDto)
  @IsOptional()
  additional_contacts?: AdditionalContactDto[];

  @IsObject()
  @ValidateNested()
  @Type(() => BankDetailsDto)
  @IsOptional()
  bank_details?: BankDetailsDto;
}
