import React, { useState } from 'react';
import { Shield, Users, Building2, Settings, TrendingUp, AlertTriangle, CheckCircle, XCircle, Pause, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Données de démonstration — à remplacer par les vrais appels API
const DEMO_TENANTS = [
  { id: '1', name: 'Acme Industries', slug: 'acme', email: 'admin@acme.fr', plan: 'pro', status: 'active', enable_task_routines: true, enable_product_ranges: true, created_at: '2025-01-15' },
  { id: '2', name: 'Dupont Fabrication', slug: 'dupont', email: 'contact@dupont.com', plan: 'starter', status: 'trial', enable_task_routines: false, enable_product_ranges: false, created_at: '2025-03-01' },
  { id: '3', name: 'Martin SA', slug: 'martin', email: 'it@martin-sa.fr', plan: 'enterprise', status: 'active', enable_task_routines: true, enable_product_ranges: true, created_at: '2024-11-20' },
  { id: '4', name: 'Test Corp', slug: 'testcorp', email: 'test@test.fr', plan: 'free', status: 'suspended', enable_task_routines: false, enable_product_ranges: false, created_at: '2025-02-10' },
];

const PLAN_CONFIG = {
  free:       { label: 'Free',       class: 'bg-slate-700 text-slate-300' },
  starter:    { label: 'Starter',    class: 'bg-blue-900 text-blue-300' },
  pro:        { label: 'Pro',        class: 'bg-purple-900 text-purple-300' },
  enterprise: { label: 'Enterprise', class: 'bg-yellow-900 text-yellow-300' },
};

const STATUS_CONFIG = {
  trial:     { label: 'Essai',    class: 'bg-blue-900 text-blue-300' },
  active:    { label: 'Actif',    class: 'bg-emerald-900 text-emerald-300' },
  suspended: { label: 'Suspendu', class: 'bg-red-900 text-red-300' },
  cancelled: { label: 'Annulé',   class: 'bg-slate-700 text-slate-400' },
};

function TenantDetailDialog({ tenant, open, onOpenChange, onUpdate }) {
  const [form, setForm] = useState(tenant ? { ...tenant } : {});
  React.useEffect(() => { if (tenant) setForm({ ...tenant }); }, [tenant]);

  if (!tenant) return null;

  const handleSave = () => { onUpdate(form); onOpenChange(false); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-slate-800 border-slate-700 text-white">
        <DialogHeader><DialogTitle className="text-white">Configuration — {tenant.name}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Nom</Label>
              <Input value={form.name || ''} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Email admin</Label>
              <Input value={form.email || ''} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} className="bg-slate-700 border-slate-600 text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Plan</Label>
              <Select value={form.plan} onValueChange={(v) => setForm(p => ({ ...p, plan: v }))}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {['free', 'starter', 'pro', 'enterprise'].map(p => <SelectItem key={p} value={p} className="text-white">{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Statut</Label>
              <Select value={form.status} onValueChange={(v) => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {['trial', 'active', 'suspended', 'cancelled'].map(s => <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-700">
            <Label className="text-slate-300">Modules activés</Label>
            <label className="flex items-center justify-between p-3 bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-600">
              <div>
                <p className="font-medium text-white">Gammes de tâches</p>
                <p className="text-xs text-slate-400">Routages de fabrication</p>
              </div>
              <input type="checkbox" checked={form.enable_task_routines || false} onChange={(e) => setForm(p => ({ ...p, enable_task_routines: e.target.checked }))} className="w-5 h-5 accent-yellow-400" />
            </label>
            <label className="flex items-center justify-between p-3 bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-600">
              <div>
                <p className="font-medium text-white">Gammes de produits</p>
                <p className="text-xs text-slate-400">Regroupement par gamme</p>
              </div>
              <input type="checkbox" checked={form.enable_product_ranges || false} onChange={(e) => setForm(p => ({ ...p, enable_product_ranges: e.target.checked }))} className="w-5 h-5 accent-yellow-400" />
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-600 text-slate-300 hover:bg-slate-700">Annuler</Button>
          <Button onClick={handleSave} className="bg-yellow-400 text-slate-900 hover:bg-yellow-300 font-semibold">Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SuperAdmin() {
  const [tenants, setTenants] = useState(DEMO_TENANTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filtered = tenants.filter(t =>
    (t.name?.toLowerCase().includes(searchTerm.toLowerCase()) || t.slug?.includes(searchTerm.toLowerCase())) &&
    (!statusFilter || t.status === statusFilter)
  );

  const stats = {
    total: tenants.length,
    active: tenants.filter(t => t.status === 'active').length,
    trial: tenants.filter(t => t.status === 'trial').length,
    suspended: tenants.filter(t => t.status === 'suspended').length,
  };

  const toggleSuspend = (tenant) => {
    const newStatus = tenant.status === 'suspended' ? 'active' : 'suspended';
    if (confirm(`${newStatus === 'suspended' ? 'Suspendre' : 'Réactiver'} "${tenant.name}" ?`)) {
      setTenants(prev => prev.map(t => t.id === tenant.id ? { ...t, status: newStatus } : t));
      toast.success(`Tenant ${newStatus === 'suspended' ? 'suspendu' : 'réactivé'}`);
    }
  };

  const handleUpdate = (updated) => {
    setTenants(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t));
    toast.success('Tenant mis à jour');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-slate-900" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Super Administration</h1>
            <p className="text-slate-400">Gestion des tenants ProducSync</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total tenants', value: stats.total, color: 'text-white', icon: Building2 },
            { label: 'Actifs', value: stats.active, color: 'text-emerald-400', icon: CheckCircle },
            { label: 'En essai', value: stats.trial, color: 'text-blue-400', icon: TrendingUp },
            { label: 'Suspendus', value: stats.suspended, color: 'text-red-400', icon: AlertTriangle },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-400 text-sm">{kpi.label}</p>
                <kpi.icon className={cn("w-4 h-4", kpi.color)} />
              </div>
              <p className={cn("text-3xl font-bold", kpi.color)}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <Input placeholder="Rechercher un tenant..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-slate-800 border-slate-600 text-white"><SelectValue placeholder="Tous statuts" /></SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="" className="text-white">Tous statuts</SelectItem>
              <SelectItem value="trial" className="text-white">Essai</SelectItem>
              <SelectItem value="active" className="text-white">Actif</SelectItem>
              <SelectItem value="suspended" className="text-white">Suspendu</SelectItem>
              <SelectItem value="cancelled" className="text-white">Annulé</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-yellow-400 text-slate-900 hover:bg-yellow-300 font-semibold">
            <Plus className="w-4 h-4 mr-2" /> Nouveau tenant
          </Button>
        </div>

        {/* Table */}
        <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
          <table className="w-full text-white">
            <thead className="bg-slate-900/50">
              <tr>
                {['Tenant', 'Slug', 'Plan', 'Statut', 'Créé le', 'Modules', ''].map(h => (
                  <th key={h} className="text-left p-4 text-slate-400 font-medium text-sm">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((tenant) => {
                const planConfig = PLAN_CONFIG[tenant.plan] || PLAN_CONFIG.free;
                const statusConfig = STATUS_CONFIG[tenant.status] || STATUS_CONFIG.trial;
                return (
                  <tr key={tenant.id} className="border-t border-slate-700 hover:bg-slate-700/50">
                    <td className="p-4">
                      <p className="font-semibold">{tenant.name}</p>
                      <p className="text-slate-400 text-sm">{tenant.email}</p>
                    </td>
                    <td className="p-4 font-mono text-slate-300 text-sm">{tenant.slug}</td>
                    <td className="p-4"><span className={cn("text-xs px-2 py-0.5 rounded font-medium", planConfig.class)}>{planConfig.label}</span></td>
                    <td className="p-4"><span className={cn("text-xs px-2 py-0.5 rounded font-medium", statusConfig.class)}>{statusConfig.label}</span></td>
                    <td className="p-4 text-slate-400 text-sm">{tenant.created_at}</td>
                    <td className="p-4">
                      <div className="flex gap-1 flex-wrap">
                        {tenant.enable_task_routines && <span className="text-xs bg-purple-900 text-purple-300 px-2 py-0.5 rounded">Gammes</span>}
                        {tenant.enable_product_ranges && <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded">Ranges</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-600"
                          onClick={() => { setSelectedTenant(tenant); setDetailOpen(true); }}>
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className={cn("h-8 w-8 hover:bg-slate-600", tenant.status === 'suspended' ? "text-emerald-400 hover:text-emerald-300" : "text-slate-400 hover:text-red-400")}
                          onClick={() => toggleSuspend(tenant)}>
                          {tenant.status === 'suspended' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-slate-500">Aucun tenant trouvé</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <TenantDetailDialog tenant={selectedTenant} open={detailOpen} onOpenChange={setDetailOpen} onUpdate={handleUpdate} />
      </div>
    </div>
  );
}

// Import manquant
const Plus = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);
