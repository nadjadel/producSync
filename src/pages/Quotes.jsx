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
import { Plus, Search, MoreVertical, Pencil, Trash2, FileSearch, Send, CheckCircle, XCircle, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getNextNumber } from '@/components/utils/counterUtils';

const STATUS_CONFIG = {
  draft:    { label: 'Brouillon', class: 'bg-slate-100 text-slate-700' },
  sent:     { label: 'Envoyé',    class: 'bg-blue-100 text-blue-700' },
  accepted: { label: 'Accepté',   class: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Refusé',    class: 'bg-rose-100 text-rose-700' },
  expired:  { label: 'Expiré',    class: 'bg-orange-100 text-orange-700' },
};

function QuoteForm({ open, onOpenChange, quote, onSave, customers = [], products = [] }) {
  const [formData, setFormData] = useState({
    quote_number: '', customer_id: '', customer_name: '',
    status: 'draft', quote_date: new Date().toISOString().slice(0, 10),
    valid_until: '', items: [], notes: '', vat_rate: 20,
  });

  React.useEffect(() => {
    if (quote) {
      setFormData({ ...quote, items: quote.items || [] });
    } else if (open && !quote) {
      (async () => {
        const quoteNumber = await getNextNumber('DE');
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 30);
        setFormData({
          quote_number: quoteNumber, customer_id: '', customer_name: '',
          status: 'draft', quote_date: new Date().toISOString().slice(0, 10),
          valid_until: validUntil.toISOString().slice(0, 10),
          items: [], notes: '', vat_rate: 20,
        });
      })();
    }
  }, [quote, open]);

  const handleCustomerChange = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    setFormData(prev => ({ ...prev, customer_id: customerId, customer_name: customer?.company_name || '' }));
  };

  const addItem = () => setFormData(prev => ({
    ...prev, items: [...prev.items, { product_id: '', product_name: '', product_reference: '', quantity: 1, unit_price: 0, total: 0 }],
  }));

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    if (field === 'product_id') {
      const p = products.find(p => p.id === value);
      newItems[index] = { ...newItems[index], product_id: value, product_name: p?.name || '', product_reference: p?.reference || '', unit_price: p?.sell_price || 0, total: (p?.sell_price || 0) * (newItems[index].quantity || 1) };
    } else {
      newItems[index][field] = value;
      if (field === 'quantity' || field === 'unit_price') newItems[index].total = (newItems[index].quantity || 0) * (newItems[index].unit_price || 0);
    }
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const totals = () => {
    const total_ht = formData.items.reduce((s, i) => s + (i.total || 0), 0);
    const total_vat = total_ht * (formData.vat_rate / 100);
    return { total_ht, total_vat, total_ttc: total_ht + total_vat };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, ...totals() });
  };

  const { total_ht, total_vat, total_ttc } = totals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="text-xl font-semibold">{quote ? 'Modifier le devis' : 'Nouveau devis'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2"><Label>N° Devis *</Label><Input value={formData.quote_number} onChange={(e) => setFormData(p => ({ ...p, quote_number: e.target.value }))} required /></div>
            <div className="space-y-2"><Label>Date *</Label><Input type="date" value={formData.quote_date} onChange={(e) => setFormData(p => ({ ...p, quote_date: e.target.value }))} required /></div>
            <div className="space-y-2"><Label>Valide jusqu'au</Label><Input type="date" value={formData.valid_until} onChange={(e) => setFormData(p => ({ ...p, valid_until: e.target.value }))} /></div>
          </div>

          <div className="space-y-2">
            <Label>Client *</Label>
            <Select value={formData.customer_id} onValueChange={handleCustomerChange}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
              <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Lignes du devis</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="w-4 h-4 mr-1" /> Ajouter</Button>
            </div>
            {formData.items.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Produit</TableHead>
                      <TableHead className="w-24">Quantité</TableHead>
                      <TableHead className="w-32">Prix unitaire</TableHead>
                      <TableHead className="w-32">Total HT</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Select value={item.product_id} onValueChange={(v) => updateItem(index, 'product_id', v)}>
                            <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                            <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.reference} — {p.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell><Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)} /></TableCell>
                        <TableCell><Input type="number" step="0.01" value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)} /></TableCell>
                        <TableCell className="font-semibold">{item.total?.toFixed(2)} €</TableCell>
                        <TableCell><Button type="button" variant="ghost" size="icon" onClick={() => setFormData(p => ({ ...p, items: p.items.filter((_, i) => i !== index) }))}><Trash2 className="w-4 h-4 text-red-500" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <div className="w-80 space-y-2 bg-slate-50 p-4 rounded-lg">
              <div className="flex justify-between text-sm"><span>Total HT:</span><span className="font-semibold">{total_ht.toFixed(2)} €</span></div>
              <div className="flex justify-between text-sm"><span>TVA (20%):</span><span className="font-semibold">{total_vat.toFixed(2)} €</span></div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t"><span>Total TTC:</span><span>{total_ttc.toFixed(2)} €</span></div>
            </div>
          </div>

          <div className="space-y-2"><Label>Notes</Label><Textarea value={formData.notes} onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" className="bg-slate-900 hover:bg-slate-800" disabled={!formData.customer_id || formData.items.length === 0}>{quote ? 'Enregistrer' : 'Créer'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Quotes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const queryClient = useQueryClient();

  const { data: quotes = [], isLoading } = useQuery({ queryKey: ['quotes'], queryFn: () => base44.entities.Quote.list('-created_at') });
  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: () => base44.entities.Customer.list() });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: () => base44.entities.Product.list() });

  const createMutation = useMutation({ mutationFn: (data) => base44.entities.Quote.create(data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['quotes'] }); toast.success('Devis créé'); setFormOpen(false); } });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => base44.entities.Quote.update(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['quotes'] }); toast.success('Devis mis à jour'); setFormOpen(false); setEditingQuote(null); } });
  const deleteMutation = useMutation({ mutationFn: (id) => base44.entities.Quote.delete(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['quotes'] }); toast.success('Devis supprimé'); } });

  const convertToOrder = useMutation({
    mutationFn: async (quote) => {
      const orderNumber = await getNextNumber('CO');
      const order = await base44.entities.Order.create({
        order_number: orderNumber, customer_id: quote.customer_id, customer_name: quote.customer_name,
        status: 'draft', order_date: new Date().toISOString().slice(0, 10),
        items: quote.items, total_ht: quote.total_ht, total_vat: quote.total_vat, total_ttc: quote.total_ttc,
      });
      await base44.entities.Quote.update(quote.id, { status: 'accepted', order_id: order.id });
      const ofPromises = (quote.items || []).map(async item => {
        const ofNumber = await getNextNumber('OF');
        return base44.entities.ManufacturingOrder.create({ order_number: ofNumber, customer_order_id: order.id, customer_order_number: orderNumber, product_id: item.product_id, product_name: item.product_name, quantity_planned: item.quantity, quantity_produced: 0, status: 'draft', priority: 'medium', ready_for_delivery: false, delivered: false });
      });
      await Promise.all(ofPromises);
      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['manufacturing-orders'] });
      toast.success('Devis converti en commande + OF créés');
    },
  });

  const filtered = quotes.filter(q =>
    q.quote_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Devis</h1>
            <p className="text-slate-500 mt-1">Gérez vos propositions commerciales</p>
          </div>
          <Button onClick={() => { setEditingQuote(null); setFormOpen(true); }} className="bg-slate-900 hover:bg-slate-800">
            <Plus className="w-4 h-4 mr-2" /> Nouveau devis
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Rechercher un devis..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-white" />
          </div>
        </div>

        {isLoading ? <Skeleton className="h-96 rounded-xl" /> :
          filtered.length === 0 && quotes.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm">
              <FileSearch className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600">Aucun devis</h3>
              <p className="text-slate-400 mt-1">Créez votre premier devis</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold">N° Devis</TableHead>
                    <TableHead className="font-semibold">Client</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Valide jusqu'au</TableHead>
                    <TableHead className="font-semibold">Montant TTC</TableHead>
                    <TableHead className="font-semibold">Statut</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((quote) => {
                    const statusConfig = STATUS_CONFIG[quote.status] || STATUS_CONFIG.draft;
                    return (
                      <TableRow key={quote.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-semibold">{quote.quote_number}</TableCell>
                        <TableCell>{quote.customer_name}</TableCell>
                        <TableCell className="text-slate-500">{quote.quote_date && format(new Date(quote.quote_date), "dd MMM yyyy", { locale: fr })}</TableCell>
                        <TableCell className="text-slate-500">{quote.valid_until && format(new Date(quote.valid_until), "dd MMM yyyy", { locale: fr })}</TableCell>
                        <TableCell className="font-semibold">{quote.total_ttc?.toFixed(2)} €</TableCell>
                        <TableCell><Badge className={statusConfig.class}>{statusConfig.label}</Badge></TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setEditingQuote(quote); setFormOpen(true); }}><Pencil className="w-4 h-4 mr-2" /> Modifier</DropdownMenuItem>
                              {quote.status === 'draft' && <DropdownMenuItem onClick={() => updateMutation.mutate({ id: quote.id, data: { status: 'sent' } })}><Send className="w-4 h-4 mr-2" /> Envoyer</DropdownMenuItem>}
                              {quote.status === 'sent' && <DropdownMenuItem onClick={() => convertToOrder.mutate(quote)}><ShoppingCart className="w-4 h-4 mr-2" /> Convertir en commande</DropdownMenuItem>}
                              {quote.status === 'sent' && <DropdownMenuItem onClick={() => updateMutation.mutate({ id: quote.id, data: { status: 'rejected' } })}><XCircle className="w-4 h-4 mr-2" /> Marquer refusé</DropdownMenuItem>}
                              <DropdownMenuItem onClick={() => { if (confirm(`Supprimer le devis "${quote.quote_number}" ?`)) deleteMutation.mutate(quote.id); }} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Supprimer</DropdownMenuItem>
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

        <QuoteForm open={formOpen} onOpenChange={setFormOpen} quote={editingQuote}
          onSave={(data) => { if (editingQuote) updateMutation.mutate({ id: editingQuote.id, data }); else createMutation.mutate(data); }}
          customers={customers} products={products} />
      </div>
    </div>
  );
}
