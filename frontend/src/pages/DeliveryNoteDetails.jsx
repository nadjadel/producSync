import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Truck, CheckCircle, Building, MapPin, Package, Printer } from "lucide-react";
import { printDeliveryNote } from '@/components/delivery/printDeliveryNote';
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const STATUS_CONFIG = {
  draft:    { label: 'Brouillon', class: 'bg-slate-100 text-slate-700' },
  sent:     { label: 'Envoyé',    class: 'bg-blue-100 text-blue-700' },
  invoiced: { label: 'Facturé',  class: 'bg-emerald-100 text-emerald-700' },
};

export default function DeliveryNoteDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: deliveryNote, isLoading } = useQuery({
    queryKey: ['delivery-note', id],
    queryFn: () => base44.entities.DeliveryNote.get(id),
    enabled: !!id,
  });

  const { data: customer } = useQuery({
    queryKey: ['customer', deliveryNote?.customer_id],
    queryFn: () => base44.entities.Customer.get(deliveryNote?.customer_id),
    enabled: !!deliveryNote?.customer_id,
  });

  const { data: productsResponse } = useQuery({
    queryKey: ['products', { limit: 9999 }],
    queryFn: () => base44.entities.Product.filter({ limit: 9999 }),
  });
  const products = productsResponse?.data ?? [];

  const markSentMutation = useMutation({
    mutationFn: () => base44.entities.DeliveryNote.update(id, { status: 'sent' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-note', id] });
      queryClient.invalidateQueries({ queryKey: ['delivery-notes'] });
      toast.success('BL marqué comme envoyé');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const markInvoicedMutation = useMutation({
    mutationFn: () => base44.entities.DeliveryNote.update(id, { status: 'invoiced' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-note', id] });
      queryClient.invalidateQueries({ queryKey: ['delivery-notes'] });
      toast.success('BL marqué comme facturé');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-5xl mx-auto">
          <Skeleton className="h-12 w-48 mb-6" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!deliveryNote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-5xl mx-auto text-center py-16">
          <Truck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600">Bon de livraison non trouvé</h3>
          <Button onClick={() => navigate('/delivery-notes')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux bons de livraison
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[deliveryNote.status] || STATUS_CONFIG.draft;
  const items = deliveryNote.items || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div className="flex items-start gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/delivery-notes')} className="mt-1">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                  {deliveryNote.delivery_number || `BL #${id.slice(-6)}`}
                </h1>
                <Badge className={statusConfig.class}>{statusConfig.label}</Badge>
              </div>
              <p className="text-slate-500 mt-1">
                {deliveryNote.customer_name} — {deliveryNote.delivery_date
                  ? format(new Date(deliveryNote.delivery_date), 'dd MMMM yyyy', { locale: fr })
                  : 'Date non définie'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => printDeliveryNote(deliveryNote, customer, products)}
            >
              <Printer className="w-4 h-4 mr-2" />
              Exporter PDF
            </Button>
            {deliveryNote.status === 'draft' && (
              <Button
                onClick={() => markSentMutation.mutate()}
                disabled={markSentMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Truck className="w-4 h-4 mr-2" />
                Marquer envoyé
              </Button>
            )}
            {deliveryNote.status === 'sent' && (
              <Button
                onClick={() => markInvoicedMutation.mutate()}
                disabled={markInvoicedMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Marquer facturé
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column */}
          <div className="space-y-6">

            {/* Delivery info */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Livraison
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-500">N° BL</p>
                  <p className="font-mono font-semibold">{deliveryNote.delivery_number || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Date de livraison</p>
                  <p className="font-medium">
                    {deliveryNote.delivery_date
                      ? format(new Date(deliveryNote.delivery_date), 'dd MMM yyyy', { locale: fr })
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Statut</p>
                  <Badge className={statusConfig.class}>{statusConfig.label}</Badge>
                </div>
                {deliveryNote.notes && (
                  <div>
                    <p className="text-slate-500">Notes</p>
                    <p className="text-slate-700 whitespace-pre-line">{deliveryNote.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client info */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building className="w-4 h-4" /> Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-500">Société</p>
                  <p className="font-medium">{deliveryNote.customer_name || customer?.company_name || '—'}</p>
                </div>
                {deliveryNote.delivery_address && (
                  <div>
                    <p className="text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> Adresse</p>
                    <p className="font-medium whitespace-pre-line">{deliveryNote.delivery_address}</p>
                  </div>
                )}
                {customer?.email && (
                  <div>
                    <p className="text-slate-500">Email</p>
                    <p className="font-medium">{customer.email}</p>
                  </div>
                )}
                {customer?.phone && (
                  <div>
                    <p className="text-slate-500">Téléphone</p>
                    <p className="font-medium">{customer.phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Right column — Items */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-4 h-4" /> Articles ({items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {items.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p>Aucun article</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="font-semibold">N° OF</TableHead>
                        <TableHead className="font-semibold">Produit</TableHead>
                        <TableHead className="font-semibold">Réf.</TableHead>
                        <TableHead className="font-semibold text-right">Qté</TableHead>
                        <TableHead className="font-semibold text-right">P.U.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, idx) => (
                        <TableRow key={idx} className="hover:bg-slate-50/50">
                          <TableCell className="font-mono text-slate-600">{item.order_number || '—'}</TableCell>
                          <TableCell className="font-medium">{item.product_name}</TableCell>
                          <TableCell className="text-slate-500">{item.product_reference || '—'}</TableCell>
                          <TableCell className="text-right font-semibold">{item.quantity}</TableCell>
                          <TableCell className="text-right text-slate-600">
                            {item.unit_price != null && item.unit_price !== 0
                              ? `${Number(item.unit_price).toFixed(2)} €`
                              : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
