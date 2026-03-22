import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import OrderForm from '@/components/orders/OrderForm';
import OrderTable from '@/components/orders/OrderTable';

export default function ManufacturingOrders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['manufacturing-orders'],
    queryFn: () => base44.entities.ManufacturingOrder.list('-created_at'),
  });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: () => base44.entities.Product.list() });
  const { data: workstations = [] } = useQuery({ queryKey: ['workstations'], queryFn: () => base44.entities.Workstation.list() });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ManufacturingOrder.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['manufacturing-orders'] }); toast.success('OF créé'); setFormOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ManufacturingOrder.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['manufacturing-orders'] }); toast.success('OF mis à jour'); setFormOpen(false); setEditingOrder(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ManufacturingOrder.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['manufacturing-orders'] }); toast.success('OF supprimé'); },
  });

  const handleStatusChange = (order, newStatus) => {
    const updateData = { status: newStatus };
    if (newStatus === 'in_progress') updateData.actual_start = new Date().toISOString();
    else if (newStatus === 'completed') { updateData.actual_end = new Date().toISOString(); updateData.quantity_produced = order.quantity_planned; }
    else if (newStatus === 'ready_for_delivery') { updateData.ready_for_delivery = true; updateData.status = 'completed'; }
    updateMutation.mutate({ id: order.id, data: updateData });
  };

  const filtered = orders.filter(o => {
    const matchSearch = o.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) || o.product_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Ordres de fabrication</h1>
            <p className="text-slate-500 mt-1">Planifiez et suivez votre production</p>
          </div>
          <Button onClick={() => { setEditingOrder(null); setFormOpen(true); }} className="bg-slate-900 hover:bg-slate-800">
            <Plus className="w-4 h-4 mr-2" /> Nouvel OF
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Rechercher un OF..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-white" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-white"><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="planned">Planifié</SelectItem>
              <SelectItem value="in_progress">En cours</SelectItem>
              <SelectItem value="completed">Terminé</SelectItem>
              <SelectItem value="cancelled">Annulé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? <Skeleton className="h-96 rounded-xl" /> :
          filtered.length === 0 && orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm">
              <ClipboardList className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600">Aucun ordre de fabrication</h3>
              <p className="text-slate-400 mt-1">Créez votre premier OF pour démarrer</p>
            </div>
          ) : (
            <OrderTable orders={filtered}
              onEdit={(o) => { setEditingOrder(o); setFormOpen(true); }}
              onDelete={(o) => { if (confirm(`Supprimer l'OF "${o.order_number}" ?`)) deleteMutation.mutate(o.id); }}
              onStatusChange={handleStatusChange} />
          )
        }

        <OrderForm open={formOpen} onOpenChange={setFormOpen} order={editingOrder}
          onSave={(data) => { if (editingOrder) updateMutation.mutate({ id: editingOrder.id, data }); else createMutation.mutate(data); }}
          products={products} workstations={workstations} />
      </div>
    </div>
  );
}
