import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Package, Calendar, Cog, Play, CheckCircle, XCircle,
  Truck, ArrowRightLeft, ShoppingCart, FileText, ClipboardList,
  Pencil, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import OrderForm from '@/components/orders/OrderForm';

// ─── Config ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  draft:       { label: 'Brouillon',  class: 'bg-slate-100 text-slate-700' },
  planned:     { label: 'Planifié',   class: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'En cours',   class: 'bg-amber-100 text-amber-700' },
  completed:   { label: 'Terminé',    class: 'bg-emerald-100 text-emerald-700' },
  cancelled:   { label: 'Annulé',     class: 'bg-rose-100 text-rose-700' },
};

const PRIORITY_CONFIG = {
  low:    { label: 'Basse',    class: 'bg-slate-100 text-slate-600' },
  medium: { label: 'Moyenne',  class: 'bg-blue-100 text-blue-600' },
  high:   { label: 'Haute',    class: 'bg-orange-100 text-orange-600' },
  urgent: { label: 'Urgente',  class: 'bg-red-100 text-red-700 font-semibold' },
};

const fmt = (d) => d ? format(new Date(d), 'dd MMM yyyy', { locale: fr }) : '—';
const fmtFull = (d) => d ? format(new Date(d), 'dd MMM yyyy HH:mm', { locale: fr }) : '—';

// ─── Component ───────────────────────────────────────────────────────────────

