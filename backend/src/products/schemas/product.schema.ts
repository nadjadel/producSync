import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema()
export class BomItem {
  @Prop({ type: Types.ObjectId, ref: 'Product' })
  product_id: Types.ObjectId;

  @Prop()
  product_name: string;

  @Prop({ required: true })
  quantity: number;
}

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, unique: true })
  reference: string;

  @Prop({ type: Types.ObjectId, ref: 'Customer' })
  customer_id: Types.ObjectId;

  @Prop()
  customer_code: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ 
    required: true,
    enum: ['matiere_premiere', 'semi_fini', 'produit_fini'] 
  })
  category: string;

  @Prop({ 
    required: true,
    enum: ['piece', 'kg', 'litre', 'metre'],
    default: 'piece'
  })
  unit: string;

  @Prop({ default: 0 })
  current_stock: number;

  @Prop({ default: 0 })
  stock_minimum: number;

  @Prop({ default: 0 })
  stock_maximum: number;

  @Prop({ default: 0 })
  average_cost: number; // Coût moyen pondéré (FIFO)

  @Prop({ default: 0 })
  total_stock_value: number; // Valeur totale du stock = current_stock * average_cost

  @Prop({ default: 0 })
  last_purchase_cost: number;

  @Prop({ default: 0 })
  standard_cost: number;

  @Prop({ default: 0 })
  sell_price: number;

  @Prop()
  last_stock_update?: Date;

  @Prop()
  image_url: string;

  @Prop({ type: [BomItem], default: [] })
  bom: BomItem[];

  @Prop({ default: true })
  is_active: boolean;

  @Prop()
  location?: string; // Emplacement physique

  @Prop()
  storage_conditions?: string; // Conditions de stockage

  @Prop()
  shelf_life?: number; // Durée de conservation en jours

  @Prop()
  safety_stock?: number; // Stock de sécurité

  @Prop()
  reorder_point?: number; // Point de réapprovisionnement

  @Prop()
  lead_time?: number; // Délai d'approvisionnement en jours

  @Prop({ default: 0 })
  total_purchased: number; // Quantité totale achetée

  @Prop({ default: 0 })
  total_sold: number; // Quantité totale vendue

  @Prop({ default: 0 })
  total_produced: number; // Quantité totale produite

  @Prop({ default: 0 })
  total_consumed: number; // Quantité totale consommée

  @Prop({ default: 0 })
  total_scrap: number; // Quantité totale mise au rebut

  createdAt?: Date;
  updatedAt?: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
