import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StockMovement, StockMovementDocument } from './schemas/stock-movement.schema';
import { CreateStockMovementDto, UpdateStockMovementDto } from './dto';
import { CountersService } from '../counters/counters.service';
import { Product, ProductDocument } from '../products/schemas/product.schema';

@Injectable()
export class StockMovementsService {
  constructor(
    @InjectModel(StockMovement.name) private stockMovementModel: Model<StockMovementDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private readonly countersService: CountersService,
  ) {}

  async create(createStockMovementDto: CreateStockMovementDto): Promise<StockMovementDocument> {
    // TOUJOURS générer un numéro de mouvement automatiquement
    const generatedMovementNumber = await this.generateMovementNumber();
    
    // Vérifier l'unicité du numéro
    const existingMovement = await this.stockMovementModel.findOne({
      movement_number: generatedMovementNumber,
    }).exec();

    if (existingMovement) {
      throw new ConflictException(`Le mouvement de stock avec le numéro ${generatedMovementNumber} existe déjà`);
    }

    // Vérifier que le produit existe
    const product = await this.productModel.findById(createStockMovementDto.product_id).exec();
    if (!product) {
      throw new NotFoundException(`Produit avec l'ID ${createStockMovementDto.product_id} non trouvé`);
    }

    // Calculer les valeurs de stock avant/après
    const stockBefore = product.current_stock || 0;
    let stockAfter = stockBefore;
    
    // Ajuster le stock selon le type de mouvement
    switch (createStockMovementDto.type) {
      case 'in':
      case 'production':
        stockAfter = stockBefore + createStockMovementDto.quantity;
        break;
      case 'out':
      case 'consumption':
        if (createStockMovementDto.quantity > stockBefore) {
          throw new BadRequestException(
            `Quantité insuffisante en stock. Disponible: ${stockBefore}, Demandée: ${createStockMovementDto.quantity}`,
          );
        }
        stockAfter = stockBefore - createStockMovementDto.quantity;
        break;
      case 'transfer':
        // Pour les transferts, le stock total ne change pas
        stockAfter = stockBefore;
        break;
      case 'adjustment':
        stockAfter = createStockMovementDto.quantity;
        break;
    }

    // Calculer les coûts moyens
    const averageCostBefore = product.average_cost || 0;
    let averageCostAfter = averageCostBefore;
    let totalStockValueBefore = stockBefore * averageCostBefore;
    let totalStockValueAfter = stockAfter * averageCostAfter;

    // Mettre à jour le coût moyen pour les entrées
    if (createStockMovementDto.type === 'in' || createStockMovementDto.type === 'production') {
      if (stockAfter > 0) {
        const totalValueBefore = stockBefore * averageCostBefore;
        const totalValueNew = createStockMovementDto.quantity * createStockMovementDto.unit_cost;
        averageCostAfter = (totalValueBefore + totalValueNew) / stockAfter;
        totalStockValueAfter = stockAfter * averageCostAfter;
      }
    }

    // Créer le mouvement de stock
    const stockMovement = new this.stockMovementModel({
      ...createStockMovementDto,
      movement_number: generatedMovementNumber,
      stock_before: stockBefore,
      stock_after: stockAfter,
      average_cost_before: averageCostBefore,
      average_cost_after: averageCostAfter,
      total_stock_value_before: totalStockValueBefore,
      total_stock_value_after: totalStockValueAfter,
      is_active: createStockMovementDto.is_active ?? true,
    });
    
    const savedMovement = await stockMovement.save();

    // Mettre à jour le produit avec les nouvelles valeurs de stock
    await this.updateProductStock(
      product._id.toString(),
      stockAfter,
      averageCostAfter,
      totalStockValueAfter,
    );

    return savedMovement;
  }

  async findAll(
    productId?: string,
    type?: string,
    category?: string,
    startDate?: Date,
    endDate?: Date,
    status?: string,
  ): Promise<StockMovementDocument[]> {
    const filter: any = {};
    if (productId) filter.product_id = productId;
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.movement_date = {};
      if (startDate) filter.movement_date.$gte = startDate;
      if (endDate) filter.movement_date.$lte = endDate;
    }
    
