import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Workstation, WorkstationDocument } from './schemas/workstation.schema';
import { CreateWorkstationDto, UpdateWorkstationDto } from './dto';
import { CountersService } from '../counters/counters.service';

@Injectable()
export class WorkstationsService {
  constructor(
    @InjectModel(Workstation.name) private workstationModel: Model<WorkstationDocument>,
    private readonly countersService: CountersService,
  ) {}

  async create(createWorkstationDto: CreateWorkstationDto): Promise<WorkstationDocument> {
    // Générer un code automatiquement si non fourni
    let workstationCode = createWorkstationDto.code;
    if (!workstationCode) {
      // Pour les postes de travail, on pourrait utiliser un format spécifique
      // Pour l'instant, on utilise un compteur simple
      const counterNumber = await this.countersService.getNextNumber('WORKSTATION');
      workstationCode = `WS-${counterNumber.padStart(3, '0')}`;
    }

    // Vérifier l'unicité du code
    const existingWorkstation = await this.workstationModel.findOne({
      code: workstationCode,
    }).exec();

    if (existingWorkstation) {
      throw new ConflictException(`Le poste de travail avec le code ${workstationCode} existe déjà`);
    }

    // Calculer la capacité hebdomadaire
    const weeklyCapacity = {
      monday: createWorkstationDto.monday_capacity,
      tuesday: createWorkstationDto.tuesday_capacity,
      wednesday: createWorkstationDto.wednesday_capacity,
      thursday: createWorkstationDto.thursday_capacity,
      friday: createWorkstationDto.friday_capacity,
      saturday: createWorkstationDto.saturday_capacity,
      sunday: createWorkstationDto.sunday_capacity,
    };

    // Créer le poste de travail
    const workstation = new this.workstationModel({
      ...createWorkstationDto,
      code: workstationCode,
      weekly_capacity: weeklyCapacity,
      current_load: 0,
      total_operating_hours: 0,
      total_production_units: 0,
      total_downtime_hours: 0,
      total_maintenance_hours: 0,
      total_rejects: 0,
      total_scrap: 0,
      is_active: createWorkstationDto.is_active ?? true,
    });
    
    return workstation.save();
  }

  async findAll(
    status?: string,
    departmentId?: string,
    type?: string,
    isActive?: boolean,
  ): Promise<WorkstationDocument[]> {
    const filter: any = {};
    if (status) filter.status = status;
    if (departmentId) filter.department_id = departmentId;
    if (type) filter.type = type;
    if (isActive !== undefined) filter.is_active = isActive;
    
    return this.workstationModel.find(filter).sort({ code: 1 }).exec();
  }

  async findOne(id: string): Promise<WorkstationDocument> {
    const workstation = await this.workstationModel.findById(id).exec();
    if (!workstation) {
      throw new NotFoundException(`Poste de travail avec l'ID ${id} non trouvé`);
    }
    return workstation;
  }

  async findByCode(code: string): Promise<WorkstationDocument> {
    const workstation = await this.workstationModel.findOne({ code }).exec();
    if (!workstation) {
      throw new NotFoundException(`Poste de travail avec le code ${code} non trouvé`);
    }
    return workstation;
  }

