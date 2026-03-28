import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeliveryNotesService } from './delivery-notes.service';
import { DeliveryNotesController } from './delivery-notes.controller';
import { DeliveryNote, DeliveryNoteSchema } from './schemas/delivery-note.schema';
import { ManufacturingOrder, ManufacturingOrderSchema } from '../manufacturing-orders/schemas/manufacturing-order.schema';
import { CountersModule } from '../counters/counters.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DeliveryNote.name, schema: DeliveryNoteSchema },
      { name: ManufacturingOrder.name, schema: ManufacturingOrderSchema },
    ]),
    CountersModule,
  ],
  controllers: [DeliveryNotesController],
  providers: [DeliveryNotesService],
  exports: [DeliveryNotesService, MongooseModule],
})
export class DeliveryNotesModule {}
