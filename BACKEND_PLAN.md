# 🚀 Plan Backend NestJS - ProducSync

## 📋 Vue d'ensemble

Ce document décrit le plan d'implémentation du backend NestJS pour l'application ProducSync (GPAO).

---

## 🗃️ Entités

| Entité | Description |
|--------|-------------|
| **User** | Utilisateurs avec rôles (Administrator/User) |
| **Customer** | Clients avec infos facturation |
| **Product** | Produits avec nomenclature (BOM) |
| **Order** | Commandes clients |
| **Quote** | Devis clients |
| **Invoice** | Factures |
| **CreditNote** | Avoirs |
| **DeliveryNote** | Bons de livraison |
| **ManufacturingOrder** | Ordres de fabrication |
| **Workstation** | Postes de travail |
| **StockMovement** | Mouvements de stock |
| **Supplier** | Fournisseurs/sous-traitants |
| **Counter** | Compteurs pour numérotation |

---

## 🏗️ Architecture

```
backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── config/
│   │   └── configuration.ts
│   │
│   ├── database/
│   │   └── database.module.ts
│   │
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/jwt.strategy.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       └── register.dto.ts
│   │
│   ├── users/
│   ├── customers/
│   ├── products/
│   ├── orders/
│   ├── quotes/
│   ├── manufacturing-orders/
│   ├── delivery-notes/
│   ├── invoices/
│   ├── credit-notes/
│   ├── workstations/
│   ├── stock-movements/
│   ├── suppliers/
│   ├── counters/
│   │
│   └── common/
│       ├── filters/
│       ├── interceptors/
│       └── dto/
│
├── .env
├── package.json
├── tsconfig.json
└── nest-cli.json
```

---

## 🔐 Sécurité

| Fonctionnalité | Détail |
|----------------|--------|
| **JWT Auth** | Token Bearer, expiration 7 jours |
| **Password Hashing** | bcrypt avec 10 rounds |
| **Role-Based Access** | Decorator `@Roles('Administrator')` |
| **Guard Global** | Protection automatique de toutes les routes |
| **Validation** | class-validator sur tous les DTOs |
| **CORS** | Configuré pour le frontend |
| **Helmet** | Headers de sécurité HTTP |
| **Rate Limiting** | Protection contre les abus |

---

## 🔄 Flux Métiers

### Flux 1 : Commande → OF automatiques
```
POST /api/orders
→ Crée automatiquement un OF pour chaque ligne de commande
→ Génère un numéro OF via CounterService
```

### Flux 2 : OF → Bon de Livraison
```
POST /api/delivery-notes/from-ofs
Body: { ofIds: [...], customerId, deliveryDate, deliveryAddress }
→ Vérifie même client
→ Vérifie status = 'completed' OU ready_for_delivery = true
→ Crée BL avec CounterService.generateCode('BL')
→ MàJ chaque OF: delivered=true, delivery_note_id=BL.id
```

### Flux 3 : BL → Facture
```
POST /api/invoices/from-delivery-notes
Body: { blIds: [...], customerId, invoiceDate }
→ Vérifie même client, BL non facturés
→ Crée FA avec CounterService.generateCode('FA')
→ dueDate = invoiceDate + customer.paymentTerms jours
→ MàJ chaque BL: status='invoiced', invoice_id=FA.id
```

### Flux 4 : Devis → Commande
```
POST /api/quotes/:id/convert-to-order
→ Génère numéro CO via CounterService
→ Crée commande avec items du devis
→ MàJ devis: status='accepted', order_id=order.id
```

---

## 📡 Endpoints API

| Module | Endpoints |
|--------|-----------|
| **Auth** | `POST /auth/login`, `POST /auth/register`, `GET /auth/me` |
| **Users** | CRUD + `POST /users/invite` |
| **Customers** | CRUD standard |
| **Products** | CRUD standard |
| **Orders** | CRUD + création auto OF |
| **Quotes** | CRUD + `/convert-to-order` |
| **ManufacturingOrders** | CRUD standard |
| **DeliveryNotes** | CRUD + `/from-ofs` |
| **Invoices** | CRUD + `/from-delivery-notes` |
| **CreditNotes** | CRUD standard |
| **Workstations** | CRUD standard |
| **StockMovements** | CRUD standard |
| **Suppliers** | CRUD standard |
| **Counters** | `GET /counters/:type/next` |

---

## 🔀 Stratégie Git

| Module | Branche |
|--------|---------|
| Structure initiale | `feature/backend-setup` |
| Auth | `feature/auth-module` |
| Users | `feature/users-module` |
| Customers | `feature/customers-module` |
| Products | `feature/products-module` |
| Orders | `feature/orders-module` |
| Quotes | `feature/quotes-module` |
| ManufacturingOrders | `feature/manufacturing-orders-module` |
| DeliveryNotes | `feature/delivery-notes-module` |
| Invoices | `feature/invoices-module` |
| Modules restants | `feature/remaining-modules` |

### Workflow Git
```bash
# 1. Créer la branche
git checkout main
git checkout -b feature/[module]-module

# 2. Commit
git add .
git commit -m "feat([module]): description"

# 3. Merger (sans suppression de branche)
git checkout main
git merge --no-ff feature/[module]-module
```

---

## 📦 Stack Technique

- **NestJS** 10.x avec TypeScript
- **MongoDB** avec Mongoose 8.x
- **Passport.js** + JWT
- **bcrypt** pour le hashage
- **class-validator** / **class-transformer**
- **Swagger** pour la documentation API
- **Helmet** pour la sécurité HTTP
- **Throttler** pour le rate limiting

---

## ⚙️ Configuration

### Variables d'environnement (.env)
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=producSync_jwt_secret_2024_secure_key
JWT_EXPIRATION=7d
PORT=3000
```

---

## ✅ Checklist d'implémentation

- [ ] Structure du projet backend
- [ ] Configuration MongoDB
- [ ] Module Auth (JWT)
- [ ] Module Users
- [ ] Module Customers
- [ ] Module Products
- [ ] Module Orders (+ flux OF)
- [ ] Module Quotes (+ conversion)
- [ ] Module ManufacturingOrders
- [ ] Module DeliveryNotes (+ regroupement)
- [ ] Module Invoices (+ regroupement)
- [ ] Modules restants (CreditNotes, Workstations, StockMovements, Suppliers, Counters)
- [ ] Documentation Swagger
- [ ] Tests
