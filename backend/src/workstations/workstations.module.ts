import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkstationsService } from './workstations.service';
import { WorkstationsController } from './workstations.controller';
import { Workstation, WorkstationSchema } from './schemas/workstation.schema';
import { CountersModule } from '../counters/counters.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Workstation.name, schema: WorkstationSchema },
    ]),
    CountersModule,
  ],
  controllers: [WorkstationsController],
  providers: [WorkstationsService],
  exports: [WorkstationsService],
})
export class WorkstationsModule {}