  async update(id: string, updateWorkstationDto: UpdateWorkstationDto): Promise<WorkstationDocument> {
    // NE PAS permettre la modification du code
    if (updateWorkstationDto.code) {
      delete updateWorkstationDto.code;
    }

    // Mettre à jour la capacité hebdomadaire si les champs sont fournis
    if (
      updateWorkstationDto.monday_capacity !== undefined ||
      updateWorkstationDto.tuesday_capacity !== undefined ||
      updateWorkstationDto.wednesday_capacity !== undefined ||
      updateWorkstationDto.thursday_capacity !== undefined ||
      updateWorkstationDto.friday_capacity !== undefined ||
      updateWorkstationDto.saturday_capacity !== undefined ||
      updateWorkstationDto.sunday_capacity !== undefined
    ) {
      const workstation = await this.findOne(id);
      const weeklyCapacity = { ...workstation.weekly_capacity };
      
      if (updateWorkstationDto.monday_capacity !== undefined) {
        weeklyCapacity.monday = updateWorkstationDto.monday_capacity;
        delete updateWorkstationDto.monday_capacity;
      }
      if (updateWorkstationDto.tuesday_capacity !== undefined) {
        weeklyCapacity.tuesday = updateWorkstationDto.tuesday_capacity;
        delete updateWorkstationDto.tuesday_capacity;
      }
      if (updateWorkstationDto.wednesday_capacity !== undefined) {
        weeklyCapacity.wednesday = updateWorkstationDto.wednesday_capacity;
        delete updateWorkstationDto.wednesday_capacity;
      }
      if (updateWorkstationDto.thursday_capacity !== undefined) {
        weeklyCapacity.thursday = updateWorkstationDto.thursday_capacity;
        delete updateWorkstationDto.thursday_capacity;
      }
      if (updateWorkstationDto.friday_capacity !== undefined) {
        weeklyCapacity.friday = updateWorkstationDto.friday_capacity;
        delete updateWorkstationDto.friday_capacity;
      }
      if (updateWorkstationDto.saturday_capacity !== undefined) {
        weeklyCapacity.saturday = updateWorkstationDto.saturday_capacity;
        delete updateWorkstationDto.saturday_capacity;
      }
      if (updateWorkstationDto.sunday_capacity !== undefined) {
        weeklyCapacity.sunday = updateWorkstationDto.sunday_capacity;
        delete updateWorkstationDto.sunday_capacity;
      }

      // Mettre à jour avec la nouvelle capacité
      const updatedWorkstation = await this.workstationModel
        .findByIdAndUpdate(
          id,
          { ...updateWorkstationDto, weekly_capacity: weeklyCapacity },
          { new: true },
        )
        .exec();

      if (!updatedWorkstation) {
        throw new NotFoundException(`Poste de travail avec l'ID ${id} non trouvé`);
      }

      return updatedWorkstation;
    }

    // Mise à jour normale
    const workstation = await this.workstationModel
      .findByIdAndUpdate(id, updateWorkstationDto, { new: true })
      .exec();

    if (!workstation) {
      throw new NotFoundException(`Poste de travail avec l'ID ${id} non trouvé`);
    }

    return workstation;
  }

