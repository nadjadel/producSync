import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ManufacturingOrdersService } from './manufacturing-orders.service';
import { ManufacturingOrdersController } from './manufacturing-orders.controller';
import { ManufacturingOrder, ManufacturingOrderSchema } from './schemas/manufacturing-order.schema';
import { CountersModule } from '../counters/counters.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ManufacturingOrder.name, schema: ManufacturingOrderSchema }]),
    CountersModule,
  ],
  controllers: [ManufacturingOrdersController],
  providers: [ManufacturingOrdersService],
  exports: [ManufacturingOrdersService, MongooseModule],
})
export class ManufacturingOrdersModule {}