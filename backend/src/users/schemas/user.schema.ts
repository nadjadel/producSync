import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  first_name: string;

  @Prop({ required: true })
  last_name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({
    enum: ['admin', 'manager', 'operator', 'viewer'],
    default: 'operator',
  })
  role: string;

  @Prop({
    enum: ['active', 'inactive', 'invited'],
    default: 'active',
  })
  status: string;

  @Prop()
  phone_number: string;

  @Prop()
  department: string;

  @Prop()
  last_login: Date;

  @Prop({ default: false })
  is_deleted: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