  async remove(id: string): Promise<void> {
    const workstation = await this.findOne(id);
    
    // Vérifier que le poste n'est pas utilisé dans des OFs en cours
    // TODO: Vérifier les OFs en cours
    
    const result = await this.workstationModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Poste de travail avec l'ID ${id} non trouvé`);
    }
  }

  async search(query: string): Promise<WorkstationDocument[]> {
    const regex = new RegExp(query, 'i');
    return this.workstationModel.find({
      $or: [
        { code: regex },
        { name: regex },
        { description: regex },
      ],
    }).limit(20).exec();
  }

  async getByDepartment(departmentId: string): Promise<WorkstationDocument[]> {
    return this.workstationModel.find({ department_id: departmentId }).sort({ code: 1 }).exec();
  }

  async getByType(type: string): Promise<WorkstationDocument[]> {
    return this.workstationModel.find({ type }).sort({ code: 1 }).exec();
  }

  async updateStatus(id: string, status: string): Promise<WorkstationDocument> {
    const validStatuses = ['active', 'maintenance', 'inactive', 'broken'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Statut invalide. Valeurs autorisées: ${validStatuses.join(', ')}`);
    }

    const workstation = await this.findOne(id);
    
    // Mettre à jour les dates de maintenance si nécessaire
    if (status === 'maintenance' && !workstation.last_maintenance_date) {
      workstation.last_maintenance_date = new Date();
    }

    if (status === 'active' && workstation.status === 'maintenance') {
      workstation.total_maintenance_hours += this.calculateMaintenanceHours(workstation);
    }

    workstation.status = status;
    
    return workstation.save();
  }

  async updateLoad(id: string, additionalLoad: number): Promise<WorkstationDocument> {
    const workstation = await this.findOne(id);
    
    // Vérifier la capacité disponible
    const availableCapacity = this.calculateAvailableCapacity(workstation);
    if (additionalLoad > availableCapacity) {
      throw new BadRequestException(
        `Charge supplémentaire (${additionalLoad}h) dépasse la capacité disponible (${availableCapacity}h)`,
      );
    }

    workstation.current_load += additionalLoad;
    
    return workstation.save();
  }

  async resetLoad(id: string): Promise<WorkstationDocument> {
    const workstation = await this.findOne(id);
    workstation.current_load = 0;
    
    return workstation.save();
  }

  async recordProduction(
    id: string,
    units: number,
    operatingHours: number,
    rejects: number = 0,
    scrap: number = 0,
  ): Promise<WorkstationDocument> {
    const workstation = await this.findOne(id);
    
    // Mettre à jour les statistiques
    workstation.total_production_units += units;
    workstation.total_operating_hours += operatingHours;
    workstation.total_rejects += rejects;
    workstation.total_scrap += scrap;
    
    // Recalculer les taux
    workstation.efficiency_rate = this.calculateEfficiencyRate(workstation);
    workstation.quality_rate = this.calculateQualityRate(workstation);
    
    return workstation.save();
  }

  async recordDowntime(id: string, downtimeHours: number): Promise<WorkstationDocument> {
    const workstation = await this.findOne(id);
    
    workstation.total_downtime_hours += downtimeHours;
    workstation.availability_rate = this.calculateAvailabilityRate(workstation);
    
    return workstation.save();
  }

  async recordMaintenance(id: string, maintenanceHours: number): Promise<WorkstationDocument> {
    const workstation = await this.findOne(id);
    
    workstation.total_maintenance_hours += maintenanceHours;
    workstation.last_maintenance_date = new Date();
    
    // Planifier la prochaine maintenance (par exemple dans 3 mois)
    const nextMaintenance = new Date();
    nextMaintenance.setMonth(nextMaintenance.getMonth() + 3);
    workstation.next_maintenance_date = nextMaintenance;
    
    return workstation.save();
  }

  async getStatistics(departmentId?: string): Promise<{
    total: number;
    active: number;
    maintenance: number;
    inactive: number;
    broken: number;
    totalCapacity: number;
    usedCapacity: number;
    availableCapacity: number;
    averageEfficiency: number;
    averageAvailability: number;
    averageQuality: number;
    byType: Record<string, number>;
  }> {
    const filter: any = {};
    if (departmentId) filter.department_id = departmentId;

    const workstations = await this.workstationModel.find(filter).exec();
    
    const byType: Record<string, number> = {};
    let active = 0;
    let maintenance = 0;
    let inactive = 0;
    let broken = 0;
    let totalCapacity = 0;
    let usedCapacity = 0;
    let totalEfficiency = 0;
    let totalAvailability = 0;
    let totalQuality = 0;

    workstations.forEach(workstation => {
      // Compter par statut
      switch (workstation.status) {
        case 'active': active++; break;
        case 'maintenance': maintenance++; break;
        case 'inactive': inactive++; break;
        case 'broken': broken++; break;
      }

      // Compter par type
      const type = workstation.type;
      byType[type] = (byType[type] || 0) + 1;

      // Calculer les capacités
      const workstationCapacity = this.calculateWeeklyCapacity(workstation);
      totalCapacity += workstationCapacity;
      usedCapacity += workstation.current_load;

      // Calculer les moyennes
      totalEfficiency += workstation.efficiency_rate;
      totalAvailability += workstation.availability_rate;
      totalQuality += workstation.quality_rate;
    });

    const availableCapacity = totalCapacity - usedCapacity;
    const averageEfficiency = workstations.length > 0 ? totalEfficiency / workstations.length : 0;
    const averageAvailability = workstations.length > 0 ? totalAvailability / workstations.length : 0;
    const averageQuality = workstations.length > 0 ? totalQuality / workstations.length : 0;

    return {
      total: workstations.length,
      active,
      maintenance,
      inactive,
      broken,
      totalCapacity,
      usedCapacity,
      availableCapacity,
      averageEfficiency,
      averageAvailability,
      averageQuality,
      byType,
    };
  }

  async getAvailableWorkstations(
    departmentId?: string,
    type?: string,
    requiredCapacity?: number,
  ): Promise<WorkstationDocument[]> {
    const filter: any = { status: 'active', is_active: true };
    if (departmentId) filter.department_id = departmentId;
    if (type) filter.type = type;

    const workstations = await this.workstationModel.find(filter).exec();
    
    // Filtrer par capacité disponible
    return workstations.filter(workstation => {
      const availableCapacity = this.calculateAvailableCapacity(workstation);
      return !requiredCapacity || availableCapacity >= requiredCapacity;
    });
  }

  async scheduleMaintenance(id: string, date: Date): Promise<WorkstationDocument> {
    const workstation = await this.findOne(id);
    
    workstation.maintenance_schedule = date;
    workstation.status = 'maintenance';
    
    return workstation.save();
  }

  async completeMaintenance(id: string, hours: number): Promise<WorkstationDocument> {
    const workstation = await this.findOne(id);
    
    workstation.last_maintenance_date = new Date();
    workstation.total_maintenance_hours += hours;
    workstation.status = 'active';
    
    // Planifier la prochaine maintenance
    const nextMaintenance = new Date();
    nextMaintenance.setMonth(nextMaintenance.getMonth() + 3);
    workstation.next_maintenance_date = nextMaintenance;
    
    return workstation.save();
  }

  // Méthodes utilitaires privées
  private calculateWeeklyCapacity(workstation: WorkstationDocument): number {
    const { weekly_capacity } = workstation;
    return (
      weekly_capacity.monday +
      weekly_capacity.tuesday +
      weekly_capacity.wednesday +
      weekly_capacity.thursday +
      weekly_capacity.friday +
      weekly_capacity.saturday +
      weekly_capacity.sunday
    );
  }

  private calculateAvailableCapacity(workstation: WorkstationDocument): number {
    const totalCapacity = this.calculateWeeklyCapacity(workstation);
    return totalCapacity - workstation.current_load;
  }

  private calculateEfficiencyRate(workstation: WorkstationDocument): number {
    if (workstation.total_operating_hours === 0) return 0;
    
    const plannedProductionTime = workstation.total_operating_hours + workstation.total_downtime_hours;
    return (workstation.total_operating_hours / plannedProductionTime) * 100;
  }

  private calculateAvailabilityRate(workstation: WorkstationDocument): number {
    const totalTime = workstation.total_operating_hours + workstation.total_downtime_hours + workstation.total_maintenance_hours;
    if (totalTime === 0) return 0;
    
    return (workstation.total_operating_hours / totalTime) * 100;
  }

  private calculateQualityRate(workstation: WorkstationDocument): number {
    if (workstation.total_production_units === 0) return 0;
    
    const goodUnits = workstation.total_production_units - workstation.total_rejects - workstation.total_scrap;
    return (goodUnits / workstation.total_production_units) * 100;
  }

  private calculateMaintenanceHours(workstation: WorkstationDocument): number {
    if (!workstation.last_maintenance_date) return 0;
    
    const now = new Date();
    const lastMaintenance = new Date(workstation.last_maintenance_date);
    const diffHours = (now.getTime() - lastMaintenance.getTime()) / (1000 * 60 * 60);
    
    return Math.max(0, diffHours);
  }
}
