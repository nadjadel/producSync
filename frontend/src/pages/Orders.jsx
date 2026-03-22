import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, MoreVertical, Pencil, Trash2, ShoppingCart, Cog } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getNextNumber } from '@/components/utils/counterUtils';
import OrderFormNew from '@/components/orders/OrderFormNew';

const STATUS_CONFIG = {
  draft:         { label: 'Brouillon',     class: 'bg-slate-100 text-slate-700' },
  confirmed:     { label: 'Confirmée',     class: 'bg-blue-100 text-blue-700' },
  in_production: { label: 'En production', class: 'bg-amber-100 text-amber-700' },
  ready:         { label: 'Prête',         class: 'bg-purple-100 text-purple-700' },
  delivered:     { label: 'Livrée',        class: 'bg-emerald-100 text-emerald-700' },
  cancelled:     { label: 'Annulée',       class: 'bg-rose-100 text-rose-700' },
};

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_at'),
  });
  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: () => base44.entities.Customer.list() });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: () => base44.entities.Product.list() });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const createdOrder = await base44.entities.Order.create(data);
      const ofPromises = data.items.map(async item => {
        const ofNumber = await getNextNumber('OF');
        return base44.entities.ManufacturingOrder.create({
          order_number: ofNumber,
          customer_order_id: createdOrder.id,
          customer_order_number: data.order_number,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity_planned: item.quantity,
          quantity_produced: 0,
          status: 'draft',
          priority: 'medium',
          ready_for_delivery: false,
          delivered: false,
        });
      });
      await Promise.all(ofPromises);
      return createdOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['manufacturing-orders'] });
      toast.success('Commande créée + OF générés automatiquement');
      setFormOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Order.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Commande mise à jour');
      setFormOpen(false);
      setEditingOrder(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Order.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['orders'] }); toast.success('Commande supprimée'); },
  });

  const handleSave = (data) => {
    if (editingOrder) updateMutation.mutate({ id: editingOrder.id, data });
    else createMutation.mutate(data);
  };

  const filtered = orders.filter(o =>
    o.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Commandes clients</h1>
            <p className="text-slate-500 mt-1">Gérez les commandes et générez les OF</p>
          </div>
          <Button onClick={() => { setEditingOrder(null); setFormOpen(true); }} className="bg-slate-900 hover:bg-slate-800">
            <Plus className="w-4 h-4 mr-2" /> Nouvelle commande
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Rechercher une commande..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-white" />
          </div>
        </div>

        {isLoading ? <Skeleton className="h-96 rounded-xl" /> :
          filtered.length === 0 && orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm">
              <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600">Aucune commande</h3>
              <p className="text-slate-400 mt-1">Créez votre première commande client</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold">N° Commande</TableHead>
                    <TableHead className="font-semibold">Client</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Livraison</TableHead>
                    <TableHead className="font-semibold">Montant TTC</TableHead>
                    <TableHead className="font-semibold">Statut</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((order) => {
                    const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.draft;
                    return (
                      <TableRow key={order.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-semibold">{order.order_number}</TableCell>
                        <TableCell>{order.customer_name}</TableCell>
                        <TableCell className="text-slate-500">
                          {order.order_date && format(new Date(order.order_date), "dd MMM yyyy", { locale: fr })}
                        </TableCell>
                        <TableCell className="text-slate-500">
                          {order.delivery_date_requested ? format(new Date(order.delivery_date_requested), "dd MMM yyyy", { locale: fr }) : '-'}
                        </TableCell>
                        <TableCell className="font-semibold">{order.total_ttc?.toFixed(2)} €</TableCell>
                        <TableCell><Badge className={statusConfig.class}>{statusConfig.label}</Badge></TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setEditingOrder(order); setFormOpen(true); }}>
                                <Pencil className="w-4 h-4 mr-2" /> Modifier
                              </DropdownMenuItem>
                              {order.status === 'confirmed' && (
                                <DropdownMenuItem asChild>
                                  <Link to={createPageUrl("ManufacturingOrders")}>
                                    <Cog className="w-4 h-4 mr-2" /> Voir les OF
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => { if (confirm(`Supprimer la commande "${order.order_number}" ?`)) deleteMutation.mutate(order.id); }} className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )
        }

        <OrderFormNew open={formOpen} onOpenChange={setFormOpen} order={editingOrder} onSave={handleSave} customers={customers} products={products} />
      </div>
    </div>
  );
}
