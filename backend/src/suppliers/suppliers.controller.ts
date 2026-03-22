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
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @Roles('Administrator')
  create(@Body() createSupplierDto: CreateSupplierDto) {
    return this.suppliersService.create(createSupplierDto);
  }

  @Get()
  @Public()
  findAll(
    @Query('status') status?: string,
    @Query('speciality') speciality?: string,
  ) {
    return this.suppliersService.findAll(status, speciality);
  }

  @Get('search')
  @Public()
  search(@Query('q') query: string) {
    return this.suppliersService.search(query);
  }

  @Get('active')
  @Public()
  getActiveSuppliers() {
    return this.suppliersService.getActiveSuppliers();
  }

  @Get('top')
  @Public()
  getTopSuppliers(@Query('limit', ParseIntPipe) limit?: number) {
    return this.suppliersService.getTopSuppliers(limit);
  }

  @Get('speciality/:speciality')
  @Public()
  getBySpeciality(@Param('speciality') speciality: string) {
    return this.suppliersService.getBySpeciality(speciality);
  }

  @Get('category/:category')
  @Public()
  getByProductCategory(@Param('category') category: string) {
    return this.suppliersService.getSuppliersByProductCategory(category);
  }

  @Get('certifications')
  @Public()
  getWithCertifications(@Query('certs') certifications: string) {
    const certsArray = certifications ? certifications.split(',') : [];
    return this.suppliersService.getSuppliersWithCertifications(certsArray);
  }

  @Get('statistics')
  @Roles('Administrator')
  getStatistics() {
    return this.suppliersService.getStatistics();
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.suppliersService.findOne(id);
  }

  @Get('code/:code')
  @Public()
  findByCode(@Param('code') code: string) {
    return this.suppliersService.findByCode(code);
  }

  @Patch(':id')
  @Roles('Administrator')
  update(
    @Param('id') id: string,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(id, updateSupplierDto);
  }

  @Patch(':id/status')
  @Roles('Administrator')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.suppliersService.updateStatus(id, status);
  }

  @Patch(':id/reliability')
  @Roles('Administrator')
  updateReliabilityScore(
    @Param('id') id: string,
    @Body('score') score: number,
  ) {
    return this.suppliersService.updateReliabilityScore(id, score);
  }

  @Patch(':id/delivery-time')
  @Roles('Administrator')
  updateDeliveryTime(
    @Param('id') id: string,
    @Body('deliveryTime') deliveryTime: number,
  ) {
    return this.suppliersService.updateDeliveryTime(id, deliveryTime);
  }

  @Patch(':id/satisfaction')
  @Roles('Administrator')
  updateSatisfactionRate(
    @Param('id') id: string,
    @Body('rate') rate: number,
  ) {
    return this.suppliersService.updateSatisfactionRate(id, rate);
  }

  @Patch(':id/increment-order')
  @Roles('Administrator')
  incrementOrderCount(
    @Param('id') id: string,
    @Body('amount') amount: number,
  ) {
    return this.suppliersService.incrementOrderCount(id, amount);
  }

  @Patch(':id/certifications/add')
  @Roles('Administrator')
  addCertification(
    @Param('id') id: string,
    @Body('certification') certification: string,
  ) {
    return this.suppliersService.addCertification(id, certification);
  }

  @Patch(':id/certifications/remove')
  @Roles('Administrator')
  removeCertification(
    @Param('id') id: string,
    @Body('certification') certification: string,
  ) {
    return this.suppliersService.removeCertification(id, certification);
  }

  @Patch(':id/categories/add')
  @Roles('Administrator')
  addProductCategory(
    @Param('id') id: string,
    @Body('category') category: string,
  ) {
    return this.suppliersService.addProductCategory(id, category);
  }

  @Patch(':id/categories/remove')
  @Roles('Administrator')
  removeProductCategory(
    @Param('id') id: string,
    @Body('category') category: string,
  ) {
    return this.suppliersService.removeProductCategory(id, category);
  }

  @Delete(':id')
  @Roles('Administrator')
  remove(@Param('id') id: string) {
    return this.suppliersService.remove(id);
  }
}
