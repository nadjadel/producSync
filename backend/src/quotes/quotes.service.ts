import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Quote, QuoteDocument } from './schemas/quote.schema';
import { CreateQuoteDto, UpdateQuoteDto } from './dto';
import { CountersService } from '../counters/counters.service';

@Injectable()
export class QuotesService {
  constructor(
    @InjectModel(Quote.name) private quoteModel: Model<QuoteDocument>,
    private readonly countersService: CountersService,
  ) {}

  async create(createQuoteDto: CreateQuoteDto): Promise<QuoteDocument> {
    // Générer le numéro de devis automatiquement
    const generatedQuoteNumber = await this.countersService.getNextNumber('DE');
    
    // Vérifier l'unicité (au cas où)
    const existingQuote = await this.quoteModel.findOne({
      quote_number: generatedQuoteNumber,
    }).exec();

    if (existingQuote) {
      throw new ConflictException(`Le numéro de devis ${generatedQuoteNumber} est déjà utilisé`);
    }

    // Créer le devis avec le numéro généré automatiquement
    // Ignorer tout quote_number fourni dans le DTO
    const quote = new this.quoteModel({
      ...createQuoteDto,
      quote_number: generatedQuoteNumber, // Toujours utiliser le numéro généré
    });
    
    this.calculateTotals(quote);
    return quote.save();
  }

  async findAll(status?: string, customerId?: string): Promise<QuoteDocument[]> {
    const filter: any = {};
    if (status) filter.status = status;
    if (customerId) filter.customer_id = customerId;
    return this.quoteModel.find(filter).sort({ quote_date: -1 }).exec();
  }

  async findOne(id: string): Promise<QuoteDocument> {
    const quote = await this.quoteModel.findById(id).exec();
    if (!quote) {
      throw new NotFoundException(`Devis avec l'ID ${id} non trouvé`);
    }
    return quote;
  }

  async findByQuoteNumber(quoteNumber: string): Promise<QuoteDocument> {
    const quote = await this.quoteModel.findOne({ quote_number: quoteNumber }).exec();
    if (!quote) {
      throw new NotFoundException(`Devis avec le numéro ${quoteNumber} non trouvé`);
    }
    return quote;
  }

  async update(id: string, updateQuoteDto: UpdateQuoteDto): Promise<QuoteDocument> {
    // NE PAS permettre la modification du numéro de devis
    // Supprimer quote_number du DTO de mise à jour s'il est présent
    if (updateQuoteDto.quote_number) {
      delete updateQuoteDto.quote_number;
    }

    const quote = await this.quoteModel
      .findByIdAndUpdate(id, updateQuoteDto, { new: true })
      .exec();

    if (!quote) {
      throw new NotFoundException(`Devis avec l'ID ${id} non trouvé`);
    }

    if (updateQuoteDto.items) {
      this.calculateTotals(quote);
      await quote.save();
    }

    return quote;
  }

  async remove(id: string): Promise<void> {
    const result = await this.quoteModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Devis avec l'ID ${id} non trouvé`);
    }
  }

  async search(query: string): Promise<QuoteDocument[]> {
    const regex = new RegExp(query, 'i');
    return this.quoteModel.find({
      $or: [
        { quote_number: regex },
        { customer_name: regex },
      ],
    }).limit(20).exec();
  }

  async getByCustomer(customerId: string): Promise<QuoteDocument[]> {
    return this.quoteModel.find({ customer_id: customerId }).sort({ quote_date: -1 }).exec();
  }

  async updateStatus(id: string, status: string): Promise<QuoteDocument> {
    const validStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Statut invalide. Valeurs autorisées: ${validStatuses.join(', ')}`);
    }

    const quote = await this.quoteModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();

    if (!quote) {
      throw new NotFoundException(`Devis avec l'ID ${id} non trouvé`);
    }

    return quote;
  }

  async convertToOrder(id: string): Promise<{ quote: QuoteDocument; orderId: string }> {
  const quote = await this.findOne(id);

  if (quote.status !== 'accepted') {
    throw new BadRequestException('Seuls les devis acceptés peuvent être convertis en commande');
  }

  if (quote.order_id) {
    throw new BadRequestException('Ce devis a déjà été converti en commande');
  }

  // Bug 10 corrigé : lever une erreur explicite plutôt que persister un ID fictif.
  // La création de la commande doit être initiée depuis le frontend via POST /orders,
  // puis l'order_id doit être renseigné via PATCH /quotes/:id
  throw new BadRequestException(
    'La conversion doit être effectuée depuis le module commandes : ' +
    'créez la commande via POST /api/orders puis mettez à jour le devis avec l\'ID obtenu.',
  );
}

  async getExpiredQuotes(): Promise<QuoteDocument[]> {
    const now = new Date();
    return this.quoteModel.find({
      valid_until: { $lt: now },
      status: { $in: ['draft', 'sent'] }
    }).exec();
  }

  private calculateTotals(quote: QuoteDocument): void {
    let totalHT = 0;
    
    quote.items.forEach((item: any) => {
      item.total = item.quantity * (item.unit_price || 0);
      totalHT += item.total;
    });

    quote.total_ht = totalHT;
    quote.total_vat = (totalHT * quote.vat_rate) / 100;
    quote.total_ttc = totalHT + quote.total_vat;
  }
}
