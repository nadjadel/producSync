import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, MoreVertical, Trash2, FileText, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import DeliveryNoteForm from '@/components/delivery/DeliveryNoteForm';

const STATUS_CONFIG = {
  draft:    { label: 'Brouillon', class: 'bg-slate-100 text-slate-700' },
  sent:     { label: 'Envoyé',    class: 'bg-blue-100 text-blue-700' },
  invoiced: { label: 'Facturé',   class: 'bg-emerald-100 text-emerald-700' },
};

export default function DeliveryNotes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: deliveryNotes = [], isLoading } = useQuery({
    queryKey: ['delivery-notes'],
    queryFn: () => base44.entities.DeliveryNote.list('-created_at'),
  });
  const { data: manufacturingOrders = [] } = useQuery({
    queryKey: ['manufacturing-orders'],
    queryFn: () => base44.entities.ManufacturingOrder.list(),
  });
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
  });

  const createMutation = useMutation({
    mutationFn: async ({ deliveryNote, selectedOFs }) => {
      const created = await base44.entities.DeliveryNote.create(deliveryNote);
      await Promise.all(selectedOFs.map(of =>
        base44.entities.ManufacturingOrder.update(of.id, { delivered: true, delivery_note_id: created.id })
      ));
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-notes'] });
      queryClient.invalidateQueries({ queryKey: ['manufacturing-orders'] });
      toast.success('Bon de livraison créé');
      setFormOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DeliveryNote.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['delivery-notes'] }); toast.success('BL supprimé'); },
  });

  const markAsSentMutation = useMutation({
    mutationFn: (id) => base44.entities.DeliveryNote.update(id, { status: 'sent' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['delivery-notes'] }); toast.success('BL marqué envoyé'); },
  });

  const filtered = deliveryNotes.filter(dn =>
    dn.delivery_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dn.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Bons de livraison</h1>
            <p className="text-slate-500 mt-1">Gérez vos livraisons clients</p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="bg-slate-900 hover:bg-slate-800">
            <Plus className="w-4 h-4 mr-2" /> Nouveau BL
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Rechercher un BL..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-white" />
          </div>
        </div>

        {isLoading ? <Skeleton className="h-96 rounded-xl" /> :
          filtered.length === 0 && deliveryNotes.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600">Aucun bon de livraison</h3>
              <p className="text-slate-400 mt-1">Créez votre premier BL depuis les OF terminés</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold">N° BL</TableHead>
                    <TableHead className="font-semibold">Client</TableHead>
                    <TableHead className="font-semibold">Commande</TableHead>
                    <TableHead className="font-semibold">Date livraison</TableHead>
                    <TableHead className="font-semibold">Nb articles</TableHead>
                    <TableHead className="font-semibold">Statut</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((dn) => {
                    const statusConfig = STATUS_CONFIG[dn.status] || STATUS_CONFIG.draft;
                    return (
                      <TableRow key={dn.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-semibold">{dn.delivery_number}</TableCell>
                        <TableCell>{dn.customer_name}</TableCell>
                        <TableCell className="text-slate-500">{dn.order_number || '-'}</TableCell>
                        <TableCell className="text-slate-500">
                          {dn.delivery_date && format(new Date(dn.delivery_date), "dd MMM yyyy", { locale: fr })}
                        </TableCell>
                        <TableCell>{dn.items?.length || 0} article(s)</TableCell>
                        <TableCell><Badge className={statusConfig.class}>{statusConfig.label}</Badge></TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {dn.status === 'draft' && (
                                <DropdownMenuItem onClick={() => markAsSentMutation.mutate(dn.id)}>
                                  <CheckCircle className="w-4 h-4 mr-2" /> Marquer envoyé
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => { if (confirm(`Supprimer le BL "${dn.delivery_number}" ?`)) deleteMutation.mutate(dn.id); }} className="text-red-600">
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

        <DeliveryNoteForm open={formOpen} onOpenChange={setFormOpen}
          onSave={(deliveryNote, selectedOFs) => createMutation.mutate({ deliveryNote, selectedOFs })}
          manufacturingOrders={manufacturingOrders} customers={customers} />
      </div>
    </div>
  );
}
