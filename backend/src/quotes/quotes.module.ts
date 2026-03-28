import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { Quote, QuoteSchema } from './schemas/quote.schema';
import { CountersModule } from '../counters/counters.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Quote.name, schema: QuoteSchema }]),
    CountersModule,
  ],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService, MongooseModule],
})
export class QuotesModule {}
