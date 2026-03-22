import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, Truck, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import SupplierForm from '@/components/suppliers/SupplierForm';

const STATUS_CONFIG = {
  active: { label: 'Actif', class: 'bg-emerald-100 text-emerald-700' },
  inactive: { label: 'Inactif', class: 'bg-slate-100 text-slate-600' }
};

export default function Suppliers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const queryClient = useQueryClient();

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.Supplier.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Supplier.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Fournisseur créé');
      setFormOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Supplier.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Fournisseur mis à jour');
      setFormOpen(false);
      setEditingSupplier(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Supplier.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Fournisseur supprimé');
    }
  });

  const handleSave = (data) => {
    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormOpen(true);
  };

  const handleDelete = (supplier) => {
    if (confirm(`Supprimer le fournisseur "${supplier.company_name}" ?`)) {
      deleteMutation.mutate(supplier.id);
    }
  };

  const filtered = suppliers.filter(s =>
    s.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.speciality?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Fournisseurs</h1>
            <p className="text-slate-500 mt-1">Gérez vos fournisseurs et sous-traitants</p>
          </div>
          <Button
            onClick={() => { setEditingSupplier(null); setFormOpen(true); }}
            className="bg-slate-900 hover:bg-slate-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau fournisseur
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Rechercher un fournisseur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-slate-200 max-w-md"
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <Skeleton className="h-96 rounded-xl" />
        ) : filtered.length === 0 && suppliers.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <Truck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600">Aucun fournisseur</h3>
            <p className="text-slate-400 mt-1">Ajoutez votre premier fournisseur / sous-traitant</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(supplier => {
              const statusCfg = STATUS_CONFIG[supplier.status] || STATUS_CONFIG.active;
              return (
                <div key={supplier.id} className="bg-white rounded-xl shadow-sm p-5 border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {supplier.code || '—'}
                        </span>
                        <Badge className={statusCfg.class}>{statusCfg.label}</Badge>
                      </div>
                      <h3 className="font-semibold text-slate-900 mt-1">{supplier.company_name}</h3>
                      {supplier.speciality && (
                        <p className="text-xs text-slate-500 mt-0.5">{supplier.speciality}</p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(supplier)}>
                          <Pencil className="w-4 h-4 mr-2" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(supplier)} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="space-y-1 text-sm text-slate-500">
                    {supplier.contact_name && <p>👤 {supplier.contact_name}</p>}
                    {supplier.email && <p>✉️ {supplier.email}</p>}
                    {supplier.phone && <p>📞 {supplier.phone}</p>}
                    {supplier.city && <p>📍 {supplier.city} {supplier.country ? `(${supplier.country})` : ''}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <SupplierForm
          open={formOpen}
          onOpenChange={setFormOpen}
          supplier={editingSupplier}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}