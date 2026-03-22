import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer, CustomerDocument } from './schemas/customer.schema';
import { CreateCustomerDto, UpdateCustomerDto } from './dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<CustomerDocument> {
    const existingCustomer = await this.customerModel.findOne({ code: createCustomerDto.code }).exec();
    if (existingCustomer) {
      throw new ConflictException('Un client avec ce code existe déjà');
    }

    const customer = new this.customerModel(createCustomerDto);
    return customer.save();
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
    if (updateCustomerDto.code) {
      const existingCustomer = await this.customerModel.findOne({
        code: updateCustomerDto.code,
        _id: { $ne: id },
      }).exec();
      if (existingCustomer) {
        throw new ConflictException('Un client avec ce code existe déjà');
      }
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
