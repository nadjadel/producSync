import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  FileText, 
  Truck, 
  CheckCircle, 
  XCircle,
  Download,
  Eye,
  Package,
  Calendar,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Receipt
} from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG = {
  draft: { label: 'Brouillon', class: 'bg-slate-100 text-slate-700' },
  prepared: { label: 'Préparé', class: 'bg-blue-100 text-blue-700' },
  shipped: { label: 'Expédié', class: 'bg-emerald-100 text-emerald-700' },
  delivered: { label: 'Livré', class: 'bg-purple-100 text-purple-700' },
  cancelled: { label: 'Annulé', class: 'bg-amber-100 text-amber-700' }
};

export default function DeliveryNoteDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch delivery note details
  const { data: deliveryNote, isLoading: isLoadingDeliveryNote } = useQuery({
    queryKey: ['deliveryNote', id],
    queryFn: () => base44.entities.DeliveryNote.get(id),
    enabled: !!id,
  });

  // Fetch order details
  const { data: order, isLoading: isLoadingOrder } = useQuery({
    queryKey: ['order', deliveryNote?.order_id],
    queryFn: () => base44.entities.Order.get(deliveryNote?.order_id),
    enabled: !!deliveryNote?.order_id,
  });

  // Fetch customer details
  const { data: customer, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ['customer', deliveryNote?.customer_id],
    queryFn: () => base44.entities.Customer.get(deliveryNote?.customer_id),
    enabled: !!deliveryNote?.customer_id,
  });

  // Mutations for delivery note actions
  const markAsPreparedMutation = useMutation({
    mutationFn: () => base44.entities.DeliveryNote.update(id, { status: 'prepared' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveryNote', id] });
      toast.success('Bon de livraison marqué comme préparé');
    },
    onError: (error) => {
      toast.error('Erreur lors du marquage du bon de livraison');
      console.error(error);
    }
  });

  const markAsShippedMutation = useMutation({
    mutationFn: () => base44.entities.DeliveryNote.update(id, { status: 'shipped' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveryNote', id] });
      toast.success('Bon de livraison marqué comme expédié');
    },
    onError: (error) => {
      toast.error('Erreur lors du marquage du bon de livraison');
      console.error(error);
    }
  });

  const markAsDeliveredMutation = useMutation({
    mutationFn: () => base44.entities.DeliveryNote.update(id, { status: 'delivered' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveryNote', id] });
      toast.success('Bon de livraison marqué comme livré');
    },
    onError: (error) => {
      toast.error('Erreur lors du marquage du bon de livraison');
      console.error(error);
    }
  });

  const cancelDeliveryNoteMutation = useMutation({
    mutationFn: () => base44.entities.DeliveryNote.update(id, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveryNote', id] });
      toast.success('Bon de livraison annulé');
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'annulation du bon de livraison');
      console.error(error);
    }
  });

  const handleMarkAsPrepared = () => {
    if (window.confirm('Marquer ce bon de livraison comme préparé ?')) {
      markAsPreparedMutation.mutate();
    }
  };

  const handleMarkAsShipped = () => {
    if (window.confirm('Marquer ce bon de livraison comme expédié ?')) {
      markAsShippedMutation.mutate();
    }
  };

  const handleMarkAsDelivered = () => {
    if (window.confirm('Marquer ce bon de livraison comme livré ?')) {
      markAsDeliveredMutation.mutate();
    }
  };

  const handleCancelDeliveryNote = () => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler ce bon de livraison ?')) {
      cancelDeliveryNoteMutation.mutate();
    }
  };

  const downloadPDF = () => {
    toast.info('Téléchargement du PDF en cours de développement');
    // TODO: Implement PDF download
  };

  if (isLoadingDeliveryNote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-12 w-48 mb-6" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!deliveryNote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16">
            <Truck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600">Bon de livraison non trouvé</h3>
            <p className="text-slate-400 mt-1">Le bon de livraison demandé n\'existe pas ou a été supprimé</p>
            <Button onClick={() => navigate('/deliverynotes')} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux bons de livraison
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[deliveryNote.status] || STATUS_CONFIG.draft;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div className="flex items-start gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/deliverynotes')} className="mt-1">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                  {deliveryNote.title || `Bon de livraison ${deliveryNote.code}`}
                </h1>
                <Badge className={statusConfig.class}>{statusConfig.label}</Badge>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <p className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                  {deliveryNote.code}
                </p>
                {deliveryNote.order_code && (
                  <Link to={`/orders/${deliveryNote.order_id}`} className="text-blue-600 hover:underline">
                    <Badge variant="outline" className="ml-2">
                      Commande: {deliveryNote.order_code}
                    </Badge>
                  </Link>
                )}
              </div>
              <p className="text-slate-500 mt-1">Détails du bon de livraison et actions associées</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={downloadPDF} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Télécharger PDF
            </Button>
            {deliveryNote.status === 'draft' && (
              <Button onClick={handleMarkAsPrepared} className="bg-blue-600 hover:bg-blue-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                Marquer préparé
              </Button>
            )}
            {deliveryNote.status === 'prepared' && (
              <Button onClick={handleMarkAsShipped} className="bg-emerald-600 hover:bg-emerald-700">
                <Truck className="w-4 h-4 mr-2" />
                Marquer expédié
              </Button>
            )}
            {deliveryNote.status === 'shipped' && (
              <Button onClick={handleMarkAsDelivered} className="bg-purple-600 hover:bg-purple-700">
                <Package className="w-4 h-4 mr-2" />
                Marquer livré
              </Button>
            )}
            {deliveryNote.status !== 'cancelled' && deliveryNote.status !== 'delivered' && (
              <Button onClick={handleCancelDeliveryNote} variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50">
                <XCircle className="w-4 h-4 mr-2" />
                Annuler
              </Button>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Delivery note info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Informations livraison
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-500">Date de création</p>
                    <p className="font-medium">
                      {deliveryNote.created_date ? new Date(deliveryNote.created_date).toLocaleDateString('fr-FR') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Date d'expédition</p>
                    <p className="font-medium">
                      {deliveryNote.shipping_date ? new Date(deliveryNote.shipping_date).toLocaleDateString('fr-FR') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Date de livraison</p>
                    <p className="font-medium">
                      {deliveryNote.delivery_date ? new Date(deliveryNote.delivery_date).toLocaleDateString('fr-FR') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Transporteur</p>
                    <p className="font-medium">{deliveryNote.carrier || 'Non spécifié'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Numéro de suivi</p>
                    <p className="font-medium">{deliveryNote.tracking_number || 'Non spécifié'}</p>
                  </div>
                  {deliveryNote.notes && (
                    <div>
                      <p className="text-sm text-slate-500">Notes</p>
                      <p className="font-medium text-sm">{deliveryNote.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order info */}
            {order && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    Commande associée
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-slate-500">Code commande</p>
                      <p className="font-medium">{order.code}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Date commande</p>
                      <p className="font-medium">
                        {order.created_date ? new Date(order.created_date).toLocaleDateString('fr-FR') : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Statut commande</p>
                      <Badge className={
                        order.status === 'delivered' ? 'bg-purple-100 text-purple-700' :
                        order.status === 'ready' ? 'bg-emerald-100 text-emerald-700' :
                        order.status === 'in_production' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'confirmed' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }>
                        {order.status === 'delivered' ? 'Livrée' : 
                         order.status === 'ready' ? 'Prête' :
                         order.status === 'in_production' ? 'En production' :
                         order.status === 'confirmed' ? 'Confirmée' : 'Brouillon'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Customer info */}
            {customer && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Client
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Building className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-500">Société</p>
                        <p className="font-medium">{customer.company_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-500">Contact</p>
                        <p className="font-medium">{customer.contact_name || 'Non spécifié'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-500">Email</p>
                        <p className="font-medium">{customer.email}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column - Tabs */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="overview">Aperçu</TabsTrigger>
                <TabsTrigger value="items">Articles</TabsTrigger>
                <TabsTrigger value="history">Historique</TabsTrigger>
              </TabsList>

              {/* Overview tab */}
              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Résumé</CardTitle>
                    <CardDescription>Informations générales sur le bon de livraison</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-500">Statut</p>
                          <p className="font-medium">{statusConfig.label}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-500">Client</p>
                          <p className="font-medium">{deliveryNote.customer_name || customer?.company_name || 'Non spécifié'}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-500">Transporteur</p>
                          <p className="font-medium">{deliveryNote.carrier || 'Non spécifié'}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-500">Numéro de suivi</p>
                          <p className="font-medium">{deliveryNote.tracking_number || 'Non spécifié'}</p>
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-500">Date de livraison</p>
                        <p className="font-medium">
                          {deliveryNote.delivery_date ? new Date(deliveryNote.delivery_date).toLocaleDateString('fr-FR') : '-'}
                        </p>
                      </div>
                      {deliveryNote.notes && (
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-500">Notes</p>
                          <p className="font-medium text-sm">{deliveryNote.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Items tab */}
              <TabsContent value="items">
                <Card>
                  <CardHeader>
                    <CardTitle>Articles</CardTitle>
                    <CardDescription>Articles inclus dans ce bon de livraison</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-600">Aucun article</h3>
                      <p className="text-slate-400 mt-1">Les articles seront ajoutés automatiquement depuis la commande</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* History tab */}
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle>Historique</CardTitle>
                    <CardDescription>Historique des modifications de ce bon de livraison</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="font-medium">Création</p>
                            <p className="text-sm text-slate-500">
                              {deliveryNote.created_date ? new Date(deliveryNote.created_date).toLocaleDateString('fr-FR') : 'Date inconnue'}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-slate-100 text-slate-700">Créé</Badge>
                      </div>
                      {deliveryNote.updated_date && (
                        <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-slate-400" />
                            <div>
                              <p className="font-medium">Dernière modification</p>
                              <p className="text-sm text-slate-500">
                                {new Date(deliveryNote.updated_date).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-blue-100 text-blue-700">Modifié</Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
