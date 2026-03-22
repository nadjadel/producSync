import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreditNote, CreditNoteDocument } from './schemas/credit-note.schema';
import { CreateCreditNoteDto, UpdateCreditNoteDto } from './dto';
import { CountersService } from '../counters/counters.service';
import { Invoice, InvoiceDocument } from '../invoices/schemas/invoice.schema';

@Injectable()
export class CreditNotesService {
  constructor(
    @InjectModel(CreditNote.name) private creditNoteModel: Model<CreditNoteDocument>,
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
    private readonly countersService: CountersService,
  ) {}

  async create(createCreditNoteDto: CreateCreditNoteDto): Promise<CreditNoteDocument> {
    // TOUJOURS générer un numéro d'avoir automatiquement
    const generatedCreditNoteNumber = await this.countersService.getNextNumber('AV');
    
    // Vérifier l'unicité du numéro
    const existingCreditNote = await this.creditNoteModel.findOne({
      credit_note_number: generatedCreditNoteNumber,
    }).exec();

    if (existingCreditNote) {
      throw new ConflictException(`Le numéro d'avoir ${generatedCreditNoteNumber} est déjà utilisé`);
    }

    // Vérifier que la facture existe
    const invoice = await this.invoiceModel.findById(createCreditNoteDto.invoice_id).exec();
    if (!invoice) {
      throw new NotFoundException(`Facture avec l'ID ${createCreditNoteDto.invoice_id} non trouvée`);
    }

    // Vérifier que le montant de l'avoir ne dépasse pas le montant de la facture
    if (createCreditNoteDto.total_with_vat > invoice.total_ttc) {
      throw new BadRequestException(
        `Le montant de l'avoir (${createCreditNoteDto.total_with_vat}) dépasse le montant de la facture (${invoice.total_ttc})`,
      );
    }

    // Calculer le montant restant
    const remainingAmount = createCreditNoteDto.total_with_vat;
    const isFullyApplied = false;

    // Créer l'avoir avec le numéro généré automatiquement
    const creditNote = new this.creditNoteModel({
      ...createCreditNoteDto,
      credit_note_number: generatedCreditNoteNumber, // Toujours utiliser le numéro généré
      remaining_amount: remainingAmount,
      is_fully_applied: isFullyApplied,
    });
    
    return creditNote.save();
  }

  async findAll(
    status?: string,
    customerId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<CreditNoteDocument[]> {
    const filter: any = {};
    if (status) filter.status = status;
    if (customerId) filter.customer_id = customerId;
    if (startDate || endDate) {
      filter.credit_note_date = {};
      if (startDate) filter.credit_note_date.$gte = startDate;
      if (endDate) filter.credit_note_date.$lte = endDate;
    }
    return this.creditNoteModel.find(filter).sort({ credit_note_date: -1 }).exec();
  }

  async findOne(id: string): Promise<CreditNoteDocument> {
    const creditNote = await this.creditNoteModel.findById(id).exec();
    if (!creditNote) {
      throw new NotFoundException(`Avoir avec l'ID ${id} non trouvé`);
    }
    return creditNote;
  }

  async findByCreditNoteNumber(creditNoteNumber: string): Promise<CreditNoteDocument> {
    const creditNote = await this.creditNoteModel.findOne({ credit_note_number: creditNoteNumber }).exec();
    if (!creditNote) {
      throw new NotFoundException(`Avoir avec le numéro ${creditNoteNumber} non trouvé`);
    }
    return creditNote;
  }

  async update(id: string, updateCreditNoteDto: UpdateCreditNoteDto): Promise<CreditNoteDocument> {
    // NE PAS permettre la modification du numéro d'avoir
    if (updateCreditNoteDto.credit_note_number) {
      delete updateCreditNoteDto.credit_note_number;
    }

    // NE PAS permettre la modification de la facture liée
    if (updateCreditNoteDto.invoice_id) {
      delete updateCreditNoteDto.invoice_id;
    }

    const creditNote = await this.creditNoteModel
      .findByIdAndUpdate(id, updateCreditNoteDto, { new: true })
      .exec();

    if (!creditNote) {
      throw new NotFoundException(`Avoir avec l'ID ${id} non trouvé`);
    }

    return creditNote;
  }

  async remove(id: string): Promise<void> {
    const creditNote = await this.findOne(id);
    
    // Vérifier que l'avoir n'est pas appliqué
    if (creditNote.status === 'applied' || creditNote.is_fully_applied) {
      throw new BadRequestException('Impossible de supprimer un avoir déjà appliqué');
    }

    const result = await this.creditNoteModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Avoir avec l'ID ${id} non trouvé`);
    }
  }

  async search(query: string): Promise<CreditNoteDocument[]> {
    const regex = new RegExp(query, 'i');
    return this.creditNoteModel.find({
      $or: [
        { credit_note_number: regex },
        { customer_name: regex },
      ],
    }).limit(20).exec();
  }

  async getByCustomer(customerId: string): Promise<CreditNoteDocument[]> {
    return this.creditNoteModel.find({ customer_id: customerId }).sort({ credit_note_date: -1 }).exec();
  }

