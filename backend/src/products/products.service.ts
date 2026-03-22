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
    const product = await this.productModel.findByIdAndUpdate(
      id, 
      { 
        $inc: { current_stock: quantity },
        last_stock_update: new Date(),
      }, 
      { new: true }
    ).exec();
    if (!product) {
      throw new NotFoundException(`Produit avec l'ID ${id} non trouvé`);
    }
    return product;
  }

  async getLowStockProducts(): Promise<ProductDocument[]> {
    return this.productModel.find({ 
      $expr: { $lt: ['$current_stock', '$stock_minimum'] },
      is_active: true,
    }).exec();
  }

  async getStockStatistics(): Promise<{
    totalProducts: number;
    activeProducts: number;
    totalStockValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    byCategory: Record<string, number>;
  }> {
    const products = await this.productModel.find({ is_active: true }).exec();
    
    const byCategory: Record<string, number> = {};
    let totalStockValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach(product => {
      // Compter par catégorie
      const category = product.category;
      byCategory[category] = (byCategory[category] || 0) + 1;

      // Calculer la valeur totale du stock
      totalStockValue += product.total_stock_value || 0;

      // Compter les produits en rupture de stock
      if (product.current_stock <= 0) {
        outOfStockCount++;
      }

      // Compter les produits avec stock faible
      if (product.current_stock > 0 && product.current_stock < (product.stock_minimum || 0)) {
        lowStockCount++;
      }
    });

    return {
      totalProducts: products.length,
      activeProducts: products.filter(p => p.is_active).length,
      totalStockValue,
      lowStockCount,
      outOfStockCount,
      byCategory,
    };
  }

  async updateProductCost(
    id: string, 
    newCost: number, 
    updateAverage: boolean = false
  ): Promise<ProductDocument> {
    const updateData: any = { 
      last_purchase_cost: newCost,
      last_stock_update: new Date(),
    };

    if (updateAverage) {
      const product = await this.findOne(id);
      const currentStock = product.current_stock || 0;
      const currentAverage = product.average_cost || 0;
      const currentValue = currentStock * currentAverage;
      
      // Pour l'instant, on met simplement à jour le coût standard
      // Le coût moyen sera mis à jour par le module StockMovements
      updateData.standard_cost = newCost;
    }

    const product = await this.productModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    if (!product) {
      throw new NotFoundException(`Produit avec l'ID ${id} non trouvé`);
    }
    return product;
  }

  async getProductsNeedingReorder(): Promise<ProductDocument[]> {
    return this.productModel.find({
      is_active: true,
      $expr: { 
        $lte: ['$current_stock', { $ifNull: ['$reorder_point', '$stock_minimum'] }]
      },
    }).sort({ current_stock: 1 }).exec();
  }

  async updateStockLevels(
    id: string,
    stockData: {
      stock_minimum?: number;
      stock_maximum?: number;
      safety_stock?: number;
      reorder_point?: number;
    }
  ): Promise<ProductDocument> {
    const product = await this.productModel.findByIdAndUpdate(id, stockData, { new: true }).exec();
    if (!product) {
      throw new NotFoundException(`Produit avec l'ID ${id} non trouvé`);
    }
    return product;
  }

  async getByCustomer(customerId: string): Promise<ProductDocument[]> {
    return this.productModel.find({ customer_id: customerId }).sort({ reference: 1 }).exec();
  }
}
