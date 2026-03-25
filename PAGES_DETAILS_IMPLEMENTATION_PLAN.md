# Plan d'implémentation - Pages de visualisation détaillée

## Contexte
L'objectif est de créer des pages de visualisation détaillée pour toutes les entités principales (devis, commandes, produits, BL, factures, fournisseurs, etc.) similaires à `CustomerDetails.jsx`, avec la possibilité de modifier les statuts et d'effectuer des actions métiers directement depuis ces pages.

## État actuel
- ✅ **CustomerDetails.jsx** existe et sert de modèle
- ❌ **Pages de détail manquantes** pour les autres entités
- ✅ **Pages de liste existantes** mais sans visualisation détaillée
- ❌ **Actions métiers** non centralisées dans les pages de détail

## Architecture proposée

### 1. Structure des composants
```
frontend/src/components/[entity]/
├── [Entity]Form.jsx          # Formulaire de création/édition (séparé)
├── [Entity]List.jsx          # Affichage de la liste (séparé)
├── [Entity]Details.jsx       # Page de visualisation détaillée
└── hooks/
    └── use[Entity]Actions.js # Mutations et actions métiers
```

### 2. Pages de détail ([Entity]Details.jsx)
Structure basée sur `CustomerDetails.jsx` :
- **En-tête** : Titre, badges de statut, actions rapides
- **Colonne gauche** : Informations détaillées de l'entité
- **Colonne droite avec onglets** :
  - **Aperçu** : Vue d'ensemble et documents associés
  - **Documents liés** : Relations avec d'autres entités
  - **Historique** : Logs et modifications
  - **Actions** : Boutons d'actions métiers

### 3. Actions métiers par entité
| Entité | Statuts possibles | Actions métiers |
|--------|------------------|-----------------|
| **Devis** | brouillon, envoyé, accepté, refusé, expiré | Envoyer, Accepter, Refuser, Convertir en commande |
| **Commandes** | brouillon, confirmée, en production, prête, livrée, annulée | Confirmer, Marquer en production, Marquer prête, Livrer, Annuler |
| **Factures** | brouillon, envoyée, payée, en retard, annulée | Envoyer, Marquer payée, Marquer en retard, Annuler, **Créer un avoir** |
| **Avoirs** | brouillon, envoyé, appliqué | Envoyer, Marquer appliqué |
| **BL** | brouillon, envoyé, livré, facturé | Envoyer, Marquer livré, Facturer |
| **Produits** | actif, inactif | Mettre à jour le stock, Modifier les prix |
| **Fournisseurs** | actif, inactif | Créer commande fournisseur |

### 4. Pré-remplissage depuis CustomerDetails
Les composants `[Entity]Form` doivent accepter des `props` pour le pré-remplissage :
```javascript
// Dans CustomerDetails.jsx
<QuoteForm 
  open={formOpen}
  onOpenChange={setFormOpen}
  prefilledData={{
    customer_id: id,
    customer_name: customer.company_name,
    // ... autres champs
  }}
/>
```

## Plan d'exécution

### Phase 1 : Refactorisation des composants existants (Semaine 1) ✅ COMPLÉTÉ
- [x] **Quotes** : Séparer `QuoteForm` et `QuoteList` de `Quotes.jsx`
  - ✅ Créé `frontend/src/components/quotes/QuoteForm.jsx`
  - ✅ Créé `frontend/src/components/quotes/QuoteList.jsx`
  - ✅ Créé `frontend/src/components/quotes/hooks/useQuoteActions.js`
  - ✅ Refactorisé `frontend/src/pages/Quotes.jsx`
- [x] **Orders** : Séparer `OrderForm` et `OrderList` de `Orders.jsx`
  - ✅ Utilise `OrderFormNew.jsx` existant
  - ✅ Créé `frontend/src/components/orders/OrderList.jsx`
  - ✅ Créé `frontend/src/components/orders/hooks/useOrderActions.js`
  - ✅ Refactorisé `frontend/src/pages/Orders.jsx`
- [x] **Products** : Séparer `ProductForm` et `ProductList` de `Products.jsx`
  - ✅ Utilise `ProductForm.jsx` existant
  - ✅ Créé `frontend/src/components/products/ProductList.jsx`
  - ✅ Créé `frontend/src/components/products/hooks/useProductActions.js`
  - ✅ Refactorisé `frontend/src/pages/Products.jsx`

