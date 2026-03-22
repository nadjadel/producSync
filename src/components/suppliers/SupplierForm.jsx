import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function SupplierForm({ open, onOpenChange, supplier, onSave }) {
  const [formData, setFormData] = useState({
    code: '', company_name: '', siret: '', vat_number: '',
    contact_name: '', email: '', phone: '',
    address: '', postal_code: '', city: '', country: 'France',
    speciality: '', status: 'active', payment_terms: '30_days', notes: ''
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        code: supplier.code || '',
        company_name: supplier.company_name || '',
        siret: supplier.siret || '',
        vat_number: supplier.vat_number || '',
        contact_name: supplier.contact_name || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        postal_code: supplier.postal_code || '',
        city: supplier.city || '',
        country: supplier.country || 'France',
        speciality: supplier.speciality || '',
        status: supplier.status || 'active',
        payment_terms: supplier.payment_terms || '30_days',
        notes: supplier.notes || ''
      });
    } else {
      setFormData({
        code: '', company_name: '', siret: '', vat_number: '',
        contact_name: '', email: '', phone: '',
        address: '', postal_code: '', city: '', country: 'France',
        speciality: '', status: 'active', payment_terms: '30_days', notes: ''
      });
    }
  }, [supplier, open]);

  const h = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{supplier ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Raison sociale *</Label>
              <Input value={formData.company_name} onChange={e => h('company_name', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Code fournisseur</Label>
              <Input value={formData.code} onChange={e => h('code', e.target.value.toUpperCase())} maxLength={6} placeholder="EX: ACM" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Spécialité / Domaine</Label>
              <Input value={formData.speciality} onChange={e => h('speciality', e.target.value)} placeholder="ex: Usinage, Peinture..." />
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={formData.status} onValueChange={v => h('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contact</Label>
              <Input value={formData.contact_name} onChange={e => h('contact_name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={formData.email} onChange={e => h('email', e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input value={formData.phone} onChange={e => h('phone', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>SIRET</Label>
              <Input value={formData.siret} onChange={e => h('siret', e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Adresse</Label>
            <Input value={formData.address} onChange={e => h('address', e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Code postal</Label>
              <Input value={formData.postal_code} onChange={e => h('postal_code', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Ville</Label>
              <Input value={formData.city} onChange={e => h('city', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Pays</Label>
              <Input value={formData.country} onChange={e => h('country', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>N° TVA</Label>
              <Input value={formData.vat_number} onChange={e => h('vat_number', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Conditions de paiement</Label>
              <Select value={formData.payment_terms} onValueChange={v => h('payment_terms', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Comptant</SelectItem>
                  <SelectItem value="30_days">30 jours</SelectItem>
                  <SelectItem value="45_days">45 jours</SelectItem>
                  <SelectItem value="60_days">60 jours</SelectItem>
                  <SelectItem value="end_of_month">Fin de mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={formData.notes} onChange={e => h('notes', e.target.value)} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" className="bg-slate-900 hover:bg-slate-800">
              {supplier ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}