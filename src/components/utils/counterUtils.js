import { base44 } from '@/api/base44Client';

/**
 * Génère le prochain numéro pour un type de compteur donné
 * @param {string} counterType - Type: OF, CO, DE, BL, FA, AV, PRODUCT_{CODE_CLIENT}
 * @returns {Promise<string>} - Numéro formaté
 */
export async function getNextNumber(counterType) {
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
}

/**
 * Génère un code client unique de 3 lettres à partir du nom
 * @param {string} companyName - Nom de l'entreprise
 * @param {Array} existingCustomers - Liste des clients existants
 * @returns {string} - Code unique de 3 lettres
 */
export function generateCustomerCode(companyName, existingCustomers) {
  const cleanName = companyName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 3);

  let code = cleanName.padEnd(3, 'X');
  const existingCodes = existingCustomers.map(c => c.code);
  let counter = 1;
  const originalCode = code;

  while (existingCodes.includes(code)) {
    code = originalCode.slice(0, 2) + counter.toString();
    counter++;
  }

  return code;
}