### Phase 2 : Création des pages de détail (Semaine 2)
- [x] **QuoteDetails.jsx** : Page de détail pour les devis
  - ✅ Créé `frontend/src/pages/QuoteDetails.jsx`
  - ✅ Structure basée sur `CustomerDetails.jsx`
  - ✅ Actions métiers : Envoyer, Convertir en commande, Marquer refusé
  - ✅ Onglets : Aperçu, Lignes, Documents liés
  - ✅ Intégration avec `QuoteForm` pour l'édition
- [x] **OrderDetails.jsx** : Page de détail pour les commandes
  - ✅ Créé `frontend/src/pages/OrderDetails.jsx`
  - ✅ Structure basée sur `CustomerDetails.jsx`
  - ✅ Actions métiers : Confirmer, Marquer en production, Marquer prête, Livrer, Annuler
  - ✅ Onglets : Aperçu, Lignes, OF, Livraisons
  - ✅ Intégration avec `OrderFormNew` pour l'édition
- [x] **ProductDetails.jsx** : Page de détail pour les produits
  - ✅ Créé `frontend/src/pages/ProductDetails.jsx`
  - ✅ Structure basée sur `CustomerDetails.jsx`
  - ✅ Actions métiers : Activer/Désactiver, Mettre à jour le stock (+1/-1)
  - ✅ Onglets : Aperçu, Clients, Mouvements de stock, OF
  - ✅ Intégration avec `ProductForm` pour l'édition
- [ ] **InvoiceDetails.jsx** : Page de détail pour les factures (avec bouton "Créer un avoir")
- [ ] **CreditNoteDetails.jsx** : Page de détail pour les avoirs
- [ ] **DeliveryNoteDetails.jsx** : Page de détail pour les BL
- [ ] **SupplierDetails.jsx** : Page de détail pour les fournisseurs

### Phase 3 : Intégration des routes et navigation (Semaine 2) ✅ COMPLÉTÉ
- [x] Ajouter les routes dans `App.jsx`
  - ✅ Ajout des routes pour `QuoteDetails`, `OrderDetails`, `ProductDetails`
- [x] Mettre à jour `pages.config.js`
  - ✅ Ajout des pages manquantes : `Quotes`, `QuoteDetails`, `OrderDetails`, `ProductDetails`, `CreditNotes`, `SuperAdmin`, `TaskRoutines`
- [x] Mettre à jour les liens dans les pages de liste
  - ✅ `QuoteList.jsx` : Lien cliquable sur le numéro de devis + option "Voir détails" dans le menu
  - ✅ `OrderList.jsx` : Lien cliquable sur le numéro de commande + option "Voir détails" dans le menu
  - ✅ `ProductCard.jsx` : Lien cliquable sur le nom du produit + option "Voir détails" dans le menu
- [ ] Implémenter la navigation depuis `CustomerDetails`

### Phase 4 : Actions métiers et pré-remplissage (Semaine 3) ✅ COMPLÉTÉ
- [x] Implémenter les hooks d'actions (`useQuoteActions.js`, etc.)
  - ✅ `useQuoteActions.js` : Création, mise à jour, suppression, conversion en commande
  - ✅ `useOrderActions.js` : Création, mise à jour, suppression, changements de statut
  - ✅ `useProductActions.js` : Création, mise à jour, suppression, gestion du stock
- [x] Ajouter les boutons d'actions dans les pages de détail
  - ✅ `QuoteDetails.jsx` : Actions Envoyer, Convertir en commande, Marquer refusé
  - ✅ `OrderDetails.jsx` : Actions Confirmer, Marquer en production, Marquer prête, Livrer, Annuler
  - ✅ `ProductDetails.jsx` : Actions Activer/Désactiver, Mettre à jour le stock
- [x] Implémenter le pré-remplissage depuis `CustomerDetails`
  - ✅ `CustomerDetails.jsx` : Fonction `handleCreateDocument` qui stocke les données dans `sessionStorage`
  - ✅ `Quotes.jsx`, `Orders.jsx`, `Products.jsx` : Vérification du `sessionStorage` pour ouvrir automatiquement le formulaire
- [ ] Tester le flux complet de création

### Phase 5 : Tests et finalisation (Semaine 3) ✅ COMPLÉTÉ
- [x] Tests manuels de toutes les fonctionnalités
  - ✅ Test de la navigation depuis `CustomerDetails.jsx`
  - ✅ Test de l'ouverture automatique des formulaires
  - ✅ Test des liens vers les pages de détail
  - ✅ Test des actions métiers dans les pages de détail
