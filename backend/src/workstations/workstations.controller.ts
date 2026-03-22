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
import { WorkstationsService } from './workstations.service';
import { CreateWorkstationDto, UpdateWorkstationDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('workstations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkstationsController {
  constructor(private readonly workstationsService: WorkstationsService) {}

  @Post()
  @Roles('Administrator', 'ProductionManager')
  create(@Body() createWorkstationDto: CreateWorkstationDto) {
    return this.workstationsService.create(createWorkstationDto);
  }

  @Get()
  @Public()
  findAll(
    @Query('status') status?: string,
    @Query('departmentId') departmentId?: string,
    @Query('type') type?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.workstationsService.findAll(status, departmentId, type, isActive);
  }

  @Get('search')
  @Public()
  search(@Query('q') query: string) {
    return this.workstationsService.search(query);
  }

  @Get('department/:departmentId')
  @Public()
  getByDepartment(@Param('departmentId') departmentId: string) {
    return this.workstationsService.getByDepartment(departmentId);
  }

  @Get('type/:type')
  @Public()
  getByType(@Param('type') type: string) {
    return this.workstationsService.getByType(type);
  }

  @Get('available')
  @Public()
  getAvailableWorkstations(
    @Query('departmentId') departmentId?: string,
    @Query('type') type?: string,
    @Query('requiredCapacity') requiredCapacity?: number,
  ) {
    return this.workstationsService.getAvailableWorkstations(departmentId, type, requiredCapacity);
  }

  @Get('statistics')
  @Roles('Administrator', 'ProductionManager')
  getStatistics(@Query('departmentId') departmentId?: string) {
    return this.workstationsService.getStatistics(departmentId);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.workstationsService.findOne(id);
  }

  @Get('code/:code')
  @Public()
  findByCode(@Param('code') code: string) {
    return this.workstationsService.findByCode(code);
  }

  @Patch(':id')
  @Roles('Administrator', 'ProductionManager')
  update(
    @Param('id') id: string,
    @Body() updateWorkstationDto: UpdateWorkstationDto,
  ) {
    return this.workstationsService.update(id, updateWorkstationDto);
  }

  @Patch(':id/status')
  @Roles('Administrator', 'ProductionManager')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.workstationsService.updateStatus(id, status);
  }

  @Patch(':id/load')
  @Roles('Administrator', 'ProductionManager')
  updateLoad(
    @Param('id') id: string,
    @Body('additionalLoad', ParseIntPipe) additionalLoad: number,
  ) {
    return this.workstationsService.updateLoad(id, additionalLoad);
  }

  @Patch(':id/load/reset')
  @Roles('Administrator', 'ProductionManager')
  resetLoad(@Param('id') id: string) {
    return this.workstationsService.resetLoad(id);
  }

  @Patch(':id/production')
  @Roles('Administrator', 'ProductionManager')
  recordProduction(
    @Param('id') id: string,
    @Body('units', ParseIntPipe) units: number,
    @Body('operatingHours', ParseIntPipe) operatingHours: number,
    @Body('rejects') rejects?: number,
    @Body('scrap') scrap?: number,
  ) {
    return this.workstationsService.recordProduction(id, units, operatingHours, rejects, scrap);
  }

  @Patch(':id/downtime')
  @Roles('Administrator', 'ProductionManager')
  recordDowntime(
    @Param('id') id: string,
    @Body('downtimeHours', ParseIntPipe) downtimeHours: number,
  ) {
    return this.workstationsService.recordDowntime(id, downtimeHours);
  }

  @Patch(':id/maintenance')
  @Roles('Administrator', 'ProductionManager')
  recordMaintenance(
    @Param('id') id: string,
    @Body('maintenanceHours', ParseIntPipe) maintenanceHours: number,
  ) {
    return this.workstationsService.recordMaintenance(id, maintenanceHours);
  }

  @Patch(':id/maintenance/schedule')
  @Roles('Administrator', 'ProductionManager')
  scheduleMaintenance(
    @Param('id') id: string,
    @Body('date') date: Date,
  ) {
    return this.workstationsService.scheduleMaintenance(id, date);
  }

  @Patch(':id/maintenance/complete')
  @Roles('Administrator', 'ProductionManager')
  completeMaintenance(
    @Param('id') id: string,
    @Body('hours', ParseIntPipe) hours: number,
  ) {
    return this.workstationsService.completeMaintenance(id, hours);
  }

  @Delete(':id')
  @Roles('Administrator')
  remove(@Param('id') id: string) {
    return this.workstationsService.remove(id);
  }
}
