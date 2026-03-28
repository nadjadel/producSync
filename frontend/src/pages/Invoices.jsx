import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, MoreVertical, Trash2, FileText, Send, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const STATUS_CONFIG = {
  draft:     { label: 'Brouillon', class: 'bg-slate-100 text-slate-700' },
  sent:      { label: 'Envoyée',   class: 'bg-blue-100 text-blue-700' },
  paid:      { label: 'Payée',     class: 'bg-emerald-100 text-emerald-700' },
  overdue:   { label: 'Échue',     class: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Annulée',   class: 'bg-rose-100 text-rose-700' },
};

function InvoiceForm({ open, onOpenChange, onSave, deliveryNotes = [], customers = [] }) {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedBLs, setSelectedBLs] = useState([]);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const availableBLs = deliveryNotes.filter(dn => dn.status === 'sent' && !dn.invoice_id && dn.customer_id === selectedCustomerId);

  const handleToggleBL = (dn) => {
    setSelectedBLs(prev => prev.find(b => b.id === dn.id) ? prev.filter(b => b.id !== dn.id) : [...prev, dn]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedBLs.length === 0) return alert('Sélectionnez au moins un BL');
    const customer = customers.find(c => c.id === selectedCustomerId);
    const items = selectedBLs.flatMap(bl => bl.items || []);
    const total_ht = items.reduce((sum, item) => sum + (item.total || 0), 0);
    const total_vat = total_ht * 0.2;

    const paymentDays = customer?.payment_terms === '45_days' ? 45 : customer?.payment_terms === '60_days' ? 60 : customer?.payment_terms === 'end_of_month' ? 30 : 30;
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + paymentDays);

    onSave({
      invoice_date: invoiceDate,
      customer_id: selectedCustomerId,
      customer_name: customer?.company_name || '',
      customer_address: `${customer?.address || ''}, ${customer?.postal_code || ''} ${customer?.city || ''}`,
      customer_siret: customer?.siret || '',
      customer_vat_number: customer?.vat_number || '',
      status: 'draft',
      payment_terms: customer?.payment_terms || '30_days',
      due_date: dueDate.toISOString().slice(0, 10),
      delivery_notes: selectedBLs.map(bl => ({ delivery_note_id: bl.id, delivery_number: bl.delivery_number, delivery_date: bl.delivery_date })),
      items,
      total_ht,
      total_vat,
      total_ttc: total_ht + total_vat,
      notes,
    }, selectedBLs);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="text-xl font-semibold">Nouvelle facture</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select value={selectedCustomerId} onValueChange={(v) => { setSelectedCustomerId(v); setSelectedBLs([]); }}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
                <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date de facture</Label>
              <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
            </div>
          </div>

          {selectedCustomerId && (
            <div className="space-y-3">
              <Label>Bons de livraison à facturer</Label>
              {availableBLs.length === 0 ? (
                <p className="text-slate-400 text-sm py-4 text-center">Aucun BL disponible pour ce client</p>
              ) : availableBLs.map(bl => (
                <div key={bl.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100"
                  onClick={() => handleToggleBL(bl)}>
                  <div className="flex items-center gap-3">
                    <Checkbox checked={!!selectedBLs.find(b => b.id === bl.id)} onCheckedChange={() => handleToggleBL(bl)} />
                    <div>
                      <p className="font-medium">{bl.delivery_number}</p>
                      <p className="text-sm text-slate-500">{bl.delivery_date && format(new Date(bl.delivery_date), "dd MMM yyyy", { locale: fr })}</p>
                    </div>
                  </div>
                  <span className="text-sm text-slate-500">{bl.items?.length || 0} article(s)</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" className="bg-slate-900 hover:bg-slate-800" disabled={!selectedCustomerId || selectedBLs.length === 0}>
              Créer la facture
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Invoices() {
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery({ queryKey: ['invoices'], queryFn: () => base44.entities.Invoice.list('-created_at') });
  const { data: deliveryNotes = [] } = useQuery({ queryKey: ['delivery-notes'], queryFn: () => base44.entities.DeliveryNote.list() });
  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: () => base44.entities.Customer.list() });

  // Check for prefilled data from customer details page
  React.useEffect(() => {
    // Look for any prefilled invoice data in sessionStorage
    const keys = Object.keys(sessionStorage);
    const invoiceKey = keys.find(key => key.startsWith('prefilled_invoice_'));
    if (invoiceKey) {
      try {
        const prefilledData = JSON.parse(sessionStorage.getItem(invoiceKey));
        if (prefilledData && !formOpen) {
          // For invoices, we can't auto-fill the form because it requires selecting delivery notes
          // But we can pre-select the customer and show a toast
          toast.info(`Client ${prefilledData.customer_name} pré-sélectionné pour la création de facture`);
          // Clear the sessionStorage item
          sessionStorage.removeItem(invoiceKey);
        }
      } catch (error) {
        console.error('Error parsing prefilled invoice data:', error);
        sessionStorage.removeItem(invoiceKey);
      }
    }
  }, [formOpen]);

  const createMutation = useMutation({
    mutationFn: async ({ invoice, selectedDNs }) => {
      const created = await base44.entities.Invoice.create(invoice);
      await Promise.all(selectedDNs.map(dn => base44.entities.DeliveryNote.update(dn.id, { status: 'invoiced', invoice_id: created.id })));
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['delivery-notes'] });
      toast.success('Facture créée');
      setFormOpen(false);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, payment_date }) => base44.entities.Invoice.update(id, { status, payment_date }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); toast.success('Facture mise à jour'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Invoice.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); toast.success('Facture supprimée'); },
  });

  const filtered = invoices.filter(inv =>
    inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: filtered.reduce((sum, inv) => sum + (inv.total_ttc || 0), 0),
    unpaid: filtered.filter(inv => ['sent', 'overdue'].includes(inv.status)).reduce((sum, inv) => sum + (inv.total_ttc || 0), 0),
    paid: filtered.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total_ttc || 0), 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Factures</h1>
            <p className="text-slate-500 mt-1">Facturation mensuelle regroupée</p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="bg-slate-900 hover:bg-slate-800">
            <Plus className="w-4 h-4 mr-2" /> Nouvelle facture
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm"><p className="text-sm text-slate-500">Total facturé</p><p className="text-2xl font-bold text-slate-900 mt-1">{stats.total.toFixed(2)} €</p></div>
          <div className="bg-white p-4 rounded-xl shadow-sm"><p className="text-sm text-slate-500">En attente</p><p className="text-2xl font-bold text-amber-600 mt-1">{stats.unpaid.toFixed(2)} €</p></div>
          <div className="bg-white p-4 rounded-xl shadow-sm"><p className="text-sm text-slate-500">Payé</p><p className="text-2xl font-bold text-emerald-600 mt-1">{stats.paid.toFixed(2)} €</p></div>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Rechercher une facture..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-white" />
          </div>
        </div>

        {isLoading ? <Skeleton className="h-96 rounded-xl" /> :
          filtered.length === 0 && invoices.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600">Aucune facture</h3>
              <p className="text-slate-400 mt-1">Créez votre première facture depuis les BL envoyés</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold">N° Facture</TableHead>
                    <TableHead className="font-semibold">Client</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Échéance</TableHead>
                    <TableHead className="font-semibold">Montant TTC</TableHead>
                    <TableHead className="font-semibold">BL inclus</TableHead>
                    <TableHead className="font-semibold">Statut</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((invoice) => {
                    const statusConfig = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.draft;
                    return (
                      <TableRow key={invoice.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-semibold">{invoice.invoice_number}</TableCell>
                        <TableCell>{invoice.customer_name}</TableCell>
                        <TableCell className="text-slate-500">{invoice.invoice_date && format(new Date(invoice.invoice_date), "dd MMM yyyy", { locale: fr })}</TableCell>
                        <TableCell className="text-slate-500">{invoice.due_date && format(new Date(invoice.due_date), "dd MMM yyyy", { locale: fr })}</TableCell>
                        <TableCell className="font-semibold">{invoice.total_ttc?.toFixed(2)} €</TableCell>
                        <TableCell className="text-slate-500">{invoice.delivery_notes?.length || 0} BL</TableCell>
                        <TableCell><Badge className={statusConfig.class}>{statusConfig.label}</Badge></TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {invoice.status === 'draft' && (
                                <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: 'sent' })}>
                                  <Send className="w-4 h-4 mr-2" /> Marquer envoyée
                                </DropdownMenuItem>
                              )}
                              {['sent', 'overdue'].includes(invoice.status) && (
                                <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: 'paid', payment_date: new Date().toISOString().slice(0, 10) })}>
                                  <CheckCircle2 className="w-4 h-4 mr-2" /> Marquer payée
                                </DropdownMenuItem>
                              )}
                              {!['cancelled', 'paid'].includes(invoice.status) && (
                                <DropdownMenuItem onClick={() => { if (confirm('Annuler cette facture ?')) updateStatusMutation.mutate({ id: invoice.id, status: 'cancelled' }); }}>
                                  <XCircle className="w-4 h-4 mr-2" /> Annuler
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => { if (confirm(`Supprimer la facture "${invoice.invoice_number}" ?`)) deleteMutation.mutate(invoice.id); }} className="text-red-600">
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

        <InvoiceForm open={formOpen} onOpenChange={setFormOpen}
          onSave={(invoice, selectedDNs) => createMutation.mutate({ invoice, selectedDNs })}
          deliveryNotes={deliveryNotes} customers={customers} />
      </div>
    </div>
  );
}