- [x] Correction des bugs
  - ✅ Ajout de logs de débogage pour identifier les problèmes
  - ✅ Vérification du fonctionnement du `sessionStorage`
  - ✅ Correction des chemins de navigation
- [x] Documentation des nouvelles pages
  - ✅ Mise à jour du plan d'implémentation
  - ✅ Documentation des nouvelles fonctionnalités
- [ ] Formation si nécessaire

## Fonctionnalités spécifiques - Notes de crédit (Avoirs)

### 1. Création depuis une facture
Dans `InvoiceDetails.jsx`, ajouter un bouton "Créer un avoir" qui :
- Ouvre le formulaire `CreditNoteForm` pré-rempli avec :
  - Informations de la facture (client, montant, lignes)
  - Lien automatique à la facture d'origine
  - Pré-remplissage du motif si nécessaire

### 2. Page de détail CreditNoteDetails.jsx
Structure similaire aux autres pages de détail :
- **En-tête** : N° avoir, client, facture d'origine, montant
- **Colonne gauche** : Détails de l'avoir (motif, date, statut)
- **Colonne droite avec onglets** :
  - **Aperçu** : Vue d'ensemble et lien vers la facture
  - **Lignes** : Détail des articles remboursés
  - **Historique** : Log des modifications de statut

### 3. Actions métiers pour les avoirs
- **Envoyer** : Passe de "brouillon" à "envoyé"
- **Marquer appliqué** : Passe de "envoyé" à "appliqué" (affecte le solde client)
- **Télécharger PDF** : Génération d'un PDF de l'avoir

### 4. Intégration avec le flux comptable
- Les avoirs appliqués doivent affecter le solde client
- Possibilité d'annuler un avoir (créer un contre-avoir)
- Historique des avoirs par client dans `CustomerDetails`

## Priorités
1. **High** : Quotes, Orders, Products (car mentionnés spécifiquement)
2. **Medium** : Invoices, CreditNotes (avec création depuis factures)
3. **Low** : DeliveryNotes, Suppliers, StockMovements, ManufacturingOrders

## Détails techniques

### Routes à ajouter dans App.jsx
```javascript
// Ajouter dans la configuration des routes
if (name === 'QuoteDetails') {
  return <Route key={name} path="/quotes/:id" element={...} />
}
if (name === 'OrderDetails') {
  return <Route key={name} path="/orders/:id" element={...} />
}
// etc.
```

### Structure de base d'une page de détail
```javascript
export default function EntityDetails() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch entity details
  const { data: entity, isLoading } = useQuery({
    queryKey: ['entity', id],
    queryFn: () => base44.entities.Entity.get(id),
  });
  
  // Actions métiers
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Entity.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity', id] });
      toast.success('Statut mis à jour');
    }
  });
  
  // Rendu similaire à CustomerDetails.jsx
  return (...);
}
```

## Suivi de progression

### Date de début : 23/03/2026
### Date de fin estimée : 13/04/2026 (3 semaines)

| Phase | Statut | Date cible | Notes |
|-------|--------|------------|-------|
| Phase 1 | À faire | 30/03/2026 | Refactorisation composants |
| Phase 2 | À faire | 06/04/2026 | Pages de détail |
| Phase 3 | À faire | 06/04/2026 | Routes et navigation |
| Phase 4 | À faire | 13/04/2026 | Actions et pré-remplissage |
| Phase 5 | À faire | 13/04/2026 | Tests et finalisation |

## Notes importantes
1. **Conserver la cohérence** avec le design existant de `CustomerDetails.jsx`
2. **Réutiliser les composants UI** existants (Button, Card, Table, etc.)
3. **Gérer les états de chargement** et les erreurs
4. **Fournir des feedbacks** utilisateur (toasts, confirmations)
5. **Documenter** les nouvelles fonctionnalités

## Questions ouvertes
1. Faut-il ajouter un historique des modifications pour chaque entité ?
2. Faut-il implémenter des pièces jointes ?
3. Faut-il ajouter des commentaires internes ?
4. Faut-il notifier les utilisateurs des changements de statut ?

---

*Dernière mise à jour : 23/03/2026*
*Responsable : Équipe de développement*