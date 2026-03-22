import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { getNextNumber } from '@/components/utils/counterUtils';

const CATEGORIES = [
  { value: 'matiere_premiere', label: 'Matière première' },
  { value: 'semi_fini', label: 'Semi-fini' },
  { value: 'produit_fini', label: 'Produit fini' },
];

const UNITS = [
  { value: 'piece', label: 'Pièce' },
  { value: 'kg', label: 'Kilogramme' },
  { value: 'litre', label: 'Litre' },
  { value: 'metre', label: 'Mètre' },
];

const emptyForm = {
  reference: '', customer_id: '', customer_code: '', name: '', description: '',
  category: 'produit_fini', unit: 'piece', stock_quantity: 0, stock_minimum: 0,
  cost_price: 0, sell_price: 0, bom: [],
};

export default function ProductForm({ open, onOpenChange, product, onSave, allProducts = [], customers = [] }) {
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (product) {
      setFormData({ ...emptyForm, ...product, bom: product.bom || [] });
    } else {
      setFormData(emptyForm);
    }
  }, [product, open]);

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleCustomerChange = async (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer && !product) {
      const reference = await getNextNumber(`PRODUCT_${customer.code}`);
      setFormData(prev => ({ ...prev, customer_id: customerId, customer_code: customer.code, reference }));
    } else {
      setFormData(prev => ({ ...prev, customer_id: customerId, customer_code: customer?.code || '' }));
    }
  };

  const addBomItem = () => setFormData(prev => ({
    ...prev, bom: [...prev.bom, { product_id: '', product_name: '', quantity: 1 }]
  }));

  const updateBomItem = (index, field, value) => {
    const newBom = [...formData.bom];
    if (field === 'product_id') {
      const sel = allProducts.find(p => p.id === value);
      newBom[index] = { ...newBom[index], product_id: value, product_name: sel?.name || '' };
    } else {
      newBom[index] = { ...newBom[index], [field]: value };
    }
    setFormData(prev => ({ ...prev, bom: newBom }));
  };

  const removeBomItem = (index) => setFormData(prev => ({
    ...prev, bom: prev.bom.filter((_, i) => i !== index)
  }));

  const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {product ? 'Modifier le produit' : 'Nouveau produit'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Client *</Label>
            <Select value={formData.customer_id} onValueChange={handleCustomerChange}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
              <SelectContent>
                {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.code} — {c.company_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Référence *</Label>
              <Input value={formData.reference} onChange={(e) => handleChange('reference', e.target.value)}
                disabled={!!product} required placeholder="ABC-001" />
            </div>
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={formData.name} onChange={(e) => handleChange('name', e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={formData.description} onChange={(e) => handleChange('description', e.target.value)} rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Catégorie *</Label>
              <Select value={formData.category} onValueChange={(v) => handleChange('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unité *</Label>
              <Select value={formData.unit} onValueChange={(v) => handleChange('unit', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{UNITS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Stock actuel</Label>
              <Input type="number" value={formData.stock_quantity} onChange={(e) => handleChange('stock_quantity', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Stock minimum</Label>
              <Input type="number" value={formData.stock_minimum} onChange={(e) => handleChange('stock_minimum', parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prix de revient (€)</Label>
              <Input type="number" step="0.01" value={formData.cost_price} onChange={(e) => handleChange('cost_price', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Prix de vente (€)</Label>
              <Input type="number" step="0.01" value={formData.sell_price} onChange={(e) => handleChange('sell_price', parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          {formData.category !== 'matiere_premiere' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Nomenclature (composants)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addBomItem}>
                  <Plus className="w-4 h-4 mr-1" /> Ajouter
                </Button>
              </div>
              {formData.bom.length > 0 && (
                <div className="space-y-2 bg-slate-50 rounded-lg p-4">
                  {formData.bom.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Select value={item.product_id} onValueChange={(v) => updateBomItem(index, 'product_id', v)}>
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Sélectionner un composant" /></SelectTrigger>
                        <SelectContent>
                          {allProducts.filter(p => p.id !== product?.id).map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.reference} — {p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input type="number" className="w-24" placeholder="Qté" value={item.quantity}
                        onChange={(e) => updateBomItem(index, 'quantity', parseFloat(e.target.value) || 1)} />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeBomItem(index)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" className="bg-slate-900 hover:bg-slate-800">
              {product ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
