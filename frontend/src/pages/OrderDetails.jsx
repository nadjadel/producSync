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
  ShoppingCart, 
  Building, 
  Mail, 
  Phone, 
  Calendar, 
  CheckCircle, 
  Play, 
  Truck,
  XCircle,
  Download,
  Copy,
  Eye,
  Plus,
  Cog,
  Package
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import OrderFormNew from '@/components/orders/OrderFormNew';

const STATUS_CONFIG = {
  draft:         { label: 'Brouillon',     class: 'bg-slate-100 text-slate-700' },
  confirmed:     { label: 'Confirmée',     class: 'bg-blue-100 text-blue-700' },
  in_production: { label: 'En production', class: 'bg-amber-100 text-amber-700' },
  ready:         { label: 'Prête',         class: 'bg-purple-100 text-purple-700' },
  delivered:     { label: 'Livrée',        class: 'bg-emerald-100 text-emerald-700' },
  cancelled:     { label: 'Annulée',       class: 'bg-rose-100 text-rose-700' },
};

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [formOpen, setFormOpen] = useState(false);

  // Fetch order details
  const { data: order, isLoading: isLoadingOrder } = useQuery({
    queryKey: ['order', id],
    queryFn: () => base44.entities.Order.get(id),
    enabled: !!id,
  });

  // Fetch related documents
  const { data: customer, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ['customer', order?.customer_id],
    queryFn: () => base44.entities.Customer.get(order?.customer_id),
    enabled: !!order?.customer_id,
  });

  const { data: manufacturingOrders = [], isLoading: isLoadingManufacturingOrders } = useQuery({
    queryKey: ['manufacturing-orders', order?.id],
    queryFn: () => order?.id ? base44.entities.ManufacturingOrder.filter({ customer_order_id: order.id }) : [],
    enabled: !!order?.id && activeTab === 'manufacturing',
  });

  const { data: deliveryNotes = [], isLoading: isLoadingDeliveryNotes } = useQuery({
    queryKey: ['delivery-notes', order?.id],
    queryFn: () => order?.id ? base44.entities.DeliveryNote.filter({ order_id: order.id }) : [],
    enabled: !!order?.id && activeTab === 'delivery',
  });

  // Mutations for status changes
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Order.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      toast.success('Statut de la commande mis à jour');
    },
    onError: (error) => {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    }
  });

  const handleStatusChange = (newStatus) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  const copyOrderNumber = () => {
    if (order?.order_number) {
      navigator.clipboard.writeText(order.order_number);
      toast.success('Numéro de commande copié');
    }
  };

  if (isLoadingOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-12 w-48 mb-6" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16">
            <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600">Commande non trouvée</h3>
            <p className="text-slate-400 mt-1">La commande demandée n'existe pas ou a été supprimée</p>
            <Button onClick={() => navigate('/orders')} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux commandes
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.draft;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div className="flex items-start gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/orders')} className="mt-1">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                  Commande {order.order_number}
                </h1>
                <Badge className={statusConfig.class}>{statusConfig.label}</Badge>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <p className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                  {order.order_number}
                </p>
                <Button variant="ghost" size="icon" onClick={copyOrderNumber} className="h-8 w-8">
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
              <p className="text-slate-500 mt-1">
                {customer ? `Client: ${customer.company_name}` : 'Chargement du client...'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {order.status === 'draft' && (
              <Button onClick={() => handleStatusChange('confirmed')} className="bg-blue-600 hover:bg-blue-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirmer la commande
              </Button>
            )}
            {order.status === 'confirmed' && (
              <Button onClick={() => handleStatusChange('in_production')} className="bg-amber-600 hover:bg-amber-700">
                <Play className="w-4 h-4 mr-2" />
                Marquer en production
              </Button>
            )}
            {order.status === 'in_production' && (
              <Button onClick={() => handleStatusChange('ready')} className="bg-purple-600 hover:bg-purple-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                Marquer prête
              </Button>
            )}
            {order.status === 'ready' && (
              <Button onClick={() => handleStatusChange('delivered')} className="bg-emerald-600 hover:bg-emerald-700">
                <Truck className="w-4 h-4 mr-2" />
                Marquer livrée
              </Button>
            )}
            {order.status !== 'cancelled' && order.status !== 'delivered' && (
              <Button onClick={() => handleStatusChange('cancelled')} variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50">
                <XCircle className="w-4 h-4 mr-2" />
                Annuler
              </Button>
            )}
            <Button onClick={() => setFormOpen(true)} variant="outline">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Modifier
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Télécharger PDF
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Order info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Informations de la commande
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Date</p>
                      <p className="font-medium">
                        {order.order_date ? format(new Date(order.order_date), "dd MMMM yyyy", { locale: fr }) : 'Non spécifiée'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Livraison souhaitée</p>
                      <p className="font-medium">
                        {order.delivery_date_requested ? format(new Date(order.delivery_date_requested), "dd MMMM yyyy", { locale: fr }) : 'Non spécifiée'}
                      </p>
                    </div>
                  </div>
                  {order.notes && (
                    <div>
                      <p className="text-sm text-slate-500">Notes</p>
                      <p className="font-medium text-sm">{order.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

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
                    <div>
                      <p className="text-sm text-slate-500">Société</p>
                      <p className="font-medium">{customer.company_name}</p>
                    </div>
                    {customer.contact_name && (
                      <div>
                        <p className="text-sm text-slate-500">Contact</p>
                        <p className="font-medium">{customer.contact_name}</p>
                      </div>
                    )}
                    {customer.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-sm text-slate-500">Email</p>
                          <p className="font-medium">{customer.email}</p>
                        </div>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-sm text-slate-500">Téléphone</p>
                          <p className="font-medium">{customer.phone}</p>
                        </div>
                      </div>
                    )}
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <Link to={`/customers/${customer.id}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        Voir la fiche client
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Totals */}
            <Card>
              <CardHeader>
                <CardTitle>Totaux</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total HT</span>
                    <span className="font-bold">{order.total_ht?.toFixed(2) || '0.00'} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">TVA ({order.vat_rate || 20}%)</span>
                    <span className="font-bold">{order.total_vat?.toFixed(2) || '0.00'} €</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-slate-200">
                    <span className="text-lg font-bold text-slate-900">Total TTC</span>
                    <span className="text-lg font-bold text-slate-900">{order.total_ttc?.toFixed(2) || '0.00'} €</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Tabs */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="overview">Aperçu</TabsTrigger>
                <TabsTrigger value="items">Lignes</TabsTrigger>
                <TabsTrigger value="manufacturing">OF</TabsTrigger>
                <TabsTrigger value="delivery">Livraisons</TabsTrigger>
              </TabsList>

              {/* Overview tab */}
              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Résumé</CardTitle>
                    <CardDescription>Vue d'ensemble de la commande et de son statut</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <h4 className="font-semibold text-slate-900 mb-2">Statut actuel</h4>
                        <div className="flex items-center gap-3">
                          <Badge className={statusConfig.class}>{statusConfig.label}</Badge>
                          <p className="text-slate-600">
                            {order.status === 'draft' && 'Cette commande est en cours de préparation.'}
                            {order.status === 'confirmed' && 'Cette commande a été confirmée et est prête pour la production.'}
                            {order.status === 'in_production' && 'Cette commande est en cours de production.'}
                            {order.status === 'ready' && 'Cette commande est prête pour la livraison.'}
                            {order.status === 'delivered' && 'Cette commande a été livrée au client.'}
                            {order.status === 'cancelled' && 'Cette commande a été annulée.'}
                          </p>
                        </div>
                      </div>

                      {/* Quick stats */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-700">{order.items?.length || 0}</p>
                          <p className="text-sm text-blue-600">Articles</p>
                        </div>
                        <div className="text-center p-3 bg-amber-50 rounded-lg">
                          <p className="text-2xl font-bold text-amber-700">{manufacturingOrders.length}</p>
                          <p className="text-sm text-amber-600">OF générés</p>
                        </div>
                        <div className="text-center p-3 bg-emerald-50 rounded-lg">
                          <p className="text-2xl font-bold text-emerald-700">{deliveryNotes.length}</p>
                          <p className="text-sm text-emerald-600">Livraisons</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Actions rapides</CardTitle>
                    <CardDescription>Gérez le statut de cette commande</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {order.status === 'draft' && (
                        <Button onClick={() => handleStatusChange('confirmed')} className="bg-blue-600 hover:bg-blue-700">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirmer la commande
                        </Button>
                      )}
                      {order.status === 'confirmed' && (
                        <Button onClick={() => handleStatusChange('in_production')} className="bg-amber-600 hover:bg-amber-700">
                          <Play className="w-4 h-4 mr-2" />
                          Marquer en production
                        </Button>
                      )}
                      {order.status === 'in_production' && (
                        <Button onClick={() => handleStatusChange('ready')} className="bg-purple-600 hover:bg-purple-700">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Marquer prête
                        </Button>
                      )}
                      {order.status === 'ready' && (
                        <Button onClick={() => handleStatusChange('delivered')} className="bg-emerald-600 hover:bg-emerald-700">
                          <Truck className="w-4 h-4 mr-2" />
                          Marquer livrée
                        </Button>
                      )}
                      {order.status !== 'cancelled' && order.status !== 'delivered' && (
                        <Button onClick={() => handleStatusChange('cancelled')} variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50">
                          <XCircle className="w-4 h-4 mr-2" />
                          Annuler
                        </Button>
                      )}
                      <Button onClick={() => setFormOpen(true)} variant="outline">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Modifier la commande
                      </Button>
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Items tab */}
              <TabsContent value="items">
                <Card>
                  <CardHeader>
                    <CardTitle>Lignes de commande</CardTitle>
                    <CardDescription>Détail des articles commandés</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {order.items && order.items.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produit</TableHead>
                            <TableHead className="text-right">Quantité</TableHead>
                            <TableHead className="text-right">Prix unitaire</TableHead>
                            <TableHead className="text-right">Total HT</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {order.items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{item.product_name || item.description}</p>
                                  {item.product_reference && (
                                    <p className="text-sm text-slate-500">{item.product_reference}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{item.quantity || 1}</TableCell>
                              <TableCell className="text-right">{item.unit_price?.toFixed(2) || '0.00'} €</TableCell>
                              <TableCell className="text-right font-medium">
                                {((item.quantity || 1) * (item.unit_price || 0)).toFixed(2)} €
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-slate-50">
                            <TableCell colSpan={3} className="text-right font-bold">Total HT</TableCell>
                            <TableCell className="text-right font-bold">{order.total_ht?.toFixed(2) || '0.00'} €</TableCell>
                          </TableRow>
                          <TableRow className="bg-slate-50">
                            <TableCell colSpan={3} className="text-right font-bold">TVA ({order.vat_rate || 20}%)</TableCell>
                            <TableCell className="text-right font-bold">{order.total_vat?.toFixed(2) || '0.00'} €</TableCell>
                          </TableRow>
                          <TableRow className="bg-slate-100">
                            <TableCell colSpan={3} className="text-right font-bold text-lg">Total TTC</TableCell>
                            <TableCell className="text-right font-bold text-lg">{order.total_ttc?.toFixed(2) || '0.00'} €</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-12">
                        <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-600">Aucune ligne</h3>
                        <p className="text-slate-400 mt-1">Cette commande ne contient pas encore d'articles</p>
                        <Button onClick={() => setFormOpen(true)} className="mt-4">
                          <Plus className="w-4 h-4 mr-2" />
                          Ajouter des articles
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Manufacturing tab */}
              <TabsContent value="manufacturing">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Ordres de fabrication</CardTitle>
                      <CardDescription>OF générés pour cette commande</CardDescription>
                    </div>
                    <Button size="sm" asChild>
                      <Link to="/manufacturing-orders">
                        <Cog className="w-4 h-4 mr-2" />
                        Voir tous les OF
                      </Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isLoadingManufacturingOrders ? (
                      <Skeleton className="h-64 rounded-lg" />
                    ) : manufacturingOrders.length === 0 ? (
                      <div className="text-center py-12">
                        <Cog className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-600">Aucun OF généré</h3>
                        <p className="text-slate-400 mt-1">
                          {order.status === 'confirmed' || order.status === 'in_production' || order.status === 'ready'
                            ? 'Les OF sont générés automatiquement lors de la confirmation de la commande'
                            : 'Confirmez la commande pour générer les OF'}
                        </p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>N° OF</TableHead>
                            <TableHead>Produit</TableHead>
                            <TableHead>Quantité</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {manufacturingOrders.map((mo) => (
                            <TableRow key={mo.id}>
                              <TableCell className="font-mono font-bold">{mo.order_number}</TableCell>
                              <TableCell>{mo.product_name}</TableCell>
                              <TableCell>
                                <span className="font-medium">{mo.quantity_produced || 0}</span>
                                <span className="text-slate-400"> / {mo.quantity_planned}</span>
                              </TableCell>
                              <TableCell>
                                <Badge className={
                                  mo.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                  mo.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                  mo.status === 'planned' ? 'bg-amber-100 text-amber-700' :
                                  'bg-slate-100 text-slate-700'
                                }>
                                  {mo.status === 'completed' ? 'Terminé' :
                                   mo.status === 'in_progress' ? 'En cours' :
                                   mo.status === 'planned' ? 'Planifié' : 'Brouillon'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" asChild>
                                  <Link to={`/manufacturing-orders/${mo.id}`}>
                                    <Eye className="w-4 h-4" />
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Delivery tab */}
              <TabsContent value="delivery">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Bons de livraison</CardTitle>
                      <CardDescription>Livraisons associées à cette commande</CardDescription>
                    </div>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Créer un BL
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isLoadingDeliveryNotes ? (
                      <Skeleton className="h-64 rounded-lg" />
                    ) : deliveryNotes.length === 0 ? (
                      <div className="text-center py-12">
                        <Truck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-600">Aucun bon de livraison</h3>
                        <p className="text-slate-400 mt-1">
                          {order.status === 'ready' || order.status === 'delivered'
                            ? 'Créez un bon de livraison pour cette commande'
                            : 'La commande doit être prête pour créer un bon de livraison'}
                        </p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>N° BL</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {deliveryNotes.map((note) => (
                            <TableRow key={note.id}>
                              <TableCell className="font-mono font-bold">{note.delivery_note_number}</TableCell>
                              <TableCell>
                                {note.delivery_date ? format(new Date(note.delivery_date), "dd MMM yyyy", { locale: fr }) : '-'}
                              </TableCell>
                              <TableCell>
                                <Badge className={
                                  note.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                                  note.status === 'in_transit' ? 'bg-blue-100 text-blue-700' :
                                  'bg-slate-100 text-slate-700'
                                }>
                                  {note.status === 'delivered' ? 'Livré' :
                                   note.status === 'in_transit' ? 'En transit' : 'Préparé'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" asChild>
                                  <Link to={`/delivery-notes/${note.id}`}>
                                    <Eye className="w-4 h-4" />
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Order Form Modal */}
        <OrderFormNew 
          open={formOpen} 
          onOpenChange={setFormOpen} 
          order={order}
          onSave={(data) => {
            // Handle save logic here
            setFormOpen(false);
            toast.success('Commande mise à jour');
          }}
          customers={customer ? [customer] : []}
          products={[]}
        />
      </div>
    </div>
  );
}
