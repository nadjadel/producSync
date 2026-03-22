import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Counter, CounterDocument } from './schemas/counter.schema';

@Injectable()
export class CountersService {
  constructor(
    @InjectModel(Counter.name) private counterModel: Model<CounterDocument>,
  ) {}

  /**
   * Initialise un compteur s'il n'existe pas déjà
   */
  async initializeCounter(counterType: string, format?: string): Promise<CounterDocument> {
    const existingCounter = await this.counterModel.findOne({ counter_type: counterType }).exec();
    
    if (existingCounter) {
      return existingCounter;
    }

    const defaultFormats: Record<string, string> = {
      'OF': 'OF+XXXXXXXX',
      'CO': 'CO+XXXXXXXX',
      'DE': 'DE+XXXXXXXX',
      'BL': 'BL+XXXXXXXX',
      'FA': 'FA+XXXXXXXX',
      'AV': 'AV+XXXXXXXX',
      'SUPPLIER': 'SU+XXXXXXXX',
      'SUPPLIER_ORDER': 'ST+XXXXXXXX',
      'CUSTOMER': 'XXX', // 3 lettres générées
      'PRODUCT': 'XXX+XXXXXXXX', // 3 lettres customer + 8 chiffres
    };

    const counter = new this.counterModel({
      counter_type: counterType,
      format: format || defaultFormats[counterType] || 'XXX+XXXXXXXX',
      last_number: 0,
      increment: 1,
      reset_yearly: false, // Pas de réinitialisation annuelle pour les formats sans année
      start_number: 1,
      max_number: 99999999, // 8 chiffres = 99,999,999
      current_year: new Date().getFullYear(),
    });

    return counter.save();
  }

  /**
   * Génère le prochain numéro pour une typologie donnée
   * Le numéro est incrémenté automatiquement et sauvegardé
   */
  async getNextNumber(counterType: string): Promise<string> {
    const counter = await this.counterModel.findOne({ counter_type: counterType }).exec();
    
    if (!counter) {
      // Initialiser le compteur s'il n'existe pas
      const newCounter = await this.initializeCounter(counterType);
      return this.generateAndSaveNumber(newCounter);
    }

    // Vérifier si on doit réinitialiser pour la nouvelle année
    const currentYear = new Date().getFullYear();
    if (counter.reset_yearly && counter.current_year !== currentYear) {
      counter.last_number = counter.start_number - counter.increment;
      counter.current_year = currentYear;
    }

    // Vérifier si on a atteint le maximum
    if (counter.last_number >= counter.max_number) {
      throw new ConflictException(`Le compteur ${counterType} a atteint son maximum (${counter.max_number})`);
    }

    return this.generateAndSaveNumber(counter);
  }

  /**
   * Génère et sauvegarde le numéro (incrémente le compteur)
   */
  private async generateAndSaveNumber(counter: CounterDocument): Promise<string> {
    // Incrémenter le compteur
    counter.last_number += counter.increment;
    await counter.save();

    return this.formatNumber(counter);
  }

  /**
   * Formate le numéro selon le format du compteur
   */
  private formatNumber(counter: CounterDocument): string {
    const nextNumber = counter.last_number;
    
    // Cas spécial pour CUSTOMER : 3 lettres générées
    if (counter.counter_type === 'CUSTOMER') {
      return this.generateCustomerCode(nextNumber);
    }
    
    // Cas spécial pour PRODUCT : 3 lettres customer + 8 chiffres
    if (counter.counter_type === 'PRODUCT') {
      return this.generateProductCode(nextNumber);
    }
    
    // Cas général : utiliser le format du compteur
    let formattedNumber = counter.format
      .replace(/XXXXXXXX/g, nextNumber.toString().padStart(8, '0'))
      .replace(/XXXXXXX/g, nextNumber.toString().padStart(7, '0'))
      .replace(/XXXXXX/g, nextNumber.toString().padStart(6, '0'))
      .replace(/XXXXX/g, nextNumber.toString().padStart(5, '0'))
      .replace(/XXXX/g, nextNumber.toString().padStart(4, '0'))
      .replace(/XXX/g, nextNumber.toString().padStart(3, '0'))
      .replace(/XX/g, nextNumber.toString().padStart(2, '0'))
      .replace(/X/g, nextNumber.toString());

    return formattedNumber;
  }

  /**
   * Génère un code client de 3 lettres
   */
  private generateCustomerCode(number: number): string {
    // Convertir le nombre en base 26 (A-Z) pour obtenir 3 lettres
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    let n = number;
    
    for (let i = 0; i < 3; i++) {
      const remainder = n % 26;
      code = letters[remainder] + code;
      n = Math.floor(n / 26);
    }
    
    return code.padStart(3, 'A');
  }

  /**
   * Génère un code produit : 3 lettres customer + 8 chiffres
   */
  private generateProductCode(number: number): string {
    // Pour l'instant, on utilise des lettres fixes
    // En production, il faudrait récupérer les 3 lettres du client
    const customerPrefix = 'CUS'; // À remplacer par les 3 lettres du client
    const productNumber = number.toString().padStart(8, '0');
    
    return `${customerPrefix}+${productNumber}`;
  }

  /**
   * Génère un aperçu du prochain numéro sans incrémenter le compteur
   */
  async getNextNumberPreview(counterType: string): Promise<string> {
    const counter = await this.counterModel.findOne({ counter_type: counterType }).exec();
    
    if (!counter) {
      const newCounter = await this.initializeCounter(counterType);
      return this.formatPreviewNumber(newCounter);
    }

    return this.formatPreviewNumber(counter);
  }

