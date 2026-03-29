import React, { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ProductForm from '@/components/products/ProductForm';
import ProductList from '@/components/products/ProductList';
import { useProductActions } from '@/components/products/hooks/useProductActions';
import { useDebounce } from '@/hooks/useDebounce';

const PAGE_SIZE = 50;

export default function Products() {
  const [searchTerm, setSearchTerm]       = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage]                   = useState(1);
  const [formOpen, setFormOpen]           = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const queryClient = useQueryClient();

  // Debounce la recherche pour éviter trop de requêtes
  const debouncedSearch = useDebounce(searchTerm, 350);

  // Remettre à la page 1 quand les filtres changent
  const handleSearch = (v) => { setSearchTerm(v); setPage(1); };
  const handleCategory = (v) => { setCategoryFilter(v); setPage(1); };

  const queryParams = {
    page,
    limit: PAGE_SIZE,
    ...(debouncedSearch && { q: debouncedSearch }),
    ...(categoryFilter !== 'all' && { category: categoryFilter }),
  };

  const { data: response = { data: [], total: 0, pages: 1 }, isLoading, isFetching } = useQuery({
    queryKey: ['products', queryParams],
    queryFn: () => base44.entities.Product.filter(queryParams),
    keepPreviousData: true,   // affiche la page précédente pendant le chargement
  });

  const products = response.data  ?? [];
  const total    = response.total ?? 0;
  const pages    = response.pages ?? 1;

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
  });

  const { createMutation, updateMutation, deleteProduct, isLoading: actionsLoading } = useProductActions();

  // Prefill depuis CustomerDetails
  React.useEffect(() => {
    const keys = Object.keys(sessionStorage);
    const productKey = keys.find(k => k.startsWith('prefilled_product_'));
    if (productKey) {
      try {
        const prefilledData = JSON.parse(sessionStorage.getItem(productKey));
        if (prefilledData) {
          setEditingProduct({
            ...prefilledData,
            name: prefilledData.name || '',
            reference: prefilledData.reference || '',
            category: prefilledData.category || 'produit_fini',
            customer_codes: prefilledData.customer_codes || [],
            buy_price: prefilledData.buy_price || 0,
            sell_price: prefilledData.sell_price || 0,
            stock_quantity: prefilledData.stock_quantity || 0,
            min_stock: prefilledData.min_stock || 0,
            description: prefilledData.description || '',
          });
          setFormOpen(true);
          sessionStorage.removeItem(productKey);
        }
      } catch {
        sessionStorage.removeItem(productKey);
      }
    }
  }, []);

  const handleSave = (data) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id || editingProduct._id, data }, {
        onSuccess: () => { setFormOpen(false); setEditingProduct(null); queryClient.invalidateQueries({ queryKey: ['products'] }); }
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => { setFormOpen(false); queryClient.invalidateQueries({ queryKey: ['products'] }); }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Produits</h1>
            <p className="text-slate-500 mt-1">
              {total > 0 ? `${total.toLocaleString('fr-FR')} produits au total` : 'Gérez votre catalogue'}
            </p>
          </div>
          <Button
            onClick={() => { setEditingProduct(null); setFormOpen(true); }}
            className="bg-slate-900 hover:bg-slate-800"
            disabled={actionsLoading}
          >
            <Plus className="w-4 h-4 mr-2" /> Nouveau produit
          </Button>
        </div>

        <ProductList
          products={products}
          isLoading={isLoading}
          isFetching={isFetching}
          searchTerm={searchTerm}
          categoryFilter={categoryFilter}
          onSearchChange={handleSearch}
          onCategoryFilterChange={handleCategory}
          onEdit={(p) => { setEditingProduct(p); setFormOpen(true); }}
          onDelete={deleteProduct}
          showFilters={true}
          // pagination
          page={page}
          pages={pages}
          total={total}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />

        <ProductForm
          open={formOpen}
          onOpenChange={setFormOpen}
          product={editingProduct}
          onSave={handleSave}
          allProducts={products}
          customers={customers}
        />
      </div>
    </div>
  );
}
