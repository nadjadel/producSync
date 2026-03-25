import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { getNextNumber } from '@/components/utils/counterUtils';

const QuoteForm = ({ open, onOpenChange, quote, onSave, customers = [], products = [], prefilledData = null }) => {
  const [formData, setFormData] = useState({
    quote_number: '', customer_id: '', customer_name: '',
    status: 'draft', quote_date: new Date().toISOString().slice(0, 10),
    valid_until: '', items: [], notes: '', vat_rate: 20,
  });

  React.useEffect(() => {
    if (quote) {
      // Mode édition : utiliser les données du devis existant
      setFormData({ ...quote, items: quote.items || [] });
    } else if (open && !quote) {
      // Mode création : initialiser avec données pré-remplies ou valeurs par défaut
      (async () => {
        const quoteNumber = await getNextNumber('DE');
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 30);
        
        const initialData = prefilledData || {
          quote_number: quoteNumber,
          customer_id: '',
          customer_name: '',
          status: 'draft',
          quote_date: new Date().toISOString().slice(0, 10),
          valid_until: validUntil.toISOString().slice(0, 10),
          items: [],
          notes: '',
          vat_rate: 20,
        };

        // Si prefilledData existe mais n'a pas de quote_number, utiliser celui généré
        if (prefilledData && !prefilledData.quote_number) {
          initialData.quote_number = quoteNumber;
        }

        setFormData(initialData);
      })();
    }
  }, [quote, open, prefilledData]);

  const handleCustomerChange = (customerId) => {
    // Try to find customer by id or _id
    const customer = customers.find(c => c.id === customerId || c._id === customerId);
    setFormData(prev => ({ ...prev, customer_id: customerId, customer_name: customer?.company_name || '' }));
  };

  const addItem = () => setFormData(prev => ({
    ...prev, items: [...prev.items, { product_id: '', product_name: '', product_reference: '', quantity: 1, unit_price: 0, total: 0 }],
  }));

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    if (field === 'product_id') {
      // Try to find product by id or _id
      const p = products.find(p => p.id === value || p._id === value);
      newItems[index] = { 
        ...newItems[index], 
        product_id: value, 
        product_name: p?.name || '', 
        product_reference: p?.reference || '', 
        unit_price: p?.sell_price || 0, 
        total: (p?.sell_price || 0) * (newItems[index].quantity || 1) 
      };
    } else {
      newItems[index][field] = value;
      if (field === 'quantity' || field === 'unit_price') {
        newItems[index].total = (newItems[index].quantity || 0) * (newItems[index].unit_price || 0);
      }
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
    // Créer une copie des données sans les propriétés calculées
    const dataToSend = { ...formData };
    
    // Ne pas inclure les totaux calculés (l'API les calcule probablement côté serveur)
    delete dataToSend.total_ht;
    delete dataToSend.total_vat;
    delete dataToSend.total_ttc;
    
    // Nettoyer les items : enlever la propriété 'total' de chaque item
    if (dataToSend.items && Array.isArray(dataToSend.items)) {
      dataToSend.items = dataToSend.items.map(item => {
        const { total, ...cleanItem } = item;
        return cleanItem;
      });
    }
    
    onSave(dataToSend);
  };

  const { total_ht, total_vat, total_ttc } = totals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {quote ? 'Modifier le devis' : 'Nouveau devis'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>N° Devis *</Label>
              <Input 
                value={formData.quote_number} 
                onChange={(e) => setFormData(p => ({ ...p, quote_number: e.target.value }))} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input 
                type="date" 
                value={formData.quote_date} 
                onChange={(e) => setFormData(p => ({ ...p, quote_date: e.target.value }))} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>Valide jusqu'au</Label>
              <Input 
                type="date" 
                value={formData.valid_until} 
                onChange={(e) => setFormData(p => ({ ...p, valid_until: e.target.value }))} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Client *</Label>
            <Select value={formData.customer_id} onValueChange={handleCustomerChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent>
                {customers.map(c => (
                  <SelectItem key={c.id || c._id} value={c.id || c._id}>
                    {c.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Lignes du devis</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" /> Ajouter
              </Button>
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
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map(p => (
                                <SelectItem key={p.id || p._id} value={p.id || p._id}>
                                  {p.reference} — {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            min="1" 
                            value={item.quantity} 
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)} 
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            step="0.01" 
                            value={item.unit_price} 
                            onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)} 
                          />
                        </TableCell>
                        <TableCell className="font-semibold">
                          {item.total?.toFixed(2)} €
                        </TableCell>
                        <TableCell>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setFormData(p => ({ ...p, items: p.items.filter((_, i) => i !== index) }))}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <div className="w-80 space-y-2 bg-slate-50 p-4 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Total HT:</span>
                <span className="font-semibold">{total_ht.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>TVA (20%):</span>
                <span className="font-semibold">{total_vat.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total TTC:</span>
                <span>{total_ttc.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea 
              value={formData.notes} 
              onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))} 
              rows={2} 
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="bg-slate-900 hover:bg-slate-800" 
              disabled={!formData.customer_id || formData.items.length === 0}
            >
              {quote ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuoteForm;