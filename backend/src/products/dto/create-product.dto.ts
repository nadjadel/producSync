import { IsString, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class BomItemDto {
  @IsString()
  product_id: string;

  @IsOptional()
  @IsString()
  product_name?: string;

  @IsNumber()
  @Min(0)
  quantity: number;
}

export class CreateProductDto {
  @IsString()
  reference: string;

  @IsOptional()
  @IsString()
  customer_id?: string;

  @IsOptional()
  @IsString()
  customer_code?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(['matiere_premiere', 'semi_fini', 'produit_fini'])
  category: string;

  @IsEnum(['piece', 'kg', 'litre', 'metre'])
  unit: string;

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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BomItemDto)
  bom?: BomItemDto[];
}
