import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ManufacturingOrdersService } from './manufacturing-orders.service';
import { CreateManufacturingOrderDto, UpdateManufacturingOrderDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('manufacturing-orders')
@UseGuards(JwtAuthGuard)
export class ManufacturingOrdersController {
  constructor(private readonly manufacturingOrdersService: ManufacturingOrdersService) {}

  @Post()
  create(@Body() createManufacturingOrderDto: CreateManufacturingOrderDto) {
    return this.manufacturingOrdersService.create(createManufacturingOrderDto);
  }

  @Get()
  findAll(@Query('status') status?: string, @Query('customerOrderId') customerOrderId?: string) {
    return this.manufacturingOrdersService.findAll(status, customerOrderId);
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.manufacturingOrdersService.search(query);
  }

  @Get('customer-order/:customerOrderId')
  getByCustomerOrder(@Param('customerOrderId') customerOrderId: string) {
    return this.manufacturingOrdersService.getByCustomerOrder(customerOrderId);
  }

  @Get('ready-for-delivery')
  getReadyForDelivery() {
    return this.manufacturingOrdersService.getReadyForDelivery();
  }

  @Get('subcontracted')
  getSubcontractedOrders() {
    return this.manufacturingOrdersService.getSubcontractedOrders();
  }

  @Get('workstation/:workstationId')
  getByWorkstation(@Param('workstationId') workstationId: string) {
    return this.manufacturingOrdersService.getByWorkstation(workstationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.manufacturingOrdersService.findOne(id);
  }

  @Get('number/:orderNumber')
  findByOrderNumber(@Param('orderNumber') orderNumber: string) {
    return this.manufacturingOrdersService.findByOrderNumber(orderNumber);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateManufacturingOrderDto: UpdateManufacturingOrderDto) {
    return this.manufacturingOrdersService.update(id, updateManufacturingOrderDto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.manufacturingOrdersService.updateStatus(id, body.status);
  }

  @Patch(':id/progress')
  updateProgress(@Param('id') id: string, @Body() body: { quantityProduced: number }) {
    return this.manufacturingOrdersService.updateProgress(id, body.quantityProduced);
  }

  @Patch(':id/mark-delivered')
  markAsDelivered(@Param('id') id: string, @Body() body: { deliveryNoteId?: string }) {
    return this.manufacturingOrdersService.markAsDelivered(id, body.deliveryNoteId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.manufacturingOrdersService.remove(id);
  }
}
