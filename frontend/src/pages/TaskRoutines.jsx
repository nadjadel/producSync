import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, MoreVertical, Pencil, Trash2, ListChecks, GripVertical, Clock } from "lucide-react";
import { toast } from "sonner";

function TaskRoutineForm({ open, onOpenChange, routine, onSave, workstations = [], products = [] }) {
  const [formData, setFormData] = useState({ code: '', name: '', product_id: '', product_reference: '', customer_id: '', steps: [], status: 'active', notes: '' });

  React.useEffect(() => {
    if (routine) setFormData({ ...routine, steps: routine.steps || [] });
    else setFormData({ code: '', name: '', product_id: '', product_reference: '', customer_id: '', steps: [], status: 'active', notes: '' });
  }, [routine, open]);

  const addStep = () => {
    const stepNumber = formData.steps.length + 1;
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, { step_number: stepNumber, name: '', description: '', workstation_id: '', workstation_name: '', duration_minutes: 0, required: true }],
    }));
  };

  const updateStep = (index, field, value) => {
    const newSteps = [...formData.steps];
    if (field === 'workstation_id') {
      const ws = workstations.find(w => w.id === value);
      newSteps[index] = { ...newSteps[index], workstation_id: value, workstation_name: ws?.name || '' };
    } else {
      newSteps[index] = { ...newSteps[index], [field]: value };
    }
    setFormData(prev => ({ ...prev, steps: newSteps }));
  };

  const removeStep = (index) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, step_number: i + 1 })),
    }));
  };

  const totalDuration = formData.steps.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

  const handleProductChange = (productId) => {
    const p = products.find(p => p.id === productId);
    setFormData(prev => ({ ...prev, product_id: productId, product_reference: p?.reference || '', customer_id: p?.customer_id || '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, total_duration_minutes: totalDuration });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="text-xl font-semibold">{routine ? 'Modifier la gamme' : 'Nouvelle gamme de tâches'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Code *</Label><Input value={formData.code} onChange={(e) => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))} required placeholder="GAM-001" /></div>
            <div className="space-y-2"><Label>Nom *</Label><Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} required /></div>
          </div>

          <div className="space-y-2">
            <Label>Produit associé (optionnel)</Label>
            <Select value={formData.product_id} onValueChange={handleProductChange}>
              <SelectTrigger><SelectValue placeholder="Aucun produit spécifique" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucun</SelectItem>
                {products.map(p => <SelectItem key={p.id} value={p.id}>{p.reference} — {p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Étapes de fabrication</Label>
                {totalDuration > 0 && (
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Durée totale: {totalDuration} min ({Math.floor(totalDuration / 60)}h{totalDuration % 60 > 0 ? `${totalDuration % 60}min` : ''})
                  </p>
                )}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addStep}><Plus className="w-4 h-4 mr-1" /> Ajouter une étape</Button>
            </div>

            {formData.steps.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg text-slate-400">Aucune étape — ajoutez des étapes de fabrication</div>
            ) : (
              <div className="space-y-3">
                {formData.steps.map((step, index) => (
                  <div key={index} className="flex gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center text-slate-400 mt-2"><GripVertical className="w-4 h-4" /></div>
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Étape {step.step_number} — Nom *</Label>
                        <Input value={step.name} onChange={(e) => updateStep(index, 'name', e.target.value)} placeholder="Nom de l'étape" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Poste de travail</Label>
                        <Select value={step.workstation_id} onValueChange={(v) => updateStep(index, 'workstation_id', v)}>
                          <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Aucun</SelectItem>
                            {workstations.map(ws => <SelectItem key={ws.id} value={ws.id}>{ws.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Description</Label>
                        <Input value={step.description} onChange={(e) => updateStep(index, 'description', e.target.value)} placeholder="Description optionnelle" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Durée (minutes)</Label>
                        <Input type="number" min="0" value={step.duration_minutes} onChange={(e) => updateStep(index, 'duration_minutes', parseInt(e.target.value) || 0)} />
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeStep(index)} className="mt-2 shrink-0"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="archived">Archivé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2"><Label>Notes</Label><Textarea value={formData.notes} onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" className="bg-slate-900 hover:bg-slate-800">{routine ? 'Enregistrer' : 'Créer'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function TaskRoutines() {
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const queryClient = useQueryClient();

  const { data: routines = [], isLoading } = useQuery({ queryKey: ['task-routines'], queryFn: () => base44.entities.TaskRoutine.list() });
  const { data: workstations = [] } = useQuery({ queryKey: ['workstations'], queryFn: () => base44.entities.Workstation.list() });
  const { data: productsResponse } = useQuery({ queryKey: ['products', { limit: 9999 }], queryFn: () => base44.entities.Product.filter({ limit: 9999 }) });
  const products = productsResponse?.data ?? [];

  const createMutation = useMutation({ mutationFn: (data) => base44.entities.TaskRoutine.create(data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['task-routines'] }); toast.success('Gamme créée'); setFormOpen(false); } });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => base44.entities.TaskRoutine.update(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['task-routines'] }); toast.success('Gamme mise à jour'); setFormOpen(false); setEditingRoutine(null); } });
  const deleteMutation = useMutation({ mutationFn: (id) => base44.entities.TaskRoutine.delete(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['task-routines'] }); toast.success('Gamme supprimée'); } });

  const STATUS_CONFIG = {
    draft:    { label: 'Brouillon', class: 'bg-slate-100 text-slate-700' },
    active:   { label: 'Actif',     class: 'bg-emerald-100 text-emerald-700' },
    archived: { label: 'Archivé',   class: 'bg-orange-100 text-orange-700' },
  };

  const filtered = routines.filter(r =>
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gammes de tâches</h1>
            <p className="text-slate-500 mt-1">Définissez les étapes de fabrication de vos produits</p>
          </div>
          <Button onClick={() => { setEditingRoutine(null); setFormOpen(true); }} className="bg-slate-900 hover:bg-slate-800">
            <Plus className="w-4 h-4 mr-2" /> Nouvelle gamme
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Rechercher une gamme..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-white" />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <ListChecks className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600">Aucune gamme de tâches</h3>
            <p className="text-slate-400 mt-1">Créez des gammes pour standardiser vos process de fabrication</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((routine) => {
              const statusConfig = STATUS_CONFIG[routine.status] || STATUS_CONFIG.draft;
              const isExpanded = expandedId === routine.id;
              return (
                <Card key={routine.id} className="border-0 shadow-sm hover:shadow-md transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => setExpandedId(isExpanded ? null : routine.id)}>
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                          <ListChecks className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{routine.name}</CardTitle>
                            <Badge className={statusConfig.class}>{statusConfig.label}</Badge>
                          </div>
                          <p className="text-sm text-slate-500 flex items-center gap-3 mt-0.5">
                            <span className="font-mono">{routine.code}</span>
                            {routine.product_reference && <span>· {routine.product_reference}</span>}
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{routine.total_duration_minutes || 0} min</span>
                            <span>{routine.steps?.length || 0} étape(s)</span>
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditingRoutine(routine); setFormOpen(true); }}><Pencil className="w-4 h-4 mr-2" /> Modifier</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { if (confirm(`Supprimer "${routine.name}" ?`)) deleteMutation.mutate(routine.id); }} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  {isExpanded && routine.steps?.length > 0 && (
                    <CardContent className="pt-0">
                      <div className="border-t pt-4">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50">
                              <TableHead className="w-12">N°</TableHead>
                              <TableHead>Étape</TableHead>
                              <TableHead>Poste</TableHead>
                              <TableHead className="text-right">Durée</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {routine.steps.map((step) => (
                              <TableRow key={step.step_number}>
                                <TableCell className="font-mono text-slate-500">{step.step_number}</TableCell>
                                <TableCell>
                                  <p className="font-medium">{step.name}</p>
                                  {step.description && <p className="text-xs text-slate-400">{step.description}</p>}
                                </TableCell>
                                <TableCell className="text-slate-500">{step.workstation_name || '-'}</TableCell>
                                <TableCell className="text-right text-slate-500">{step.duration_minutes > 0 ? `${step.duration_minutes} min` : '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        <TaskRoutineForm open={formOpen} onOpenChange={setFormOpen} routine={editingRoutine}
          onSave={(data) => { if (editingRoutine) updateMutation.mutate({ id: editingRoutine.id, data }); else createMutation.mutate(data); }}
          workstations={workstations} products={products} />
      </div>
    </div>
  );
}
