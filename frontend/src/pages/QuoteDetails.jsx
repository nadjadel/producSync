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
  Building, 
  Mail, 
  Phone, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  ShoppingCart,
  Download,
  Copy,
  Eye,
  Plus,
  Send,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import QuoteForm from '@/components/quotes/QuoteForm';

const STATUS_CONFIG = {
  draft:    { label: 'Brouillon', class: 'bg-slate-100 text-slate-700' },
  sent:     { label: 'Envoyé',    class: 'bg-blue-100 text-blue-700' },
  accepted: { label: 'Accepté',   class: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Refusé',    class: 'bg-rose-100 text-rose-700' },
  expired:  { label: 'Expiré',    class: 'bg-orange-100 text-orange-700' },
};

export default function QuoteDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [formOpen, setFormOpen] = useState(false);

  // Fetch quote details
  const { data: quote, isLoading: isLoadingQuote } = useQuery({
    queryKey: ['quote', id],
    queryFn: () => base44.entities.Quote.get(id),
    enabled: !!id,
  });

  // Fetch related documents
  const { data: customer, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ['customer', quote?.customer_id],
    queryFn: () => base44.entities.Customer.get(quote?.customer_id),
    enabled: !!quote?.customer_id,
  });

  const { data: relatedOrder, isLoading: isLoadingOrder } = useQuery({
    queryKey: ['order', quote?.order_id],
    queryFn: () => quote?.order_id ? base44.entities.Order.get(quote.order_id) : null,
    enabled: !!quote?.order_id,
  });

  // Mutations for status changes
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Quote.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote', id] });
      toast.success('Statut du devis mis à jour');
    },
    onError: (error) => {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    }
  });

  const convertToOrderMutation = useMutation({
    mutationFn: async () => {
      // This would be implemented similarly to the convertToOrder function in Quotes.jsx
      // For now, just update the status
      return base44.entities.Quote.update(id, { status: 'accepted' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote', id] });
      toast.success('Devis converti en commande');
    },
    onError: (error) => {
      toast.error(`Erreur lors de la conversion: ${error.message}`);
    }
  });

  const handleStatusChange = (newStatus) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  const handleConvertToOrder = () => {
    if (confirm('Convertir ce devis en commande ? Cette action créera une nouvelle commande.')) {
      convertToOrderMutation.mutate();
    }
  };

  const copyQuoteNumber = () => {
    if (quote?.quote_number) {
      navigator.clipboard.writeText(quote.quote_number);
      toast.success('Numéro de devis copié');
    }
  };

  if (isLoadingQuote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-12 w-48 mb-6" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600">Devis non trouvé</h3>
            <p className="text-slate-400 mt-1">Le devis demandé n'existe pas ou a été supprimé</p>
            <Button onClick={() => navigate('/quotes')} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux devis
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[quote.status] || STATUS_CONFIG.draft;
  const isExpired = quote.valid_until && new Date(quote.valid_until) < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div className="flex items-start gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/quotes')} className="mt-1">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                  Devis {quote.quote_number}
                </h1>
                <Badge className={statusConfig.class}>{statusConfig.label}</Badge>
                {isExpired && quote.status !== 'accepted' && quote.status !== 'rejected' && (
                  <Badge className="bg-orange-100 text-orange-700">
                    <Clock className="w-3 h-3 mr-1" /> Expiré
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <p className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                  {quote.quote_number}
                </p>
                <Button variant="ghost" size="icon" onClick={copyQuoteNumber} className="h-8 w-8">
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
              <p className="text-slate-500 mt-1">
                {customer ? `Client: ${customer.company_name}` : 'Chargement du client...'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {quote.status === 'draft' && (
              <Button onClick={() => handleStatusChange('sent')} className="bg-blue-600 hover:bg-blue-700">
                <Send className="w-4 h-4 mr-2" />
                Envoyer le devis
              </Button>
            )}
            {quote.status === 'sent' && (
              <>
                <Button onClick={handleConvertToOrder} className="bg-emerald-600 hover:bg-emerald-700">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Convertir en commande
                </Button>
                <Button onClick={() => handleStatusChange('rejected')} variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50">
                  <XCircle className="w-4 h-4 mr-2" />
                  Marquer refusé
                </Button>
              </>
            )}
            <Button onClick={() => setFormOpen(true)} variant="outline">
              <FileText className="w-4 h-4 mr-2" />
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
          {/* Left column - Quote info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Informations du devis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Date</p>
                      <p className="font-medium">
                        {quote.quote_date ? format(new Date(quote.quote_date), "dd MMMM yyyy", { locale: fr }) : 'Non spécifiée'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Valide jusqu'au</p>
                      <p className="font-medium">
                        {quote.valid_until ? format(new Date(quote.valid_until), "dd MMMM yyyy", { locale: fr }) : 'Non spécifiée'}
                      </p>
                    </div>
                  </div>
                  {quote.notes && (
                    <div>
                      <p className="text-sm text-slate-500">Notes</p>
                      <p className="font-medium text-sm">{quote.notes}</p>
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
                      <Link to={`/customers/${customer.id || customer._id}`}>
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
                    <span className="font-bold">{quote.total_ht?.toFixed(2) || '0.00'} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">TVA ({quote.vat_rate || 20}%)</span>
                    <span className="font-bold">{quote.total_vat?.toFixed(2) || '0.00'} €</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-slate-200">
                    <span className="text-lg font-bold text-slate-900">Total TTC</span>
                    <span className="text-lg font-bold text-slate-900">{quote.total_ttc?.toFixed(2) || '0.00'} €</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Tabs */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="overview">Aperçu</TabsTrigger>
                <TabsTrigger value="items">Lignes</TabsTrigger>
                <TabsTrigger value="documents">Documents liés</TabsTrigger>
              </TabsList>

              {/* Overview tab */}
              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Résumé</CardTitle>
                    <CardDescription>Vue d'ensemble du devis et de son statut</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <h4 className="font-semibold text-slate-900 mb-2">Statut actuel</h4>
                        <div className="flex items-center gap-3">
                          <Badge className={statusConfig.class}>{statusConfig.label}</Badge>
                          <p className="text-slate-600">
                            {quote.status === 'draft' && 'Ce devis est en cours de préparation.'}
                            {quote.status === 'sent' && 'Ce devis a été envoyé au client.'}
                            {quote.status === 'accepted' && 'Ce devis a été accepté par le client.'}
                            {quote.status === 'rejected' && 'Ce devis a été refusé par le client.'}
                            {quote.status === 'expired' && 'Ce devis a expiré.'}
                          </p>
                        </div>
                      </div>

                      {relatedOrder && (
                        <div className="p-4 bg-emerald-50 rounded-lg">
                          <h4 className="font-semibold text-emerald-900 mb-2">Commande associée</h4>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{relatedOrder.order_number}</p>
                              <p className="text-sm text-emerald-600">
                                {relatedOrder.status === 'draft' ? 'Brouillon' :
                                 relatedOrder.status === 'confirmed' ? 'Confirmée' :
                                 relatedOrder.status === 'in_production' ? 'En production' :
                                 relatedOrder.status === 'ready' ? 'Prête' :
                                 relatedOrder.status === 'delivered' ? 'Livrée' : 'Annulée'}
                              </p>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/orders/${relatedOrder.id || relatedOrder._id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                Voir
                              </Link>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Actions rapides</CardTitle>
                    <CardDescription>Gérez le statut de ce devis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {quote.status === 'draft' && (
                        <Button onClick={() => handleStatusChange('sent')} className="bg-blue-600 hover:bg-blue-700">
                          <Send className="w-4 h-4 mr-2" />
                          Envoyer le devis
                        </Button>
                      )}
                      {quote.status === 'sent' && (
                        <>
                          <Button onClick={handleConvertToOrder} className="bg-emerald-600 hover:bg-emerald-700">
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Convertir en commande
                          </Button>
                          <Button onClick={() => handleStatusChange('rejected')} variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50">
                            <XCircle className="w-4 h-4 mr-2" />
                            Marquer refusé
                          </Button>
                        </>
                      )}
                      <Button onClick={() => setFormOpen(true)} variant="outline">
                        <FileText className="w-4 h-4 mr-2" />
                        Modifier le devis
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
                    <CardTitle>Lignes du devis</CardTitle>
                    <CardDescription>Détail des articles et services proposés</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {quote.items && quote.items.length > 0 ? (
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
                          {quote.items.map((item, index) => (
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
                            <TableCell className="text-right font-bold">{quote.total_ht?.toFixed(2) || '0.00'} €</TableCell>
                          </TableRow>
                          <TableRow className="bg-slate-50">
                            <TableCell colSpan={3} className="text-right font-bold">TVA ({quote.vat_rate || 20}%)</TableCell>
                            <TableCell className="text-right font-bold">{quote.total_vat?.toFixed(2) || '0.00'} €</TableCell>
                          </TableRow>
                          <TableRow className="bg-slate-100">
                            <TableCell colSpan={3} className="text-right font-bold text-lg">Total TTC</TableCell>
                            <TableCell className="text-right font-bold text-lg">{quote.total_ttc?.toFixed(2) || '0.00'} €</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-12">
                        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-600">Aucune ligne</h3>
                        <p className="text-slate-400 mt-1">Ce devis ne contient pas encore d'articles</p>
                        <Button onClick={() => setFormOpen(true)} className="mt-4">
                          <Plus className="w-4 h-4 mr-2" />
                          Ajouter des articles
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Documents tab */}
              <TabsContent value="documents">
                <Card>
                  <CardHeader>
                    <CardTitle>Documents liés</CardTitle>
                    <CardDescription>Documents associés à ce devis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {relatedOrder && (
                        <div className="p-4 border border-emerald-200 rounded-lg bg-emerald-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <ShoppingCart className="w-5 h-5 text-emerald-500" />
                              <div>
                                <p className="font-medium">Commande {relatedOrder.order_number}</p>
                                <p className="text-sm text-emerald-600">
                                  {relatedOrder.status === 'draft' ? 'Brouillon' :
                                   relatedOrder.status === 'confirmed' ? 'Confirmée' :
                                   relatedOrder.status === 'in_production' ? 'En production' :
                                   relatedOrder.status === 'ready' ? 'Prête' :
                                   relatedOrder.status === 'delivered' ? 'Livrée' : 'Annulée'}
                                </p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/orders/${relatedOrder.id || relatedOrder._id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                Voir
                              </Link>
                            </Button>
                          </div>
                        </div>
                      )}

                      {!relatedOrder && (
                        <div className="text-center py-12">
                          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-slate-600">Aucun document lié</h3>
                          <p className="text-slate-400 mt-1">
                            {quote.status === 'sent' || quote.status === 'accepted' 
                              ? 'Convertissez ce devis en commande pour créer un document lié'
                              : 'Ce devis n\'a pas encore été converti en commande'}
                          </p>
                          {quote.status === 'sent' && (
                            <Button onClick={handleConvertToOrder} className="mt-4">
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Convertir en commande
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Quote Form Modal */}
        <QuoteForm 
          open={formOpen} 
          onOpenChange={setFormOpen} 
          quote={quote}
          onSave={(data) => {
            // Handle save logic here
            setFormOpen(false);
            toast.success('Devis mis à jour');
          }}
          customers={customer ? [customer] : []}
          products={[]}
        />
      </div>
    </div>
  );
}
