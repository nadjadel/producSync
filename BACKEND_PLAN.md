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
- [ ] Module Quotes (+ conversion)
- [ ] Module ManufacturingOrders
- [ ] Module DeliveryNotes (+ regroupement)
- [ ] Module Invoices (+ regroupement)
- [ ] Modules restants (CreditNotes, Workstations, StockMovements, Suppliers, Counters)
- [ ] Documentation Swagger
- [ ] Tests

---

## 📊 Progression

**Modules complétés (7/14):**
1. ✅ **Auth** - Authentification JWT
2. ✅ **Users** - Gestion des utilisateurs
3. ✅ **Customers** - Gestion des clients
4. ✅ **Products** - Gestion des produits avec BOM
5. ✅ **Orders** - Commandes clients avec calcul automatique des totaux
6. ✅ **Configuration** - MongoDB, rate limiting, sécurité
7. ✅ **Structure** - Architecture du projet

**Modules restants:**
1. **Quotes** - Devis avec conversion en commandes
2. **ManufacturingOrders** - Ordres de fabrication
3. **DeliveryNotes** - Bons de livraison avec regroupement d'OFs
4. **Invoices** - Factures avec regroupement de BLs
5. **CreditNotes** - Avoirs
6. **Workstations** - Postes de travail
7. **StockMovements** - Mouvements de stock
8. **Suppliers** - Fournisseurs/sous-traitants
9. **Counters** - Compteurs pour numérotation

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
| **Auth** | `POST /auth/login`, `POST /auth/register`, `GET /auth/me` |
| **Users** | CRUD + `POST /users/invite` |
| **Customers** | CRUD + search + payment terms |
| **Products** | CRUD + BOM + stock management + low-stock alerts |
| **Orders** | CRUD + status management + totals calculation |
| **Quotes** | À implémenter |
| **ManufacturingOrders** | À implémenter |
| **DeliveryNotes** | À implémenter |
| **Invoices** | À implémenter |
| **CreditNotes** | À implémenter |
| **Workstations** | À implémenter |
| **StockMovements** | À implémenter |
| **Suppliers** | À implémenter |
| **Counters** | À implémenter |

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
