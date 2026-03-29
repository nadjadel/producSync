import React from 'react';
import { Link } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Package, MoreVertical, Pencil, Trash2, Eye, AlertTriangle } from "lucide-react";

const CATEGORY_CONFIG = {
  matiere_premiere: { label: 'Matière première', class: 'bg-amber-100 text-amber-700' },
  semi_fini:        { label: 'Semi-fini',         class: 'bg-blue-100 text-blue-700' },
  produit_fini:     { label: 'Produit fini',       class: 'bg-emerald-100 text-emerald-700' },
};

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
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-600">Aucun produit trouvé</h3>
        <p className="text-slate-400 mt-1">Commencez par créer votre premier produit</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-4">
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

      <div className="text-sm text-slate-400">
        {filtered.length} produit{filtered.length > 1 ? 's' : ''}
        {filtered.length < products.length && ` sur ${products.length}`}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 font-medium text-slate-500">Référence</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Désignation</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 hidden md:table-cell">Client</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 hidden lg:table-cell">Catégorie</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500 hidden sm:table-cell">Stock</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500 hidden sm:table-cell">Prix vente</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(product => {
              const productId = product.id || product._id;
              const isLowStock = product.stock_quantity !== undefined &&
                product.stock_minimum !== undefined &&
                product.stock_quantity <= product.stock_minimum;
              const catConfig = CATEGORY_CONFIG[product.category];

              return (
                <tr key={productId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">
                    {product.reference}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/products/${productId}`}
                      className="font-medium text-slate-900 hover:text-blue-600 hover:underline"
                    >
                      {product.name}
                    </Link>
                    {product.customer_reference && (
                      <p className="text-xs text-slate-400">{product.customer_reference}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-500 text-xs">
                    {product.customer_code || '—'}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {catConfig ? (
                      <Badge className={catConfig.class}>{catConfig.label}</Badge>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    <span className={isLowStock ? 'text-red-600 font-semibold' : 'text-slate-700'}>
                      {product.stock_quantity ?? 0}
                      {isLowStock && <AlertTriangle className="inline w-3 h-3 ml-1" />}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell text-slate-700">
                    {(product.sell_price || 0).toFixed(2)} €
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/products/${productId}`} className="flex items-center">
                            <Eye className="w-4 h-4 mr-2" /> Voir détails
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(product)}>
                          <Pencil className="w-4 h-4 mr-2" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(product)} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && products.length > 0 && (
          <div className="text-center py-10 text-slate-400">
            Aucun produit ne correspond à la recherche
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductList;
