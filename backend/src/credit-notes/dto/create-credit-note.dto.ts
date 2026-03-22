import { IsString, IsOptional, IsEnum, IsArray, IsNumber, Min, ValidateNested, IsDate, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

class CreditNoteItemDto {
  @IsMongoId()
  product_id: string;

  @IsString()
  product_code: string;

  @IsString()
  product_name: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  unit_price: number;

  @IsNumber()
  @Min(0)
  total: number;

  @IsNumber()
  @Min(0)
  vat_rate: number;

  @IsNumber()
  @Min(0)
  vat_amount: number;

  @IsString()
  reason: string;
}

export class CreateCreditNoteDto {
  @IsString()
  @IsOptional()
  credit_note_number?: string; // Généré automatiquement par CountersService

  @IsMongoId()
  invoice_id: string;

  @IsMongoId()
  customer_id: string;

  @IsString()
  customer_name: string;

  @IsDate()
  @Type(() => Date)
  credit_note_date: Date;

  @IsEnum(['return', 'error', 'discount', 'other'])
  reason: string;

  @IsString()
  @IsOptional()
  reason_details?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreditNoteItemDto)
  items: CreditNoteItemDto[];

  @IsNumber()
  @Min(0)
  total_amount: number;

  @IsNumber()
  @Min(0)
  vat_amount: number;

  @IsNumber()
  @Min(0)
  total_with_vat: number;

  @IsEnum(['draft', 'issued', 'applied', 'cancelled'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  created_by: string;

  @IsString()
  @IsOptional()
  approved_by?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  approval_date?: Date;
}
