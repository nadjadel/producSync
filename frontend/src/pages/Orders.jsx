import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import OrderFormNew from '@/components/orders/OrderFormNew';
import OrderList from '@/components/orders/OrderList';
import { useOrderActions } from '@/components/orders/hooks/useOrderActions';

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_at'),
  });
  
  const { data: customers = [] } = useQuery({ 
    queryKey: ['customers'], 
    queryFn: () => base44.entities.Customer.list() 
  });
  
  const { data: productsResponse } = useQuery({
    queryKey: ['products', { limit: 9999 }],
    queryFn: () => base44.entities.Product.filter({ limit: 9999 }),
  });
  const products = productsResponse?.data ?? [];

  // Utiliser le hook d'actions
  const {
    createMutation,
    updateMutation,
    deleteOrder,
    confirmOrder,
    markInProduction,
    markReady,
    markDelivered,
    cancelOrder,
    isLoading: actionsLoading
  } = useOrderActions();

  // Check for prefilled data from customer details page
  React.useEffect(() => {
    const keys = Object.keys(sessionStorage);
    const orderKey = keys.find(key => key.startsWith('prefilled_order_'));

    if (orderKey) {
      try {
        const prefilledData = JSON.parse(sessionStorage.getItem(orderKey));

        if (prefilledData) {
          setEditingOrder({
            ...prefilledData,
            order_number: prefilledData.order_number || '',
            customer_id: prefilledData.customer_id || '',
            customer_name: prefilledData.customer_name || '',
            status: prefilledData.status || 'draft',
            order_date: prefilledData.order_date || new Date().toISOString().split('T')[0],
            delivery_date_requested: prefilledData.delivery_date_requested || '',
            items: prefilledData.items || [],
            notes: prefilledData.notes || '',
          });
          setFormOpen(true);
          sessionStorage.removeItem(orderKey);
        }
      } catch (error) {
        console.error('Error parsing prefilled order data:', error);
        sessionStorage.removeItem(orderKey);
      }
    }
  }, []);

  const handleSave = (data) => {
    if (editingOrder) {
      updateMutation.mutate({ id: editingOrder.id || editingOrder._id, data }, {
        onSuccess: () => {
          setFormOpen(false);
          setEditingOrder(null);
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

  const handleEdit = (order) => {
    setEditingOrder(order);
    setFormOpen(true);
  };

  const handleConfirm = (order) => {
    confirmOrder(order.id || order._id);
  };

  const handleMarkInProduction = (order) => {
    markInProduction(order.id || order._id);
  };

  const handleMarkReady = (order) => {
    markReady(order.id || order._id);
  };

  const handleMarkDelivered = (order) => {
    markDelivered(order.id || order._id);
  };

  const handleCancel = (order) => {
    cancelOrder(order.id || order._id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Commandes clients</h1>
            <p className="text-slate-500 mt-1">Gérez les commandes et générez les OF</p>
          </div>
          <Button 
            onClick={() => { 
              setEditingOrder(null); 
              setFormOpen(true); 
            }} 
            className="bg-slate-900 hover:bg-slate-800"
            disabled={actionsLoading}
          >
            <Plus className="w-4 h-4 mr-2" /> Nouvelle commande
          </Button>
        </div>

        <OrderList 
          orders={orders}
          isLoading={isLoading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onEdit={handleEdit}
          onDelete={deleteOrder}
          onConfirm={handleConfirm}
          onMarkInProduction={handleMarkInProduction}
          onMarkReady={handleMarkReady}
          onMarkDelivered={handleMarkDelivered}
          onCancel={handleCancel}
          showSearch={true}
          showActions={true}
        />

        <OrderFormNew 
          open={formOpen} 
          onOpenChange={setFormOpen} 
          order={editingOrder}
          onSave={handleSave}
          customers={customers} 
          products={products}
        />
      </div>
    </div>
  );
}