import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invoice, InvoiceDocument } from './schemas/invoice.schema';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto';
import { DeliveryNote, DeliveryNoteDocument } from '../delivery-notes/schemas/delivery-note.schema';
import { Customer, CustomerDocument } from '../customers/schemas/customer.schema';
import { CountersService } from '../counters/counters.service';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
    @InjectModel(DeliveryNote.name) private deliveryNoteModel: Model<DeliveryNoteDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    private readonly countersService: CountersService,
  ) {}

  private calculateTotals(invoice: InvoiceDocument): void {
    if (invoice.items && invoice.items.length > 0) {
      invoice.total_ht = invoice.items.reduce((sum, item) => sum + (item.total_ht || 0), 0);
      invoice.total_vat = invoice.items.reduce(
        (sum, item) => sum + ((item.total_ht || 0) * (item.vat_rate || 0) / 100),
        0,
      );
      invoice.total_ttc = invoice.total_ht + invoice.total_vat;
    }
  }

  async create(createInvoiceDto: CreateInvoiceDto): Promise<InvoiceDocument> {
    const existingInvoice = await this.invoiceModel.findOne({
      invoice_number: createInvoiceDto.invoice_number,
    }).exec();

    if (existingInvoice) {
      throw new ConflictException('Une facture avec ce numéro existe déjà');
    }

    const invoice = new this.invoiceModel(createInvoiceDto);
    this.calculateTotals(invoice);
    return invoice.save();
  }

  async findAll(status?: string, customerId?: string): Promise<InvoiceDocument[]> {
    const filter: any = {};
    if (status) filter.status = status;
    if (customerId) filter.customer_id = customerId;
    return this.invoiceModel.find(filter).sort({ invoice_date: -1 }).exec();
  }

  async findOne(id: string): Promise<InvoiceDocument> {
    const invoice = await this.invoiceModel.findById(id).exec();
    if (!invoice) {
      throw new NotFoundException(`Facture avec l'ID ${id} non trouvée`);
    }
    return invoice;
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<InvoiceDocument> {
    const invoice = await this.invoiceModel.findOne({ invoice_number: invoiceNumber }).exec();
    if (!invoice) {
      throw new NotFoundException(`Facture avec le numéro ${invoiceNumber} non trouvée`);
    }
    return invoice;
  }

  async update(id: string, updateInvoiceDto: UpdateInvoiceDto): Promise<InvoiceDocument> {
    if (updateInvoiceDto.invoice_number) {
      const existingInvoice = await this.invoiceModel.findOne({
        invoice_number: updateInvoiceDto.invoice_number,
        _id: { $ne: id },
      }).exec();
      if (existingInvoice) {
        throw new ConflictException('Une facture avec ce numéro existe déjà');
      }
    }

    const invoice = await this.invoiceModel
      .findByIdAndUpdate(id, updateInvoiceDto, { new: true })
      .exec();

    if (!invoice) {
      throw new NotFoundException(`Facture avec l'ID ${id} non trouvée`);
    }

    if (updateInvoiceDto.items) {
      this.calculateTotals(invoice);
      await invoice.save();
    }

    return invoice;
  }

  async remove(id: string): Promise<void> {
    const result = await this.invoiceModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Facture avec l'ID ${id} non trouvée`);
    }
  }

  async search(query: string): Promise<InvoiceDocument[]> {
    const regex = new RegExp(query, 'i');
    return this.invoiceModel.find({
      $or: [
        { invoice_number: regex },
        { customer_name: regex },
      ],
    }).limit(20).exec();
  }

  async getByCustomer(customerId: string): Promise<InvoiceDocument[]> {
    return this.invoiceModel.find({ customer_id: customerId }).sort({ invoice_date: -1 }).exec();
  }

  async updateStatus(id: string, status: string): Promise<InvoiceDocument> {
    const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Statut invalide. Valeurs autorisées: ${validStatuses.join(', ')}`);
    }

    const invoice = await this.invoiceModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();

    if (!invoice) {
      throw new NotFoundException(`Facture avec l'ID ${id} non trouvée`);
    }

    return invoice;
  }

  async markAsPaid(id: string, paymentDate: string): Promise<InvoiceDocument> {
    const invoice = await this.findOne(id);

    if (invoice.status === 'paid') {
      throw new BadRequestException('Cette facture est déjà payée');
    }

    invoice.status = 'paid';
    invoice.payment_date = new Date(paymentDate);
    return invoice.save();
  }

  async createFromDeliveryNotes(
    blIds: string[],
    customerId: string,
    invoiceDate: string,
  ): Promise<InvoiceDocument> {
    const deliveryNotes = await this.deliveryNoteModel.find({
      _id: { $in: blIds },
    }).exec();

    if (deliveryNotes.length !== blIds.length) {
      throw new BadRequestException('Certains bons de livraison n\'existent pas');
    }

    const alreadyInvoicedNotes = deliveryNotes.filter(
      (note) => note.status === 'invoiced',
    );

    if (alreadyInvoicedNotes.length > 0) {
      throw new BadRequestException(
        `Certains BLs sont déjà facturés: ${alreadyInvoicedNotes.map(n => n.delivery_number).join(', ')}`,
      );
    }

    const noteCustomerId = deliveryNotes[0].customer_id;
    const sameCustomer = deliveryNotes.every(
      (note) => note.customer_id?.toString() === noteCustomerId?.toString(),
    );

    if (!sameCustomer) {
      throw new BadRequestException('Tous les BLs doivent appartenir au même client');
    }

    const customer = await this.customerModel.findById(customerId).exec();
    if (!customer) {
      throw new BadRequestException('Client non trouvé');
    }

    const items = deliveryNotes.flatMap((note) =>
      note.items.map((item) => ({
        description: `Produit: ${item.product_name} - BL ${note.delivery_number}`,
        quantity: item.quantity,
        unit_price: item.unit_price || 0,
        total_ht: item.total || 0,
        vat_rate: 20,
      })),
    );

    const total_ht = items.reduce((sum, item) => sum + item.total_ht, 0);
    const total_vat = items.reduce((sum, item) => sum + (item.total_ht * item.vat_rate / 100), 0);
    const total_ttc = total_ht + total_vat;

    const invoiceDateObj = new Date(invoiceDate);
    const dueDate = new Date(invoiceDateObj);
    dueDate.setDate(dueDate.getDate() + 30);

    // Bug 4 corrigé : utilisation de CountersService au lieu de Date.now()
    const invoiceNumber = await this.countersService.getNextNumber('FA');

    const createDto: CreateInvoiceDto = {
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      customer_id: customerId,
      customer_name: customer.company_name,
      customer_address: customer.address,
      customer_siret: customer.siret,
      customer_vat_number: customer.vat_number,
      status: 'draft',
      payment_terms: '30 jours',
      due_date: dueDate.toISOString().split('T')[0],
      delivery_notes: deliveryNotes.map((note) => ({
        delivery_note_id: note._id.toString(),
        delivery_number: note.delivery_number,
        delivery_date: note.delivery_date.toISOString().split('T')[0],
      })),
      items,
      total_ht,
      total_vat,
      total_ttc,
    };

    const invoice = await this.create(createDto);

    await this.deliveryNoteModel.updateMany(
      { _id: { $in: blIds } },
      {
        status: 'invoiced',
        invoice_id: invoice._id,
      },
    ).exec();

    return invoice;
  }

  // Bug 9 corrigé : mise à jour du statut + inclusion des factures déjà overdue
  async getOverdueInvoices(): Promise<InvoiceDocument[]> {
    const today = new Date();

    // Mettre à jour les factures 'sent' dont la date d'échéance est dépassée
    await this.invoiceModel.updateMany(
      { status: 'sent', due_date: { $lt: today } },
      { $set: { status: 'overdue' } },
    ).exec();

    // Retourner toutes les factures overdue
    return this.invoiceModel.find({ status: 'overdue' }).sort({ due_date: 1 }).exec();
  }

  async getByDeliveryNote(deliveryNoteId: string): Promise<InvoiceDocument[]> {
    const allInvoices = await this.invoiceModel.find().exec();
    return allInvoices.filter(invoice =>
      invoice.delivery_notes?.some(
        note => note.delivery_note_id?.toString() === deliveryNoteId,
      ),
    );
  }
}