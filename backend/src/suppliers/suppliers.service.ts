import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Supplier, SupplierDocument } from './schemas/supplier.schema';
import { CreateSupplierDto, UpdateSupplierDto } from './dto';
import { CountersService } from '../counters/counters.service';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectModel(Supplier.name) private supplierModel: Model<SupplierDocument>,
    private readonly countersService: CountersService,
  ) {}

  async create(createSupplierDto: CreateSupplierDto): Promise<SupplierDocument> {
    // TOUJOURS générer un code automatiquement, ignorer le code fourni par l'utilisateur
    const generatedCode = await this.countersService.getNextNumber('SUPPLIER');
    
    // Vérifier l'unicité du code (au cas où)
    const existingSupplier = await this.supplierModel.findOne({
      code: generatedCode,
    }).exec();

    if (existingSupplier) {
      throw new ConflictException(`Le code ${generatedCode} est déjà utilisé`);
    }

    // Vérifier l'unicité de l'email
    const existingEmail = await this.supplierModel.findOne({
      email: createSupplierDto.email,
    }).exec();

    if (existingEmail) {
      throw new ConflictException('Un fournisseur avec cet email existe déjà');
    }

    // Créer le fournisseur avec le code généré automatiquement
    const supplier = new this.supplierModel({
      ...createSupplierDto,
      code: generatedCode, // Toujours utiliser le code généré
    });
    
    return supplier.save();
  }

  async findAll(status?: string, speciality?: string): Promise<SupplierDocument[]> {
    const filter: any = {};
    if (status) filter.status = status;
    if (speciality) filter.speciality = speciality;
    return this.supplierModel.find(filter).sort({ company_name: 1 }).exec();
  }

  async findOne(id: string): Promise<SupplierDocument> {
    const supplier = await this.supplierModel.findById(id).exec();
    if (!supplier) {
      throw new NotFoundException(`Fournisseur avec l'ID ${id} non trouvé`);
    }
    return supplier;
  }

  async findByCode(code: string): Promise<SupplierDocument> {
    const supplier = await this.supplierModel.findOne({ code }).exec();
    if (!supplier) {
      throw new NotFoundException(`Fournisseur avec le code ${code} non trouvé`);
    }
    return supplier;
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto): Promise<SupplierDocument> {
    // NE PAS permettre la modification du code
    if (updateSupplierDto.code) {
      delete updateSupplierDto.code; // Supprimer le code de la mise à jour
    }

    if (updateSupplierDto.email) {
      const existingEmail = await this.supplierModel.findOne({
        email: updateSupplierDto.email,
        _id: { $ne: id },
      }).exec();
      if (existingEmail) {
        throw new ConflictException('Un fournisseur avec cet email existe déjà');
      }
    }

    const supplier = await this.supplierModel
      .findByIdAndUpdate(id, updateSupplierDto, { new: true })
      .exec();

    if (!supplier) {
      throw new NotFoundException(`Fournisseur avec l'ID ${id} non trouvé`);
    }

    return supplier;
  }

  async remove(id: string): Promise<void> {
    const result = await this.supplierModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Fournisseur avec l'ID ${id} non trouvé`);
    }
  }

  async search(query: string): Promise<SupplierDocument[]> {
    const regex = new RegExp(query, 'i');
    return this.supplierModel.find({
      $or: [
        { code: regex },
        { company_name: regex },
        { contact_name: regex },
        { email: regex },
        { speciality: regex },
      ],
    }).limit(20).exec();
  }

  async updateStatus(id: string, status: string): Promise<SupplierDocument> {
    const validStatuses = ['active', 'inactive'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Statut invalide. Valeurs autorisées: ${validStatuses.join(', ')}`);
    }

    const supplier = await this.supplierModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();

    if (!supplier) {
      throw new NotFoundException(`Fournisseur avec l'ID ${id} non trouvé`);
    }

    return supplier;
  }

  async getBySpeciality(speciality: string): Promise<SupplierDocument[]> {
    return this.supplierModel.find({ speciality }).sort({ company_name: 1 }).exec();
  }

  async getActiveSuppliers(): Promise<SupplierDocument[]> {
    return this.supplierModel.find({ status: 'active' }).sort({ company_name: 1 }).exec();
  }

  async getSuppliersWithCertifications(certifications: string[]): Promise<SupplierDocument[]> {
    return this.supplierModel.find({
      certifications: { $in: certifications },
    }).exec();
  }

  async updateReliabilityScore(id: string, score: number): Promise<SupplierDocument> {
    if (score < 0 || score > 5) {
      throw new BadRequestException('Le score de fiabilité doit être entre 0 et 5');
    }

    const supplier = await this.supplierModel
      .findByIdAndUpdate(id, { reliability_score: score }, { new: true })
      .exec();

    if (!supplier) {
      throw new NotFoundException(`Fournisseur avec l'ID ${id} non trouvé`);
    }

    return supplier;
  }

  async incrementOrderCount(id: string, amount: number): Promise<SupplierDocument> {
    const supplier = await this.findOne(id);
    
    supplier.order_count += 1;
    supplier.last_purchase_date = new Date();
    supplier.total_purchase_amount = (supplier.total_purchase_amount || 0) + amount;
    
    return supplier.save();
  }

  async updateDeliveryTime(id: string, deliveryTime: number): Promise<SupplierDocument> {
    const supplier = await this.findOne(id);
    
    if (!supplier.average_delivery_time) {
      supplier.average_delivery_time = deliveryTime;
    } else {
      // Calculer la moyenne pondérée
      const currentAverage = supplier.average_delivery_time;
      const orderCount = supplier.order_count;
      supplier.average_delivery_time = (currentAverage * orderCount + deliveryTime) / (orderCount + 1);
    }
    
    return supplier.save();
  }

  async updateSatisfactionRate(id: string, rate: number): Promise<SupplierDocument> {
    if (rate < 0 || rate > 100) {
      throw new BadRequestException('Le taux de satisfaction doit être entre 0 et 100');
    }

    const supplier = await this.findOne(id);
    
    if (!supplier.satisfaction_rate) {
      supplier.satisfaction_rate = rate;
    } else {
      // Calculer la moyenne pondérée
      const currentRate = supplier.satisfaction_rate;
      const orderCount = supplier.order_count;
      supplier.satisfaction_rate = (currentRate * orderCount + rate) / (orderCount + 1);
    }
    
    return supplier.save();
  }

  async getTopSuppliers(limit: number = 10): Promise<SupplierDocument[]> {
    return this.supplierModel.find({ status: 'active' })
      .sort({ reliability_score: -1, order_count: -1 })
      .limit(limit)
      .exec();
  }

  async getSuppliersByProductCategory(category: string): Promise<SupplierDocument[]> {
    return this.supplierModel.find({
      product_categories: category,
      status: 'active',
    }).sort({ reliability_score: -1 }).exec();
  }

  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    bySpeciality: Record<string, number>;
    averageReliability: number;
    totalOrders: number;
  }> {
    const allSuppliers = await this.supplierModel.find().exec();
    
    const bySpeciality: Record<string, number> = {};
    let totalReliability = 0;
    let totalOrders = 0;
    let activeCount = 0;
    let inactiveCount = 0;

    allSuppliers.forEach((supplier: SupplierDocument) => {
      if (supplier.status === 'active') activeCount++;
      else inactiveCount++;

      if (supplier.speciality) {
        bySpeciality[supplier.speciality] = (bySpeciality[supplier.speciality] || 0) + 1;
      }

      totalReliability += supplier.reliability_score || 0;
      totalOrders += supplier.order_count || 0;
    });

    return {
      total: allSuppliers.length,
      active: activeCount,
      inactive: inactiveCount,
      bySpeciality,
      averageReliability: allSuppliers.length > 0 ? totalReliability / allSuppliers.length : 0,
      totalOrders,
    };
  }

  async addCertification(id: string, certification: string): Promise<SupplierDocument> {
    const supplier = await this.findOne(id);
    
    if (!supplier.certifications) {
      supplier.certifications = [certification];
    } else if (!supplier.certifications.includes(certification)) {
      supplier.certifications.push(certification);
    }
    
    return supplier.save();
  }

  async removeCertification(id: string, certification: string): Promise<SupplierDocument> {
    const supplier = await this.findOne(id);
    
    if (supplier.certifications) {
      supplier.certifications = supplier.certifications.filter((c: string) => c !== certification);
    }
    
    return supplier.save();
  }

  async addProductCategory(id: string, category: string): Promise<SupplierDocument> {
    const supplier = await this.findOne(id);
    
    if (!supplier.product_categories) {
      supplier.product_categories = [category];
    } else if (!supplier.product_categories.includes(category)) {
      supplier.product_categories.push(category);
    }
    
    return supplier.save();
  }

  async removeProductCategory(id: string, category: string): Promise<SupplierDocument> {
    const supplier = await this.findOne(id);
    
    if (supplier.product_categories) {
      supplier.product_categories = supplier.product_categories.filter((c: string) => c !== category);
    }
    
    return supplier.save();
  }
}
