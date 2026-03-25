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
  XCircle,
  Download,
  Eye,
  Plus,
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
  sent: { label: 'Envoyé', class: 'bg-blue-100 text-blue-700' },
  applied: { label: 'Appliqué', class: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Annulé', class: 'bg-amber-100 text-amber-700' }
};

export default function CreditNoteDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch credit note details
  const { data: creditNote, isLoading: isLoadingCreditNote } = useQuery({
    queryKey: ['creditNote', id],
    queryFn: () => base44.entities.CreditNote.get(id),
    enabled: !!id,
  });

  // Fetch invoice details
  const { data: invoice, isLoading: isLoadingInvoice } = useQuery({
    queryKey: ['invoice', creditNote?.invoice_id],
    queryFn: () => base44.entities.Invoice.get(creditNote?.invoice_id),
    enabled: !!creditNote?.invoice_id,
  });

  // Fetch customer details
  const { data: customer, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ['customer', creditNote?.customer_id],
    queryFn: () => base44.entities.Customer.get(creditNote?.customer_id),
    enabled: !!creditNote?.customer_id,
  });

  // Mutations for credit note actions
  const sendCreditNoteMutation = useMutation({
    mutationFn: () => base44.entities.CreditNote.update(id, { status: 'sent' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditNote', id] });
      toast.success('Avoir envoyé');
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'envoi de l\'avoir');
      console.error(error);
    }
  });

  const markAsAppliedMutation = useMutation({
    mutationFn: () => base44.entities.CreditNote.update(id, { status: 'applied' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditNote', id] });
      toast.success('Avoir marqué comme appliqué');
    },
    onError: (error) => {
      toast.error('Erreur lors du marquage de l\'avoir');
      console.error(error);
    }
  });

  const cancelCreditNoteMutation = useMutation({
    mutationFn: () => base44.entities.CreditNote.update(id, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditNote', id] });
      toast.success('Avoir annulé');
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'annulation de l\'avoir');
      console.error(error);
    }
  });

  const handleSendCreditNote = () => {
    if (window.confirm('Êtes-vous sûr de vouloir envoyer cet avoir ?')) {
      sendCreditNoteMutation.mutate();
    }
  };

  const handleMarkAsApplied = () => {
    if (window.confirm('Marquer cet avoir comme appliqué ?')) {
      markAsAppliedMutation.mutate();
    }
  };

  const handleCancelCreditNote = () => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler cet avoir ?')) {
      cancelCreditNoteMutation.mutate();
    }
  };

  const downloadPDF = () => {
    toast.info('Téléchargement du PDF en cours de développement');
    // TODO: Implement PDF download
  };

  if (isLoadingCreditNote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-12 w-48 mb-6" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!creditNote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16">
            <CreditCard className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600">Avoir non trouvé</h3>
            <p className="text-slate-400 mt-1">L'avoir demandé n'existe pas ou a été supprimé</p>
            <Button onClick={() => navigate('/creditnotes')} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux avoirs
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[creditNote.status] || STATUS_CONFIG.draft;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div className="flex items-start gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/creditnotes')} className="mt-1">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                  {creditNote.title || `Avoir ${creditNote.code}`}
                </h1>
                <Badge className={statusConfig.class}>{statusConfig.label}</Badge>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <p className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                  {creditNote.code}
                </p>
                {creditNote.invoice_code && (
                  <Link to={`/invoices/${creditNote.invoice_id}`} className="text-blue-600 hover:underline">
                    <Badge variant="outline" className="ml-2">
                      Facture: {creditNote.invoice_code}
                    </Badge>
                  </Link>
                )}
              </div>
              <p className="text-slate-500 mt-1">Détails de l'avoir et actions associées</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={downloadPDF} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Télécharger PDF
            </Button>
            {creditNote.status === 'draft' && (
              <Button onClick={handleSendCreditNote} className="bg-blue-600 hover:bg-blue-700">
                <Send className="w-4 h-4 mr-2" />
                Envoyer
              </Button>
            )}
            {creditNote.status === 'sent' && (
              <Button onClick={handleMarkAsApplied} className="bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                Marquer appliqué
              </Button>
            )}
            {creditNote.status !== 'cancelled' && creditNote.status !== 'applied' && (
              <Button onClick={handleCancelCreditNote} variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50">
                <XCircle className="w-4 h-4 mr-2" />
                Annuler
              </Button>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Credit note info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Informations avoir
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-500">Date de création</p>
                    <p className="font-medium">
                      {creditNote.created_date ? new Date(creditNote.created_date).toLocaleDateString('fr-FR') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Motif</p>
                    <p className="font-medium">{creditNote.reason || 'Non spécifié'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Montant</p>
                    <p className="font-medium text-lg">
                      {creditNote.amount ? `${creditNote.amount.toFixed(2)} €` : '-'}
                    </p>
                  </div>
                  {creditNote.notes && (
                    <div>
                      <p className="text-sm text-slate-500">Notes</p>
                      <p className="font-medium text-sm">{creditNote.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Invoice info */}
            {invoice && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    Facture associée
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-slate-500">Code facture</p>
                      <p className="font-medium">{invoice.code}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Date facture</p>
                      <p className="font-medium">
                        {invoice.created_date ? new Date(invoice.created_date).toLocaleDateString('fr-FR') : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Montant facture</p>
                      <p className="font-medium">
                        {invoice.total_amount ? `${invoice.total_amount.toFixed(2)} €` : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Statut facture</p>
                      <Badge className={
                        invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                        invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }>
                        {invoice.status === 'paid' ? 'Payée' : 
                         invoice.status === 'sent' ? 'Envoyée' : 'Brouillon'}
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
                    <CardDescription>Informations générales sur l'avoir</CardDescription>
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
                          <p className="font-medium">{creditNote.customer_name || customer?.company_name || 'Non spécifié'}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-500">Montant</p>
                          <p className="font-medium">{creditNote.amount ? `${creditNote.amount.toFixed(2)} €` : '-'}</p>
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-500">Motif</p>
                        <p className="font-medium">{creditNote.reason || 'Non spécifié'}</p>
                      </div>
                      {creditNote.notes && (
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-500">Notes</p>
                          <p className="font-medium text-sm">{creditNote.notes}</p>
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
                    <CardDescription>Articles inclus dans cet avoir</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-600">Aucun article</h3>
                      <p className="text-slate-400 mt-1">Les articles seront ajoutés automatiquement depuis la facture</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* History tab */}
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle>Historique</CardTitle>
                    <CardDescription>Historique des modifications de cet avoir</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="font-medium">Création</p>
                            <p className="text-sm text-slate-500">
                              {creditNote.created_date ? new Date(creditNote.created_date).toLocaleDateString('fr-FR') : 'Date inconnue'}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-slate-100 text-slate-700">Créé</Badge>
                      </div>
                      {creditNote.updated_date && (
                        <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-slate-400" />
                            <div>
                              <p className="font-medium">Dernière modification</p>
                              <p className="text-sm text-slate-500">
                                {new Date(creditNote.updated_date).toLocaleDateString('fr-FR')}
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
