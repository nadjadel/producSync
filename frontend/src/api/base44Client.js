/**
 * base44Client.js — stub de migration
 * Remplace les appels base44 par des appels REST vers le backend NestJS.
 * 
 * MIGRATION : Remplacer progressivement par des appels directs à l'API NestJS.
 * URL de base configurable via VITE_API_URL dans .env
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function getToken() {
  return localStorage.getItem('producSync_token');
}

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.status === 204 ? null : res.json();
}

/**
 * Fabrique un objet CRUD pour une entité donnée.
 * Usage: base44.entities.Customer.list(), .create(), .update(), .delete()
 */
function makeEntity(path) {
  return {
    list: (sort = '-created_at', limit = 100) =>
      request('GET', `/${path}?sort=${sort}&limit=${limit}`),
    filter: (params) => {
      const qs = new URLSearchParams(params).toString();
      return request('GET', `/${path}?${qs}`);
    },
    get: (id) => request('GET', `/${path}/${id}`),
    create: (data) => request('POST', `/${path}`, data),
    update: (id, data) => request('PATCH', `/${path}/${id}`, data),
    delete: (id) => request('DELETE', `/${path}/${id}`),
  };
}

export const base44 = {
  entities: {
    Counter:             makeEntity('counters'),
    Customer:            makeEntity('customers'),
    Product:             makeEntity('products'),
    TaskRoutine:         makeEntity('task-routines'),
    Quote:               makeEntity('quotes'),
    Order:               makeEntity('orders'),
    ManufacturingOrder:  makeEntity('manufacturing-orders'),
    Workstation:         makeEntity('workstations'),
    StockMovement:       makeEntity('stock-movements'),
    DeliveryNote:        makeEntity('delivery-notes'),
    Invoice:             makeEntity('invoices'),
    CreditNote:          makeEntity('credit-notes'),
  },

  auth: {
    me: () => request('GET', '/auth/me'),
    login: (email, password) => request('POST', '/auth/login', { email, password }),
    logout: () => {
      localStorage.removeItem('producSync_token');
      return Promise.resolve();
    },
  },

  appLogs: {
    logUserInApp: (pageName) => request('POST', '/logs/navigation', { page: pageName }).catch(() => {}),
  },
};
