import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll(@Query('category') category?: string, @Query('customerId') customerId?: string) {
    return this.productsService.findAll(category, customerId);
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.productsService.search(query);
  }

  @Get('low-stock')
  getLowStockProducts() {
    return this.productsService.getLowStockProducts();
  }

  @Get('customer/:customerId')
  getByCustomer(@Param('customerId') customerId: string) {
    return this.productsService.getByCustomer(customerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Get('reference/:reference')
  findByReference(@Param('reference') reference: string) {
    return this.productsService.findByReference(reference);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Patch(':id/stock')
  updateStock(@Param('id') id: string, @Body() body: { quantity: number }) {
    return this.productsService.updateStock(id, body.quantity);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
