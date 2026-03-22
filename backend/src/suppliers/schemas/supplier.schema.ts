import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SupplierDocument = Supplier & Document;

@Schema()
export class BankDetails {
  @Prop()
  bank_name: string;

  @Prop()
  iban: string;

  @Prop()
  bic: string;

  @Prop()
  account_holder: string;
}

@Schema()
export class AdditionalContact {
  @Prop()
  name: string;

  @Prop()
  position: string;

  @Prop()
  email: string;

  @Prop()
  phone: string;
}

@Schema({ timestamps: true })
export class Supplier {
  @Prop({ 
    required: true, 
    unique: true,
    description: 'Code fournisseur (généré automatiquement via CountersService)'
  })
  code: string;

  @Prop({ required: true })
  company_name: string;

  @Prop()
  siret: string;

  @Prop()
  vat_number: string;

  @Prop()
  contact_name: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  phone: string;

  @Prop()
  address: string;

  @Prop()
  postal_code: string;

  @Prop()
  city: string;

  @Prop({ default: 'France' })
  country: string;

  @Prop({
    description: 'Spécialité / type de sous-traitance'
  })
  speciality: string;

  @Prop({ 
    enum: ['active', 'inactive'], 
    default: 'active' 
  })
  status: string;

  @Prop({ 
    enum: ['30_days', '45_days', '60_days', 'cash', 'end_of_month'], 
    default: '30_days' 
  })
  payment_terms: string;

  @Prop()
  notes: string;

  @Prop({
    default: 0,
    description: 'Note de fiabilité (0-5)'
  })
  reliability_score: number;

  @Prop({
    default: 0,
    description: 'Nombre de commandes passées'
  })
  order_count: number;

  @Prop({
    description: 'Date du dernier achat'
  })
  last_purchase_date?: Date;

  @Prop({
    description: 'Montant total des achats'
  })
  total_purchase_amount?: number;

  @Prop({
    description: 'Délai de livraison moyen en jours'
  })
  average_delivery_time?: number;

  @Prop({
    description: 'Taux de satisfaction (0-100)'
  })
  satisfaction_rate?: number;

  @Prop({
    description: 'Catégories de produits fournis'
  })
  product_categories?: string[];

  @Prop({
    description: 'Certifications du fournisseur'
  })
  certifications?: string[];

  @Prop({
    description: 'Contacts supplémentaires',
    type: [AdditionalContact],
    default: [],
  })
  additional_contacts?: AdditionalContact[];

  @Prop({
    description: 'Informations bancaires',
    type: BankDetails,
  })
  bank_details?: BankDetails;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);
export const BankDetailsSchema = SchemaFactory.createForClass(BankDetails);
export const AdditionalContactSchema = SchemaFactory.createForClass(AdditionalContact);
