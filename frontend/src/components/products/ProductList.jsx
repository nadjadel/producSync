import React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Package } from "lucide-react";
import ProductCard from './ProductCard';

const ProductList = ({ 
  products = [], 
  isLoading = false, 
  searchTerm = '', 
  categoryFilter = 'all',
  onSearchChange = () => {},
  onCategoryFilterChange = () => {},
  onEdit = () => {},
  onDelete = () => {},
  showFilters = true
}) => {
  const filtered = products.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       p.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    );
  }

  if (filtered.length === 0 && products.length === 0) {
    return (
      <div className="text-center py-16">
        <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-600">Aucun produit trouvé</h3>
        <p className="text-slate-400 mt-1">Commencez par créer votre premier produit</p>
      </div>
    );
  }

  if (filtered.length === 0 && products.length > 0) {
    return (
      <div className="text-center py-16">
        <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-600">Aucun produit trouvé</h3>
        <p className="text-slate-400 mt-1">Essayez de modifier vos critères de recherche</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Rechercher un produit..." 
              value={searchTerm} 
              onChange={(e) => onSearchChange(e.target.value)} 
              className="pl-10 bg-white" 
            />
          </div>
          <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
            <SelectTrigger className="w-full sm:w-48 bg-white">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              <SelectItem value="matiere_premiere">Matières premières</SelectItem>
              <SelectItem value="semi_fini">Semi-finis</SelectItem>
              <SelectItem value="produit_fini">Produits finis</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(product => {
          const productId = product.id || product._id;
          return (
            <ProductCard 
              key={productId} 
              product={product}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ProductList;