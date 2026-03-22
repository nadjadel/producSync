import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(createInvoiceDto);
  }

  @Post('from-delivery-notes')
  createFromDeliveryNotes(
    @Body() body: { blIds: string[]; customerId: string; invoiceDate: string },
  ) {
    return this.invoicesService.createFromDeliveryNotes(
      body.blIds,
      body.customerId,
      body.invoiceDate,
    );
  }

  @Get()
  findAll(@Query('status') status?: string, @Query('customerId') customerId?: string) {
    return this.invoicesService.findAll(status, customerId);
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.invoicesService.search(query);
  }

  @Get('customer/:customerId')
  getByCustomer(@Param('customerId') customerId: string) {
    return this.invoicesService.getByCustomer(customerId);
  }

  @Get('delivery-note/:deliveryNoteId')
  getByDeliveryNote(@Param('deliveryNoteId') deliveryNoteId: string) {
    return this.invoicesService.getByDeliveryNote(deliveryNoteId);
  }

  @Get('overdue')
  getOverdueInvoices() {
    return this.invoicesService.getOverdueInvoices();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Get('number/:invoiceNumber')
  findByInvoiceNumber(@Param('invoiceNumber') invoiceNumber: string) {
    return this.invoicesService.findByInvoiceNumber(invoiceNumber);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    return this.invoicesService.update(id, updateInvoiceDto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.invoicesService.updateStatus(id, body.status);
  }

  @Patch(':id/mark-paid')
  markAsPaid(@Param('id') id: string, @Body() body: { paymentDate: string }) {
    return this.invoicesService.markAsPaid(id, body.paymentDate);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.invoicesService.remove(id);
  }
}
