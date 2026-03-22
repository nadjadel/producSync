import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto, UpdateProductDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<ProductDocument> {
    const existingProduct = await this.productModel.findOne({ reference: createProductDto.reference }).exec();
    if (existingProduct) {
      throw new ConflictException('Un produit avec cette référence existe déjà');
    }
    const product = new this.productModel(createProductDto);
    return product.save();
  }

  async findAll(category?: string, customerId?: string): Promise<ProductDocument[]> {
    const filter: any = {};
    if (category) filter.category = category;
    if (customerId) filter.customer_id = customerId;
    return this.productModel.find(filter).sort({ reference: 1 }).exec();
  }

  async findOne(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException(`Produit avec l'ID ${id} non trouvé`);
    }
    return product;
  }

  async findByReference(reference: string): Promise<ProductDocument> {
    const product = await this.productModel.findOne({ reference }).exec();
    if (!product) {
      throw new NotFoundException(`Produit avec la référence ${reference} non trouvé`);
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<ProductDocument> {
    if (updateProductDto.reference) {
      const existingProduct = await this.productModel.findOne({
        reference: updateProductDto.reference,
        _id: { $ne: id },
      }).exec();
      if (existingProduct) {
        throw new ConflictException('Un produit avec cette référence existe déjà');
      }
    }
    const product = await this.productModel.findByIdAndUpdate(id, updateProductDto, { new: true }).exec();
    if (!product) {
      throw new NotFoundException(`Produit avec l'ID ${id} non trouvé`);
    }
    return product;
  }

  async remove(id: string): Promise<void> {
    const result = await this.productModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Produit avec l'ID ${id} non trouvé`);
    }
  }

  async search(query: string): Promise<ProductDocument[]> {
    const regex = new RegExp(query, 'i');
    return this.productModel.find({
      $or: [{ reference: regex }, { name: regex }, { description: regex }],
    }).limit(20).exec();
  }

  async updateStock(id: string, quantity: number): Promise<ProductDocument> {
    const product = await this.productModel.findByIdAndUpdate(id, { $inc: { stock_quantity: quantity } }, { new: true }).exec();
    if (!product) {
      throw new NotFoundException(`Produit avec l'ID ${id} non trouvé`);
    }
    return product;
  }

  async getLowStockProducts(): Promise<ProductDocument[]> {
    return this.productModel.find({ $expr: { $lt: ['$stock_quantity', '$stock_minimum'] } }).exec();
  }

  async getByCustomer(customerId: string): Promise<ProductDocument[]> {
    return this.productModel.find({ customer_id: customerId }).sort({ reference: 1 }).exec();
  }
}
