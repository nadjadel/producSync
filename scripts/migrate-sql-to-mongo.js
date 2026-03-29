'use strict';

/**
 * Migration MySQL → MongoDB
 * Source : dump phpMyAdmin (127_0_0_1.sql)
 * Cible  : collections producSync
 *
 * Usage :
 *   node scripts/migrate-sql-to-mongo.js [chemin/vers/127_0_0_1.sql]
 *
 * Sortie :
 *   mongo-import/customers.ndjson
 *   mongo-import/suppliers.ndjson
 *   mongo-import/products.ndjson
 *   mongo-import/quotes.ndjson
 *   mongo-import/orders.ndjson
 *   mongo-import/manufacturing-orders.ndjson
 */

const fs   = require('fs');
const path = require('path');

const SQL_FILE   = process.argv[2] ||
  'C:\\Users\\nadja\\OneDrive\\Documents\\dev\\ctsm\\bckup\\www\\gestion\\js\\upload\\DJA012449\\127_0_0_1.sql';
const OUTPUT_DIR = path.join(__dirname, '..', 'mongo-import');
const DB_NAME    = 'producSync';

// ─── Read file ────────────────────────────────────────────────────────────────

console.log(`Reading ${SQL_FILE} …`);
const rawBuffer = fs.readFileSync(SQL_FILE);
const sql = rawBuffer.toString('latin1');   // MySQL latin1 charset
console.log(`  ${(rawBuffer.length / 1024 / 1024).toFixed(1)} MB loaded`);

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ─── SQL parser ───────────────────────────────────────────────────────────────

/**
 * Find the end of the INSERT statement (semicolon not inside a string).
 */
function findStatementEnd(from) {
  let i = from;
  while (i < sql.length) {
    const ch = sql[i];
    if (ch === "'") {
      i++;
      while (i < sql.length) {
        if (sql[i] === '\\') { i += 2; continue; }
        if (sql[i] === "'")  { i++; break; }
        i++;
      }
    } else if (ch === ';') {
      return i;
    } else {
      i++;
    }
  }
  return sql.length;
}

/**
 * Parse the VALUES section of an INSERT statement.
 * Returns array of arrays (one per row).
 */
function parseValueRows(str) {
  const rows = [];
  let i = 0;
  const len = str.length;

  while (i < len) {
    // Skip whitespace / commas between rows
    while (i < len && '\t\n\r ,'.includes(str[i])) i++;
    if (i >= len || str[i] !== '(') break;
    i++; // consume '('

    const row = [];

    while (i < len) {
      // Skip leading whitespace
      while (i < len && (str[i] === ' ' || str[i] === '\t')) i++;

      if (str[i] === ')') { i++; break; }
      if (str[i] === ',') { i++; continue; }

      if (str[i] === "'") {
        // Quoted string
        i++;
        let val = '';
        while (i < len) {
          if (str[i] === '\\') {
            i++;
            const esc = str[i] ?? '';
            const MAP = { "'": "'", '\\': '\\', n: '\n', r: '\r', t: '\t', '0': '\0' };
            val += MAP[esc] ?? esc;
            i++;
          } else if (str[i] === "'") {
            if (str[i + 1] === "'") { val += "'"; i += 2; }
            else                    { i++; break; }
          } else {
            val += str[i++];
          }
        }
        row.push(val);
      } else if (str.substring(i, i + 4).toUpperCase() === 'NULL') {
        row.push(null);
        i += 4;
      } else {
        // Number or unquoted value
        let val = '';
        while (i < len && str[i] !== ',' && str[i] !== ')') val += str[i++];
        val = val.trim();
        row.push(val === '' ? null : isNaN(val) ? val : Number(val));
        continue; // i already positioned at , or )
      }
    }

    rows.push(row);
  }

  return rows;
}

/**
 * Extract all INSERT rows for a given table name.
 * Returns { columns: string[], rows: any[][] }
 */
