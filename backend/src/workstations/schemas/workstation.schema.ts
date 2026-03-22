import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type WorkstationDocument = Workstation & Document;

@Schema({ timestamps: true })
export class Workstation {
  @Prop({ required: true, unique: true })
  code: string; // Code unique du poste (ex: WS-001, WS-002)

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  type: string; // 'manual', 'semi_automatic', 'automatic', 'cnc', 'assembly', 'packaging'

  @Prop({ required: true, ref: 'Department' })
  department_id: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  department_name: string;

  @Prop({ required: true, default: 1 })
  capacity: number; // Nombre d'opérateurs simultanés

  @Prop({ required: true, default: 8 })
  daily_hours: number; // Heures de travail par jour

  @Prop({ required: true, default: 5 })
  weekly_days: number; // Jours de travail par semaine

  @Prop({ required: true, default: 0 })
  setup_time: number; // Temps de setup en minutes

  @Prop({ required: true, default: 0 })
  cycle_time: number; // Temps de cycle en minutes par unité

  @Prop({ required: true, default: 0 })
  hourly_cost: number; // Coût horaire (€/h)

  @Prop({ required: true, default: 0 })
  hourly_rate: number; // Tarif horaire (€/h)

  @Prop({
    type: [{
      day: { type: Number, min: 0, max: 6 }, // 0 = Dimanche, 1 = Lundi, ...
      start_time: String, // Format "HH:MM"
      end_time: String, // Format "HH:MM"
      is_active: Boolean,
    }],
    required: true,
  })
  schedule: Array<{
    day: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
  }>;

  @Prop({
    type: [{
      skill_id: { type: MongooseSchema.Types.ObjectId, ref: 'Skill' },
      skill_name: String,
      required_level: Number, // 1-5
    }],
    default: [],
  })
  required_skills: Array<{
    skill_id: MongooseSchema.Types.ObjectId;
    skill_name: string;
    required_level: number;
  }>;

  @Prop({
    type: [{
      tool_id: { type: MongooseSchema.Types.ObjectId, ref: 'Tool' },
      tool_name: String,
      tool_code: String,
      quantity: Number,
    }],
    default: [],
  })
  tools: Array<{
    tool_id: MongooseSchema.Types.ObjectId;
    tool_name: string;
    tool_code: string;
    quantity: number;
  }>;

  @Prop({
    type: [{
      material_id: { type: MongooseSchema.Types.ObjectId, ref: 'Material' },
      material_name: String,
      material_code: String,
      consumption_rate: Number, // Consommation par unité produite
      unit: String,
    }],
    default: [],
  })
  materials: Array<{
    material_id: MongooseSchema.Types.ObjectId;
    material_name: string;
    material_code: string;
    consumption_rate: number;
    unit: string;
  }>;

  @Prop({
    type: {
      monday: { type: Number, default: 0 },
      tuesday: { type: Number, default: 0 },
      wednesday: { type: Number, default: 0 },
      thursday: { type: Number, default: 0 },
      friday: { type: Number, default: 0 },
      saturday: { type: Number, default: 0 },
      sunday: { type: Number, default: 0 },
    },
    required: true,
  })
  weekly_capacity: {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  };

  @Prop({ required: true, default: 0 })
  current_load: number; // Charge actuelle en heures

  @Prop({ required: true, default: 0 })
  efficiency_rate: number; // Taux d'efficacité (0-100%)

  @Prop({ required: true, default: 0 })
  availability_rate: number; // Taux de disponibilité (0-100%)

  @Prop({ required: true, default: 0 })
  quality_rate: number; // Taux de qualité (0-100%)

  @Prop({
    enum: ['active', 'maintenance', 'inactive', 'broken'],
    default: 'active',
  })
  status: string;

  @Prop()
  maintenance_schedule?: Date; // Prochaine maintenance prévue

  @Prop()
  last_maintenance_date?: Date;

  @Prop()
  next_maintenance_date?: Date;

  @Prop({ default: 0 })
  total_operating_hours: number;

  @Prop({ default: 0 })
  total_production_units: number;

  @Prop({ default: 0 })
  total_downtime_hours: number;

  @Prop({ default: 0 })
  total_maintenance_hours: number;

  @Prop({ default: 0 })
  total_rejects: number;

  @Prop({ default: 0 })
  total_scrap: number;

  @Prop()
  location?: string; // Localisation physique

  @Prop()
  dimensions?: string; // Dimensions (L x l x H)

  @Prop()
  power_requirements?: string; // Besoins en énergie

  @Prop()
  safety_instructions?: string;

  @Prop()
  operating_instructions?: string;

  @Prop({ default: [] })
  attachments: string[]; // URLs des documents joints

  @Prop({ required: true })
  created_by: string;

  @Prop()
  updated_by?: string;

  @Prop({ default: true })
  is_active: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const WorkstationSchema = SchemaFactory.createForClass(Workstation);
