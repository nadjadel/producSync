# Plan de Génération Automatique des Codes

## Problèmes Identifiés

### 1. Problème Principal : Génération manuelle des codes
**Situation actuelle** : Le frontend génère certains codes (ex: `quote_number` via `counterService.getNextNumber('DE')`) et les envoie au backend.

**Problème** : 
- Incohérence avec d'autres entités (commandes, avoirs génèrent déjà leurs codes côté backend)
- Risque de conflits si deux utilisateurs créent en même temps
- Séparation des responsabilités incorrecte

### 2. Problème Secondaire : Affichage des détails de commande
**Situation actuelle** : La page `CustomerDetails.jsx` n'affiche pas les détails des lignes de commande (items).

**Problème** : Les utilisateurs ne peuvent pas voir le contenu des commandes depuis la page client.

### 3. Problème Supplémentaire : Génération d'OF
**Situation actuelle** : Les Ordres de Fabrication (OF) ne sont pas générés automatiquement lors de la création d'une commande.

**Problème** : Processus manuel requis pour créer des OF à partir des commandes.

## Solutions Proposées

### Solution 1 : Génération automatique des codes backend
- **Tous les services** doivent générer leurs codes automatiquement
- **Pattern à suivre** : Comme `orders.service.ts` qui utilise `CountersService`
- **Codes concernés** :
  - Quote (DE) : `quote_number`
  - Product : `reference`
  - Customer : `code`
  - Invoice (FA) : `invoice_number`
  - Manufacturing Order (OF) : `order_number`
  - Delivery Note (BL) : `delivery_note_number`
  - Supplier (SU) : `code`
  - Supplier Order (ST) : `order_number`

### Solution 2 : Amélioration de l'affichage CustomerDetails
- **Option A** : Ajouter une colonne "Items" avec résumé
- **Option B** : Rows expandables avec détails
- **Option C** : S'assurer que `OrderDetails.jsx` affiche correctement les items

### Solution 3 : Génération automatique d'OF
- **Logique** : Lors de la création d'une commande, créer automatiquement des OF pour les items nécessitant fabrication
- **Critères** : Produits avec `requires_manufacturing = true` ou similaires

## Plan d'Implémentation

