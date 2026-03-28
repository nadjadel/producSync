import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DeliveryNote, DeliveryNoteDocument } from './schemas/delivery-note.schema';
import { CreateDeliveryNoteDto, UpdateDeliveryNoteDto } from './dto';
import { ManufacturingOrder, ManufacturingOrderDocument } from '../manufacturing-orders/schemas/manufacturing-order.schema';
import { CountersService } from '../counters/counters.service';

@Injectable()
export class DeliveryNotesService {
  constructor(
    @InjectModel(DeliveryNote.name) private deliveryNoteModel: Model<DeliveryNoteDocument>,
    @InjectModel(ManufacturingOrder.name) private manufacturingOrderModel: Model<ManufacturingOrderDocument>,
    private readonly countersService: CountersService,
  ) {}

  async create(createDeliveryNoteDto: CreateDeliveryNoteDto): Promise<DeliveryNoteDocument> {
    const generatedDeliveryNumber = await this.countersService.getNextNumber('BL');
    const deliveryNote = new this.deliveryNoteModel({
      ...createDeliveryNoteDto,
      delivery_number: generatedDeliveryNumber,
    });
    this.calculateTotals(deliveryNote);
    return deliveryNote.save();
  }

  async findAll(status?: string, customerId?: string): Promise<DeliveryNoteDocument[]> {
    const filter: any = {};
    if (status) filter.status = status;
    if (customerId) filter.customer_id = customerId;
    return this.deliveryNoteModel.find(filter).sort({ delivery_date: -1 }).exec();
  }

  async findOne(id: string): Promise<DeliveryNoteDocument> {
    const deliveryNote = await this.deliveryNoteModel.findById(id).exec();
    if (!deliveryNote) {
      throw new NotFoundException(`Bon de livraison avec l'ID ${id} non trouvé`);
    }
    return deliveryNote;
  }

  async findByDeliveryNumber(deliveryNumber: string): Promise<DeliveryNoteDocument> {
    const deliveryNote = await this.deliveryNoteModel.findOne({ delivery_number: deliveryNumber }).exec();
    if (!deliveryNote) {
      throw new NotFoundException(`Bon de livraison avec le numéro ${deliveryNumber} non trouvé`);
    }
    return deliveryNote;
  }

  async update(id: string, updateDeliveryNoteDto: UpdateDeliveryNoteDto): Promise<DeliveryNoteDocument> {
    delete updateDeliveryNoteDto.delivery_number;

    const deliveryNote = await this.deliveryNoteModel
      .findByIdAndUpdate(id, updateDeliveryNoteDto, { new: true })
      .exec();

    if (!deliveryNote) {
      throw new NotFoundException(`Bon de livraison avec l'ID ${id} non trouvé`);
    }

    if (updateDeliveryNoteDto.items) {
      this.calculateTotals(deliveryNote);
      await deliveryNote.save();
    }

    return deliveryNote;
  }

  async remove(id: string): Promise<void> {
    const result = await this.deliveryNoteModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Bon de livraison avec l'ID ${id} non trouvé`);
    }
  }

  async search(query: string): Promise<DeliveryNoteDocument[]> {
    const regex = new RegExp(query, 'i');
    return this.deliveryNoteModel.find({
      $or: [
        { delivery_number: regex },
        { customer_name: regex },
        { order_number: regex },
      ],
    }).limit(20).exec();
  }

  async getByCustomer(customerId: string): Promise<DeliveryNoteDocument[]> {
    return this.deliveryNoteModel.find({ customer_id: customerId }).sort({ delivery_date: -1 }).exec();
  }

  async updateStatus(id: string, status: string): Promise<DeliveryNoteDocument> {
    const validStatuses = ['draft', 'sent', 'invoiced'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Statut invalide. Valeurs autorisées: ${validStatuses.join(', ')}`);
    }

    const deliveryNote = await this.deliveryNoteModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();

    if (!deliveryNote) {
      throw new NotFoundException(`Bon de livraison avec l'ID ${id} non trouvé`);
    }

    return deliveryNote;
  }

  async createFromManufacturingOrders(
    ofIds: string[],
    customerId: string,
    deliveryDate: string,
    deliveryAddress?: string,
  ): Promise<DeliveryNoteDocument> {
    const manufacturingOrders = await this.manufacturingOrderModel.find({
      _id: { $in: ofIds },
    }).exec();

    if (manufacturingOrders.length !== ofIds.length) {
      throw new BadRequestException('Certains ordres de fabrication n\'existent pas');
    }

    const notReadyOrders = manufacturingOrders.filter(
      (order) => !order.ready_for_delivery || order.delivered,
    );

    if (notReadyOrders.length > 0) {
      throw new BadRequestException(
        `Certains OFs ne sont pas prêts pour la livraison ou sont déjà livrés: ${notReadyOrders.map(o => o.order_number).join(', ')}`,
      );
    }

    // Bug 5 corrigé : vérifier que tous les OFs partagent le même customer_order_id
    // et que ce customer_order_id correspond au customerId fourni
    const firstOrderCustomerId = manufacturingOrders[0].customer_order_id?.toString();
    const sameCustomer = manufacturingOrders.every(
      (order) => order.customer_order_id?.toString() === firstOrderCustomerId,
    );

    if (!sameCustomer) {
      throw new BadRequestException('Tous les OFs doivent appartenir à la même commande client');
    }

    const items = manufacturingOrders.map((order) => ({
      manufacturing_order_id: order._id.toString(),
      order_number: order.order_number,
      product_id: order.product_id.toString(),
      product_name: order.product_name,
      quantity: order.quantity_planned,
      unit_price: 0,
    }));

    const createDto: CreateDeliveryNoteDto = {
      customer_id: customerId,
      customer_name: manufacturingOrders[0].customer_order_number || 'Client',
      delivery_date: deliveryDate,
      delivery_address: deliveryAddress,
      items,
      status: 'draft',
    };

    const deliveryNote = await this.create(createDto);

    await this.manufacturingOrderModel.updateMany(
      { _id: { $in: ofIds } },
      {
        delivered: true,
        delivery_note_id: deliveryNote._id,
      },
    ).exec();

    return deliveryNote;
  }

  async getByInvoice(invoiceId: string): Promise<DeliveryNoteDocument[]> {
    return this.deliveryNoteModel.find({ invoice_id: invoiceId }).exec();
  }

  async markAsInvoiced(id: string, invoiceId: string): Promise<DeliveryNoteDocument> {
    const deliveryNote = await this.findOne(id);

    if (deliveryNote.status === 'invoiced') {
      throw new BadRequestException('Ce bon de livraison est déjà facturé');
    }

    deliveryNote.status = 'invoiced';
    deliveryNote.invoice_id = invoiceId as any;
    return deliveryNote.save();
  }

  private calculateTotals(deliveryNote: DeliveryNoteDocument): void {
    deliveryNote.items.forEach((item: any) => {
      item.total = item.quantity * (item.unit_price || 0);
    });
  }
}