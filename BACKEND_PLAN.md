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

## ✅ Checklist d'implémentation

- [x] Structure du projet backend
- [x] Configuration MongoDB
- [x] Module Auth (JWT)
- [x] Module Users
- [x] Module Customers
- [x] Module Products
- [ ] Module Orders (+ flux OF)
- [ ] Module Quotes (+ conversion)
- [ ] Module ManufacturingOrders
- [ ] Module DeliveryNotes (+ regroupement)
- [ ] Module Invoices (+ regroupement)
- [ ] Modules restants (CreditNotes, Workstations, StockMovements, Suppliers, Counters)
- [ ] Documentation Swagger
- [ ] Tests
