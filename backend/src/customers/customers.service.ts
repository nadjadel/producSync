import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer, CustomerDocument } from './schemas/customer.schema';
import { CreateCustomerDto, UpdateCustomerDto } from './dto';

// Suffixes juridiques ignorés lors de la génération du code
const LEGAL_SUFFIXES = new Set([
  'sarl', 'sa', 'sas', 'eurl', 'sasu', 'sci', 'snc', 'ei', 'ste', 'ets',
  'le', 'la', 'les', 'de', 'du', 'des', 'et',
]);

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
  ) {}

  /**
   * Génère un code de 3 caractères depuis le nom de la société.
   * - Mot unique  → 3 premières lettres  ("DUPONT"  → "DUP")
   * - Nom composé → initiales des mots    ("3D PRINT" → "3DP", "LE COSINUS" → "COS")
   */
  private generateCodeFromName(companyName: string): string {
    // Normalisation : suppression des accents, majuscules, conservation A-Z 0-9 espace
    const cleaned = companyName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, '');

    const words = cleaned
      .split(/\s+/)
      .filter(w => w.length > 0 && !LEGAL_SUFFIXES.has(w.toLowerCase()));

    if (words.length === 0) return 'XXX';

    if (words.length === 1) {
      // Mot unique : 3 premiers caractères
      return words[0].substring(0, 3).padEnd(3, 'X');
    }

    // Nom composé : premier mot (tous ses chars) + première lettre de chaque mot suivant
    // On prend les 3 premiers caractères du résultat
    const candidate = words[0] + words.slice(1).map(w => w[0]).join('');
    return candidate.substring(0, 3).padEnd(3, 'X');
  }

  /**
   * Génère une alternative au code de base en changeant :
   *   - attempt 0-24  : la dernière lettre  (position 2)
   *   - attempt 25-49 : la lettre du milieu (position 1)
   *   - attempt 50-74 : la première lettre  (position 0)
   */
  private generateAlternativeCode(baseCode: string, attempt: number): string {
    const chars = baseCode.split('');

    let position: number;
    let offset: number;

    if (attempt < 25) {
      position = 2; offset = attempt;
    } else if (attempt < 50) {
      position = 1; offset = attempt - 25;
      chars[2] = baseCode[2]; // réinitialiser la dernière lettre
    } else {
      position = 0; offset = attempt - 50;
      chars[1] = baseCode[1]; // réinitialiser la lettre du milieu
      chars[2] = baseCode[2];
    }

    const baseIdx = LETTERS.indexOf(chars[position].toUpperCase());
    const startIdx = baseIdx >= 0 ? baseIdx : 0;
    chars[position] = LETTERS[(startIdx + 1 + offset) % 26];

    return chars.join('');
  }

  async create(createCustomerDto: CreateCustomerDto): Promise<CustomerDocument> {
    const isUnique = async (code: string) =>
      !(await this.customerModel.findOne({ code }).exec());

    const baseCode = this.generateCodeFromName(createCustomerDto.company_name);

    // Essai avec le code de base
    if (await isUnique(baseCode)) {
      const customer = new this.customerModel({ ...createCustomerDto, code: baseCode });
      return customer.save();
    }

    // Alternatives : dernière lettre → lettre du milieu → première lettre
    for (let attempt = 0; attempt < 75; attempt++) {
      const altCode = this.generateAlternativeCode(baseCode, attempt);
      if (await isUnique(altCode)) {
        const customer = new this.customerModel({ ...createCustomerDto, code: altCode });
        return customer.save();
      }
    }

    throw new ConflictException(
      `Impossible de générer un code unique pour "${createCustomerDto.company_name}"`,
    );
  }

  async findAll(status?: string): Promise<CustomerDocument[]> {
    const filter = status ? { status } : {};
    return this.customerModel.find(filter).sort({ company_name: 1 }).exec();
  }

  async findOne(id: string): Promise<CustomerDocument> {
    const customer = await this.customerModel.findById(id).exec();
    if (!customer) {
      throw new NotFoundException(`Client avec l'ID ${id} non trouvé`);
    }
    return customer;
  }

  async findByCode(code: string): Promise<CustomerDocument> {
    const customer = await this.customerModel.findOne({ code }).exec();
    if (!customer) {
      throw new NotFoundException(`Client avec le code ${code} non trouvé`);
    }
    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<CustomerDocument> {
    // NE PAS permettre la modification du code client
    // Supprimer code du DTO de mise à jour s'il est présent
    if (updateCustomerDto.code) {
      delete updateCustomerDto.code;
    }

    const customer = await this.customerModel
      .findByIdAndUpdate(id, updateCustomerDto, { new: true })
      .exec();

    if (!customer) {
      throw new NotFoundException(`Client avec l'ID ${id} non trouvé`);
    }

    return customer;
  }

  async remove(id: string): Promise<void> {
    const result = await this.customerModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Client avec l'ID ${id} non trouvé`);
    }
  }

  async search(query: string): Promise<CustomerDocument[]> {
    const regex = new RegExp(query, 'i');
    return this.customerModel.find({
      $or: [
        { code: regex },
        { company_name: regex },
        { contact_name: regex },
        { email: regex },
      ],
    }).limit(20).exec();
  }

  async getPaymentTermsDays(customerId: string): Promise<number> {
    const customer = await this.findOne(customerId);
    const termsMap: Record<string, number> = {
      'cash': 0,
      '30_days': 30,
      '45_days': 45,
      '60_days': 60,
      'end_of_month': 30,
    };
    return termsMap[customer.payment_terms] || 30;
  }
}
