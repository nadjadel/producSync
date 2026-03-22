import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { DeliveryNotesService } from './delivery-notes.service';
import { CreateDeliveryNoteDto, UpdateDeliveryNoteDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('delivery-notes')
@UseGuards(JwtAuthGuard)
export class DeliveryNotesController {
  constructor(private readonly deliveryNotesService: DeliveryNotesService) {}

  @Post()
  create(@Body() createDeliveryNoteDto: CreateDeliveryNoteDto) {
    return this.deliveryNotesService.create(createDeliveryNoteDto);
  }

  @Post('from-ofs')
  createFromManufacturingOrders(
    @Body() body: { ofIds: string[]; customerId: string; deliveryDate: string; deliveryAddress?: string },
  ) {
    return this.deliveryNotesService.createFromManufacturingOrders(
      body.ofIds,
      body.customerId,
      body.deliveryDate,
      body.deliveryAddress,
    );
  }

  @Get()
  findAll(@Query('status') status?: string, @Query('customerId') customerId?: string) {
    return this.deliveryNotesService.findAll(status, customerId);
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.deliveryNotesService.search(query);
  }

  @Get('customer/:customerId')
  getByCustomer(@Param('customerId') customerId: string) {
    return this.deliveryNotesService.getByCustomer(customerId);
  }

  @Get('invoice/:invoiceId')
  getByInvoice(@Param('invoiceId') invoiceId: string) {
    return this.deliveryNotesService.getByInvoice(invoiceId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deliveryNotesService.findOne(id);
  }

  @Get('number/:deliveryNumber')
  findByDeliveryNumber(@Param('deliveryNumber') deliveryNumber: string) {
    return this.deliveryNotesService.findByDeliveryNumber(deliveryNumber);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDeliveryNoteDto: UpdateDeliveryNoteDto) {
    return this.deliveryNotesService.update(id, updateDeliveryNoteDto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.deliveryNotesService.updateStatus(id, body.status);
  }

  @Patch(':id/mark-invoiced')
  markAsInvoiced(@Param('id') id: string, @Body() body: { invoiceId: string }) {
    return this.deliveryNotesService.markAsInvoiced(id, body.invoiceId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deliveryNotesService.remove(id);
  }
}
