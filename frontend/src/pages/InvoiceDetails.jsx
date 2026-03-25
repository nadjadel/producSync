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
  CreditCard, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Download,
  Eye,
  Plus,
  Calendar,
  User,
  Building,
  Mail,
  Phone,
  MapPin
} from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG = {
  draft: { label: 'Brouillon', class: 'bg-slate-100 text-slate-700' },
  sent: { label: 'Envoyée', class: 'bg-blue-100 text-blue-700' },
  paid: { label: 'Payée', class: 'bg-emerald-100 text-emerald-700' },
  overdue: { label: 'En retard', class: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Annulée', class: 'bg-amber-100 text-amber-700' }
};

export default function InvoiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch invoice details
  const { data: invoice, isLoading: isLoadingInvoice } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => base44.entities.Invoice.get(id),
    enabled: !!id,
  });

  // Fetch customer details
  const { data: customer, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ['customer', invoice?.customer_id],
    queryFn: () => base44.entities.Customer.get(invoice?.customer_id),
    enabled: !!invoice?.customer_id,
  });

  // Fetch related credit notes
  const { data: creditNotes = [], isLoading: isLoadingCreditNotes } = useQuery({
    queryKey: ['creditNotes', id],
    queryFn: () => base44.entities.CreditNote.filter({ invoice_id: id }),
    enabled: !!id && activeTab === 'creditNotes',
  });

  // Mutations for invoice actions
  const sendInvoiceMutation = useMutation({
    mutationFn: () => base44.entities.Invoice.update(id, { status: 'sent' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      toast.success('Facture envoyée');
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'envoi de la facture');
      console.error(error);
    }
  });

  const markAsPaidMutation = useMutation({
    mutationFn: () => base44.entities.Invoice.update(id, { status: 'paid' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      toast.success('Facture marquée comme payée');
    },
    onError: (error) => {
      toast.error('Erreur lors du marquage de la facture');
      console.error(error);
    }
  });

  const markAsOverdueMutation = useMutation({
    mutationFn: () => base44.entities.Invoice.update(id, { status: 'overdue' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      toast.success('Facture marquée comme en retard');
    },
    onError: (error) => {
      toast.error('Erreur lors du marquage de la facture');
      console.error(error);
    }
  });

  const cancelInvoiceMutation = useMutation({
    mutationFn: () => base44.entities.Invoice.update(id, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      toast.success('Facture annulée');
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'annulation de la facture');
      console.error(error);
    }
  });

  const handleSendInvoice = () => {
    if (window.confirm('Êtes-vous sûr de vouloir envoyer cette facture ?')) {
      sendInvoiceMutation.mutate();
    }
  };

  const handleMarkAsPaid = () => {
    if (window.confirm('Marquer cette facture comme payée ?')) {
      markAsPaidMutation.mutate();
    }
  };

  const handleMarkAsOverdue = () => {
    if (window.confirm('Marquer cette facture comme en retard ?')) {
      markAsOverdueMutation.mutate();
    }
  };

  const handleCancelInvoice = () => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler cette facture ?')) {
      cancelInvoiceMutation.mutate();
    }
  };

  const handleCreateCreditNote = () => {
    if (!invoice) return;
    
    // Store prefilled data for credit note creation
    const defaultData = {
      invoice_id: id,
      invoice_code: invoice.code,
      customer_id: invoice.customer_id,
      customer_name: invoice.customer_name,
      customer_code: invoice.customer_code,
      title: `Avoir pour ${invoice.title || `Facture ${invoice.code}`}`,
      status: 'draft',
      reason: 'remboursement',
      amount: invoice.total_amount || 0,
      items: invoice.items || [],
    };

    const storageKey = `prefilled_creditNote_${id}`;
    console.log(`[DEBUG] Storing prefilled credit note data with key: ${storageKey}`, defaultData);
    sessionStorage.setItem(storageKey, JSON.stringify(defaultData));
    
    // Navigate to credit notes page
    navigate('/creditnotes');
    toast.success('Redirection vers la création d\'un avoir - le formulaire s\'ouvrira automatiquement');
  };

  const downloadPDF = () => {
    toast.info('Téléchargement du PDF en cours de développement');
    // TODO: Implement PDF download
  };

  if (isLoadingInvoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-12 w-48 mb-6" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600">Facture non trouvée</h3>
            <p className="text-slate-400 mt-1">La facture demandée n'existe pas ou a été supprimée</p>
            <Button onClick={() => navigate('/invoices')} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux factures
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.draft;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div className="flex items-start gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/invoices')} className="mt-1">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                  {invoice.title || `Facture ${invoice.code}`}
                </h1>
                <Badge className={statusConfig.class}>{statusConfig.label}</Badge>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <p className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                  {invoice.code}
                </p>
                {invoice.order_code && (
                  <Link to={`/orders/${invoice.order_id}`} className="text-blue-600 hover:underline">
                    <Badge variant="outline" className="ml-2">
                      Commande: {invoice.order_code}
                    </Badge>
                  </Link>
                )}
              </div>
              <p className="text-slate-500 mt-1">Détails de la facture et actions associées</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={downloadPDF} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Télécharger PDF
            </Button>
            {invoice.status === 'draft' && (
              <Button onClick={handleSendInvoice} className="bg-blue-600 hover:bg-blue-700">
                <Send className="w-4 h-4 mr-2" />
                Envoyer
              </Button>
            )}
            {invoice.status === 'sent' && (
              <Button onClick={handleMarkAsPaid} className="bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                Marquer payée
              </Button>
            )}
            {invoice.status === 'sent' && (
              <Button onClick={handleMarkAsOverdue} variant="outline" className="border-red-200 text-red-700 hover:bg-red-50">
                <AlertCircle className="w-4 h-4 mr-2" />
                Marquer en retard
              </Button>
            )}
            {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
              <Button onClick={handleCancelInvoice} variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50">
                <XCircle className="w-4 h-4 mr-2" />
                Annuler
              </Button>
            )}
            <Button onClick={handleCreateCreditNote} variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
              <Plus className="w-4 h-4 mr-2" />
              Créer un avoir
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Invoice info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Informations facture
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-500">Date de création</p>
                    <p className="font-medium">
                      {invoice.created_date ? new Date(invoice.created_date).toLocaleDateString('fr-FR') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Date d'échéance</p>
                    <p className="font-medium">
                      {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('fr-FR') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Montant HT</p>
                    <p className="font-medium">
                      {invoice.subtotal ? `${invoice.subtotal.toFixed(2)} €` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">TVA</p>
                    <p className="font-medium">
                      {invoice.vat_amount ? `${invoice.vat_amount.toFixed(2)} €` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Montant TTC</p>
                    <p className="font-medium text-lg">
                      {invoice.total_amount ? `${invoice.total_amount.toFixed(2)} €` : '-'}
                    </p>
                  </div>
                  {invoice.notes && (
                    <div>
                      <p className="text-sm text-slate-500">Notes</p>
                      <p className="font-medium text-sm">{invoice.notes}</p>
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
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column - Tabs */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="overview">Aperçu</TabsTrigger>
                <TabsTrigger value="items">Articles</TabsTrigger>
                <TabsTrigger value="creditNotes">Avoirs</TabsTrigger>
                <TabsTrigger value="history">Historique</TabsTrigger>
              </TabsList>

              {/* Overview tab */}
              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Résumé</CardTitle>
                    <CardDescription>Informations générales sur la facture</CardDescription>
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
                          <p className="font-medium">{invoice.customer_name || customer?.company_name || 'Non spécifié'}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-500">Date d'émission</p>
                          <p className="font-medium">
                            {invoice.created_date ? new Date(invoice.created_date).toLocaleDateString('fr-FR') : '-'}
                          </p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-500">Échéance</p>
                          <p className="font-medium">
                            {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('fr-FR') : '-'}
                          </p>
                        </div>
                      </div>
                      
                      {invoice.notes && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-600 font-medium mb-1">Notes</p>
                          <p className="text-blue-700">{invoice.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Payment information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Informations de paiement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Sous-total HT</span>
                        <span className="font-medium">{invoice.subtotal ? `${invoice.subtotal.toFixed(2)} €` : '0,00 €'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">TVA ({invoice.vat_rate || 20}%)</span>
                        <span className="font-medium">{invoice.vat_amount ? `${invoice.vat_amount.toFixed(2)} €` : '0,00 €'}</span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-3">
                        <span className="text-lg font-semibold text-slate-900">Total TTC</span>
                        <span className="text-2xl font-bold text-slate-900">
                          {invoice.total_amount ? `${invoice.total_amount.toFixed(2)} €` : '0,00 €'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Items tab */}
              <TabsContent value="items">
                <Card>
                  <CardHeader>
                    <CardTitle>Articles</CardTitle>
                    <CardDescription>Détail des articles facturés</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {invoice.items && invoice.items.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Référence</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Quantité</TableHead>
                            <TableHead className="text-right">Prix unitaire</TableHead>
                            <TableHead className="text-right">Total HT</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoice.items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{item.product_reference || '-'}</TableCell>
                              <TableCell>{item.description || item.product_name || 'Article'}</TableCell>
                              <TableCell className="text-right">{item.quantity || 1}</TableCell>
                              <TableCell className="text-right">{item.unit_price ? `${item.unit_price.toFixed(2)} €` : '0,00 €'}</TableCell>
                              <TableCell className="text-right font-medium">
                                {item.total ? `${item.total.toFixed(2)} €` : '0,00 €'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">Aucun article dans cette facture</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Credit notes tab */}
              <TabsContent value="creditNotes">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Avoirs associés</CardTitle>
                      <CardDescription>Avoirs créés pour cette facture</CardDescription>
                    </div>
                    <Button onClick={handleCreateCreditNote} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Créer un avoir
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isLoadingCreditNotes ? (
                      <Skeleton className="h-64 rounded-lg" />
                    ) : creditNotes.length === 0 ? (
                      <div className="text-center py-12">
                        <CreditCard className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-600">Aucun avoir</h3>
                        <p className="text-slate-400 mt-1">Créez un avoir pour cette facture si nécessaire</p>
                        <Button onClick={handleCreateCreditNote} className="mt-4">
                          <Plus className="w-4 h-4 mr-2" />
                          Créer un avoir
                        </Button>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Motif</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Montant</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {creditNotes.map(creditNote => (
                            <TableRow key={creditNote.id}>
                              <TableCell className="font-mono font-bold">{creditNote.code}</TableCell>
                              <TableCell>{creditNote.reason || 'Remboursement'}</TableCell>
                              <TableCell>
                                {creditNote.created_date ? new Date(creditNote.created_date).toLocaleDateString('fr-FR') : '-'}
                              </TableCell>
                              <TableCell className="font-medium">
                                {creditNote.amount ? `${creditNote.amount.toFixed(2)} €` : '-'}
                              </TableCell>
                              <TableCell>
                                <Badge className={
                                  creditNote.status === 'applied' ? 'bg-emerald-100 text-emerald-700' :
                                  creditNote.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                                  'bg-slate-100 text-slate-700'
                                }>
                                  {creditNote.status === 'applied' ? 'Appliqué' : 
                                   creditNote.status === 'sent' ? 'Envoyé' : 'Brouillon'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" asChild>
                                  <Link to={`/creditnotes/${creditNote.id}`}>
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

              {/* History tab */}
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle>Historique</CardTitle>
                    <CardDescription>Historique des modifications de la facture</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-3 border border-slate-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Création de la facture</p>
                            <p className="text-sm text-slate-500">
                              {invoice.created_date ? new Date(invoice.created_date).toLocaleString('fr-FR') : 'Date inconnue'}
                            </p>
                          </div>
                          <Badge className="bg-slate-100 text-slate-700">Créé</Badge>
                        </div>
                      </div>
                      
                      {invoice.status !== 'draft' && (
                        <div className="p-3 border border-slate-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Facture envoyée</p>
                              <p className="text-sm text-slate-500">
                                {invoice.sent_date ? new Date(invoice.sent_date).toLocaleString('fr-FR') : 'Date inconnue'}
                              </p>
                            </div>
                            <Badge className="bg-blue-100 text-blue-700">Envoyé</Badge>
                          </div>
                        </div>
                      )}
                      
                      {invoice.status === 'paid' && (
                        <div className="p-3 border border-slate-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Facture payée</p>
                              <p className="text-sm text-slate-500">
                                {invoice.paid_date ? new Date(invoice.paid_date).toLocaleString('fr-FR') : 'Date inconnue'}
                              </p>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-700">Payé</Badge>
                          </div>
                        </div>
                      )}
                      
                      <div className="text-center py-4">
                        <p className="text-slate-400 text-sm">L'historique complet sera disponible prochainement</p>
                      </div>
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
