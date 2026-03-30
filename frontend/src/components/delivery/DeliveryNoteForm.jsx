import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

export default function DeliveryNoteForm({ open, onOpenChange, onSave, manufacturingOrders = [], customers = [], orders = [] }) {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedOFs, setSelectedOFs] = useState([]);
  const [formData, setFormData] = useState({
    delivery_date: new Date().toISOString().slice(0, 10),
    delivery_address: '',
    notes: '',
  });

  // Réinitialiser à l'ouverture du dialog
  useEffect(() => {
    if (open) {
      setSelectedCustomerId('');
      setSelectedOFs([]);
      setFormData({
        delivery_date: new Date().toISOString().slice(0, 10),
        delivery_address: '',
        notes: '',
      });
    }
  }, [open]);

  // Changer de client : réinitialise les OFs sélectionnés et remplit l'adresse
  const handleCustomerChange = (customerId) => {
    setSelectedCustomerId(customerId);
    setSelectedOFs([]);
    const customer = customers.find(c => (c._id || c.id) === customerId);
    if (customer) {
      const addr = [
        customer.address,
        [customer.postal_code, customer.city].filter(Boolean).join(' '),
        customer.country,
      ].filter(Boolean).join('\n');
      setFormData(prev => ({ ...prev, delivery_address: addr }));
    }
  };

  // IDs des commandes du client sélectionné
  const customerOrderIds = new Set(
    orders
      .filter(o => o.customer_id === selectedCustomerId)
      .map(o => o._id || o.id)
  );

  // OFs disponibles : prêts, non livrés, appartenant au client sélectionné
  const availableOFs = manufacturingOrders.filter(of =>
    of.ready_for_delivery && !of.delivered && customerOrderIds.has(of.customer_order_id)
  );

  const ofId = (of) => of._id || of.id;

  const handleToggleOF = (of) => {
    setSelectedOFs(prev =>
      prev.find(item => ofId(item) === ofId(of))
        ? prev.filter(item => ofId(item) !== ofId(of))
        : [...prev, of]
    );
  };

  const handleSelectAll = () => {
    if (selectedOFs.length === availableOFs.length) {
      setSelectedOFs([]);
    } else {
      setSelectedOFs([...availableOFs]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) return alert('Veuillez sélectionner un client');
    if (selectedOFs.length === 0) return alert('Veuillez sélectionner au moins un OF');

    const customer = customers.find(c => (c._id || c.id) === selectedCustomerId);

    onSave({
      customer_id: selectedCustomerId,
      customer_name: customer?.company_name || '',
      delivery_date: formData.delivery_date,
      status: 'draft',
      items: selectedOFs.map(of => ({
        manufacturing_order_id: of._id || of.id,
        order_number: of.order_number,
        product_id: of.product_id,
        product_name: of.product_name,
        product_reference: of.product_reference || '',
        quantity: of.quantity_produced || of.quantity_planned,
        unit_price: 0,
      })),
      delivery_address: formData.delivery_address,
      notes: formData.notes,
    }, selectedOFs);
  };

  const selectedCustomer = customers.find(c => (c._id || c.id) === selectedCustomerId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Créer un bon de livraison</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* 1. Sélection du client */}
          <div className="space-y-2">
            <Label>Client *</Label>
            <Select value={selectedCustomerId} onValueChange={handleCustomerChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un client…" />
              </SelectTrigger>
              <SelectContent>
                {customers.map(c => (
                  <SelectItem key={c._id || c.id} value={c._id || c.id}>
                    {c.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 2. OFs disponibles pour ce client */}
          {selectedCustomerId && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>OF prêts à livrer — {selectedCustomer?.company_name}</Label>
                {availableOFs.length > 0 && (
                  <button type="button" onClick={handleSelectAll}
                    className="text-xs text-blue-600 hover:underline">
                    {selectedOFs.length === availableOFs.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                  </button>
                )}
              </div>

              {availableOFs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 border rounded-lg bg-slate-50">
                  Aucun OF prêt à livrer pour ce client
                </div>
              ) : (
                <div className="border rounded-lg divide-y">
                  {availableOFs.map(of => {
                    const isSelected = !!selectedOFs.find(item => ofId(item) === ofId(of));
                    return (
                      <div key={ofId(of)}
                        className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 cursor-pointer"
                        onClick={() => handleToggleOF(of)}>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={isSelected}
                            onClick={(e) => e.stopPropagation()}
                            onCheckedChange={() => handleToggleOF(of)}
                          />
                          <div>
                            <p className="font-medium text-slate-900">{of.order_number}</p>
                            <p className="text-sm text-slate-500">{of.product_name}</p>
                            <p className="text-xs text-slate-400">Commande : {of.customer_order_number}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">{of.quantity_produced || of.quantity_planned} unités</p>
                          <Badge className="bg-emerald-100 text-emerald-700 text-xs mt-1">Prêt</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 3. Détails du BL (visible dès qu'un client est choisi) */}
          {selectedCustomerId && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date de livraison *</Label>
                  <Input type="date" value={formData.delivery_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, delivery_date: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>OF sélectionnés</Label>
                  <Input value={`${selectedOFs.length} OF`} readOnly className="bg-slate-50 text-slate-600" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Adresse de livraison</Label>
                <Textarea value={formData.delivery_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivery_address: e.target.value }))}
                  rows={3} placeholder="Adresse de livraison…" />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} rows={2} />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" className="bg-slate-900 hover:bg-slate-800"
              disabled={!selectedCustomerId || selectedOFs.length === 0}>
              Créer le BL ({selectedOFs.length} OF)
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
