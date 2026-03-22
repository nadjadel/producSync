import { IsString, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderItemDto } from './create-order.dto';

export class UpdateOrderDto {
  @IsOptional()
  @IsString()
  order_number?: string;

  @IsOptional()
  @IsString()
  customer_id?: string;

  @IsOptional()
  @IsString()
  customer_name?: string;

  @IsOptional()
  @IsEnum(['draft', 'confirmed', 'in_production', 'ready', 'delivered', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsDateString()
  order_date?: string;

  @IsOptional()
  @IsDateString()
  delivery_date_requested?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items?: OrderItemDto[];

  @IsOptional()
  @IsNumber()
  vat_rate?: number;

  @IsOptional()
  @IsString()
  delivery_address?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
