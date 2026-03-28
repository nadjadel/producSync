import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const PAYMENT_TERMS = [
  { value: '30_days', label: '30 jours' },
  { value: '45_days', label: '45 jours' },
  { value: '60_days', label: '60 jours' },
  { value: 'end_of_month', label: 'Fin de mois' },
  { value: 'cash', label: 'Comptant' },
];

const STATUSES = [
  { value: 'prospect', label: 'Prospect' },
  { value: 'active', label: 'Actif' },
  { value: 'inactive', label: 'Inactif' },
];

const emptyForm = {
  company_name: '', siret: '', vat_number: '',
  contact_name: '', email: '', phone: '', address: '',
  postal_code: '', city: '', country: 'France',
  payment_terms: '30_days', status: 'active', notes: '',
};

export default function CustomerForm({ open, onOpenChange, customer, onSave, existingCustomers = [] }) {
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (customer) {
      setFormData({ ...emptyForm, ...customer });
    } else {
      setFormData(emptyForm);
    }
  }, [customer, open]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Filtrer les propriétés MongoDB et autres champs non désirés
    const { _id, id, createdAt, updatedAt, __v, ...cleanData } = formData;
    onSave(cleanData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {customer ? 'Modifier le client' : 'Nouveau client'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Raison sociale *</Label>
              <Input value={formData.company_name} onChange={(e) => handleChange('company_name', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>SIRET</Label>
              <Input value={formData.siret} onChange={(e) => handleChange('siret', e.target.value)} placeholder="123 456 789 00012" />
            </div>
            <div className="space-y-2">
              <Label>N° TVA intracommunautaire</Label>
              <Input value={formData.vat_number} onChange={(e) => handleChange('vat_number', e.target.value)} placeholder="FR12345678901" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contact principal</Label>
              <Input value={formData.contact_name} onChange={(e) => handleChange('contact_name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input value={formData.address} onChange={(e) => handleChange('address', e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Code postal</Label>
                <Input value={formData.postal_code} onChange={(e) => handleChange('postal_code', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Ville</Label>
                <Input value={formData.city} onChange={(e) => handleChange('city', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Pays</Label>
                <Input value={formData.country} onChange={(e) => handleChange('country', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Conditions de paiement</Label>
              <Select value={formData.payment_terms} onValueChange={(v) => handleChange('payment_terms', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_TERMS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes internes</Label>
            <Textarea value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" className="bg-slate-900 hover:bg-slate-800">
              {customer ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
