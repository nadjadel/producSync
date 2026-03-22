import { IsString, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { DeliveryNoteItemDto } from './create-delivery-note.dto';

export class UpdateDeliveryNoteDto {
  @IsOptional()
  @IsString()
  delivery_number?: string;

  @IsOptional()
  @IsString()
  customer_id?: string;

  @IsOptional()
  @IsString()
  customer_name?: string;

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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryNoteItemDto)
  items?: DeliveryNoteItemDto[];

  @IsOptional()
  @IsString()
  delivery_address?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  invoice_id?: string;
}
