import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const STATUSES = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'planned', label: 'Planifié' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'completed', label: 'Terminé' },
  { value: 'cancelled', label: 'Annulé' }
];

const PRIORITIES = [
  { value: 'low', label: 'Basse' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'high', label: 'Haute' },
  { value: 'urgent', label: 'Urgente' }
];

export default function OrderForm({ open, onOpenChange, order, onSave, products, workstations, suppliers = [] }) {
  const [formData, setFormData] = useState({
    order_number: '',
    product_id: '',
    product_name: '',
    quantity_planned: 1,
    quantity_produced: 0,
    status: 'draft',
    priority: 'medium',
    workstation_id: '',
    workstation_name: '',
    planned_start: '',
    planned_end: '',
    notes: '',
    is_subcontracted: false,
    supplier_id: '',
    supplier_name: '',
    subcontract_number: '',
    subcontract_sent_date: '',
    subcontract_expected_date: '',
    subcontract_unit_price: ''
  });

  useEffect(() => {
    if (order) {
      setFormData({
        order_number: order.order_number || '',
        product_id: order.product_id || '',
        product_name: order.product_name || '',
        quantity_planned: order.quantity_planned || 1,
        quantity_produced: order.quantity_produced || 0,
        status: order.status || 'draft',
        priority: order.priority || 'medium',
        workstation_id: order.workstation_id || '',
        workstation_name: order.workstation_name || '',
        planned_start: order.planned_start ? order.planned_start.slice(0, 16) : '',
        planned_end: order.planned_end ? order.planned_end.slice(0, 16) : '',
        notes: order.notes || '',
        is_subcontracted: order.is_subcontracted || false,
        supplier_id: order.supplier_id || '',
        supplier_name: order.supplier_name || '',
        subcontract_number: order.subcontract_number || '',
        subcontract_sent_date: order.subcontract_sent_date || '',
        subcontract_expected_date: order.subcontract_expected_date || '',
        subcontract_unit_price: order.subcontract_unit_price || ''
      });
    } else {
      const newOrderNumber = `OF-${Date.now().toString().slice(-8)}`;
      setFormData({
        order_number: newOrderNumber,
        product_id: '',
        product_name: '',
        quantity_planned: 1,
        quantity_produced: 0,
        status: 'draft',
        priority: 'medium',
        workstation_id: '',
        workstation_name: '',
        planned_start: '',
        planned_end: '',
        notes: '',
        is_subcontracted: false,
        supplier_id: '',
        supplier_name: '',
        subcontract_number: '',
        subcontract_sent_date: '',
        subcontract_expected_date: '',
        subcontract_unit_price: ''
      });
    }
  }, [order, open]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProductChange = (productId) => {
    const selectedProduct = products.find(p => p.id === productId);
    setFormData(prev => ({
      ...prev,
      product_id: productId,
      product_name: selectedProduct?.name || ''
    }));
  };

  const handleWorkstationChange = (wsId) => {
    const selectedWs = workstations.find(w => w.id === wsId);
    setFormData(prev => ({
      ...prev,
      workstation_id: wsId,
      workstation_name: selectedWs?.name || ''
    }));
  };

  const handleSupplierChange = (supplierId) => {
    const selectedSupplier = suppliers.find(s => s.id === supplierId);
    setFormData(prev => ({
      ...prev,
      supplier_id: supplierId,
      supplier_name: selectedSupplier?.company_name || ''
    }));
  };

  const handleSubcontractToggle = (checked) => {
    handleChange('is_subcontracted', checked);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Filtrer les propriétés MongoDB et autres champs non désirés
    const { _id, id, createdAt, updatedAt, __v, ...cleanData } = formData;
    onSave(cleanData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {order ? 'Modifier l\'ordre de fabrication' : 'Nouvel ordre de fabrication'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="order_number">N° Ordre *</Label>
              <Input
                id="order_number"
                value={formData.order_number}
                onChange={(e) => handleChange('order_number', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Produit</Label>
              {order ? (
                <Input
                  value={formData.product_name || formData.product_id || '—'}
                  readOnly
                  className="bg-slate-50 text-slate-700 cursor-default"
                />
              ) : (
                <Select value={formData.product_id} onValueChange={handleProductChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un produit" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(products) ? products : []).map(p => (
                      <SelectItem key={p.id || p._id} value={p.id || p._id}>
                        {p.reference} - {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity_planned">Quantité planifiée *</Label>
              <Input
                id="quantity_planned"
                type="number"
                min="1"
                value={formData.quantity_planned}
                onChange={(e) => handleChange('quantity_planned', parseInt(e.target.value) || 1)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity_produced">Quantité produite</Label>
              <Input
                id="quantity_produced"
                type="number"
                min="0"
                value={formData.quantity_produced}
                onChange={(e) => handleChange('quantity_produced', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priorité</Label>
              <Select value={formData.priority} onValueChange={(v) => handleChange('priority', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Poste de travail</Label>
              <Select value={formData.workstation_id} onValueChange={handleWorkstationChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Aucun" />
                </SelectTrigger>
                <SelectContent>
                  {workstations.map(ws => (
                    <SelectItem key={ws.id} value={ws.id}>{ws.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="planned_start">Début planifié</Label>
              <Input
                id="planned_start"
                type="datetime-local"
                value={formData.planned_start}
                onChange={(e) => handleChange('planned_start', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="planned_end">Fin planifiée</Label>
              <Input
                id="planned_end"
                type="datetime-local"
                value={formData.planned_end}
                onChange={(e) => handleChange('planned_end', e.target.value)}
              />
            </div>
          </div>

          {/* Sous-traitance */}
          <div className="border rounded-lg p-4 space-y-4 bg-amber-50 border-amber-200">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_subcontracted"
                checked={formData.is_subcontracted}
                onChange={(e) => handleSubcontractToggle(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="is_subcontracted" className="text-amber-800 font-semibold cursor-pointer">
                🏭 Envoyer en sous-traitance
              </Label>
            </div>
            {formData.is_subcontracted && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>N° Sous-traitance</Label>
                    <Input value={formData.subcontract_number || ''} readOnly className="bg-amber-100 font-mono font-semibold" />
                  </div>
                  <div className="space-y-2">
                    <Label>Fournisseur sous-traitant *</Label>
                    <Select value={formData.supplier_id} onValueChange={handleSupplierChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un fournisseur" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.company_name} {s.speciality ? `(${s.speciality})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subcontract_unit_price">Prix unitaire (€)</Label>
                    <Input
                      id="subcontract_unit_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.subcontract_unit_price}
                      onChange={(e) => handleChange('subcontract_unit_price', parseFloat(e.target.value) || '')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subcontract_sent_date">Date d'envoi</Label>
                    <Input
                      id="subcontract_sent_date"
                      type="date"
                      value={formData.subcontract_sent_date}
                      onChange={(e) => handleChange('subcontract_sent_date', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subcontract_expected_date">Date retour prévue</Label>
                    <Input
                      id="subcontract_expected_date"
                      type="date"
                      value={formData.subcontract_expected_date}
                      onChange={(e) => handleChange('subcontract_expected_date', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              placeholder="Informations complémentaires..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" className="bg-slate-900 hover:bg-slate-800">
              {order ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}