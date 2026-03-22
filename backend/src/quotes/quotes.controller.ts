import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto, UpdateQuoteDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('quotes')
@UseGuards(JwtAuthGuard)
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  create(@Body() createQuoteDto: CreateQuoteDto) {
    return this.quotesService.create(createQuoteDto);
  }

  @Get()
  findAll(@Query('status') status?: string, @Query('customerId') customerId?: string) {
    return this.quotesService.findAll(status, customerId);
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.quotesService.search(query);
  }

  @Get('customer/:customerId')
  getByCustomer(@Param('customerId') customerId: string) {
    return this.quotesService.getByCustomer(customerId);
  }

  @Get('expired')
  getExpiredQuotes() {
    return this.quotesService.getExpiredQuotes();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quotesService.findOne(id);
  }

  @Get('number/:quoteNumber')
  findByQuoteNumber(@Param('quoteNumber') quoteNumber: string) {
    return this.quotesService.findByQuoteNumber(quoteNumber);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateQuoteDto: UpdateQuoteDto) {
    return this.quotesService.update(id, updateQuoteDto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.quotesService.updateStatus(id, body.status);
  }

  @Post(':id/convert-to-order')
  convertToOrder(@Param('id') id: string) {
    return this.quotesService.convertToOrder(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.quotesService.remove(id);
  }
}
