import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, IsDateString, Min } from 'class-validator';

export class UpdateManufacturingOrderDto {
  @IsOptional()
  @IsString()
  order_number?: string;

  @IsOptional()
  @IsString()
  customer_order_id?: string;

  @IsOptional()
  @IsString()
  customer_order_number?: string;

  @IsOptional()
  @IsString()
  product_id?: string;

  @IsOptional()
  @IsString()
  product_name?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity_planned?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity_produced?: number;

  @IsOptional()
  @IsEnum(['draft', 'planned', 'in_progress', 'completed', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority?: string;

  @IsOptional()
  @IsString()
  workstation_id?: string;

  @IsOptional()
  @IsString()
  workstation_name?: string;

  @IsOptional()
  @IsDateString()
  planned_start?: string;

  @IsOptional()
  @IsDateString()
  planned_end?: string;

  @IsOptional()
  @IsDateString()
  actual_start?: string;

  @IsOptional()
  @IsDateString()
  actual_end?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  ready_for_delivery?: boolean;

  @IsOptional()
  @IsBoolean()
  delivered?: boolean;

  @IsOptional()
  @IsString()
  delivery_note_id?: string;

  @IsOptional()
  @IsBoolean()
  is_subcontracted?: boolean;

  @IsOptional()
  @IsString()
  supplier_id?: string;

  @IsOptional()
  @IsString()
  supplier_name?: string;

  @IsOptional()
  @IsString()
  subcontract_number?: string;

  @IsOptional()
  @IsDateString()
  subcontract_sent_date?: string;

  @IsOptional()
  @IsDateString()
  subcontract_expected_date?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  subcontract_unit_price?: number;
}