    return this.stockMovementModel.find(filter).sort({ movement_date: -1, createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<StockMovementDocument> {
    const stockMovement = await this.stockMovementModel.findById(id).exec();
    if (!stockMovement) {
      throw new NotFoundException(`Mouvement de stock avec l'ID ${id} non trouvé`);
    }
    return stockMovement;
  }

  async findByMovementNumber(movementNumber: string): Promise<StockMovementDocument> {
    const stockMovement = await this.stockMovementModel.findOne({ movement_number: movementNumber }).exec();
    if (!stockMovement) {
      throw new NotFoundException(`Mouvement de stock avec le numéro ${movementNumber} non trouvé`);
    }
    return stockMovement;
  }

  async update(id: string, updateStockMovementDto: UpdateStockMovementDto): Promise<StockMovementDocument> {
    // NE PAS permettre la modification du numéro de mouvement
    if (updateStockMovementDto.movement_number) {
      delete updateStockMovementDto.movement_number;
    }

    // NE PAS permettre la modification du produit
    if (updateStockMovementDto.product_id) {
      delete updateStockMovementDto.product_id;
    }

    // NE PAS permettre la modification du type (nécessiterait un recalcul complexe)
    if (updateStockMovementDto.type) {
      delete updateStockMovementDto.type;
    }

    // NE PAS permettre la modification de la quantité (nécessiterait un recalcul complexe)
    if (updateStockMovementDto.quantity) {
      delete updateStockMovementDto.quantity;
    }

    const stockMovement = await this.stockMovementModel
      .findByIdAndUpdate(id, updateStockMovementDto, { new: true })
      .exec();

    if (!stockMovement) {
      throw new NotFoundException(`Mouvement de stock avec l'ID ${id} non trouvé`);
    }

    return stockMovement;
  }

  async remove(id: string): Promise<void> {
    const stockMovement = await this.findOne(id);
    
    // Vérifier que le mouvement n'est pas approuvé/complété
    if (stockMovement.status === 'approved' || stockMovement.status === 'completed') {
      throw new BadRequestException('Impossible de supprimer un mouvement de stock approuvé ou complété');
    }

    // Vérifier que le mouvement n'a pas été inversé
    if (stockMovement.is_reversed) {
      throw new BadRequestException('Impossible de supprimer un mouvement de stock inversé');
    }

    const result = await this.stockMovementModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Mouvement de stock avec l'ID ${id} non trouvé`);
    }

    // Recalculer le stock du produit
    await this.recalculateProductStock(stockMovement.product_id.toString());
  }

  async search(query: string): Promise<StockMovementDocument[]> {
    const regex = new RegExp(query, 'i');
    return this.stockMovementModel.find({
      $or: [
        { movement_number: regex },
        { product_code: regex },
        { product_name: regex },
        { batch_number: regex },
        { serial_number: regex },
      ],
    }).limit(20).exec();
  }

  async getByProduct(productId: string): Promise<StockMovementDocument[]> {
    return this.stockMovementModel.find({ product_id: productId }).sort({ movement_date: -1 }).exec();
  }

  async getByOrder(orderId: string): Promise<StockMovementDocument[]> {
    return this.stockMovementModel.find({ order_id: orderId }).exec();
  }

  async getByManufacturingOrder(manufacturingOrderId: string): Promise<StockMovementDocument[]> {
    return this.stockMovementModel.find({ manufacturing_order_id: manufacturingOrderId }).exec();
  }

  async getByInvoice(invoiceId: string): Promise<StockMovementDocument[]> {
    return this.stockMovementModel.find({ invoice_id: invoiceId }).exec();
  }

  async updateStatus(id: string, status: string): Promise<StockMovementDocument> {
    const validStatuses = ['draft', 'pending', 'approved', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Statut invalide. Valeurs autorisées: ${validStatuses.join(', ')}`);
    }

    const stockMovement = await this.findOne(id);

    // Validation des transitions de statut
    if (status === 'approved' && stockMovement.status !== 'pending') {
      throw new BadRequestException('Seuls les mouvements en attente peuvent être approuvés');
    }

    if (status === 'completed' && stockMovement.status !== 'approved') {
      throw new BadRequestException('Seuls les mouvements approuvés peuvent être complétés');
    }

    if (status === 'cancelled' && (stockMovement.status === 'completed' || stockMovement.is_reversed)) {
      throw new BadRequestException('Impossible d\'annuler un mouvement complété ou inversé');
    }

    stockMovement.status = status;
    
    // Mettre à jour la date d'approbation si nécessaire
    if (status === 'approved' && !stockMovement.approval_date) {
      stockMovement.approval_date = new Date();
    }

    return stockMovement.save();
  }

  async reverseMovement(id: string, reason: string): Promise<StockMovementDocument> {
    const originalMovement = await this.findOne(id);
    
    // Vérifier que le mouvement peut être inversé
    if (originalMovement.is_reversed) {
      throw new BadRequestException('Ce mouvement a déjà été inversé');
    }

    if (originalMovement.status !== 'completed') {
      throw new BadRequestException('Seuls les mouvements complétés peuvent être inversés');
    }

    // Créer un mouvement inverse
    const reverseMovementDto: CreateStockMovementDto = {
      movement_date: new Date(),
      type: this.getReverseType(originalMovement.type),
      category: 'return',
      product_id: originalMovement.product_id.toString(),
      product_code: originalMovement.product_code,
      product_name: originalMovement.product_name,
      quantity: originalMovement.quantity,
      unit: originalMovement.unit,
      unit_cost: originalMovement.unit_cost,
      total_cost: originalMovement.total_cost,
      unit_price: originalMovement.unit_price,
      total_price: originalMovement.total_price,
      from_location_id: originalMovement.to_location_id?.toString(),
      from_location_name: originalMovement.to_location_name,
      to_location_id: originalMovement.from_location_id?.toString(),
      to_location_name: originalMovement.from_location_name,
      reason: `Inversion: ${reason}`,
      notes: `Inversion du mouvement ${originalMovement.movement_number}`,
      created_by: originalMovement.created_by,
      status: 'completed',
      is_reversed: false,
      reversal_of_id: originalMovement._id.toString(),
      is_active: true,
    };

    const reverseMovement = await this.create(reverseMovementDto);

    // Marquer le mouvement original comme inversé
    originalMovement.is_reversed = true;
    originalMovement.reversed_by_id = reverseMovement._id as any;
    originalMovement.reversal_reason = reason;
    originalMovement.reversal_date = new Date();
    
    await originalMovement.save();

    return reverseMovement;
  }

  async getStatistics(
    productId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalMovements: number;
    totalIn: number;
    totalOut: number;
    totalTransfer: number;
    totalAdjustment: number;
    totalProduction: number;
    totalConsumption: number;
    totalQuantityIn: number;
    totalQuantityOut: number;
    totalCostIn: number;
    totalCostOut: number;
    totalValueIn: number;
    totalValueOut: number;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    const filter: any = {};
    if (productId) filter.product_id = productId;
    if (startDate || endDate) {
      filter.movement_date = {};
      if (startDate) filter.movement_date.$gte = startDate;
      if (endDate) filter.movement_date.$lte = endDate;
    }

    const movements = await this.stockMovementModel.find(filter).exec();
    
    const byCategory: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let totalIn = 0;
    let totalOut = 0;
    let totalTransfer = 0;
    let totalAdjustment = 0;
    let totalProduction = 0;
    let totalConsumption = 0;
    let totalQuantityIn = 0;
    let totalQuantityOut = 0;
    let totalCostIn = 0;
    let totalCostOut = 0;
    let totalValueIn = 0;
    let totalValueOut = 0;

    movements.forEach(movement => {
      // Compter par catégorie
      const category = movement.category;
      byCategory[category] = (byCategory[category] || 0) + 1;

      // Compter par statut
      const status = movement.status;
      byStatus[status] = (byStatus[status] || 0) + 1;

      // Compter par type
      switch (movement.type) {
        case 'in':
          totalIn++;
          totalQuantityIn += movement.quantity;
          totalCostIn += movement.total_cost;
          totalValueIn += movement.total_price;
          break;
        case 'out':
          totalOut++;
          totalQuantityOut += movement.quantity;
          totalCostOut += movement.total_cost;
          totalValueOut += movement.total_price;
          break;
        case 'transfer':
          totalTransfer++;
          break;
        case 'adjustment':
          totalAdjustment++;
          break;
        case 'production':
          totalProduction++;
          totalQuantityIn += movement.quantity;
          totalCostIn += movement.total_cost;
          totalValueIn += movement.total_price;
          break;
        case 'consumption':
          totalConsumption++;
          totalQuantityOut += movement.quantity;
          totalCostOut += movement.total_cost;
          totalValueOut += movement.total_price;
          break;
      }
    });

    return {
      totalMovements: movements.length,
      totalIn,
      totalOut,
      totalTransfer,
      totalAdjustment,
      totalProduction,
      totalConsumption,
      totalQuantityIn,
      totalQuantityOut,
      totalCostIn,
      totalCostOut,
      totalValueIn,
      totalValueOut,
      byCategory,
      byStatus,
    };
  }

  async getStockHistory(
    productId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Array<{
    date: Date;
    movement_number: string;
    type: string;
    category: string;
    quantity: number;
    stock_before: number;
    stock_after: number;
    unit_cost: number;
    total_cost: number;
    average_cost_before: number;
    average_cost_after: number;
  }>> {
    const filter: any = { product_id: productId };
    if (startDate || endDate) {
      filter.movement_date = {};
      if (startDate) filter.movement_date.$gte = startDate;
      if (endDate) filter.movement_date.$lte = endDate;
    }

    const movements = await this.stockMovementModel
      .find(filter)
      .sort({ movement_date: 1, createdAt: 1 })
      .exec();

    return movements.map(movement => ({
      date: movement.movement_date,
      movement_number: movement.movement_number,
      type: movement.type,
      category: movement.category,
      quantity: movement.quantity,
      stock_before: movement.stock_before,
      stock_after: movement.stock_after,
      unit_cost: movement.unit_cost,
      total_cost: movement.total_cost,
      average_cost_before: movement.average_cost_before,
      average_cost_after: movement.average_cost_after,
    }));
  }

  async getCurrentStockValue(productId?: string): Promise<{
    totalProducts: number;
    totalQuantity: number;
    totalValue: number;
    averageCost: number;
    byProduct: Array<{
      product_id: string;
      product_code: string;
      product_name: string;
      quantity: number;
      average_cost: number;
      total_value: number;
    }>;
  }> {
    const filter: any = {};
    if (productId) filter._id = productId;

    const products = await this.productModel.find(filter).exec();
    
    const byProduct = products.map(product => ({
      product_id: product._id.toString(),
      product_code: product.reference, // Utiliser reference au lieu de code
      product_name: product.name,
      quantity: product.current_stock || 0,
      average_cost: product.average_cost || 0,
      total_value: (product.current_stock || 0) * (product.average_cost || 0),
    }));

    const totalQuantity = byProduct.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = byProduct.reduce((sum, item) => sum + item.total_value, 0);
    const averageCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;

    return {
      totalProducts: products.length,
      totalQuantity,
      totalValue,
      averageCost,
      byProduct,
    };
  }

  // Méthodes utilitaires privées
  private async generateMovementNumber(): Promise<string> {
  const today = new Date();
  const datePart = today.toISOString().slice(0, 10).replace(/-/g, '');
  // Bug 8 corrigé : on incrémente manuellement sans passer par getNextNumber
  // qui retourne un string formaté non paddable
  const current = await this.countersService.getCurrentNumber('STOCK_MOVEMENT').catch(() => 0);
  const nextNum = (current + 1).toString().padStart(6, '0');
  // Incrémenter le compteur manuellement en base
  await this.countersService.getNextNumber('STOCK_MOVEMENT');
  return `SM-${datePart}-${nextNum}`;
}

  private async updateProductStock(
    productId: string,
    newStock: number,
    newAverageCost: number,
    newTotalValue: number,
  ): Promise<void> {
    await this.productModel.findByIdAndUpdate(productId, {
      current_stock: newStock,
      average_cost: newAverageCost,
      total_stock_value: newTotalValue,
      last_stock_update: new Date(),
    }).exec();
  }

  private async recalculateProductStock(productId: string): Promise<void> {
    // Récupérer tous les mouvements pour ce produit
    const movements = await this.stockMovementModel
      .find({ product_id: productId })
      .sort({ movement_date: 1, createdAt: 1 })
      .exec();

    let currentStock = 0;
    let totalValue = 0;
    let totalQuantity = 0;

    // Recalculer le stock et le coût moyen
    for (const movement of movements) {
      if (movement.type === 'in' || movement.type === 'production') {
        const movementValue = movement.quantity * movement.unit_cost;
        totalValue += movementValue;
        totalQuantity += movement.quantity;
        currentStock += movement.quantity;
      } else if (movement.type === 'out' || movement.type === 'consumption') {
        currentStock -= movement.quantity;
      } else if (movement.type === 'adjustment') {
        currentStock = movement.quantity;
      }
    }

    const averageCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;
    const totalStockValue = currentStock * averageCost;

    // Mettre à jour le produit
    await this.updateProductStock(productId, currentStock, averageCost, totalStockValue);
  }

  private getReverseType(originalType: string): string {
    const reverseMap: Record<string, string> = {
      'in': 'out',
      'out': 'in',
      'production': 'consumption',
      'consumption': 'production',
      'transfer': 'transfer', // Les transferts restent des transferts
      'adjustment': 'adjustment', // Les ajustements restent des ajustements
    };
    return reverseMap[originalType] || 'adjustment';
  }
}
