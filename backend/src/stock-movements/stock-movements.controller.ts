import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { StockMovementsService } from './stock-movements.service';
import { CreateStockMovementDto, UpdateStockMovementDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('stock-movements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StockMovementsController {
  constructor(private readonly stockMovementsService: StockMovementsService) {}

  @Post()
  @Roles('Administrator', 'WarehouseManager')
  create(@Body() createStockMovementDto: CreateStockMovementDto) {
    return this.stockMovementsService.create(createStockMovementDto);
  }

  @Get()
  @Public()
  findAll(
    @Query('productId') productId?: string,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
    @Query('status') status?: string,
  ) {
    return this.stockMovementsService.findAll(productId, type, category, startDate, endDate, status);
  }

  @Get('search')
  @Public()
  search(@Query('q') query: string) {
    return this.stockMovementsService.search(query);
  }

  @Get('product/:productId')
  @Public()
  getByProduct(@Param('productId') productId: string) {
    return this.stockMovementsService.getByProduct(productId);
  }

  @Get('order/:orderId')
  @Public()
  getByOrder(@Param('orderId') orderId: string) {
    return this.stockMovementsService.getByOrder(orderId);
  }

  @Get('manufacturing-order/:manufacturingOrderId')
  @Public()
  getByManufacturingOrder(@Param('manufacturingOrderId') manufacturingOrderId: string) {
    return this.stockMovementsService.getByManufacturingOrder(manufacturingOrderId);
  }

  @Get('invoice/:invoiceId')
  @Public()
  getByInvoice(@Param('invoiceId') invoiceId: string) {
    return this.stockMovementsService.getByInvoice(invoiceId);
  }

  @Get('statistics')
  @Roles('Administrator', 'WarehouseManager')
  getStatistics(
    @Query('productId') productId?: string,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ) {
    return this.stockMovementsService.getStatistics(productId, startDate, endDate);
  }

  @Get('history/:productId')
  @Public()
  getStockHistory(
    @Param('productId') productId: string,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ) {
    return this.stockMovementsService.getStockHistory(productId, startDate, endDate);
  }

  @Get('current-value')
  @Public()
  getCurrentStockValue(@Query('productId') productId?: string) {
    return this.stockMovementsService.getCurrentStockValue(productId);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.stockMovementsService.findOne(id);
  }

  @Get('number/:movementNumber')
  @Public()
  findByMovementNumber(@Param('movementNumber') movementNumber: string) {
    return this.stockMovementsService.findByMovementNumber(movementNumber);
  }

  @Patch(':id')
  @Roles('Administrator', 'WarehouseManager')
  update(
    @Param('id') id: string,
    @Body() updateStockMovementDto: UpdateStockMovementDto,
  ) {
    return this.stockMovementsService.update(id, updateStockMovementDto);
  }

  @Patch(':id/status')
  @Roles('Administrator', 'WarehouseManager')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.stockMovementsService.updateStatus(id, status);
  }

  @Patch(':id/reverse')
  @Roles('Administrator', 'WarehouseManager')
  reverseMovement(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.stockMovementsService.reverseMovement(id, reason);
  }

  @Delete(':id')
  @Roles('Administrator')
  remove(@Param('id') id: string) {
    return this.stockMovementsService.remove(id);
  }
}
