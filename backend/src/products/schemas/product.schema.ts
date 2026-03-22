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
  stock_quantity: number;

  @Prop({ default: 0 })
  stock_minimum: number;

  @Prop({ default: 0 })
  cost_price: number;

  @Prop({ default: 0 })
  sell_price: number;

  @Prop()
  image_url: string;

  @Prop({ type: [BomItem], default: [] })
  bom: BomItem[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
