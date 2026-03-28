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
} from '@nestjs/common';
import { CreditNotesService } from './credit-notes.service';
import { CreateCreditNoteDto, UpdateCreditNoteDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('credit-notes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CreditNotesController {
  constructor(private readonly creditNotesService: CreditNotesService) {}

  @Post()
  @Roles('Administrator')
  create(@Body() createCreditNoteDto: CreateCreditNoteDto) {
    return this.creditNotesService.create(createCreditNoteDto);
  }

  @Get()
  @Public()
  findAll(
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ) {
    return this.creditNotesService.findAll(status, customerId, startDate, endDate);
  }

  @Get('search')
  @Public()
  search(@Query('q') query: string) {
    return this.creditNotesService.search(query);
  }

  @Get('customer/:customerId')
  @Public()
  getByCustomer(@Param('customerId') customerId: string) {
    return this.creditNotesService.getByCustomer(customerId);
  }

  @Get('invoice/:invoiceId')
  @Public()
  getByInvoice(@Param('invoiceId') invoiceId: string) {
    return this.creditNotesService.getByInvoice(invoiceId);
  }

  @Get('available/:customerId')
  @Public()
  getAvailableCreditNotes(@Param('customerId') customerId: string) {
    return this.creditNotesService.getAvailableCreditNotes(customerId);
  }

  @Get('statistics')
  @Roles('Administrator')
  getStatistics(@Query('customerId') customerId?: string) {
    return this.creditNotesService.getStatistics(customerId);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.creditNotesService.findOne(id);
  }

  @Get('number/:creditNoteNumber')
  @Public()
  findByCreditNoteNumber(@Param('creditNoteNumber') creditNoteNumber: string) {
    return this.creditNotesService.findByCreditNoteNumber(creditNoteNumber);
  }

  @Patch(':id')
  @Roles('Administrator')
  update(
    @Param('id') id: string,
    @Body() updateCreditNoteDto: UpdateCreditNoteDto,
  ) {
    return this.creditNotesService.update(id, updateCreditNoteDto);
  }

  @Patch(':id/status')
  @Roles('Administrator')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.creditNotesService.updateStatus(id, status);
  }

  // Bug 6 corrigé : suppression de ParseIntPipe — amount peut être un float
  @Patch(':id/apply')
  @Roles('Administrator')
  applyToInvoice(
    @Param('id') id: string,
    @Body('invoiceId') invoiceId: string,
    @Body('amount') amount: number,
  ) {
    return this.creditNotesService.applyToInvoice(id, invoiceId, amount);
  }

  @Patch(':id/cancel')
  @Roles('Administrator')
  cancelCreditNote(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.creditNotesService.cancelCreditNote(id, reason);
  }

  @Delete(':id')
  @Roles('Administrator')
  remove(@Param('id') id: string) {
    return this.creditNotesService.remove(id);
  }
}