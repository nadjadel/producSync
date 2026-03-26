import { Controller, Get, Post, Param, Body, Delete, Patch } from '@nestjs/common';
import { CountersService } from './counters.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/counters')
export class CountersController {
  constructor(private readonly countersService: CountersService) {}

  @Get()
  @Public()
  async getAllCounters() {
    return this.countersService.getAllCounters();
  }

  @Get(':counterType')
  @Public()
  async getCounter(@Param('counterType') counterType: string) {
    return this.countersService.getCounter(counterType);
  }

  @Get(':counterType/next')
  @Public()
  async getNextNumber(@Param('counterType') counterType: string) {
    const nextNumber = await this.countersService.getNextNumber(counterType);
    return { counter_type: counterType, next_number: nextNumber };
  }

  @Get(':counterType/next-preview')
  @Public()
  async getNextNumberPreview(@Param('counterType') counterType: string) {
    const preview = await this.countersService.getNextNumberPreview(counterType);
    return { counter_type: counterType, next_number_preview: preview };
  }

  @Get(':counterType/current')
  @Public()
  async getCurrentNumber(@Param('counterType') counterType: string) {
    const current = await this.countersService.getCurrentNumber(counterType);
    return { counter_type: counterType, current_number: current };
  }

  @Get(':counterType/info')
  @Public()
  async getCounterInfo(@Param('counterType') counterType: string) {
    return this.countersService.getCounterInfo(counterType);
  }

  @Post(':counterType/initialize')
  @Public()
  async initializeCounter(
    @Param('counterType') counterType: string,
    @Body() body: { format?: string }
  ) {
    const counter = await this.countersService.initializeCounter(counterType, body?.format);
    return counter;
  }

  @Patch(':counterType/reset')
  @Public()
  async resetCounter(
    @Param('counterType') counterType: string,
    @Body() body: { start_number?: number }
  ) {
    const counter = await this.countersService.resetCounter(counterType, body?.start_number);
    return counter;
  }

  @Delete(':counterType')
  @Public()
  async deleteCounter(@Param('counterType') counterType: string) {
    await this.countersService.deleteCounter(counterType);
    return { message: `Compteur ${counterType} supprimé avec succès` };
  }

  @Get(':counterType/available')
  @Public()
  async isNumberAvailable(
    @Param('counterType') counterType: string,
    @Body() body: { count?: number }
  ) {
    const available = await this.countersService.isNumberAvailable(counterType, body?.count || 1);
    return { counter_type: counterType, available };
  }

  @Post('product-code')
  @Public()
  async getNextProductCode(@Body() body: { customer_prefix: string }) {
    const code = await this.countersService.getNextProductCode(body.customer_prefix);
    return { customer_prefix: body.customer_prefix, product_code: code };
  }

  @Get('customer-code/next')
  @Public()
  async getNextCustomerCode() {
    const code = await this.countersService.getNextCustomerCode();
    return { customer_code: code };
  }

  @Post('initialize-all')
  @Public()
  async initializeAllCounters() {
    await this.countersService.initializeAllCounters();
    return { message: 'Tous les compteurs ont été initialisés' };
  }
}