function extractInserts(tableName) {
  const searchStr = `INSERT INTO \`${tableName}\``;
  const result    = { columns: [], rows: [] };
  let   pos       = 0;

  while (true) {
    const insertIdx = sql.indexOf(searchStr, pos);
    if (insertIdx === -1) break;

    // Columns list: first (...) after INSERT INTO `table`
    const parenOpen  = sql.indexOf('(', insertIdx);
    const parenClose = sql.indexOf(')', parenOpen);
    const columns    = sql.substring(parenOpen + 1, parenClose)
      .split(',')
      .map(c => c.trim().replace(/`/g, ''));

    // VALUES section
    const valuesIdx = sql.indexOf('VALUES', parenClose);
    const endIdx    = findStatementEnd(valuesIdx + 6);
    const valuesSec = sql.substring(valuesIdx + 6, endIdx);

    const rows = parseValueRows(valuesSec);

    if (result.columns.length === 0) result.columns = columns;
    result.rows.push(...rows);

    pos = endIdx;
  }

  return result;
}

/** Convert parallel arrays to objects. */
function toObjects({ columns, rows }) {
  return rows.map(row => {
    const obj = {};
    columns.forEach((col, i) => { obj[col] = row[i] ?? null; });
    return obj;
  });
}

// ─── Date helper ──────────────────────────────────────────────────────────────

function parseDate(v) {
  if (!v) return null;
  const s = String(v).trim();
  if (!s || s.startsWith('0000')) return null;
  try {
    const d = new Date(s);
    return isNaN(d) ? null : d.toISOString();
  } catch { return null; }
}

// ─── Status mappings ──────────────────────────────────────────────────────────

function quoteStatus(s) {
  if (!s) return 'draft';
  if (s.startsWith('Ferm')) return 'completed';
  if (s === 'Ouvert')        return 'draft';
  return 'draft';
}

function orderStatus(s) {
  if (!s) return 'draft';
  if (s.startsWith('Ferm'))  return 'completed';
  if (s === 'Ouvert')        return 'confirmed';
  if (s === 'En cours')      return 'in_production';
  return 'draft';
}

function ofStatus(s) {
  if (!s) return 'draft';
  if (s.startsWith('Ferm'))  return 'completed';
  if (s === 'Ouvert' || s === 'En cours') return 'in_progress';
  return 'draft';
}

// ─── Transformers ─────────────────────────────────────────────────────────────

function transformCustomer(r) {
  return {
    code:          r.code || '',
    company_name:  (r.Societe  || '').trim(),
    contact_name:  (r.Contact1 || '').trim() || null,
    address:       [r.Adresse1, r.Adresse2].filter(a => a && a.trim()).map(a => a.trim()).join(', ') || null,
    postal_code:   r.CP ? String(r.CP) : null,
    city:          (r.Ville || '').trim() || null,
    country:       (r.Pays  || '').trim() || null,
    phone:         (r.Tel   || '').trim() || null,
    email:         (r.Email || '').trim() || null,
    payment_terms: r.Condpaie || null,
    status:        r.statut === 'ouvert' ? 'active' : 'inactive',
    vat_number:    (r.cee   || '').trim() || null,
    created_at:    new Date().toISOString(),
  };
}

function transformSupplier(r) {
  return {
    code:          r.code || '',
    company_name:  (r.Societe  || '').trim(),
    contact_name:  (r.Contact1 || '').trim() || null,
    address:       [r.Adresse1, r.Adresse2].filter(a => a && a.trim()).map(a => a.trim()).join(', ') || null,
    postal_code:   r.CP ? String(r.CP) : null,
    city:          (r.Ville || '').trim() || null,
    country:       (r.Pays  || '').trim() || null,
    phone:         (r.Tel   || '').trim() || null,
    fax:           (r.Fax   || '').trim() || null,
    email:         (r.Email || '').trim() || null,
    status:        r.statut === 'ouvert' ? 'active' : 'inactive',
    created_at:    new Date().toISOString(),
  };
}

function transformProduct(r, customerMap) {
  const customerCode = (r.Num_client || '').trim();
  return {
    reference:          (r.REFART      || '').trim(),
    customer_reference: (r.ref_client  || '').trim() || null,
    name:               (r.Libelle     || '').trim(),
    description:        (r.commentaire || '').trim() || null,
    customer_code:      customerCode || null,
    customer_name:      customerMap[customerCode] || null,
    thickness:          r.epaisseur ? String(r.epaisseur).trim() : null,
    material:           r.Matiere   ? String(r.Matiere).trim()   : null,
    ral:                (r.RAL    || '').trim() || null,
    motif:              (r.motif  || '').trim() || null,
    length_mm:          r.longueur_piece || null,
    width_mm:           r.largeur_piece  || null,
    sell_price:         r.PU_HT  || 0,
    stock_quantity:     r.stock  || 0,
    qty_per_sheet:      r.qte_feuille || 0,
    status:             'active',
    created_at:         parseDate(r.date_crea),
    updated_at:         parseDate(r.date_maj),
  };
}

function buildItems(lines) {
  return (lines || []).map(l => ({
    product_reference:        (l.CODE_ARTICLE || '').trim(),
    product_name:             (l.CODE_ARTICLE || '').trim(),
    quantity:                 l.QUANTITE             || 0,
    unit_price:               l.PRIX_VENTE_UNITAIRE  || 0,
    total:                    (l.QUANTITE || 0) * (l.PRIX_VENTE_UNITAIRE || 0),
    delivery_date_requested:  parseDate(l.DATE_LIVRAISON_DEMANDEE),
  }));
}

function transformQuote(h, linesMap, customerMap) {
  const lines    = linesMap[String(h.NUMERO_COMMANDE)] || [];
  const items    = buildItems(lines);
  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const frais    = (h.MONTANT_PORT || 0) + (h.MONTANT_FORFAIT_PRISE_EN_CHARGE || 0) + (h.MONTANT_DIVERS || 0);
  const code     = (h.CODE_CLIENT || '').trim();

  return {
    quote_number:          (h.CODE_COMMANDE       || '').trim(),
    customer_code:          code || null,
    customer_name:          customerMap[code] || null,
    customer_reference:    (h.REFERENCE_CLIENT    || '').trim() || null,
    quote_date:             parseDate(h.DATE_COMMANDE),
    status:                 quoteStatus(h.CODE_STATUT),
    items,
    total_ht:               subtotal,
    total_vat:              0,
    total_ttc:              subtotal + frais,
    linked_order_number:   (h.CODE_CLIENT_COMMANDE || '').trim() || null,
    created_at:             parseDate(h.DATE_COMMANDE),
  };
}

function transformOrder(h, linesMap, customerMap) {
  const lines    = linesMap[String(h.NUMERO_COMMANDE)] || [];
  const items    = buildItems(lines).map((item, i) => ({
    ...item,
    line_status: lines[i]?.statut  || null,
    of_number:   lines[i]?.CODE_OF || null,
  }));
  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const frais    = (h.MONTANT_PORT || 0) + (h.MONTANT_FORFAIT_PRISE_EN_CHARGE || 0) + (h.MONTANT_DIVERS || 0);
  const code     = (h.CODE_CLIENT || '').trim();

  return {
    order_number:       (h.CODE_COMMANDE     || '').trim(),
    customer_code:       code || null,
    customer_name:       customerMap[code] || null,
    customer_reference: (h.REFERENCE_CLIENT  || '').trim() || null,
    order_date:          parseDate(h.DATE_COMMANDE),
    status:              orderStatus(h.CODE_STATUT),
    items,
    total_ht:            subtotal,
    total_vat:           0,
    total_ttc:           subtotal + frais,
    created_at:          parseDate(h.DATE_COMMANDE),
  };
}

function transformOf(r, articleMap, orderCodeMap) {
  const ref = (r.CODE_ARTICLE || '').trim();
  return {
    order_number:          (r.CODE_OF || '').trim(),
    customer_order_number:  orderCodeMap[String(r.NUMERO_COMMANDE)] || null,
    product_reference:      ref || null,
    product_name:           articleMap[ref] || null,
    quantity_planned:       r.QUANTITE_NECESSAIRE || 0,
    quantity_produced:      r.QUANTITE_LANCEE     || 0,
    status:                 ofStatus(r.STATUT),
    priority:               r.ORDONNANCEMENT_PRIORITE === 'Normal' ? 'medium' : 'medium',
    due_date:               parseDate(r.DATE_BESOIN),
    start_date:             parseDate(r.DATE_LANCEMENT),
    completion_date:        parseDate(r.DATE_FIN_FABRICATION),
    ready_for_delivery:     r.STATUT?.startsWith('Ferm') ?? false,
    created_at:             parseDate(r.DATE_CREATION),
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log('\nExtracting INSERT statements…');

const clientsRaw    = toObjects(extractInserts('clients'));
const foursRaw      = toObjects(extractInserts('fournisseur'));
const articlesRaw   = toObjects(extractInserts('article'));
const devisRaw      = toObjects(extractInserts('client_devis'));
const devisLigRaw   = toObjects(extractInserts('client_devis_ligne'));
const commandeRaw   = toObjects(extractInserts('client_commande'));
const commandeLigRaw= toObjects(extractInserts('client_commande_ligne'));
const ofRaw         = toObjects(extractInserts('ordre_fabrication'));

console.log(`  clients           : ${clientsRaw.length}`);
console.log(`  fournisseur       : ${foursRaw.length}`);
console.log(`  article           : ${articlesRaw.length}`);
console.log(`  client_devis      : ${devisRaw.length}`);
console.log(`  client_devis_ligne: ${devisLigRaw.length}`);
console.log(`  client_commande   : ${commandeRaw.length}`);
console.log(`  client_commande_ligne: ${commandeLigRaw.length}`);
console.log(`  ordre_fabrication : ${ofRaw.length}`);

// Lookup maps
const customerMap = {};
clientsRaw.forEach(c => { customerMap[(c.code || '').trim()] = (c.Societe || '').trim(); });

const articleMap = {};
articlesRaw.forEach(a => { articleMap[(a.REFART || '').trim()] = (a.Libelle || '').trim(); });

// order NUMERO_COMMANDE → CODE_COMMANDE  (for OF join)
const orderCodeMap = {};
commandeRaw.forEach(c => { orderCodeMap[String(c.NUMERO_COMMANDE)] = (c.CODE_COMMANDE || '').trim(); });

// Lines maps
const devisLigMap = {};
devisLigRaw.forEach(l => {
  const k = String(l.NUMERO_COMMANDE);
  (devisLigMap[k] = devisLigMap[k] || []).push(l);
});

const commandeLigMap = {};
commandeLigRaw.forEach(l => {
  const k = String(l.NUMERO_COMMANDE);
  (commandeLigMap[k] = commandeLigMap[k] || []).push(l);
});

// Transform
console.log('\nTransforming…');

const customersOut  = clientsRaw.map(transformCustomer);
const suppliersOut  = foursRaw.map(transformSupplier);
const productsOut   = articlesRaw.map(r => transformProduct(r, customerMap));
const quotesOut     = devisRaw.map(h => transformQuote(h, devisLigMap, customerMap));
const ordersOut     = commandeRaw.map(h => transformOrder(h, commandeLigMap, customerMap));
const mfgOrdersOut  = ofRaw.map(r => transformOf(r, articleMap, orderCodeMap));

// Write NDJSON
console.log('\nWriting NDJSON files…');

function writeNDJSON(filename, records) {
  const outPath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(outPath, records.map(r => JSON.stringify(r)).join('\n'), 'utf8');
  console.log(`  ✓ ${filename}  (${records.length} docs)`);
  return filename;
}

const written = [
  writeNDJSON('customers.ndjson',           customersOut),
  writeNDJSON('suppliers.ndjson',           suppliersOut),
  writeNDJSON('products.ndjson',            productsOut),
  writeNDJSON('quotes.ndjson',              quotesOut),
  writeNDJSON('orders.ndjson',             ordersOut),
  writeNDJSON('manufacturing-orders.ndjson', mfgOrdersOut),
];

// Print mongoimport commands
console.log('\n══════════════════════════════════════════════════════');
console.log('  COMMANDES MONGOIMPORT');
console.log('══════════════════════════════════════════════════════');
written.forEach(f => {
  const col = f.replace('.ndjson', '');
  console.log(`mongoimport --db ${DB_NAME} --collection ${col} --type json --file mongo-import/${f}`);
});
console.log('\nNote : ajoutez --drop pour vider la collection avant import.');
console.log('Terminé !');
