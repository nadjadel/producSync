import { IsString, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class DeliveryNoteItemDto {
  @IsString()
  manufacturing_order_id: string;

  @IsOptional()
  @IsString()
  order_number?: string;

  @IsString()
  product_id: string;

  @IsString()
  product_name: string;

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

export class CreateDeliveryNoteDto {
  @IsOptional()
  @IsString()
  delivery_number?: string;

  @IsString()
  customer_id: string;

  @IsString()
  customer_name: string;

  @IsOptional()
  @IsString()
  order_id?: string;

  @IsOptional()
  @IsString()
  order_number?: string;

  @IsOptional()
  @IsDateString()
  delivery_date?: string;

  @IsOptional()
  @IsEnum(['draft', 'sent', 'invoiced'])
  status?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryNoteItemDto)
  items: DeliveryNoteItemDto[];

  @IsOptional()
  @IsString()
  delivery_address?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
