import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CountersService } from './counters.service';
import { CountersController } from './counters.controller';
import { Counter, CounterSchema } from './schemas/counter.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Counter.name, schema: CounterSchema },
    ]),
  ],
  controllers: [CountersController],
  providers: [CountersService],
  exports: [CountersService],
})
export class CountersModule {}
