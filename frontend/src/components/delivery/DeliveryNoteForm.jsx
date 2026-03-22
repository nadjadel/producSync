import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { getNextNumber } from '@/components/utils/counterUtils';

export default function DeliveryNoteForm({ open, onOpenChange, onSave, manufacturingOrders = [], customers = [] }) {
  const [selectedOFs, setSelectedOFs] = useState([]);
  const [formData, setFormData] = useState({
    delivery_date: new Date().toISOString().slice(0, 10),
    delivery_address: '',
    notes: '',
  });

  const ofsByOrder = manufacturingOrders
    .filter(of => of.customer_order_id && of.ready_for_delivery && !of.delivered)
    .reduce((acc, of) => {
      const key = of.customer_order_id;
      if (!acc[key]) {
        acc[key] = { customer_order_id: of.customer_order_id, customer_order_number: of.customer_order_number, ofs: [] };
      }
      acc[key].ofs.push(of);
      return acc;
    }, {});

  const handleToggleOF = (of) => {
    setSelectedOFs(prev =>
      prev.find(item => item.id === of.id)
        ? prev.filter(item => item.id !== of.id)
        : [...prev, of]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedOFs.length === 0) return alert('Veuillez sélectionner au moins un OF');

    const firstOF = selectedOFs[0];
    const deliveryNumber = await getNextNumber('BL');

    onSave({
      delivery_number: deliveryNumber,
      customer_id: firstOF.customer_order_id || '',
      customer_name: firstOF.customer_order_number || 'Client',
      order_id: firstOF.customer_order_id,
      order_number: firstOF.customer_order_number,
      delivery_date: formData.delivery_date,
      status: 'draft',
      items: selectedOFs.map(of => ({
        manufacturing_order_id: of.id,
        order_number: of.order_number,
        product_id: of.product_id,
        product_name: of.product_name,
        product_reference: of.product_reference || '',
        quantity: of.quantity_produced || of.quantity_planned,
        unit_price: 0,
        total: 0,
      })),
      delivery_address: formData.delivery_address,
      notes: formData.notes,
    }, selectedOFs);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Créer un bon de livraison</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Label>Sélectionner les OF à livrer</Label>

            {Object.values(ofsByOrder).length === 0 ? (
              <div className="text-center py-8 text-slate-400">Aucun OF prêt pour la livraison</div>
            ) : (
              <div className="space-y-6">
                {Object.values(ofsByOrder).map((group) => (
                  <div key={group.customer_order_id} className="border rounded-lg p-4 space-y-3">
                    <div className="font-semibold text-slate-900">Commande: {group.customer_order_number}</div>
                    <div className="space-y-2">
                      {group.ofs.map(of => {
                        const isSelected = !!selectedOFs.find(item => item.id === of.id);
                        return (
                          <div key={of.id}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer"
                            onClick={() => handleToggleOF(of)}>
                            <div className="flex items-center gap-3">
                              <Checkbox checked={isSelected} onCheckedChange={() => handleToggleOF(of)} />
                              <div>
                                <p className="font-medium text-slate-900">{of.order_number}</p>
                                <p className="text-sm text-slate-500">{of.product_name}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{of.quantity_produced || of.quantity_planned} unités</p>
                              <Badge className="bg-emerald-100 text-emerald-700 mt-1">Prêt</Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedOFs.length > 0 && (
            <>
              <div className="space-y-2">
                <Label>Date de livraison</Label>
                <Input type="date" value={formData.delivery_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivery_date: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Adresse de livraison</Label>
                <Textarea value={formData.delivery_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivery_address: e.target.value }))}
                  rows={3} placeholder="Adresse complète..." />
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
            <Button type="submit" className="bg-slate-900 hover:bg-slate-800" disabled={selectedOFs.length === 0}>
              Créer le BL
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
