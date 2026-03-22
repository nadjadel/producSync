import { IsString, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QuoteItemDto {
  @IsString()
  product_id: string;

  @IsOptional()
  @IsString()
  product_name?: string;

  @IsOptional()
  @IsString()
  product_reference?: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unit_price?: number;
}

export class CreateQuoteDto {
  @IsOptional()
  @IsString()
  quote_number?: string;

  @IsOptional()
  @IsDateString()
  quote_date?: string;

  @IsString()
  customer_id: string;

  @IsString()
  customer_name: string;

  @IsOptional()
  @IsEnum(['draft', 'sent', 'accepted', 'rejected', 'expired'])
  status?: string;

  @IsOptional()
  @IsDateString()
  valid_until?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteItemDto)
  items: QuoteItemDto[];

  @IsOptional()
  @IsNumber()
  vat_rate?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