  /**
   * Formate un numéro de prévisualisation (sans incrémenter)
   */
  private formatPreviewNumber(counter: CounterDocument): string {
    const nextNumber = counter.last_number + counter.increment;
    
    // Cas spécial pour CUSTOMER : 3 lettres générées
    if (counter.counter_type === 'CUSTOMER') {
      return this.generateCustomerCode(nextNumber);
    }
    
    // Cas spécial pour PRODUCT : 3 lettres customer + 8 chiffres
    if (counter.counter_type === 'PRODUCT') {
      return this.generateProductCode(nextNumber);
    }
    
    // Cas général : utiliser le format du compteur
    let formattedNumber = counter.format
      .replace(/XXXXXXXX/g, nextNumber.toString().padStart(8, '0'))
      .replace(/XXXXXXX/g, nextNumber.toString().padStart(7, '0'))
      .replace(/XXXXXX/g, nextNumber.toString().padStart(6, '0'))
      .replace(/XXXXX/g, nextNumber.toString().padStart(5, '0'))
      .replace(/XXXX/g, nextNumber.toString().padStart(4, '0'))
      .replace(/XXX/g, nextNumber.toString().padStart(3, '0'))
      .replace(/XX/g, nextNumber.toString().padStart(2, '0'))
      .replace(/X/g, nextNumber.toString());

    return formattedNumber;
  }

  /**
   * Récupère le numéro courant (dernier numéro utilisé)
   */
  async getCurrentNumber(counterType: string): Promise<number> {
    const counter = await this.counterModel.findOne({ counter_type: counterType }).exec();
    
    if (!counter) {
      throw new NotFoundException(`Compteur ${counterType} non trouvé`);
    }

    return counter.last_number;
  }

  /**
   * Réinitialise un compteur
   */
  async resetCounter(counterType: string, startNumber?: number): Promise<CounterDocument> {
    const counter = await this.counterModel.findOne({ counter_type: counterType }).exec();
    
    if (!counter) {
      throw new NotFoundException(`Compteur ${counterType} non trouvé`);
    }

    counter.last_number = startNumber || counter.start_number - counter.increment;
    counter.current_year = new Date().getFullYear();
    
    return counter.save();
  }

  /**
   * Récupère tous les compteurs
   */
  async getAllCounters(): Promise<CounterDocument[]> {
    return this.counterModel.find().exec();
  }

  /**
   * Récupère un compteur spécifique
   */
  async getCounter(counterType: string): Promise<CounterDocument> {
    const counter = await this.counterModel.findOne({ counter_type: counterType }).exec();
    
    if (!counter) {
      throw new NotFoundException(`Compteur ${counterType} non trouvé`);
    }

    return counter;
  }

  /**
   * Supprime un compteur
   */
  async deleteCounter(counterType: string): Promise<void> {
    const result = await this.counterModel.deleteOne({ counter_type: counterType }).exec();
    
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Compteur ${counterType} non trouvé`);
    }
  }

  /**
   * Initialise tous les compteurs par défaut
   */
  async initializeAllCounters(): Promise<void> {
    const counterTypes = ['OF', 'CO', 'DE', 'BL', 'FA', 'AV', 'SUPPLIER', 'SUPPLIER_ORDER', 'CUSTOMER', 'PRODUCT'];
    
    for (const counterType of counterTypes) {
      await this.initializeCounter(counterType);
    }
  }

  /**
   * Récupère les informations d'un compteur
   */
  async getCounterInfo(counterType: string): Promise<{
    current: number;
    next: string;
    format: string;
    max: number;
    available: number;
  }> {
    const counter = await this.counterModel.findOne({ counter_type: counterType }).exec();
    
    if (!counter) {
      const newCounter = await this.initializeCounter(counterType);
      return {
        current: newCounter.last_number,
        next: await this.getNextNumberPreview(counterType),
        format: newCounter.format,
        max: newCounter.max_number,
        available: newCounter.max_number - newCounter.last_number,
      };
    }

    return {
      current: counter.last_number,
      next: await this.getNextNumberPreview(counterType),
      format: counter.format,
      max: counter.max_number,
      available: counter.max_number - counter.last_number,
    };
  }

  /**
   * Vérifie si un numéro est disponible
   */
  async isNumberAvailable(counterType: string, count: number = 1): Promise<boolean> {
    const counter = await this.counterModel.findOne({ counter_type: counterType }).exec();
    
    if (!counter) {
      return true; // Le compteur n'existe pas encore, donc tous les numéros sont disponibles
    }

    return (counter.max_number - counter.last_number) >= count;
  }

  /**
   * Génère un code produit avec un préfixe client spécifique
   */
  async getNextProductCode(customerPrefix: string): Promise<string> {
    const counter = await this.counterModel.findOne({ counter_type: 'PRODUCT' }).exec();
    
    if (!counter) {
      await this.initializeCounter('PRODUCT');
      return this.getNextProductCode(customerPrefix);
    }

    // Incrémenter le compteur
    counter.last_number += counter.increment;
    await counter.save();

    const productNumber = counter.last_number.toString().padStart(8, '0');
    return `${customerPrefix}+${productNumber}`;
  }

  /**
   * Génère un code client de 3 lettres
   */
  async getNextCustomerCode(): Promise<string> {
    const counter = await this.counterModel.findOne({ counter_type: 'CUSTOMER' }).exec();
    
    if (!counter) {
      const newCounter = await this.initializeCounter('CUSTOMER');
      return this.generateCustomerCode(newCounter.last_number + newCounter.increment);
    }

    // Incrémenter le compteur
    counter.last_number += counter.increment;
    await counter.save();

    return this.generateCustomerCode(counter.last_number);
  }
}
