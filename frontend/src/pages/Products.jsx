import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ProductForm from '@/components/products/ProductForm';
import ProductList from '@/components/products/ProductList';
import { useProductActions } from '@/components/products/hooks/useProductActions';

export default function Products() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });
  
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
  });

  // Utiliser le hook d'actions
  const {
    createMutation,
    updateMutation,
    deleteProduct,
    isLoading: actionsLoading
  } = useProductActions();

  // Check for prefilled data from customer details page
  React.useEffect(() => {
    // Look for any prefilled product data in sessionStorage
    const keys = Object.keys(sessionStorage);
    console.log(`[DEBUG Products.jsx] Checking sessionStorage keys:`, keys);
    const productKey = keys.find(key => key.startsWith('prefilled_product_'));
    console.log(`[DEBUG Products.jsx] Found productKey:`, productKey);
    
    if (productKey) {
      try {
        const prefilledData = JSON.parse(sessionStorage.getItem(productKey));
        console.log(`[DEBUG Products.jsx] Parsed prefilled data:`, prefilledData);
        console.log(`[DEBUG Products.jsx] formOpen state:`, formOpen);
        
        if (prefilledData && !formOpen) {
          console.log(`[DEBUG Products.jsx] Setting editing product and opening form`);
          // Set the prefilled data as editing product to auto-open form
          setEditingProduct({
            ...prefilledData,
            // Ensure we have required fields
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
          // Clear the sessionStorage item
          sessionStorage.removeItem(productKey);
          console.log(`[DEBUG Products.jsx] Removed sessionStorage key:`, productKey);
        }
      } catch (error) {
        console.error('[DEBUG Products.jsx] Error parsing prefilled product data:', error);
        sessionStorage.removeItem(productKey);
      }
    }
  }, [formOpen]);

  const handleSave = (data) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id || editingProduct._id, data }, {
        onSuccess: () => {
          setFormOpen(false);
          setEditingProduct(null);
        }
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          setFormOpen(false);
        }
      });
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Produits</h1>
            <p className="text-slate-500 mt-1">Gérez votre catalogue de produits</p>
          </div>
          <Button 
            onClick={() => { 
              setEditingProduct(null); 
              setFormOpen(true); 
            }} 
            className="bg-slate-900 hover:bg-slate-800"
            disabled={actionsLoading}
          >
            <Plus className="w-4 h-4 mr-2" /> Nouveau produit
          </Button>
        </div>

        <ProductList 
          products={products}
          isLoading={isLoading}
          searchTerm={searchTerm}
          categoryFilter={categoryFilter}
          onSearchChange={setSearchTerm}
          onCategoryFilterChange={setCategoryFilter}
          onEdit={handleEdit}
          onDelete={deleteProduct}
          showFilters={true}
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