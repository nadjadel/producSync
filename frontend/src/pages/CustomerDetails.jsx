import React, { useState, useEffect } from 'react';
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
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  ShoppingCart, 
  Truck, 
  Package,
  Plus,
  Eye,
  Download,
  Copy,
  Calendar,
  CreditCard,
  User
} from "lucide-react";
import { toast } from "sonner";
import QuoteForm from '@/components/quotes/QuoteForm';
import OrderFormNew from '@/components/orders/OrderFormNew';
import ProductForm from '@/components/products/ProductForm';

const STATUS_CONFIG = {
  active: { label: 'Actif', class: 'bg-emerald-100 text-emerald-700' },
  inactive: { label: 'Inactif', class: 'bg-slate-100 text-slate-700' },
  prospect: { label: 'Prospect', class: 'bg-blue-100 text-blue-700' }
};

const PAYMENT_TERMS_CONFIG = {
  '30_days': { label: '30 jours', class: 'bg-blue-50 text-blue-700' },
  '45_days': { label: '45 jours', class: 'bg-purple-50 text-purple-700' },
  '60_days': { label: '60 jours', class: 'bg-amber-50 text-amber-700' },
  'cash': { label: 'Comptant', class: 'bg-emerald-50 text-emerald-700' },
  'end_of_month': { label: 'Fin de mois', class: 'bg-slate-50 text-slate-700' }
};

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [prefilledData, setPrefilledData] = useState(null);
  const queryClient = useQueryClient();

  // Fetch customer details
  const { data: customer, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => base44.entities.Customer.get(id),
    enabled: !!id,
  });

  // Fetch related documents
  const { data: quotes = [], isLoading: isLoadingQuotes } = useQuery({
    queryKey: ['quotes', id],
    queryFn: () => base44.entities.Quote.filter({ customer_id: id }),
    enabled: !!id && activeTab === 'quotes',
  });

  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ['orders', id],
    queryFn: () => base44.entities.Order.filter({ customer_id: id }),
    enabled: !!id && activeTab === 'orders',
  });

  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['invoices', id],
    queryFn: () => base44.entities.Invoice.filter({ customer_id: id }),
    enabled: !!id && activeTab === 'invoices',
  });

  const { data: deliveryNotes = [], isLoading: isLoadingDeliveryNotes } = useQuery({
    queryKey: ['deliveryNotes', id],
    queryFn: () => base44.entities.DeliveryNote.filter({ customer_id: id }),
    enabled: !!id && activeTab === 'deliveryNotes',
  });

  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    enabled: !!id,
  });

  // Mutations for creating documents
  const createQuoteMutation = useMutation({
    mutationFn: (data) => base44.entities.Quote.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes', id] });
      setQuoteModalOpen(false);
      setPrefilledData(null);
      toast.success('Devis créé avec succès');
    },
    onError: (error) => {
      toast.error(`Erreur lors de la création du devis: ${error.message}`);
    }
  });

  const createOrderMutation = useMutation({
    mutationFn: (data) => base44.entities.Order.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', id] });
      setOrderModalOpen(false);
      setPrefilledData(null);
      toast.success('Commande créée avec succès');
    },
    onError: (error) => {
      toast.error(`Erreur lors de la création de la commande: ${error.message}`);
    }
  });

  const createProductMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setProductModalOpen(false);
      setPrefilledData(null);
      toast.success('Produit créé avec succès');
    },
    onError: (error) => {
      toast.error(`Erreur lors de la création du produit: ${error.message}`);
    }
  });

  const handleCreateDocument = (type) => {
    if (!customer) return;

    switch (type) {
      case 'quote':
        setPrefilledData({
          customer_id: id,
          customer_name: customer.company_name,
          status: 'draft',
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
        setQuoteModalOpen(true);
        break;
      case 'order':
        setPrefilledData({
          customer_id: id,
          customer_name: customer.company_name,
          status: 'draft',
          expected_delivery_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
        setOrderModalOpen(true);
        break;
      case 'product':
        setPrefilledData({
          customer_id: id,
          customer_code: customer.code,
          name: `Produit pour ${customer.company_name}`,
        });
        setProductModalOpen(true);
        break;
      case 'invoice':
        // For invoices, we still navigate because the form requires selecting delivery notes
        navigate('/invoices');
        toast.info(`Client ${customer.company_name} pré-sélectionné pour la création de facture`);
        break;
      case 'deliveryNote':
        // For delivery notes, we still navigate because the form requires selecting manufacturing orders
        navigate('/deliverynotes');
        toast.info(`Client ${customer.company_name} pré-sélectionné pour la création de bon de livraison`);
        break;
    }
  };

  const copyCustomerCode = () => {
    if (customer?.code) {
      navigator.clipboard.writeText(customer.code);
      toast.success('Code client copié');
    }
  };

  if (isLoadingCustomer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-12 w-48 mb-6" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16">
            <Building className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600">Client non trouvé</h3>
            <p className="text-slate-400 mt-1">Le client demandé n'existe pas ou a été supprimé</p>
            <Button onClick={() => navigate('/customers')} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux clients
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[customer.status] || STATUS_CONFIG.active;
  const paymentTermsConfig = PAYMENT_TERMS_CONFIG[customer.payment_terms] || PAYMENT_TERMS_CONFIG['30_days'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div className="flex items-start gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/customers')} className="mt-1">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{customer.company_name}</h1>
                <Badge className={statusConfig.class}>{statusConfig.label}</Badge>
                <Badge className={paymentTermsConfig.class}>{paymentTermsConfig.label}</Badge>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <p className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                  {customer.code}
                </p>
                <Button variant="ghost" size="icon" onClick={copyCustomerCode} className="h-8 w-8">
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
              <p className="text-slate-500 mt-1">Détails du client et documents associés</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => handleCreateDocument('quote')} className="bg-blue-600 hover:bg-blue-700">
              <FileText className="w-4 h-4 mr-2" />
              Nouveau devis
            </Button>
            <Button onClick={() => handleCreateDocument('order')} className="bg-emerald-600 hover:bg-emerald-700">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Nouvelle commande
            </Button>
            <Button onClick={() => handleCreateDocument('product')} variant="outline">
              <Package className="w-4 h-4 mr-2" />
              Nouveau produit
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Customer info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Informations client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
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
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Téléphone</p>
                      <p className="font-medium">{customer.phone || 'Non spécifié'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Adresse</p>
                      <p className="font-medium">
                        {customer.address ? `${customer.address}, ${customer.postal_code} ${customer.city}` : 'Non spécifiée'}
                      </p>
                    </div>
                  </div>
                  {customer.siret && (
                    <div>
                      <p className="text-sm text-slate-500">SIRET</p>
                      <p className="font-medium">{customer.siret}</p>
                    </div>
                  )}
                  {customer.vat_number && (
                    <div>
                      <p className="text-sm text-slate-500">N° TVA</p>
                      <p className="font-medium">{customer.vat_number}</p>
                    </div>
                  )}
                  {customer.notes && (
                    <div>
                      <p className="text-sm text-slate-500">Notes</p>
                      <p className="font-medium text-sm">{customer.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick stats */}
            <Card>
              <CardHeader>
                <CardTitle>Statistiques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-700">{quotes.length}</p>
                    <p className="text-sm text-blue-600">Devis</p>
                  </div>
                  <div className="text-center p-3 bg-emerald-50 rounded-lg">
                    <p className="text-2xl font-bold text-emerald-700">{orders.length}</p>
                    <p className="text-sm text-emerald-600">Commandes</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-700">{invoices.length}</p>
                    <p className="text-sm text-purple-600">Factures</p>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-lg">
                    <p className="text-2xl font-bold text-amber-700">{deliveryNotes.length}</p>
                    <p className="text-sm text-amber-600">Livraisons</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Tabs */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-5 mb-6">
                <TabsTrigger value="overview">Aperçu</TabsTrigger>
                <TabsTrigger value="quotes">Devis</TabsTrigger>
                <TabsTrigger value="orders">Commandes</TabsTrigger>
                <TabsTrigger value="invoices">Factures</TabsTrigger>
                <TabsTrigger value="deliveryNotes">Livraisons</TabsTrigger>
              </TabsList>

              {/* Overview tab */}
              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Documents récents</CardTitle>
                    <CardDescription>Les derniers documents associés à ce client</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Recent quotes */}
                      {quotes.slice(0, 3).map(quote => (
                        <div key={quote.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-blue-500" />
                            <div>
                              <p className="font-medium">{quote.title || `Devis ${quote.code}`}</p>
                              <p className="text-sm text-slate-500">
                                {quote.created_date ? new Date(quote.created_date).toLocaleDateString('fr-FR') : 'Date inconnue'}
                              </p>
                            </div>
                          </div>
                          <Badge className={
                            quote.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                            quote.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-700'
                          }>
                            {quote.status === 'accepted' ? 'Accepté' : quote.status === 'rejected' ? 'Refusé' : 'Brouillon'}
                          </Badge>
                        </div>
                      ))}

                      {/* Recent orders */}
                      {orders.slice(0, 3).map(order => (
                        <div key={order.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <ShoppingCart className="w-5 h-5 text-emerald-500" />
                            <div>
                              <p className="font-medium">{order.title || `Commande ${order.code}`}</p>
                              <p className="text-sm text-slate-500">
                                {order.created_date ? new Date(order.created_date).toLocaleDateString('fr-FR') : 'Date inconnue'}
                              </p>
                            </div>
                          </div>
                          <Badge className={
                            order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            order.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-700'
                          }>
                            {order.status === 'completed' ? 'Terminée' : 
                             order.status === 'in_progress' ? 'En cours' : 
                             order.status === 'cancelled' ? 'Annulée' : 'Brouillon'}
                          </Badge>
                        </div>
                      ))}

                      {/* Recent invoices */}
                      {invoices.slice(0, 3).map(invoice => (
                        <div key={invoice.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <CreditCard className="w-5 h-5 text-purple-500" />
                            <div>
                              <p className="font-medium">{invoice.title || `Facture ${invoice.code}`}</p>
                              <p className="text-sm text-slate-500">
                                {invoice.created_date ? new Date(invoice.created_date).toLocaleDateString('fr-FR') : 'Date inconnue'}
                              </p>
                            </div>
                          </div>
                          <Badge className={
                            invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                            invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-700'
                          }>
                            {invoice.status === 'paid' ? 'Payée' : 
                             invoice.status === 'overdue' ? 'En retard' : 'En attente'}
                          </Badge>
                        </div>
                      ))}

                      {quotes.length === 0 && orders.length === 0 && invoices.length === 0 && (
                        <div className="text-center py-8">
                          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500">Aucun document associé à ce client</p>
                          <p className="text-sm text-slate-400 mt-1">Créez un devis, une commande ou une facture</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Actions rapides</CardTitle>
                    <CardDescription>Créez rapidement de nouveaux documents</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Button onClick={() => handleCreateDocument('quote')} variant="outline" className="h-auto py-4 flex flex-col items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-500 mb-2" />
                        <span>Nouveau devis</span>
                        <span className="text-xs text-slate-400 mt-1">Pré-rempli avec le client</span>
                      </Button>
                      <Button onClick={() => handleCreateDocument('order')} variant="outline" className="h-auto py-4 flex flex-col items-center justify-center">
                        <ShoppingCart className="w-6 h-6 text-emerald-500 mb-2" />
                        <span>Nouvelle commande</span>
                        <span className="text-xs text-slate-400 mt-1">Basée sur le client</span>
                      </Button>
                      <Button onClick={() => handleCreateDocument('invoice')} variant="outline" className="h-auto py-4 flex flex-col items-center justify-center">
                        <CreditCard className="w-6 h-6 text-purple-500 mb-2" />
                        <span>Nouvelle facture</span>
                        <span className="text-xs text-slate-400 mt-1">Pour ce client</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Quotes tab */}
              <TabsContent value="quotes">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Devis</CardTitle>
                      <CardDescription>Tous les devis associés à ce client</CardDescription>
                    </div>
                    <Button onClick={() => handleCreateDocument('quote')} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Nouveau devis
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isLoadingQuotes ? (
                      <Skeleton className="h-64 rounded-lg" />
                    ) : quotes.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-600">Aucun devis</h3>
                        <p className="text-slate-400 mt-1">Créez votre premier devis pour ce client</p>
                        <Button onClick={() => handleCreateDocument('quote')} className="mt-4">
                          <Plus className="w-4 h-4 mr-2" />
                          Créer un devis
                        </Button>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Titre</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Validité</TableHead>
                            <TableHead>Montant</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {quotes.map(quote => (
                            <TableRow key={quote.id}>
                              <TableCell className="font-mono font-bold">{quote.code}</TableCell>
                              <TableCell className="font-medium">{quote.title}</TableCell>
                              <TableCell>
                                {quote.created_date ? new Date(quote.created_date).toLocaleDateString('fr-FR') : '-'}
                              </TableCell>
                              <TableCell>
                                {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('fr-FR') : '-'}
                              </TableCell>
                              <TableCell className="font-medium">
                                {quote.total_amount ? `${quote.total_amount.toFixed(2)} €` : '-'}
                              </TableCell>
                              <TableCell>
                                <Badge className={
                                  quote.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                                  quote.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                  'bg-slate-100 text-slate-700'
                                }>
                                  {quote.status === 'accepted' ? 'Accepté' : 
                                   quote.status === 'rejected' ? 'Refusé' : 'Brouillon'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" asChild>
                                  <Link to={`/quotes/${quote.id}`}>
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

              {/* Orders tab */}
              <TabsContent value="orders">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Commandes</CardTitle>
                      <CardDescription>Toutes les commandes associées à ce client</CardDescription>
                    </div>
                    <Button onClick={() => handleCreateDocument('order')} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Nouvelle commande
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isLoadingOrders ? (
                      <Skeleton className="h-64 rounded-lg" />
                    ) : orders.length === 0 ? (
                      <div className="text-center py-12">
                        <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-600">Aucune commande</h3>
                        <p className="text-slate-400 mt-1">Créez votre première commande pour ce client</p>
                        <Button onClick={() => handleCreateDocument('order')} className="mt-4">
                          <Plus className="w-4 h-4 mr-2" />
                          Créer une commande
                        </Button>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Titre</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Livraison prévue</TableHead>
                            <TableHead>Articles</TableHead>
                            <TableHead>Montant</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders.map(order => {
                            const itemCount = order.items?.length || 0;
                            const totalItems = order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
                            const itemsSummary = itemCount > 0 
                              ? `${itemCount} produit${itemCount > 1 ? 's' : ''}, ${totalItems} unité${totalItems > 1 ? 's' : ''}`
                              : 'Aucun article';
                            
                            return (
                              <TableRow key={order.id}>
                                <TableCell className="font-mono font-bold">{order.code}</TableCell>
                                <TableCell className="font-medium">{order.title}</TableCell>
                                <TableCell>
                                  {order.created_date ? new Date(order.created_date).toLocaleDateString('fr-FR') : '-'}
                                </TableCell>
                                <TableCell>
                                  {order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString('fr-FR') : '-'}
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <div className="font-medium">{itemsSummary}</div>
                                    {order.total_ht && (
                                      <div className="text-slate-500">Total: {order.total_ht.toFixed(2)} € HT</div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                  {order.total_amount ? `${order.total_amount.toFixed(2)} €` : '-'}
                                </TableCell>
                                <TableCell>
                                  <Badge className={
                                    order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                    order.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                    order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                    'bg-slate-100 text-slate-700'
                                  }>
                                    {order.status === 'completed' ? 'Terminée' : 
                                     order.status === 'in_progress' ? 'En cours' : 
                                     order.status === 'cancelled' ? 'Annulée' : 'Brouillon'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="icon" asChild>
                                    <Link to={`/orders/${order.id}`}>
                                      <Eye className="w-4 h-4" />
                                    </Link>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Invoices tab */}
              <TabsContent value="invoices">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Factures</CardTitle>
                      <CardDescription>Toutes les factures associées à ce client</CardDescription>
                    </div>
                    <Button onClick={() => handleCreateDocument('invoice')} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Nouvelle facture
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isLoadingInvoices ? (
                      <Skeleton className="h-64 rounded-lg" />
                    ) : invoices.length === 0 ? (
                      <div className="text-center py-12">
                        <CreditCard className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-600">Aucune facture</h3>
                        <p className="text-slate-400 mt-1">Créez votre première facture pour ce client</p>
                        <Button onClick={() => handleCreateDocument('invoice')} className="mt-4">
                          <Plus className="w-4 h-4 mr-2" />
                          Créer une facture
                        </Button>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Titre</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Échéance</TableHead>
                            <TableHead>Montant</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoices.map(invoice => (
                            <TableRow key={invoice.id}>
                              <TableCell className="font-mono font-bold">{invoice.code}</TableCell>
                              <TableCell className="font-medium">{invoice.title}</TableCell>
                              <TableCell>
                                {invoice.created_date ? new Date(invoice.created_date).toLocaleDateString('fr-FR') : '-'}
                              </TableCell>
                              <TableCell>
                                {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('fr-FR') : '-'}
                              </TableCell>
                              <TableCell className="font-medium">
                                {invoice.total_amount ? `${invoice.total_amount.toFixed(2)} €` : '-'}
                              </TableCell>
                              <TableCell>
                                <Badge className={
                                  invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                  invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                                  'bg-slate-100 text-slate-700'
                                }>
                                  {invoice.status === 'paid' ? 'Payée' : 
                                   invoice.status === 'overdue' ? 'En retard' : 'En attente'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" asChild>
                                  <Link to={`/invoices/${invoice.id}`}>
                                    <Eye className="w-4 h-4" />
                                  </Link>
                                </Button>
                                <Button variant="ghost" size="icon">
                                  <Download className="w-4 h-4" />
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

              {/* Delivery notes tab */}
              <TabsContent value="deliveryNotes">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Bons de livraison</CardTitle>
                      <CardDescription>Tous les bons de livraison associés à ce client</CardDescription>
                    </div>
                    <Button onClick={() => handleCreateDocument('deliveryNote')} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Nouveau bon
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isLoadingDeliveryNotes ? (
                      <Skeleton className="h-64 rounded-lg" />
                    ) : deliveryNotes.length === 0 ? (
                      <div className="text-center py-12">
                        <Truck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-600">Aucun bon de livraison</h3>
                        <p className="text-slate-400 mt-1">Créez votre premier bon de livraison pour ce client</p>
                        <Button onClick={() => handleCreateDocument('deliveryNote')} className="mt-4">
                          <Plus className="w-4 h-4 mr-2" />
                          Créer un bon
                        </Button>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Titre</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Commande associée</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {deliveryNotes.map(note => (
                            <TableRow key={note.id}>
                              <TableCell className="font-mono font-bold">{note.code}</TableCell>
                              <TableCell className="font-medium">{note.title}</TableCell>
                              <TableCell>
                                {note.delivery_date ? new Date(note.delivery_date).toLocaleDateString('fr-FR') : '-'}
                              </TableCell>
                              <TableCell>
                                {note.order_code ? (
                                  <Link to={`/orders/${note.order_id}`} className="text-blue-600 hover:underline">
                                    {note.order_code}
                                  </Link>
                                ) : '-'}
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
                                  <Link to={`/deliverynotes/${note.id}`}>
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
      </div>

      {/* Quote Form Modal */}
      <QuoteForm 
        open={quoteModalOpen} 
        onOpenChange={setQuoteModalOpen} 
        quote={null}
        onSave={(data) => createQuoteMutation.mutate(data)}
        customers={customer ? [customer] : []}
        products={products}
        prefilledData={prefilledData}
      />

      {/* Order Form Modal */}
      <OrderFormNew
        open={orderModalOpen}
        onOpenChange={setOrderModalOpen}
        order={null}
        onSave={(data) => createOrderMutation.mutate(data)}
        customers={customer ? [customer] : []}
        products={products}
        prefilledData={prefilledData}
      />

      {/* Product Form Modal */}
      <ProductForm
        open={productModalOpen}
        onOpenChange={setProductModalOpen}
        product={null}
        onSave={(data) => createProductMutation.mutate(data)}
        allProducts={products}
        customers={customer ? [customer] : []}
        prefilledData={prefilledData}
      />
    </div>
  );
}


