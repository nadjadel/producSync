// Workstations.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Settings, MoreVertical, Pencil, Trash2, CheckCircle, Loader2, Wrench, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import WorkstationForm from '@/components/workstations/WorkstationForm';

const STATUS_CONFIG = {
  available:   { label: 'Disponible', class: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, iconClass: 'text-emerald-500', bgClass: 'from-emerald-50 to-white' },
  busy:        { label: 'Occupé',     class: 'bg-amber-100 text-amber-700',     icon: Loader2,     iconClass: 'text-amber-500',   bgClass: 'from-amber-50 to-white' },
  maintenance: { label: 'Maintenance',class: 'bg-blue-100 text-blue-700',       icon: Wrench,      iconClass: 'text-blue-500',    bgClass: 'from-blue-50 to-white' },
  offline:     { label: 'Hors ligne', class: 'bg-slate-100 text-slate-700',     icon: XCircle,     iconClass: 'text-slate-500',   bgClass: 'from-slate-50 to-white' },
};

export default function Workstations() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingWs, setEditingWs] = useState(null);
  const queryClient = useQueryClient();

  const { data: workstations = [], isLoading } = useQuery({
    queryKey: ['workstations'],
    queryFn: () => base44.entities.Workstation.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Workstation.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['workstations'] }); toast.success('Poste créé'); setFormOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Workstation.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['workstations'] }); toast.success('Poste mis à jour'); setFormOpen(false); setEditingWs(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Workstation.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['workstations'] }); toast.success('Poste supprimé'); },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Postes de travail</h1>
            <p className="text-slate-500 mt-1">Gérez vos équipements de production</p>
          </div>
          <Button onClick={() => { setEditingWs(null); setFormOpen(true); }} className="bg-slate-900 hover:bg-slate-800">
            <Plus className="w-4 h-4 mr-2" /> Nouveau poste
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : workstations.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <Settings className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600">Aucun poste de travail</h3>
            <p className="text-slate-400 mt-1">Configurez vos équipements de production</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workstations.map((ws) => {
              const config = STATUS_CONFIG[ws.status] || STATUS_CONFIG.offline;
              const Icon = config.icon;
              return (
                <Card key={ws.id} className={cn("relative overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300", `bg-gradient-to-br ${config.bgClass}`)}>
                  <div className="absolute top-4 right-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditingWs(ws); setFormOpen(true); }}><Pencil className="w-4 h-4 mr-2" /> Modifier</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { if (confirm(`Supprimer "${ws.name}" ?`)) deleteMutation.mutate(ws.id); }} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Supprimer</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-sm">
                        <Icon className={cn("w-6 h-6", config.iconClass)} />
                      </div>
                      <div>
                        <Badge className={config.class}>{config.label}</Badge>
                        <h3 className="font-semibold text-slate-900 mt-2">{ws.name}</h3>
                        <p className="text-sm text-slate-500">{ws.code}</p>
                      </div>
                    </div>
                    {ws.description && <p className="mt-4 text-sm text-slate-500 line-clamp-2">{ws.description}</p>}
                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Capacité</p>
                      <p className="font-semibold text-slate-900 mt-1">{ws.capacity_per_hour || 0} unités/heure</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <WorkstationForm open={formOpen} onOpenChange={setFormOpen} workstation={editingWs}
          onSave={(data) => { if (editingWs) updateMutation.mutate({ id: editingWs.id, data }); else createMutation.mutate(data); }} />
      </div>
    </div>
  );
}