### Phase 1 : Génération automatique des codes backend
**Services à modifier** (dans l'ordre de priorité) :

1. **Quotes Service** (`backend/src/quotes/quotes.service.ts`)
   - Importer `CountersService`
   - Modifier `create()` pour générer `quote_number` avec `countersService.getNextNumber('DE')`
   - Vérifier l'unicité
   - Empêcher la modification dans `update()`

2. **Products Service** (`backend/src/products/products.service.ts`)
   - Importer `CountersService`
   - Modifier `create()` pour générer `reference` avec `countersService.getNextProductCode(customerPrefix)`
   - Vérifier l'unicité

3. **Customers Service** (`backend/src/customers/customers.service.ts`)
   - Importer `CountersService`
   - Modifier `create()` pour générer `code` avec `countersService.getNextCustomerCode()`
   - Vérifier l'unicité

4. **Manufacturing Orders Service** (`backend/src/manufacturing-orders/manufacturing-orders.service.ts`)
   - Importer `CountersService`
   - Modifier `create()` pour générer `order_number` avec `countersService.getNextNumber('OF')`
   - Vérifier l'unicité

5. **Invoices Service** (`backend/src/invoices/invoices.service.ts`)
   - À vérifier, probablement similaire

6. **Delivery Notes Service** (`backend/src/delivery-notes/delivery-notes.service.ts`)
   - À vérifier, probablement similaire

7. **Suppliers Service** (`backend/src/suppliers/suppliers.service.ts`)
   - Vérifier si déjà partiellement implémenté

### Phase 2 : Génération automatique d'OF
**Modification de `orders.service.ts`** :
- Dans la méthode `create()`, après la création de la commande
- Pour chaque item nécessitant fabrication
- Créer un Manufacturing Order avec :
  - `customer_order_id` = ID de la commande
  - `customer_order_number` = `order_number` de la commande
  - `product_id` = produit de l'item
  - `quantity_planned` = quantité de l'item
  - `order_number` généré automatiquement
  - Statut initial = 'planned'

### Phase 3 : Mise à jour des formulaires frontend
**Formulaires à modifier** :

1. **QuoteForm.jsx** (`frontend/src/components/quotes/QuoteForm.jsx`)
   - Retirer le champ `quote_number`
   - Ne plus appeler `counterService.getNextNumber('DE')`
   - Afficher "Généré automatiquement"

2. **ProductForm.jsx** (`frontend/src/components/products/ProductForm.jsx`)
   - Retirer le champ `reference`
   - Afficher "Généré automatiquement"

3. **CustomerForm.jsx** (à localiser)
   - Retirer le champ `code`
   - Afficher "Généré automatiquement"

4. **Autres formulaires** : Appliquer le même pattern

### Phase 4 : Amélioration de CustomerDetails
**Modification de `CustomerDetails.jsx`** :
- Option A (recommandée) : Ajouter une colonne "Items" dans le tableau des commandes
- Afficher : "X produits, Total: Y€"
- Optionnel : Tooltip avec liste des produits

### Phase 5 : Tests
**Scénarios de test** :

1. **Création sans code** :
   - Créer un devis sans fournir `quote_number` → Vérifier qu'il est généré
   - Créer un produit sans `reference` → Vérifier qu'il est généré
   - Créer un client sans `code` → Vérifier qu'il est généré

2. **Génération d'OF** :
   - Créer une commande avec items → Vérifier que les OF sont créés
   - Vérifier que les OF ont les bonnes informations

3. **Affichage** :
   - Vérifier que CustomerDetails affiche les résumés de commande
   - Vérifier que les formulaires n'ont plus de champs de code

## Services Impactés (Backend)

### 1. Quotes Service
- **Fichier** : `backend/src/quotes/quotes.service.ts`
- **Modifications** :
  ```typescript
  // Ajouter l'import
  import { CountersService } from '../counters/counters.service';
  
  // Ajouter au constructor
  constructor(
    @InjectModel(Quote.name) private quoteModel: Model<QuoteDocument>,
    private readonly countersService: CountersService,
  ) {}
  
  // Modifier create()
  async create(createQuoteDto: CreateQuoteDto): Promise<QuoteDocument> {
    // Générer le numéro automatiquement
    const generatedQuoteNumber = await this.countersService.getNextNumber('DE');
    
    // Vérifier l'unicité
    const existingQuote = await this.quoteModel.findOne({
      quote_number: generatedQuoteNumber,
    }).exec();
    
    if (existingQuote) {
      throw new ConflictException(`Le numéro de devis ${generatedQuoteNumber} est déjà utilisé`);
    }
    
    // Créer avec le numéro généré
    const quote = new this.quoteModel({
      ...createQuoteDto,
      quote_number: generatedQuoteNumber, // Toujours utiliser le numéro généré
    });
    
    this.calculateTotals(quote);
    return quote.save();
  }
  ```

### 2. Products Service
- **Fichier** : `backend/src/products/products.service.ts`
- **Modifications** : Similaire, utiliser `getNextProductCode()`

### 3. Customers Service
- **Fichier** : `backend/src/customers/customers.service.ts`
- **Modifications** : Similaire, utiliser `getNextCustomerCode()`

### 4. Manufacturing Orders Service
- **Fichier** : `backend/src/manufacturing-orders/manufacturing-orders.service.ts`
- **Modifications** : Similaire, utiliser `getNextNumber('OF')`

### 5. Orders Service (pour génération d'OF)
- **Fichier** : `backend/src/orders/orders.service.ts`
- **Modifications** : Ajouter la logique de création d'OF après `order.save()`

## Modules à Mettre à Jour

Chaque service modifié doit aussi mettre à jour son module pour inclure `CountersService` :

```typescript
// Dans quotes.module.ts, products.module.ts, etc.
import { CountersModule } from '../counters/counters.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Quote.name, schema: QuoteSchema }]),
    CountersModule, // Ajouter cette ligne
  ],
  // ...
})
```

## Notes Techniques

### Serveurs en mode watch
- Les serveurs tournent déjà en arrière-plan
- Pas besoin de les relancer manuellement
- Les changements seront automatiquement pris en compte

### Compatibilité
- Les anciennes données avec codes manuels restent compatibles
- Les nouvelles données auront des codes générés automatiquement
- Les updates ne permettent pas de modifier les codes

### Tests API
- Utiliser les endpoints existants
- Vérifier les réponses contiennent les codes générés
- Tester les validations d'unicité

## Chronologie

1. **Jour 1** : Quotes Service + tests
2. **Jour 2** : Products, Customers Services + tests
3. **Jour 3** : Manufacturing Orders, génération d'OF + tests
4. **Jour 4** : Frontend (formulaires) + tests
5. **Jour 5** : CustomerDetails amélioration + tests finaux

## Responsables
- **Backend modifications** : Cline (IA Assistant)
- **Frontend modifications** : Cline (IA Assistant)
- **Tests** : Cline (IA Assistant) avec validation utilisateur

## Date de Début
26 mars 2026

## Statut
- [x] Analyse complète
- [x] Plan documenté
- [x] Implémentation Phase 1 (Quotes Service)
  - [x] Backend: Quotes Service modifié pour générer automatiquement `quote_number`
  - [x] Backend: Quotes Module mis à jour pour inclure CountersModule
  - [x] Frontend: QuoteForm.jsx modifié pour ne plus générer/envoiyer `quote_number`
- [x] Implémentation Phase 2 (Products, Customers)
  - [x] Backend: Products Service modifié pour générer automatiquement `reference`
  - [x] Backend: Products Module mis à jour pour inclure CountersModule
  - [x] Backend: Customers Service modifié pour générer automatiquement `code`
  - [x] Backend: Customers Module mis à jour pour inclure CountersModule
- [x] Implémentation Phase 3 (Manufacturing Orders, OF génération)
  - [x] Backend: Manufacturing Orders Service modifié pour générer automatiquement `order_number`
  - [x] Backend: Manufacturing Orders Module mis à jour pour inclure CountersModule
  - [x] Backend: Orders Service modifié pour créer automatiquement des OF lors de la création d'une commande
  - [x] Backend: Orders Module mis à jour pour inclure ManufacturingOrdersModule
- [x] Implémentation Phase 4 (Frontend formulaires - autres)
- [x] Implémentation Phase 5 (CustomerDetails amélioration)
- [x] Tests complets
- [ ] Validation utilisateur