export default function ManufacturingOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);

  // OF
  const { data: mo, isLoading } = useQuery({
    queryKey: ['manufacturing-order', id],
    queryFn: () => base44.entities.ManufacturingOrder.get(id),
    enabled: !!id,
  });

  // Données liées
  const { data: product } = useQuery({
    queryKey: ['product', mo?.product_id],
    queryFn: () => base44.entities.Product.get(mo.product_id),
    enabled: !!mo?.product_id,
  });

  const { data: customerOrder } = useQuery({
    queryKey: ['order', mo?.customer_order_id],
    queryFn: () => base44.entities.Order.get(mo.customer_order_id),
    enabled: !!mo?.customer_order_id,
  });

  const { data: deliveryNote } = useQuery({
    queryKey: ['delivery-note', mo?.delivery_note_id],
    queryFn: () => base44.entities.DeliveryNote.get(mo.delivery_note_id),
    enabled: !!mo?.delivery_note_id,
  });

  const { data: workstations = [] } = useQuery({
    queryKey: ['workstations'],
    queryFn: () => base44.entities.Workstation.list(),
  });
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.DeliveryNote.list(), // réutilise la liste existante
    enabled: false,
  });

  // Mutations de statut
  const updateMutation = useMutation({
    mutationFn: ({ data }) => base44.entities.ManufacturingOrder.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing-order', id] });
      queryClient.invalidateQueries({ queryKey: ['manufacturing-orders'] });
      toast.success('OF mis à jour');
      setFormOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const changeStatus = (newStatus) => {
    const data = { status: newStatus };
    if (newStatus === 'in_progress') data.actual_start = new Date().toISOString();
    if (newStatus === 'completed')   { data.actual_end = new Date().toISOString(); data.quantity_produced = mo.quantity_planned; }
    if (newStatus === 'ready_for_delivery') { data.ready_for_delivery = true; data.status = 'completed'; }
    updateMutation.mutate({ data });
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (!mo) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 text-center">
        <p className="text-slate-500">OF introuvable.</p>
        <Button variant="outline" onClick={() => navigate('/manufacturingorders')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Button>
      </div>
    );
  }

  const statusCfg   = STATUS_CONFIG[mo.status]   || STATUS_CONFIG.draft;
  const priorityCfg = PRIORITY_CONFIG[mo.priority] || PRIORITY_CONFIG.medium;
  const progress    = mo.quantity_planned > 0
    ? Math.min(100, Math.round((mo.quantity_produced || 0) / mo.quantity_planned * 100))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/manufacturingorders')} className="text-slate-500">
            <ArrowLeft className="w-4 h-4 mr-2" /> Ordres de fabrication
          </Button>
          <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
            <Pencil className="w-4 h-4 mr-2" /> Modifier
          </Button>
        </div>

        {/* Titre + statut */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{mo.order_number}</h1>
              <p className="text-slate-500 text-sm">{mo.product_name}</p>
            </div>
          </div>
          <div className="sm:ml-auto flex items-center gap-2 flex-wrap">
            <Badge className={priorityCfg.class}>{priorityCfg.label}</Badge>
            <Badge className={statusCfg.class}>{statusCfg.label}</Badge>
            {mo.ready_for_delivery && (
              <Badge className="bg-purple-100 text-purple-700">Prêt à livrer</Badge>
            )}
            {mo.is_subcontracted && (
              <Badge className="bg-amber-100 text-amber-700">
                <ArrowRightLeft className="w-3 h-3 mr-1" /> Sous-traité
              </Badge>
            )}
          </div>
        </div>

        {/* Actions de statut */}
        <div className="flex gap-2 flex-wrap">
          {mo.status === 'planned' && (
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600"
              onClick={() => changeStatus('in_progress')}>
              <Play className="w-4 h-4 mr-2" /> Démarrer
            </Button>
          )}
          {mo.status === 'in_progress' && (
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => changeStatus('completed')}>
              <CheckCircle className="w-4 h-4 mr-2" /> Terminer
            </Button>
          )}
          {mo.status === 'completed' && !mo.ready_for_delivery && (
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700"
              onClick={() => changeStatus('ready_for_delivery')}>
              <Truck className="w-4 h-4 mr-2" /> Prêt pour livraison
            </Button>
          )}
          {mo.status !== 'completed' && mo.status !== 'cancelled' && (
            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => { if (confirm('Annuler cet OF ?')) changeStatus('cancelled'); }}>
              <XCircle className="w-4 h-4 mr-2" /> Annuler
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">

            {/* Infos OF */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
                  <Cog className="w-4 h-4" /> Détails de l'OF
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                  <div>
                    <dt className="text-slate-400 text-xs uppercase tracking-wide mb-1">Produit</dt>
                    <dd className="font-medium text-slate-800">
                      {product ? (
                        <Link to={`/products/${mo.product_id}`} className="hover:text-blue-600 hover:underline">
                          {product.reference} — {product.name}
                        </Link>
                      ) : mo.product_name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 text-xs uppercase tracking-wide mb-1">Poste de travail</dt>
                    <dd className="font-medium text-slate-800">
                      {mo.is_subcontracted
                        ? <span className="text-amber-700">🏭 {mo.supplier_name || 'Sous-traitant'}</span>
                        : (mo.workstation_name || '—')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 text-xs uppercase tracking-wide mb-1">Qté planifiée</dt>
                    <dd className="font-semibold text-slate-900 text-lg">{mo.quantity_planned}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 text-xs uppercase tracking-wide mb-1">Qté produite</dt>
                    <dd className="font-semibold text-slate-900 text-lg">{mo.quantity_produced || 0}</dd>
                  </div>
                </dl>

                {/* Barre de progression */}
                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Avancement</span>
                    <span className="font-semibold">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${
                        progress >= 100 ? 'bg-emerald-500' : progress >= 50 ? 'bg-amber-400' : 'bg-blue-400'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dates */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Planification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                  <div>
                    <dt className="text-slate-400 text-xs uppercase tracking-wide mb-1">Début planifié</dt>
                    <dd className="font-medium text-slate-800">{fmt(mo.planned_start)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 text-xs uppercase tracking-wide mb-1">Fin planifiée</dt>
                    <dd className="font-medium text-slate-800">{fmt(mo.planned_end)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 text-xs uppercase tracking-wide mb-1">Début réel</dt>
                    <dd className="font-medium text-slate-800">{fmtFull(mo.actual_start)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 text-xs uppercase tracking-wide mb-1">Fin réelle</dt>
                    <dd className="font-medium text-slate-800">{fmtFull(mo.actual_end)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 text-xs uppercase tracking-wide mb-1">Créé le</dt>
                    <dd className="text-slate-600">{fmtFull(mo.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 text-xs uppercase tracking-wide mb-1">Modifié le</dt>
                    <dd className="text-slate-600">{fmtFull(mo.updatedAt)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Sous-traitance */}
            {mo.is_subcontracted && (
              <Card className="border-0 shadow-sm border-l-4 border-l-amber-400">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-amber-700 flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4" /> Sous-traitance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    <div>
                      <dt className="text-slate-400 text-xs uppercase tracking-wide mb-1">Fournisseur</dt>
                      <dd className="font-medium text-slate-800">{mo.supplier_name || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 text-xs uppercase tracking-wide mb-1">N° sous-traitance</dt>
                      <dd className="font-mono font-medium text-slate-800">{mo.subcontract_number || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 text-xs uppercase tracking-wide mb-1">Prix unitaire</dt>
                      <dd className="font-semibold text-slate-900">
                        {mo.subcontract_unit_price ? `${mo.subcontract_unit_price.toFixed(2)} €` : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 text-xs uppercase tracking-wide mb-1">Montant total</dt>
                      <dd className="font-semibold text-slate-900">
                        {mo.subcontract_unit_price
                          ? `${(mo.subcontract_unit_price * mo.quantity_planned).toFixed(2)} €`
                          : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 text-xs uppercase tracking-wide mb-1">Date d'envoi</dt>
                      <dd className="text-slate-800">{fmt(mo.subcontract_sent_date)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 text-xs uppercase tracking-wide mb-1">Retour prévu</dt>
                      <dd className="text-slate-800">{fmt(mo.subcontract_expected_date)}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {mo.notes && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-slate-700">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{mo.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Colonne latérale — Documents liés */}
          <div className="space-y-4">

            {/* Produit */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                  <Package className="w-4 h-4" /> Produit
                </CardTitle>
              </CardHeader>
              <CardContent>
                {product ? (
                  <Link
                    to={`/products/${mo.product_id}`}
                    className="block p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <p className="font-mono text-xs text-slate-500">{product.reference}</p>
                    <p className="font-medium text-slate-800 text-sm mt-0.5">{product.name}</p>
                    {product.customer_code && (
                      <p className="text-xs text-slate-400 mt-1">Client : {product.customer_code}</p>
                    )}
                  </Link>
                ) : (
                  <p className="text-sm text-slate-400 italic">{mo.product_name || '—'}</p>
                )}
              </CardContent>
            </Card>

            {/* Commande client liée */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> Commande client
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mo.customer_order_id ? (
                  <Link
                    to={`/orders/${mo.customer_order_id}`}
                    className="block p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                  >
                    <p className="font-mono text-xs text-blue-500">
                      {customerOrder?.order_number || mo.customer_order_number || mo.customer_order_id}
                    </p>
                    {customerOrder && (
                      <>
                        <p className="font-medium text-slate-800 text-sm mt-0.5">
                          {customerOrder.customer_name}
                        </p>
                        <Badge className={`mt-1 text-xs ${
                          customerOrder.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                          customerOrder.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {customerOrder.status}
                        </Badge>
                      </>
                    )}
                  </Link>
                ) : mo.customer_order_number ? (
                  <div className="p-3 rounded-lg bg-slate-50">
                    <p className="font-mono text-xs text-slate-500">{mo.customer_order_number}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">Aucune commande liée</p>
                )}
              </CardContent>
            </Card>

            {/* Bon de livraison */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Bon de livraison
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mo.delivery_note_id ? (
                  <Link
                    to={`/delivery-notes/${mo.delivery_note_id}`}
                    className="block p-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors"
                  >
                    <p className="font-mono text-xs text-emerald-600">
                      {deliveryNote?.note_number || mo.delivery_note_id}
                    </p>
                    {deliveryNote && (
                      <p className="text-sm text-slate-700 mt-0.5">{deliveryNote.customer_name}</p>
                    )}
                  </Link>
                ) : (
                  <p className="text-sm text-slate-400 italic">
                    {mo.ready_for_delivery
                      ? <span className="text-purple-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Prêt — BL à créer</span>
                      : 'Pas encore livré'}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Fiche technique produit */}
            {product && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Fiche produit
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-600 space-y-1">
                  {product.thickness && <p><span className="text-slate-400">Épaisseur :</span> {product.thickness}</p>}
                  {product.material  && <p><span className="text-slate-400">Matière :</span>   {product.material}</p>}
                  {product.ral       && <p><span className="text-slate-400">RAL :</span>        {product.ral}</p>}
                  {product.sell_price != null && (
                    <p><span className="text-slate-400">Prix vente :</span> {product.sell_price.toFixed(2)} €</p>
                  )}
                  {product.description && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-3">{product.description}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Formulaire d'édition */}
        <OrderForm
          open={formOpen}
          onOpenChange={setFormOpen}
          order={mo}
          onSave={(data) => updateMutation.mutate({ data })}
          products={products}
          workstations={workstations}
        />
      </div>
    </div>
  );
}
