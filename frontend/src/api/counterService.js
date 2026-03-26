import { base44 } from './base44Client';

/**
 * Service pour interagir avec l'API de compteurs du backend
 */
export const counterService = {
  /**
   * Récupère le prochain numéro pour un type de compteur donné
   * @param {string} counterType - Type: DE (devis), CO (commande), FA (facture), BL (bon de livraison), OF (ordre de fabrication), ST (sous-traitance), etc.
   * @returns {Promise<string>} - Le prochain numéro formaté
   */
  async getNextNumber(counterType) {
    try {
      // Essayer d'abord l'API backend
      const response = await fetch(`http://localhost:3000/api/counters/${counterType}/next`);
      if (response.ok) {
        const data = await response.json();
        return data.next_number;
      }
    } catch (error) {
      console.warn(`API backend non disponible pour les compteurs, utilisation de base44: ${error.message}`);
    }
    
    // Fallback sur l'ancienne méthode base44
    const counters = await base44.entities.Counter.filter({ counter_type: counterType });
    
    let counter;
    if (counters.length === 0) {
      counter = await base44.entities.Counter.create({
        counter_type: counterType,
        last_number: 1
      });
    } else {
      counter = counters[0];
      const newNumber = (counter.last_number || 0) + 1;
      await base44.entities.Counter.update(counter.id, { last_number: newNumber });
      counter.last_number = newNumber;
    }

    if (counterType.startsWith('PRODUCT_')) {
      const clientCode = counterType.replace('PRODUCT_', '');
      return `${clientCode}${counter.last_number.toString().padStart(3, '0')}`;
    } else {
      return `${counterType}${counter.last_number.toString().padStart(8, '0')}`;
    }
  },

  /**
   * Récupère un aperçu du prochain numéro sans incrémenter le compteur
   * @param {string} counterType - Type de compteur
   * @returns {Promise<string>} - Aperçu du prochain numéro
   */
  async getNextNumberPreview(counterType) {
    try {
      const response = await fetch(`http://localhost:3000/api/counters/${counterType}/next-preview`);
      if (response.ok) {
        const data = await response.json();
        return data.next_number_preview;
      }
    } catch (error) {
      console.warn(`API backend non disponible pour preview, utilisation de base44: ${error.message}`);
    }
    
    // Fallback sur l'ancienne méthode
    const counters = await base44.entities.Counter.filter({ counter_type: counterType });
    
    if (counters.length === 0) {
      return `${counterType}00000001`;
    }
    
    const counter = counters[0];
    const nextNumber = (counter.last_number || 0) + 1;
    
    if (counterType.startsWith('PRODUCT_')) {
      const clientCode = counterType.replace('PRODUCT_', '');
      return `${clientCode}${nextNumber.toString().padStart(3, '0')}`;
    } else {
      return `${counterType}${nextNumber.toString().padStart(8, '0')}`;
    }
  },

  /**
   * Génère un code produit avec préfixe client
   * @param {string} customerPrefix - Préfixe client (3 lettres)
   * @returns {Promise<string>} - Code produit formaté
   */
  async getNextProductCode(customerPrefix) {
    try {
      const response = await fetch('http://localhost:3000/api/counters/product-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customer_prefix: customerPrefix }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.product_code;
      }
    } catch (error) {
      console.warn(`API backend non disponible pour product code, utilisation de base44: ${error.message}`);
    }
    
    // Fallback sur l'ancienne méthode
    const counterType = `PRODUCT_${customerPrefix}`;
    return this.getNextNumber(counterType);
  },

  /**
   * Génère un code client de 3 lettres
   * @returns {Promise<string>} - Code client de 3 lettres
   */
  async getNextCustomerCode() {
    try {
      const response = await fetch('http://localhost:3000/api/counters/customer-code/next');
      if (response.ok) {
        const data = await response.json();
        return data.customer_code;
      }
    } catch (error) {
      console.warn(`API backend non disponible pour customer code, utilisation de base44: ${error.message}`);
    }
    
    // Fallback sur l'ancienne méthode
    const counters = await base44.entities.Counter.filter({ counter_type: 'CUSTOMER' });
    
    let counter;
    if (counters.length === 0) {
      counter = await base44.entities.Counter.create({
        counter_type: 'CUSTOMER',
        last_number: 1
      });
    } else {
      counter = counters[0];
      const newNumber = (counter.last_number || 0) + 1;
      await base44.entities.Counter.update(counter.id, { last_number: newNumber });
      counter.last_number = newNumber;
    }
    
    // Générer 3 lettres à partir du nombre
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    let n = counter.last_number;
    
    for (let i = 0; i < 3; i++) {
      const remainder = n % 26;
      code = letters[remainder] + code;
      n = Math.floor(n / 26);
    }
    
    return code.padStart(3, 'A');
  },

  /**
   * Récupère les informations d'un compteur
   * @param {string} counterType - Type de compteur
   * @returns {Promise<Object>} - Informations du compteur
   */
  async getCounterInfo(counterType) {
    try {
      const response = await fetch(`http://localhost:3000/api/counters/${counterType}/info`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn(`API backend non disponible pour info, utilisation de base44: ${error.message}`);
    }
    
    // Fallback minimal
    return {
      current: 0,
      next: `${counterType}00000001`,
      format: `${counterType}XXXXXXXX`,
      max: 99999999,
      available: 99999999,
    };
  }
};