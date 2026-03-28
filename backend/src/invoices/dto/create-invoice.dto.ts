import { IsString, IsDateString, IsOptional, IsArray, IsNumber, IsEnum } from 'class-validator';

class DeliveryNoteItemDto {
  @IsString()
  delivery_note_id: string;

  @IsString()
  delivery_number: string;

  @IsDateString()
  delivery_date: string;
}

class InvoiceItemDto {
  @IsString()
  description: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unit_price: number;

  @IsNumber()
  @IsOptional()
  total_ht?: number;

  @IsNumber()
  vat_rate: number;
}

export class CreateInvoiceDto {
  @IsOptional()
  @IsString()
  invoice_number?: string;

  @IsDateString()
  invoice_date: string;

  @IsString()
  customer_id: string;

  @IsString()
  customer_name: string;

  @IsOptional()
  @IsString()
  customer_address?: string;

  @IsOptional()
  @IsString()
  customer_siret?: string;

  @IsOptional()
  @IsString()
  customer_vat_number?: string;

  @IsOptional()
  @IsEnum(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsString()
  payment_terms?: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsArray()
  delivery_notes?: DeliveryNoteItemDto[];

  @IsOptional()
  @IsArray()
  items?: InvoiceItemDto[];

  @IsOptional()
  @IsNumber()
  total_ht?: number;

  @IsOptional()
  @IsNumber()
  total_vat?: number;

  @IsOptional()
  @IsNumber()
  total_ttc?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
