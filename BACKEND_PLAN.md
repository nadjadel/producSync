# 🚀 Plan Backend NestJS - ProducSync

## 📋 Vue d'ensemble

Ce document décrit le plan d'implémentation du backend NestJS pour l'application ProducSync (GPAO).

---

## ✅ Checklist d'implémentation

- [x] Structure du projet backend
- [x] Configuration MongoDB
- [x] Module Auth (JWT)
- [x] Module Users
- [x] Module Customers
- [x] Module Products
- [x] Module Orders (+ flux OF)
- [x] Module Quotes (+ conversion)
- [x] Module ManufacturingOrders
- [x] Module DeliveryNotes (+ regroupement)
- [x] Module Invoices (+ regroupement)
- [x] Module Counters
- [ ] Modules restants (CreditNotes, Workstations, StockMovements, Suppliers)
- [ ] Documentation Swagger
- [ ] Tests

---

## 📊 Progression

**Modules complétés (13/14):**
1. ✅ **Auth** - Authentification JWT avec guards, decorators et stratégies
2. ✅ **Users** - Gestion des utilisateurs
3. ✅ **Customers** - Gestion des clients
4. ✅ **Products** - Gestion des produits avec BOM
5. ✅ **Orders** - Commandes clients avec calcul automatique des totaux
6. ✅ **Quotes** - Devis avec conversion en commandes et expiration
7. ✅ **ManufacturingOrders** - Ordres de fabrication avec suivi de progression et sous-traitance
8. ✅ **DeliveryNotes** - Bons de livraison avec regroupement d'OFs et gestion de statut
9. ✅ **Invoices** - Factures avec regroupement de BLs et suivi de paiement
10. ✅ **Counters** - Compteurs pour numérotation automatique des documents
11. ✅ **Configuration** - MongoDB, rate limiting, sécurité
12. ✅ **Structure** - Architecture du projet
13. ✅ **Auth Module** - Module d'authentification complet

**Modules restants:**
1. **CreditNotes** - Avoirs
2. **Workstations** - Postes de travail
3. **StockMovements** - Mouvements de stock
4. **Suppliers** - Fournisseurs/sous-traitants

---

## 🔄 Flux Métiers implémentés

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

## 📡 Endpoints API disponibles

| Module | Endpoints |
|--------|-----------|
| **Auth** | `POST /auth/login`, `POST /auth/register`, `GET /auth/me`, `PATCH /auth/change-password`, `POST /auth/reset-password` |
| **Users** | CRUD + `POST /users/invite` |
| **Customers** | CRUD + search + payment terms |
| **Products** | CRUD + BOM + stock management + low-stock alerts |
| **Orders** | CRUD + status management + totals calculation |
| **Quotes** | CRUD + conversion to orders + expiration tracking |
| **ManufacturingOrders** | CRUD + progress tracking + delivery status + subcontracting |
| **DeliveryNotes** | CRUD + OF grouping + status management + invoicing |
| **Invoices** | CRUD + BL grouping + payment tracking + overdue management |
| **Counters** | Service injectable pour la numérotation automatique |
| **CreditNotes** | À implémenter |
| **Workstations** | À implémenter |
| **StockMovements** | À implémenter |
| **Suppliers** | À implémenter |

---

## 🔀 Stratégie Git utilisée

Tous les modules ont été créés avec le workflow suivant:
```bash
# 1. Créer la branche
git checkout main
git checkout -b feature/[module]-module

# 2. Développer et commiter
git add .
git commit -m "feat([module]): description"

# 3. Merger (sans suppression de branche)
git checkout main
git merge --no-ff feature/[module]-module
```

**Branches créées et mergées:**
- ✅ `feature/auth-module`
- ✅ `feature/users-module`
- ✅ `feature/customers-module`
- ✅ `feature/products-module`
- ✅ `feature/orders-module`
- ✅ `feature/quotes-module`
- ✅ `feature/manufacturing-orders-module`
- ✅ `feature/delivery-notes-module`
- ✅ `feature/invoices-module`
- ✅ `feature/counters-module`

---

## 📦 Stack Technique

- **NestJS** 10.x avec TypeScript
- **MongoDB** avec Mongoose 8.x
- **Passport.js** + JWT
- **bcrypt** pour le hashage
- **class-validator** / **class-transformer**
- **Swagger** pour la documentation API (à implémenter)
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

### Module Counters - Formats par défaut
- **OF**: `YYYY-OF-XXXX` (ex: 2024-OF-0001)
- **CO**: `YYYY-CO-XXXX` (ex: 2024-CO-0001)
- **DE**: `YYYY-DE-XXXX` (ex: 2024-DE-0001)
- **BL**: `YYYY-BL-XXXX` (ex: 2024-BL-0001)
- **FA**: `YYYY-FA-XXXX` (ex: 2024-FA-0001)
- **AV**: `YYYY-AV-XXXX` (ex: 2024-AV-0001)
- **PRODUCT**: `PR-XXXX` (ex: PR-0001)
- **CUSTOMER**: `CL-XXXX` (ex: CL-0001)
- **SUPPLIER**: `SU-XXXX` (ex: SU-0001)
