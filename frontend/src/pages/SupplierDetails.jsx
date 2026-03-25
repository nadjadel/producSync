import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Globe,
  FileText,
  Package,
  Edit,
  Trash2,
  Plus,
  Download,
  Eye,
  User
} from "lucide-react";
import { toast } from "sonner";

export default function SupplierDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch supplier details
  const { data: supplier, isLoading: isLoadingSupplier } = useQuery({
    queryKey: ['supplier', id],
    queryFn: () => base44.entities.Supplier.get(id),
    enabled: !!id,
  });

  // Fetch supplier products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['supplierProducts', id],
    queryFn: () => base44.entities.Product.filter({ supplier_id: id }),
    enabled: !!id && activeTab === 'products',
  });

  // Fetch supplier orders
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ['supplierOrders', id],
    queryFn: () => base44.entities.Order.filter({ supplier_id: id }),
    enabled: !!id && activeTab === 'orders',
  });

  // Mutation for deleting supplier
  const deleteSupplierMutation = useMutation({
    mutationFn: () => base44.entities.Supplier.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Fournisseur supprimé');
      navigate('/suppliers');
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression du fournisseur');
      console.error(error);
    }
  });

  const handleDeleteSupplier = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ? Cette action est irréversible.')) {
      deleteSupplierMutation.mutate();
    }
  };

  const handleEditSupplier = () => {
    navigate(`/suppliers/edit/${id}`);
  };

  const handleCreateProduct = () => {
    // Store prefilled data for product creation
    const defaultData = {
      supplier_id: id,
      supplier_name: supplier?.company_name,
      supplier_code: supplier?.code,
      status: 'active',
    };

    const storageKey = `prefilled_product_supplier_${id}`;
    console.log(`[DEBUG] Storing prefilled product data with key: ${storageKey}`, defaultData);
    sessionStorage.setItem(storageKey, JSON.stringify(defaultData));
    
    // Navigate to products page
    navigate('/products');
    toast.success('Redirection vers la création d\'un produit - le formulaire s\'ouvrira automatiquement');
  };

  const downloadSupplierData = () => {
    toast.info('Export des données en cours de développement');
    // TODO: Implement data export
  };

  if (isLoadingSupplier) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-12 w-48 mb-6" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16">
            <Building className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600">Fournisseur non trouvé</h3>
            <p className="text-slate-400 mt-1">Le fournisseur demandé n'existe pas ou a été supprimé</p>
            <Button onClick={() => navigate('/suppliers')} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux fournisseurs
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div className="flex items-start gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/suppliers')} className="mt-1">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                  {supplier.company_name}
                </h1>
                <Badge className={
                  supplier.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                  supplier.status === 'inactive' ? 'bg-slate-100 text-slate-700' :
                  'bg-amber-100 text-amber-700'
                }>
                  {supplier.status === 'active' ? 'Actif' : 
                   supplier.status === 'inactive' ? 'Inactif' : 'En attente'}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <p className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                  {supplier.code}
                </p>
                {supplier.vat_number && (
                  <Badge variant="outline" className="ml-2">
                    TVA: {supplier.vat_number}
                  </Badge>
                )}
              </div>
              <p className="text-slate-500 mt-1">Détails du fournisseur et produits associés</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={downloadSupplierData} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
            <Button onClick={handleCreateProduct} variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau produit
            </Button>
            <Button onClick={handleEditSupplier} variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50">
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
            <Button onClick={handleDeleteSupplier} variant="outline" className="border-red-200 text-red-700 hover:bg-red-50">
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Supplier info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Informations fournisseur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Société</p>
                      <p className="font-medium">{supplier.company_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Contact</p>
                      <p className="font-medium">{supplier.contact_name || 'Non spécifié'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Email</p>
                      <p className="font-medium">{supplier.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Téléphone</p>
                      <p className="font-medium">{supplier.phone || 'Non spécifié'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Site web</p>
                      <p className="font-medium">{supplier.website || 'Non spécifié'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Adresse</p>
                      <p className="font-medium">
                        {supplier.address ? `${supplier.address}, ${supplier.postal_code} ${supplier.city}` : 'Non spécifiée'}
                      </p>
                    </div>
                  </div>
                  {supplier.notes && (
                    <div>
                      <p className="text-sm text-slate-500">Notes</p>
                      <p className="font-medium text-sm">{supplier.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Financial info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Informations financières
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-500">Numéro TVA</p>
                    <p className="font-medium">{supplier.vat_number || 'Non spécifié'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Conditions de paiement</p>
                    <p className="font-medium">{supplier.payment_terms || '30 jours'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Délai de livraison</p>
                    <p className="font-medium">{supplier.delivery_time || 'Non spécifié'}</p>
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
                <TabsTrigger value="products">Produits</TabsTrigger>
                <TabsTrigger value="orders">Commandes</TabsTrigger>
              </TabsList>

              {/* Overview tab */}
              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Résumé</CardTitle>
                    <CardDescription>Informations générales sur le fournisseur</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-500">Statut</p>
                          <p className="font-medium">
                            {supplier.status === 'active' ? 'Actif' : 
                             supplier.status === 'inactive' ? 'Inactif' : 'En attente'}
                          </p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-500">Code</p>
                          <p className="font-medium">{supplier.code}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-500">Contact</p>
                          <p className="font-medium">{supplier.contact_name || 'Non spécifié'}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-500">Email</p>
                          <p className="font-medium">{supplier.email}</p>
                        </div>
                      </div>
                      
                      {supplier.notes && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-600 font-medium mb-1">Notes</p>
                          <p className="text-blue-700">{supplier.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Statistiques</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-emerald-50 rounded-lg">
                        <p className="text-2xl font-bold text-emerald-700">
                          {products.length}
                        </p>
                        <p className="text-sm text-emerald-600">Produits</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-700">
                          {orders.length}
                        </p>
                        <p className="text-sm text-blue-600">Commandes</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-700">
                          {supplier.rating || 'N/A'}
                        </p>
                        <p className="text-sm text-purple-600">Note</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Products tab */}
              <TabsContent value="products">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Produits du fournisseur</CardTitle>
                      <CardDescription>Liste des produits fournis par ce fournisseur</CardDescription>
                    </div>
                    <Button onClick={handleCreateProduct} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Nouveau produit
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isLoadingProducts ? (
                      <Skeleton className="h-64 rounded-lg" />
                    ) : products.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-600">Aucun produit</h3>
                        <p className="text-slate-400 mt-1">Ce fournisseur n'a pas encore de produits associés</p>
                        <Button onClick={handleCreateProduct} className="mt-4">
                          <Plus className="w-4 h-4 mr-2" />
                          Créer un produit
                        </Button>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Référence</TableHead>
                            <TableHead>Nom</TableHead>
                            <TableHead>Catégorie</TableHead>
                            <TableHead>Prix</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {products.map(product => (
                            <TableRow key={product.id}>
                              <TableCell className="font-mono font-bold">{product.code}</TableCell>
                              <TableCell>{product.name}</TableCell>
                              <TableCell>{product.category || '-'}</TableCell>
                              <TableCell>{product.price ? `${product.price.toFixed(2)} €` : '-'}</TableCell>
                              <TableCell>{product.stock_quantity || 0}</TableCell>
                              <TableCell>
                                <Badge className={
                                  product.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                  product.status === 'inactive' ? 'bg-slate-100 text-slate-700' :
                                  'bg-amber-100 text-amber-700'
                                }>
                                  {product.status === 'active' ? 'Actif' : 'Inactif'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => navigate(`/products/${product.id}`)}>
                                  <Eye className="w-4 h-4" />
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
                  <CardHeader>
                    <CardTitle>Commandes du fournisseur</CardTitle>
                    <CardDescription>Commandes passées auprès de ce fournisseur</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingOrders ? (
                      <Skeleton className="h-64 rounded-lg" />
                    ) : orders.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-600">Aucune commande</h3>
                        <p className="text-slate-400 mt-1">Aucune commande n'a été passée auprès de ce fournisseur</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Montant</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders.map(order => (
                            <TableRow key={order.id}>
                              <TableCell className="font-mono font-bold">{order.code}</TableCell>
                              <TableCell>
                                {order.created_date ? new Date(order.created_date).toLocaleDateString('fr-FR') : '-'}
                              </TableCell>
                              <TableCell className="font-medium">
                                {order.total_amount ? `${order.total_amount.toFixed(2)} €` : '-'}
                              </TableCell>
                              <TableCell>
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
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => navigate(`/orders/${order.id}`)}>
                                  <Eye className="w-4 h-4" />
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
    </div>
  );
}
