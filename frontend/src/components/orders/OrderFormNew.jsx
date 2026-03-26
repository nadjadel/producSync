import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { counterService } from '@/api/counterService';

export default function OrderFormNew({ open, onOpenChange, order, onSave, customers, products }) {
  const [formData, setFormData] = useState({
    order_number: '',
    customer_id: '',
    customer_name: '',
    status: 'draft',
    order_date: new Date().toISOString().slice(0, 10),
    delivery_date_requested: '',
    items: [],
    delivery_address: '',
    notes: '',
    vat_rate: 20
  });

  useEffect(() => {
    if (order) {
      setFormData({
        order_number: order.order_number || '',
        customer_id: order.customer_id || '',
        customer_name: order.customer_name || '',
        status: order.status || 'draft',
        order_date: order.order_date || new Date().toISOString().slice(0, 10),
        delivery_date_requested: order.delivery_date_requested || '',
        items: order.items || [],
        delivery_address: order.delivery_address || '',
        notes: order.notes || '',
        vat_rate: order.vat_rate || 20
      });
    } else if (open && !order) {
      (async () => {
        const newOrderNumber = await counterService.getNextNumber('CO');
        setFormData({
          order_number: newOrderNumber,
          customer_id: '',
          customer_name: '',
          status: 'draft',
          order_date: new Date().toISOString().slice(0, 10),
          delivery_date_requested: '',
          items: [],
          delivery_address: '',
          notes: '',
          vat_rate: 20
        });
      })();
    }
  }, [order, open]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomerChange = (customerId) => {
    // Try to find customer by id or _id
    const customer = customers.find(c => c.id === customerId || c._id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customer_id: customerId,
        customer_name: customer.company_name,
        delivery_address: `${customer.address || ''}\n${customer.postal_code || ''} ${customer.city || ''}`.trim()
      }));
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { 
        product_id: '', 
        product_name: '', 
        product_reference: '',
        quantity: 1, 
        unit_price: 0, 
        total: 0 
      }]
    }));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    if (field === 'product_id') {
      const product = products.find(p => p._id === value|| p.id === value);
      newItems[index] = {
        ...newItems[index],
        product_id: value,
        product_name: product?.name || '',
        product_reference: product?.reference || '',
        unit_price: product?.sell_price || 0,
        total: (product?.sell_price || 0) * (newItems[index].quantity || 1)
      };
    } else {
      newItems[index][field] = value;
      if (field === 'quantity' || field === 'unit_price') {
        newItems[index].total = (newItems[index].quantity || 0) * (newItems[index].unit_price || 0);
      }
    }
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotals = () => {
    const total_ht = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
    const total_vat = total_ht * (formData.vat_rate / 100);
    const total_ttc = total_ht + total_vat;
    return { total_ht, total_vat, total_ttc };
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

  const { total_ht, total_vat, total_ttc } = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {order ? 'Modifier la commande' : 'Nouvelle commande client'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
          
            <div className="space-y-2">
              <Label htmlFor="order_date">Date *</Label>
              <Input
                id="order_date"
                type="date"
                value={formData.order_date}
                onChange={(e) => handleChange('order_date', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery_date">Livraison souhaitée</Label>
              <Input
                id="delivery_date"
                type="date"
                value={formData.delivery_date_requested}
                onChange={(e) => handleChange('delivery_date_requested', e.target.value)}
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
                  <SelectItem key={c.id || c._id} value={c.id || c._id}>{c.company_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Lignes de commande</Label>
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
                          <Select 
                            value={item.product_id} 
                            onValueChange={(v) => updateItem(index, 'product_id', v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.filter(p => p.category === 'produit_fini').map(p => (
                                <SelectItem key={p.id || p._id} value={p.id || p._id}>
                                  {p.reference} - {p.name}
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
                            onClick={() => removeItem(index)}
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

          {/* Totaux */}
          <div className="flex justify-end">
            <div className="w-80 space-y-2 bg-slate-50 p-4 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Total HT:</span>
                <span className="font-semibold">{total_ht.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>TVA ({formData.vat_rate}%):</span>
                <span className="font-semibold">{total_vat.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total TTC:</span>
                <span>{total_ttc.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery_address">Adresse de livraison</Label>
            <Textarea
              id="delivery_address"
              value={formData.delivery_address}
              onChange={(e) => handleChange('delivery_address', e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" className="bg-slate-900 hover:bg-slate-800" disabled={!formData.customer_id || formData.items.length === 0}>
              {order ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}