  async getByInvoice(invoiceId: string): Promise<CreditNoteDocument[]> {
    return this.creditNoteModel.find({ invoice_id: invoiceId }).exec();
  }

  async updateStatus(id: string, status: string): Promise<CreditNoteDocument> {
    const validStatuses = ['draft', 'issued', 'applied', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Statut invalide. Valeurs autorisées: ${validStatuses.join(', ')}`);
    }

    const creditNote = await this.findOne(id);

    // Validation des transitions de statut
    if (status === 'issued' && creditNote.status !== 'draft') {
      throw new BadRequestException('Seuls les avoirs en brouillon peuvent être émis');
    }

    if (status === 'cancelled' && creditNote.status === 'applied') {
      throw new BadRequestException('Impossible d\'annuler un avoir déjà appliqué');
    }

    if (status === 'applied') {
      // Vérifier que l'avoir est émis
      if (creditNote.status !== 'issued') {
        throw new BadRequestException('Seuls les avoirs émis peuvent être appliqués');
      }

      // Vérifier qu'il reste du montant à appliquer
      if (creditNote.remaining_amount <= 0) {
        throw new BadRequestException('Cet avoir a déjà été entièrement appliqué');
      }
    }

    creditNote.status = status;
    
    // Mettre à jour les dates selon le statut
    if (status === 'issued' && !creditNote.approval_date) {
      creditNote.approval_date = new Date();
    }

    if (status === 'cancelled') {
      creditNote.cancelled_date = new Date();
    }

    return creditNote.save();
  }

  async applyToInvoice(creditNoteId: string, invoiceId: string, amount: number): Promise<CreditNoteDocument> {
    const creditNote = await this.findOne(creditNoteId);
    
    // Vérifier que l'avoir est émis
    if (creditNote.status !== 'issued') {
      throw new BadRequestException('Seuls les avoirs émis peuvent être appliqués');
    }

    // Vérifier le montant disponible
    if (amount > creditNote.remaining_amount) {
      throw new BadRequestException(
        `Montant demandé (${amount}) supérieur au montant restant (${creditNote.remaining_amount})`,
      );
    }

    // Vérifier que la facture existe
    const invoice = await this.invoiceModel.findById(invoiceId).exec();
    if (!invoice) {
      throw new NotFoundException(`Facture avec l'ID ${invoiceId} non trouvée`);
    }

    // Mettre à jour l'avoir
    creditNote.remaining_amount -= amount;
    creditNote.is_fully_applied = creditNote.remaining_amount === 0;
    
    if (!creditNote.applied_to_invoice_id) {
      creditNote.applied_to_invoice_id = invoice._id as any;
      creditNote.applied_date = new Date();
    }

    if (creditNote.is_fully_applied) {
      creditNote.status = 'applied';
    }

    return creditNote.save();
  }

  async getStatistics(customerId?: string): Promise<{
    total: number;
    draft: number;
    issued: number;
    applied: number;
    cancelled: number;
    totalAmount: number;
    remainingAmount: number;
    byReason: Record<string, number>;
  }> {
    const filter: any = {};
    if (customerId) filter.customer_id = customerId;

    const creditNotes = await this.creditNoteModel.find(filter).exec();
    
    const byReason: Record<string, number> = {};
    let totalAmount = 0;
    let remainingAmount = 0;
    let draft = 0;
    let issued = 0;
    let applied = 0;
    let cancelled = 0;

    creditNotes.forEach(creditNote => {
      // Compter par statut
      switch (creditNote.status) {
        case 'draft': draft++; break;
        case 'issued': issued++; break;
        case 'applied': applied++; break;
        case 'cancelled': cancelled++; break;
      }

      // Compter par raison
      const reason = creditNote.reason;
      byReason[reason] = (byReason[reason] || 0) + 1;

      // Calculer les montants
      totalAmount += creditNote.total_with_vat;
      remainingAmount += creditNote.remaining_amount;
    });

    return {
      total: creditNotes.length,
      draft,
      issued,
      applied,
      cancelled,
      totalAmount,
      remainingAmount,
      byReason,
    };
  }

  async getAvailableCreditNotes(customerId: string): Promise<CreditNoteDocument[]> {
    return this.creditNoteModel.find({
      customer_id: customerId,
      status: 'issued',
      remaining_amount: { $gt: 0 },
    }).sort({ credit_note_date: 1 }).exec();
  }

  async cancelCreditNote(id: string, reason: string): Promise<CreditNoteDocument> {
    const creditNote = await this.findOne(id);
    
    // Vérifier que l'avoir peut être annulé
    if (creditNote.status === 'applied') {
      throw new BadRequestException('Impossible d\'annuler un avoir déjà appliqué');
    }

    if (creditNote.status === 'cancelled') {
      throw new BadRequestException('Cet avoir est déjà annulé');
    }

    creditNote.status = 'cancelled';
    creditNote.cancellation_reason = reason;
    creditNote.cancelled_date = new Date();

    return creditNote.save();
  }
}
