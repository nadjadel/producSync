import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ManufacturingOrder, ManufacturingOrderDocument } from './schemas/manufacturing-order.schema';
import { CreateManufacturingOrderDto, UpdateManufacturingOrderDto } from './dto';
import { CountersService } from '../counters/counters.service';

@Injectable()
export class ManufacturingOrdersService {
  constructor(
    @InjectModel(ManufacturingOrder.name) private manufacturingOrderModel: Model<ManufacturingOrderDocument>,
    private readonly countersService: CountersService,
  ) {}

  // Bug 7 corrigé : génération automatique du order_number via CountersService
  async create(createManufacturingOrderDto: CreateManufacturingOrderDto): Promise<ManufacturingOrderDocument> {
    const order_number = createManufacturingOrderDto.order_number
      ?? await this.countersService.getNextNumber('OF');

    const manufacturingOrder = new this.manufacturingOrderModel({
      ...createManufacturingOrderDto,
      order_number,
    });
    return manufacturingOrder.save();
  }

  async findAll(status?: string, customerOrderId?: string): Promise<ManufacturingOrderDocument[]> {
    const filter: any = {};
    if (status) filter.status = status;
    if (customerOrderId) filter.customer_order_id = customerOrderId;
    return this.manufacturingOrderModel.find(filter).sort({ planned_start: 1 }).exec();
  }

  async findOne(id: string): Promise<ManufacturingOrderDocument> {
    const manufacturingOrder = await this.manufacturingOrderModel.findById(id).exec();
    if (!manufacturingOrder) {
      throw new NotFoundException(`Ordre de fabrication avec l'ID ${id} non trouvé`);
    }
    return manufacturingOrder;
  }

  async findByOrderNumber(orderNumber: string): Promise<ManufacturingOrderDocument> {
    const manufacturingOrder = await this.manufacturingOrderModel.findOne({ order_number: orderNumber }).exec();
    if (!manufacturingOrder) {
      throw new NotFoundException(`Ordre de fabrication avec le numéro ${orderNumber} non trouvé`);
    }
    return manufacturingOrder;
  }

  async update(id: string, updateManufacturingOrderDto: UpdateManufacturingOrderDto): Promise<ManufacturingOrderDocument> {
    if (updateManufacturingOrderDto.order_number) {
      const existingOrder = await this.manufacturingOrderModel.findOne({
        order_number: updateManufacturingOrderDto.order_number,
        _id: { $ne: id },
      }).exec();
      if (existingOrder) {
        throw new ConflictException('Un ordre de fabrication avec ce numéro existe déjà');
      }
    }

    const manufacturingOrder = await this.manufacturingOrderModel
      .findByIdAndUpdate(id, updateManufacturingOrderDto, { new: true })
      .exec();

    if (!manufacturingOrder) {
      throw new NotFoundException(`Ordre de fabrication avec l'ID ${id} non trouvé`);
    }

    return manufacturingOrder;
  }

  async remove(id: string): Promise<void> {
    const result = await this.manufacturingOrderModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Ordre de fabrication avec l'ID ${id} non trouvé`);
    }
  }

  async search(query: string): Promise<ManufacturingOrderDocument[]> {
    const regex = new RegExp(query, 'i');
    return this.manufacturingOrderModel.find({
      $or: [
        { order_number: regex },
        { customer_order_number: regex },
        { product_name: regex },
      ],
    }).limit(20).exec();
  }

  async getByCustomerOrder(customerOrderId: string): Promise<ManufacturingOrderDocument[]> {
    return this.manufacturingOrderModel.find({ customer_order_id: customerOrderId }).exec();
  }

  async updateStatus(id: string, status: string): Promise<ManufacturingOrderDocument> {
    const validStatuses = ['draft', 'planned', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Statut invalide. Valeurs autorisées: ${validStatuses.join(', ')}`);
    }

    const manufacturingOrder = await this.manufacturingOrderModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();

    if (!manufacturingOrder) {
      throw new NotFoundException(`Ordre de fabrication avec l'ID ${id} non trouvé`);
    }

    return manufacturingOrder;
  }

  async updateProgress(id: string, quantityProduced: number): Promise<ManufacturingOrderDocument> {
    const manufacturingOrder = await this.findOne(id);

    if (quantityProduced < 0 || quantityProduced > manufacturingOrder.quantity_planned) {
      throw new BadRequestException(`Quantité produite invalide. Doit être entre 0 et ${manufacturingOrder.quantity_planned}`);
    }

    manufacturingOrder.quantity_produced = quantityProduced;

    if (quantityProduced >= manufacturingOrder.quantity_planned) {
      manufacturingOrder.status = 'completed';
      manufacturingOrder.ready_for_delivery = true;
      manufacturingOrder.actual_end = new Date();
    } else if (quantityProduced > 0 && manufacturingOrder.status === 'planned') {
      manufacturingOrder.status = 'in_progress';
      if (!manufacturingOrder.actual_start) {
        manufacturingOrder.actual_start = new Date();
      }
    }

    return manufacturingOrder.save();
  }

  async getReadyForDelivery(): Promise<ManufacturingOrderDocument[]> {
    return this.manufacturingOrderModel.find({
      ready_for_delivery: true,
      delivered: false,
    }).exec();
  }

  async markAsDelivered(id: string, deliveryNoteId?: string): Promise<ManufacturingOrderDocument> {
    const manufacturingOrder = await this.findOne(id);

    if (!manufacturingOrder.ready_for_delivery) {
      throw new BadRequestException('Cet OF n\'est pas prêt pour la livraison');
    }

    manufacturingOrder.delivered = true;
    if (deliveryNoteId) {
      manufacturingOrder.delivery_note_id = deliveryNoteId as any;
    }

    return manufacturingOrder.save();
  }

  async getSubcontractedOrders(): Promise<ManufacturingOrderDocument[]> {
    return this.manufacturingOrderModel.find({ is_subcontracted: true }).exec();
  }

  async getByWorkstation(workstationId: string): Promise<ManufacturingOrderDocument[]> {
    return this.manufacturingOrderModel.find({ workstation_id: workstationId }).exec();
  }
}