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
      'OF': 'YYYY-OF-XXXX',
      'CO': 'YYYY-CO-XXXX',
      'DE': 'YYYY-DE-XXXX',
      'BL': 'YYYY-BL-XXXX',
      'FA': 'YYYY-FA-XXXX',
      'AV': 'YYYY-AV-XXXX',
      'PRODUCT': 'PR-XXXX',
      'CUSTOMER': 'CL-XXXX',
      'SUPPLIER': 'SU-XXXX',
    };

    const counter = new this.counterModel({
      counter_type: counterType,
      format: format || defaultFormats[counterType] || 'YYYY-XXXX',
      last_number: 0,
      increment: 1,
      reset_yearly: true,
      start_number: 1,
      max_number: 9999,
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
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const number = counter.last_number.toString().padStart(4, '0');

    let formattedNumber = counter.format
      .replace(/YYYY/g, year)
      .replace(/YY/g, year.slice(-2))
      .replace(/MM/g, month)
      .replace(/DD/g, day)
      .replace(/XXXX/g, number)
      .replace(/XXX/g, counter.last_number.toString().padStart(3, '0'))
      .replace(/XX/g, counter.last_number.toString().padStart(2, '0'))
      .replace(/X/g, counter.last_number.toString());

    return formattedNumber;
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
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const nextNumber = counter.last_number + counter.increment;
    const number = nextNumber.toString().padStart(4, '0');

    let formattedNumber = counter.format
      .replace(/YYYY/g, year)
      .replace(/YY/g, year.slice(-2))
      .replace(/MM/g, month)
      .replace(/DD/g, day)
      .replace(/XXXX/g, number)
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
    const counterTypes = ['OF', 'CO', 'DE', 'BL', 'FA', 'AV', 'PRODUCT', 'CUSTOMER', 'SUPPLIER'];
    
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
}
