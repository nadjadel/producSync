import { IsString, IsNumber, IsOptional, IsEnum, IsArray, IsBoolean, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { BomItemDto } from './create-product.dto';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  customer_id?: string;

  @IsOptional()
  @IsString()
  customer_code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['matiere_premiere', 'semi_fini', 'produit_fini'])
  category?: string;

  @IsOptional()
  @IsEnum(['piece', 'kg', 'litre', 'metre'])
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock_quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock_minimum?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cost_price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sell_price?: number;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'archived'])
  status?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BomItemDto)
  bom?: BomItemDto[];
}
