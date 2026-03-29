import React from 'react';
import { Link } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Search, Package, MoreVertical, Pencil, Trash2, Eye, AlertTriangle,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2,
} from "lucide-react";

const CATEGORY_CONFIG = {
  matiere_premiere: { label: 'Matière première', class: 'bg-amber-100 text-amber-700' },
  semi_fini:        { label: 'Semi-fini',         class: 'bg-blue-100 text-blue-700' },
  produit_fini:     { label: 'Produit fini',       class: 'bg-emerald-100 text-emerald-700' },
};

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ page, pages, total, pageSize, onPageChange, isFetching }) {
  if (pages <= 1 && total <= pageSize) return null;

  const from  = (page - 1) * pageSize + 1;
  const to    = Math.min(page * pageSize, total);

  // Fenêtre de pages : max 7 boutons autour de la page courante
  const buildRange = () => {
    const delta = 2;
    const range = [];
    for (let i = Math.max(1, page - delta); i <= Math.min(pages, page + delta); i++) {
      range.push(i);
    }
    if (range[0] > 2) range.unshift('...');
    if (range[0] !== 1) range.unshift(1);
    if (range[range.length - 1] < pages - 1) range.push('...');
    if (range[range.length - 1] !== pages) range.push(pages);
    return range;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-3 border-t border-slate-100">
      <p className="text-sm text-slate-500">
        {isFetching
          ? <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Chargement…</span>
          : `${from}–${to} sur ${total.toLocaleString('fr-FR')}`}
      </p>

      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8"
          onClick={() => onPageChange(1)} disabled={page === 1 || isFetching}>
          <ChevronsLeft className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8"
          onClick={() => onPageChange(page - 1)} disabled={page === 1 || isFetching}>
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {buildRange().map((p, i) =>
          p === '...'
            ? <span key={`dots-${i}`} className="px-1 text-slate-400 text-sm">…</span>
            : (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                size="icon"
                className={`h-8 w-8 text-sm ${p === page ? 'bg-slate-900 text-white' : ''}`}
                onClick={() => onPageChange(p)}
                disabled={isFetching}
              >
                {p}
              </Button>
            )
        )}

        <Button variant="outline" size="icon" className="h-8 w-8"
          onClick={() => onPageChange(page + 1)} disabled={page === pages || isFetching}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8"
          onClick={() => onPageChange(pages)} disabled={page === pages || isFetching}>
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Saut de page direct */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span>Page</span>
        <Input
          type="number"
          min={1}
          max={pages}
          defaultValue={page}
          key={page}
          onBlur={(e) => {
            const v = parseInt(e.target.value);
            if (v >= 1 && v <= pages) onPageChange(v);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const v = parseInt(e.target.value);
              if (v >= 1 && v <= pages) onPageChange(v);
            }
          }}
          className="w-16 h-8 text-center"
        />
        <span>/ {pages}</span>
      </div>
    </div>
  );
}

// ─── ProductList ──────────────────────────────────────────────────────────────

const ProductList = ({
  products = [],
  isLoading = false,
  isFetching = false,
  searchTerm = '',
  categoryFilter = 'all',
  onSearchChange = () => {},
  onCategoryFilterChange = () => {},
  onEdit = () => {},
  onDelete = () => {},
  showFilters = true,
  page = 1,
  pages = 1,
  total = 0,
  pageSize = 50,
  onPageChange = () => {},
}) => {

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtres */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Référence, désignation, client…"
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

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* État vide */}
        {products.length === 0 && !isFetching && (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Aucun produit trouvé</p>
            <p className="text-slate-400 text-sm mt-1">
              {searchTerm ? 'Modifiez votre recherche' : 'Commencez par créer un produit'}
            </p>
          </div>
        )}

        {products.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-500">Référence</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Désignation</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 hidden md:table-cell">Client</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 hidden lg:table-cell">Catégorie</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500 hidden sm:table-cell">Stock</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500 hidden sm:table-cell">Prix vente</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-slate-100 transition-opacity duration-150 ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
              {products.map(product => {
                const productId = product.id || product._id;
                const isLowStock = product.stock_quantity != null &&
                  product.stock_minimum != null &&
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
                      {catConfig
                        ? <Badge className={catConfig.class}>{catConfig.label}</Badge>
                        : '—'}
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
                    <td className="px-4 py-3">
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
        )}

        {/* Pagination intégrée dans la carte */}
        {(pages > 1 || total > pageSize) && (
          <div className="px-4">
            <Pagination
              page={page}
              pages={pages}
              total={total}
              pageSize={pageSize}
              onPageChange={onPageChange}
              isFetching={isFetching}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductList;
