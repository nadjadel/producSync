import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { CreateOrderDto, UpdateOrderDto } from './dto';
import { CountersService } from '../counters/counters.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private readonly countersService: CountersService,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<OrderDocument> {
    // TOUJOURS générer un numéro de commande automatiquement
    const generatedOrderNumber = await this.countersService.getNextNumber('CO');
    
    // Vérifier l'unicité du numéro (au cas où)
    const existingOrder = await this.orderModel.findOne({
      order_number: generatedOrderNumber,
    }).exec();

    if (existingOrder) {
      throw new ConflictException(`Le numéro de commande ${generatedOrderNumber} est déjà utilisé`);
    }

    // Créer la commande avec le numéro généré automatiquement
    const order = new this.orderModel({
      ...createOrderDto,
      order_number: generatedOrderNumber, // Toujours utiliser le numéro généré
    });
    
    // Calculer les totaux
    this.calculateTotals(order);
    
    return order.save();
  }

  async findAll(status?: string, customerId?: string): Promise<OrderDocument[]> {
    const filter: any = {};
    if (status) filter.status = status;
    if (customerId) filter.customer_id = customerId;
    return this.orderModel.find(filter).sort({ order_date: -1 }).exec();
  }

  async findOne(id: string): Promise<OrderDocument> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException(`Commande avec l'ID ${id} non trouvée`);
    }
    return order;
  }

  async findByOrderNumber(orderNumber: string): Promise<OrderDocument> {
    const order = await this.orderModel.findOne({ order_number: orderNumber }).exec();
    if (!order) {
      throw new NotFoundException(`Commande avec le numéro ${orderNumber} non trouvée`);
    }
    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<OrderDocument> {
    // NE PAS permettre la modification du numéro de commande
    if (updateOrderDto.order_number) {
      delete updateOrderDto.order_number; // Supprimer le numéro de la mise à jour
    }

    const order = await this.orderModel
      .findByIdAndUpdate(id, updateOrderDto, { new: true })
      .exec();

    if (!order) {
      throw new NotFoundException(`Commande avec l'ID ${id} non trouvée`);
    }

    // Recalculer les totaux si les items ont changé
    if (updateOrderDto.items) {
      this.calculateTotals(order);
      await order.save();
    }

    return order;
  }

  async remove(id: string): Promise<void> {
    const result = await this.orderModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Commande avec l'ID ${id} non trouvée`);
    }
  }

  async search(query: string): Promise<OrderDocument[]> {
    const regex = new RegExp(query, 'i');
    return this.orderModel.find({
      $or: [
        { order_number: regex },
        { customer_name: regex },
      ],
    }).limit(20).exec();
  }

  async getByCustomer(customerId: string): Promise<OrderDocument[]> {
    return this.orderModel.find({ customer_id: customerId }).sort({ order_date: -1 }).exec();
  }

  async updateStatus(id: string, status: string): Promise<OrderDocument> {
    const validStatuses = ['draft', 'confirmed', 'in_production', 'ready', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Statut invalide. Valeurs autorisées: ${validStatuses.join(', ')}`);
    }

    const order = await this.orderModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();

    if (!order) {
      throw new NotFoundException(`Commande avec l'ID ${id} non trouvée`);
    }

    return order;
  }

  private calculateTotals(order: OrderDocument): void {
    let totalHT = 0;
    
    order.items.forEach((item: any) => {
      item.total = item.quantity * (item.unit_price || 0);
      totalHT += item.total;
    });

    order.total_ht = totalHT;
    order.total_vat = (totalHT * order.vat_rate) / 100;
    order.total_ttc = totalHT + order.total_vat;
  }
}
