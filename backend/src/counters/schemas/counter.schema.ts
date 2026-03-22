import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CounterDocument = Counter & Document;

@Schema({ timestamps: true })
export class Counter {
  @Prop({ 
    required: true, 
    unique: true,
    enum: ['OF', 'CO', 'DE', 'BL', 'FA', 'AV', 'PRODUCT', 'CUSTOMER', 'SUPPLIER'],
    description: 'Type de compteur (OF=Ordre Fabrication, CO=Commande, DE=Devis, BL=Bon Livraison, FA=Facture, AV=Avoir, PRODUCT=Produit, CUSTOMER=Client, SUPPLIER=Fournisseur)'
  })
  counter_type: string;

  @Prop({ 
    default: 0,
    description: 'Dernier numéro utilisé'
  })
  last_number: number;

  @Prop({
    default: 1,
    description: 'Incrément pour le compteur'
  })
  increment: number;

  @Prop({
    default: 'YYYY-XXXX',
    description: 'Format du numéro (YYYY=année, XXXX=numéro, MM=mois, DD=jour)'
  })
  format: string;

  @Prop({
    default: true,
    description: 'Réinitialiser le compteur chaque année'
  })
  reset_yearly: boolean;

  @Prop({
    default: 1,
    description: 'Numéro de départ'
  })
  start_number: number;

  @Prop({
    default: 9999,
    description: 'Numéro maximum avant réinitialisation'
  })
  max_number: number;

  @Prop({
    description: 'Année courante pour la réinitialisation annuelle'
  })
  current_year?: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);
