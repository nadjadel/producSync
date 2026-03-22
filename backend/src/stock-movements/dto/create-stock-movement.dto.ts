import { IsString, IsOptional, IsEnum, IsNumber, Min, IsDate, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStockMovementDto {
  @IsString()
  @IsOptional()
  movement_number?: string; // Généré automatiquement

  @IsDate()
  @Type(() => Date)
  movement_date: Date;

  @IsEnum(['in', 'out', 'transfer', 'adjustment', 'production', 'consumption'])
  type: string;

  @IsEnum(['purchase', 'sale', 'return', 'production', 'scrap', 'loss', 'transfer', 'adjustment'])
  category: string;

  @IsString()
  product_id: string;

  @IsString()
  product_code: string;

  @IsString()
  product_name: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsString()
  unit: string;

  @IsNumber()
  @Min(0)
  unit_cost: number;

  @IsNumber()
  @Min(0)
  total_cost: number;

  @IsNumber()
  @Min(0)
  unit_price: number;

  @IsNumber()
  @Min(0)
  total_price: number;

  @IsString()
  @IsOptional()
  from_location_id?: string;

  @IsString()
  @IsOptional()
  from_location_name?: string;

  @IsString()
  @IsOptional()
  to_location_id?: string;

  @IsString()
  @IsOptional()
  to_location_name?: string;

  @IsString()
  @IsOptional()
  supplier_id?: string;

  @IsString()
  @IsOptional()
  supplier_name?: string;

  @IsString()
  @IsOptional()
  customer_id?: string;

  @IsString()
  @IsOptional()
  customer_name?: string;

  @IsString()
  @IsOptional()
  order_id?: string;

  @IsString()
  @IsOptional()
  order_number?: string;

  @IsString()
  @IsOptional()
  manufacturing_order_id?: string;

  @IsString()
  @IsOptional()
  manufacturing_order_number?: string;

  @IsString()
  @IsOptional()
  invoice_id?: string;

  @IsString()
  @IsOptional()
  invoice_number?: string;

  @IsString()
  @IsOptional()
  delivery_note_id?: string;

  @IsString()
  @IsOptional()
  delivery_note_number?: string;

  @IsString()
  @IsOptional()
  credit_note_id?: string;

  @IsString()
  @IsOptional()
  credit_note_number?: string;

  @IsString()
  @IsOptional()
  batch_number?: string;

  @IsString()
  @IsOptional()
  serial_number?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  expiration_date?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  production_date?: Date;

  @IsEnum(['good', 'defective', 'quarantine', 'scrap'])
  @IsOptional()
  quality_status?: string;

  @IsString()
  @IsOptional()
  reason?: string;

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

  @IsEnum(['draft', 'pending', 'approved', 'completed', 'cancelled'])
  @IsOptional()
  status?: string;

  @IsBoolean()
  @IsOptional()
  is_reversed?: boolean;

  @IsString()
  @IsOptional()
  reversal_of_id?: string;

  @IsString()
  @IsOptional()
  reversal_reason?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stock_before?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stock_after?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  average_cost_before?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  average_cost_after?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  total_stock_value_before?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  total_stock_value_after?: number;

  @IsString()
  @IsOptional()
  document_reference?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  document_date?: Date;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
