import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type StockMovementDocument = StockMovement & Document;

@Schema({ timestamps: true })
export class StockMovement {
  @Prop({ required: true, unique: true })
  movement_number: string; // Format: SM-YYYYMMDD-XXXXXX

  @Prop({ required: true })
  movement_date: Date;

  @Prop({ required: true })
  type: string; // 'in', 'out', 'transfer', 'adjustment', 'production', 'consumption'

  @Prop({ required: true })
  category: string; // 'purchase', 'sale', 'return', 'production', 'scrap', 'loss', 'transfer', 'adjustment'

  @Prop({ required: true, ref: 'Product' })
  product_id: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  product_code: string;

  @Prop({ required: true })
  product_name: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  unit: string;

  @Prop({ required: true })
  unit_cost: number; // Coût unitaire au moment du mouvement

  @Prop({ required: true })
  total_cost: number; // Coût total = quantity * unit_cost

  @Prop({ required: true })
  unit_price: number; // Prix unitaire de vente (si applicable)

  @Prop({ required: true })
  total_price: number; // Prix total = quantity * unit_price

  @Prop({ ref: 'Location' })
  from_location_id?: MongooseSchema.Types.ObjectId;

  @Prop()
  from_location_name?: string;

  @Prop({ ref: 'Location' })
  to_location_id?: MongooseSchema.Types.ObjectId;

  @Prop()
  to_location_name?: string;

  @Prop({ ref: 'Supplier' })
  supplier_id?: MongooseSchema.Types.ObjectId;

  @Prop()
  supplier_name?: string;

  @Prop({ ref: 'Customer' })
  customer_id?: MongooseSchema.Types.ObjectId;

  @Prop()
  customer_name?: string;

  @Prop({ ref: 'Order' })
  order_id?: MongooseSchema.Types.ObjectId;

  @Prop()
  order_number?: string;

  @Prop({ ref: 'ManufacturingOrder' })
  manufacturing_order_id?: MongooseSchema.Types.ObjectId;

  @Prop()
  manufacturing_order_number?: string;

  @Prop({ ref: 'Invoice' })
  invoice_id?: MongooseSchema.Types.ObjectId;

  @Prop()
  invoice_number?: string;

  @Prop({ ref: 'DeliveryNote' })
  delivery_note_id?: MongooseSchema.Types.ObjectId;

  @Prop()
  delivery_note_number?: string;

  @Prop({ ref: 'CreditNote' })
  credit_note_id?: MongooseSchema.Types.ObjectId;

  @Prop()
  credit_note_number?: string;

  @Prop()
  batch_number?: string;

  @Prop()
  serial_number?: string;

  @Prop()
  expiration_date?: Date;

  @Prop()
  production_date?: Date;

  @Prop()
  quality_status?: string; // 'good', 'defective', 'quarantine', 'scrap'

  @Prop()
  reason?: string; // Raison du mouvement (retour, perte, ajustement, etc.)

  @Prop()
  notes?: string;

  @Prop({ required: true })
  created_by: string;

  @Prop()
  approved_by?: string;

  @Prop()
  approval_date?: Date;

  @Prop({
    enum: ['draft', 'pending', 'approved', 'completed', 'cancelled'],
    default: 'draft',
  })
  status: string;

  @Prop({ default: false })
  is_reversed: boolean;

  @Prop({ ref: 'StockMovement' })
  reversal_of_id?: MongooseSchema.Types.ObjectId;

  @Prop({ ref: 'StockMovement' })
  reversed_by_id?: MongooseSchema.Types.ObjectId;

  @Prop()
  reversal_reason?: string;

  @Prop()
  reversal_date?: Date;

  @Prop({ default: 0 })
  stock_before: number; // Stock avant le mouvement

  @Prop({ default: 0 })
  stock_after: number; // Stock après le mouvement

  @Prop({ default: 0 })
  average_cost_before: number; // Coût moyen avant le mouvement

  @Prop({ default: 0 })
  average_cost_after: number; // Coût moyen après le mouvement

  @Prop({ default: 0 })
  total_stock_value_before: number; // Valeur totale du stock avant

  @Prop({ default: 0 })
  total_stock_value_after: number; // Valeur totale du stock après

  @Prop()
  document_reference?: string; // Référence du document source (bon de livraison, facture, etc.)

  @Prop()
  document_date?: Date;

  @Prop({ default: [] })
  attachments: string[]; // URLs des documents joints

  @Prop({ default: true })
  is_active: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const StockMovementSchema = SchemaFactory.createForClass(StockMovement);
