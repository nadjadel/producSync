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
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, MoreVertical, Trash2, FileMinus, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const STATUS_CONFIG = {
  draft:   { label: 'Brouillon', class: 'bg-slate-100 text-slate-700' },
  sent:    { label: 'Envoyé',    class: 'bg-blue-100 text-blue-700' },
  applied: { label: 'Appliqué',  class: 'bg-emerald-100 text-emerald-700' },
};

function CreditNoteForm({ open, onOpenChange, onSave, invoices = [], customers = [] }) {
  const [formData, setFormData] = useState({
    credit_note_number: '', credit_note_date: new Date().toISOString().slice(0, 10),
    customer_id: '', customer_name: '', invoice_id: '', invoice_number: '',
    reason: '', items: [], status: 'draft',
  });


  const handleCustomerChange = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    setFormData(prev => ({ ...prev, customer_id: customerId, customer_name: customer?.company_name || '', invoice_id: '', invoice_number: '' }));
  };

  const handleInvoiceChange = (invoiceId) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    setFormData(prev => ({
      ...prev, invoice_id: invoiceId, invoice_number: invoice?.invoice_number || '',
      items: (invoice?.items || []).map(item => ({ ...item, total_ht: item.total_ht || item.total || 0, vat_rate: item.vat_rate || 20 })),
    }));
  };

  const totals = () => {
    const total_ht = formData.items.reduce((s, i) => s + (i.total_ht || 0), 0);
    const total_vat = formData.items.reduce((s, i) => s + ((i.total_ht || 0) * ((i.vat_rate || 20) / 100)), 0);
    return { total_ht, total_vat, total_ttc: total_ht + total_vat };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, ...totals() });
  };

  const customerInvoices = invoices.filter(i => i.customer_id === formData.customer_id && i.status !== 'cancelled');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="text-xl font-semibold">Nouvel avoir</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>N° Avoir</Label><Input value="" placeholder="Généré automatiquement" readOnly className="bg-slate-50" /></div>
            <div className="space-y-2"><Label>Date</Label><Input type="date" value={formData.credit_note_date} onChange={(e) => setFormData(p => ({ ...p, credit_note_date: e.target.value }))} /></div>
          </div>

          <div className="space-y-2">
            <Label>Client *</Label>
            <Select value={formData.customer_id} onValueChange={handleCustomerChange}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
              <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {formData.customer_id && (
            <div className="space-y-2">
              <Label>Facture d'origine *</Label>
              <Select value={formData.invoice_id} onValueChange={handleInvoiceChange}>
                <SelectTrigger><SelectValue placeholder="Sélectionner une facture" /></SelectTrigger>
                <SelectContent>{customerInvoices.map(i => <SelectItem key={i.id} value={i.id}>{i.invoice_number} — {i.total_ttc?.toFixed(2)} €</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Motif *</Label>
            <Textarea value={formData.reason} onChange={(e) => setFormData(p => ({ ...p, reason: e.target.value }))} rows={2} placeholder="Motif de l'avoir..." required />
          </div>

          {formData.items.length > 0 && (
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-700 mb-2">Lignes de l'avoir</p>
              {formData.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm py-1">
                  <span className="text-slate-600">{item.description}</span>
                  <span className="font-medium">{(item.total_ht || 0).toFixed(2)} € HT</span>
                </div>
              ))}
              <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
                <span>Total TTC:</span>
                <span className="text-rose-600">-{totals().total_ttc.toFixed(2)} €</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" className="bg-slate-900 hover:bg-slate-800" disabled={!formData.customer_id || !formData.reason}>Créer l'avoir</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CreditNotes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: creditNotes = [], isLoading } = useQuery({ queryKey: ['credit-notes'], queryFn: () => base44.entities.CreditNote.list('-created_at') });
  const { data: invoices = [] } = useQuery({ queryKey: ['invoices'], queryFn: () => base44.entities.Invoice.list() });
  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: () => base44.entities.Customer.list() });

  const createMutation = useMutation({ mutationFn: (data) => base44.entities.CreditNote.create(data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['credit-notes'] }); toast.success('Avoir créé'); setFormOpen(false); } });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => base44.entities.CreditNote.update(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['credit-notes'] }); toast.success('Avoir mis à jour'); } });
  const deleteMutation = useMutation({ mutationFn: (id) => base44.entities.CreditNote.delete(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['credit-notes'] }); toast.success('Avoir supprimé'); } });

  const filtered = creditNotes.filter(cn =>
    cn.credit_note_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cn.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Avoirs</h1>
            <p className="text-slate-500 mt-1">Gestion des avoirs sur factures</p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="bg-slate-900 hover:bg-slate-800">
            <Plus className="w-4 h-4 mr-2" /> Nouvel avoir
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Rechercher un avoir..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-white" />
          </div>
        </div>

        {isLoading ? <Skeleton className="h-96 rounded-xl" /> :
          filtered.length === 0 && creditNotes.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm">
              <FileMinus className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600">Aucun avoir</h3>
              <p className="text-slate-400 mt-1">Les avoirs sont créés depuis les factures</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold">N° Avoir</TableHead>
                    <TableHead className="font-semibold">Client</TableHead>
                    <TableHead className="font-semibold">Facture d'origine</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Motif</TableHead>
                    <TableHead className="font-semibold">Montant TTC</TableHead>
                    <TableHead className="font-semibold">Statut</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((cn) => {
                    const statusConfig = STATUS_CONFIG[cn.status] || STATUS_CONFIG.draft;
                    return (
                      <TableRow key={cn.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-semibold">{cn.credit_note_number}</TableCell>
                        <TableCell>{cn.customer_name}</TableCell>
                        <TableCell className="text-slate-500">{cn.invoice_number || '-'}</TableCell>
                        <TableCell className="text-slate-500">{cn.credit_note_date && format(new Date(cn.credit_note_date), "dd MMM yyyy", { locale: fr })}</TableCell>
                        <TableCell className="text-slate-500 max-w-xs truncate">{cn.reason}</TableCell>
                        <TableCell className="font-semibold text-rose-600">-{cn.total_ttc?.toFixed(2)} €</TableCell>
                        <TableCell><Badge className={statusConfig.class}>{statusConfig.label}</Badge></TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {cn.status === 'draft' && <DropdownMenuItem onClick={() => updateMutation.mutate({ id: cn.id, data: { status: 'sent' } })}><CheckCircle className="w-4 h-4 mr-2" /> Marquer envoyé</DropdownMenuItem>}
                              {cn.status === 'sent' && <DropdownMenuItem onClick={() => updateMutation.mutate({ id: cn.id, data: { status: 'applied' } })}><CheckCircle className="w-4 h-4 mr-2" /> Marquer appliqué</DropdownMenuItem>}
                              <DropdownMenuItem onClick={() => { if (confirm(`Supprimer l'avoir "${cn.credit_note_number}" ?`)) deleteMutation.mutate(cn.id); }} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Supprimer</DropdownMenuItem>
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

        <CreditNoteForm open={formOpen} onOpenChange={setFormOpen} onSave={(data) => createMutation.mutate(data)} invoices={invoices} customers={customers} />
      </div>
    </div>
  );
}
