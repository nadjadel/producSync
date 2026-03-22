import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Counter, CounterDocument } from './schemas/counter.schema';

@Injectable()
export class CountersService {
  constructor(
    @InjectModel(Counter.name) private counterModel: Model<CounterDocument>,
  ) {}

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

  async getNextNumber(counterType: string): Promise<string> {
    const counter = await this.counterModel.findOne({ counter_type: counterType }).exec();
    
    if (!counter) {
      // Initialiser le compteur s'il n'existe pas
      const newCounter = await this.initializeCounter(counterType);
      return this.generateNumber(newCounter);
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

    return this.generateNumber(counter);
  }

  private async generateNumber(counter: CounterDocument): Promise<string> {
    // Incrémenter le compteur
    counter.last_number += counter.increment;
    await counter.save();

    // Générer le numéro formaté
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

  async getCurrentNumber(counterType: string): Promise<number> {
    const counter = await this.counterModel.findOne({ counter_type: counterType }).exec();
    
    if (!counter) {
      throw new NotFoundException(`Compteur ${counterType} non trouvé`);
    }

    return counter.last_number;
  }

  async resetCounter(counterType: string, startNumber?: number): Promise<CounterDocument> {
    const counter = await this.counterModel.findOne({ counter_type: counterType }).exec();
    
    if (!counter) {
      throw new NotFoundException(`Compteur ${counterType} non trouvé`);
    }

    counter.last_number = startNumber || counter.start_number - counter.increment;
    counter.current_year = new Date().getFullYear();
    
    return counter.save();
  }

  async updateCounter(
    counterType: string,
    updateData: Partial<Counter>,
  ): Promise<CounterDocument> {
    const counter = await this.counterModel.findOne({ counter_type: counterType }).exec();
    
    if (!counter) {
      throw new NotFoundException(`Compteur ${counterType} non trouvé`);
    }

    // Ne pas permettre la modification du type de compteur
    if (updateData.counter_type && updateData.counter_type !== counterType) {
      throw new ConflictException('Le type de compteur ne peut pas être modifié');
    }

    Object.assign(counter, updateData);
    return counter.save();
  }

  async getAllCounters(): Promise<CounterDocument[]> {
    return this.counterModel.find().exec();
  }

  async getCounter(counterType: string): Promise<CounterDocument> {
    const counter = await this.counterModel.findOne({ counter_type: counterType }).exec();
    
    if (!counter) {
      throw new NotFoundException(`Compteur ${counterType} non trouvé`);
    }

    return counter;
  }

  async deleteCounter(counterType: string): Promise<void> {
    const result = await this.counterModel.deleteOne({ counter_type: counterType }).exec();
    
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Compteur ${counterType} non trouvé`);
    }
  }

  async initializeAllCounters(): Promise<void> {
    const counterTypes = ['OF', 'CO', 'DE', 'BL', 'FA', 'AV', 'PRODUCT', 'CUSTOMER', 'SUPPLIER'];
    
    for (const counterType of counterTypes) {
      await this.initializeCounter(counterType);
    }
  }

  async getNextNumbersForBatch(counterType: string, count: number): Promise<string[]> {
    const numbers: string[] = [];
    const counter = await this.counterModel.findOne({ counter_type: counterType }).exec();
    
    if (!counter) {
      const newCounter = await this.initializeCounter(counterType);
      for (let i = 0; i < count; i++) {
        numbers.push(await this.generateNumber(newCounter));
      }
      return numbers;
    }

    // Vérifier si on a assez de numéros disponibles
    const availableNumbers = counter.max_number - counter.last_number;
    if (availableNumbers < count) {
      throw new ConflictException(
        `Seulement ${availableNumbers} numéros disponibles pour ${counterType}, ${count} demandés`,
      );
    }

    for (let i = 0; i < count; i++) {
      numbers.push(await this.generateNumber(counter));
    }

    return numbers;
  }

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
        next: await this.generateNumber(newCounter),
        format: newCounter.format,
        max: newCounter.max_number,
        available: newCounter.max_number - newCounter.last_number,
      };
    }

    const nextNumber = await this.generateNumber(counter);
    // Annuler l'incrément car generateNumber a déjà incrémenté
    counter.last_number -= counter.increment;
    await counter.save();

    return {
      current: counter.last_number,
      next: nextNumber,
      format: counter.format,
      max: counter.max_number,
      available: counter.max_number - counter.last_number,
    };
  }
}
