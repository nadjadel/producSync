import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const STATUSES = [
  { value: 'available', label: 'Disponible' },
  { value: 'busy', label: 'Occupé' },
  { value: 'maintenance', label: 'En maintenance' },
  { value: 'offline', label: 'Hors ligne' },
];

export default function WorkstationForm({ open, onOpenChange, workstation, onSave }) {
  const [formData, setFormData] = useState({ name: '', code: '', description: '', status: 'available', capacity_per_hour: 0 });

  useEffect(() => {
    if (workstation) {
      setFormData({ name: workstation.name || '', code: workstation.code || '', description: workstation.description || '', status: workstation.status || 'available', capacity_per_hour: workstation.capacity_per_hour || 0 });
    } else {
      setFormData({ name: '', code: '', description: '', status: 'available', capacity_per_hour: 0 });
    }
  }, [workstation, open]);

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {workstation ? 'Modifier le poste' : 'Nouveau poste de travail'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Poste assemblage 1" required />
            </div>
            <div className="space-y-2">
              <Label>Code *</Label>
              <Input value={formData.code} onChange={(e) => handleChange('code', e.target.value)} placeholder="PA-01" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={formData.description} onChange={(e) => handleChange('description', e.target.value)} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Capacité/heure</Label>
              <Input type="number" min="0" value={formData.capacity_per_hour}
                onChange={(e) => handleChange('capacity_per_hour', parseInt(e.target.value) || 0)} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" className="bg-slate-900 hover:bg-slate-800">
              {workstation ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
