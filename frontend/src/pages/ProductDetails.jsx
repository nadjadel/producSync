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
  Package, 
  Building, 
  Tag, 
  DollarSign, 
  BarChart3,
  AlertTriangle,
  Download,
  Copy,
  Eye,
  Plus,
  Edit,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import ProductForm from '@/components/products/ProductForm';

const CATEGORY_CONFIG = {
  matiere_premiere: { label: 'Matière première', class: 'bg-amber-100 text-amber-700' },
  semi_fini:        { label: 'Semi-fini',         class: 'bg-blue-100 text-blue-700' },
  produit_fini:     { label: 'Produit fini',       class: 'bg-emerald-100 text-emerald-700' },
};

const STATUS_CONFIG = {
  active:   { label: 'Actif',   class: 'bg-emerald-100 text-emerald-700' },
  inactive: { label: 'Inactif', class: 'bg-slate-100 text-slate-700' },
};

const UNIT_LABELS = { piece: 'pcs', kg: 'kg', litre: 'L', metre: 'm' };

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [formOpen, setFormOpen] = useState(false);

  // Fetch product details
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['product', id],
    queryFn: () => base44.entities.Product.get(id),
    enabled: !!id,
  });

  // Fetch related documents
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
    enabled: !!product?.customer_codes?.length,
  });

  const { data: stockMovements = [], isLoading: isLoadingStockMovements } = useQuery({
    queryKey: ['stock-movements', id],
    queryFn: () => base44.entities.StockMovement.filter({ product_id: id }),
    enabled: !!id && activeTab === 'stock',
  });

  const { data: manufacturingOrders = [], isLoading: isLoadingManufacturingOrders } = useQuery({
    queryKey: ['manufacturing-orders', id],
    queryFn: () => base44.entities.ManufacturingOrder.filter({ product_id: id }),
    enabled: !!id && activeTab === 'manufacturing',
  });

  // Mutations for status changes
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Product.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      toast.success('Statut du produit mis à jour');
    },
    onError: (error) => {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    }
  });

  const updateStockMutation = useMutation({
    mutationFn: ({ id, stock_quantity }) => base44.entities.Product.update(id, { stock_quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      toast.success('Stock mis à jour');
    },
    onError: (error) => {
      toast.error(`Erreur lors de la mise à jour du stock: ${error.message}`);
    }
  });

  const handleStatusChange = (newStatus) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  const handleStockUpdate = (newStock) => {
    if (confirm(`Mettre à jour le stock à ${newStock} ${UNIT_LABELS[product?.unit] || 'unités'} ?`)) {
      updateStockMutation.mutate({ id, stock_quantity: newStock });
    }
  };

  const copyProductReference = () => {
    if (product?.reference) {
      navigator.clipboard.writeText(product.reference);
      toast.success('Référence produit copiée');
    }
  };

  if (isLoadingProduct) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-12 w-48 mb-6" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600">Produit non trouvé</h3>
            <p className="text-slate-400 mt-1">Le produit demandé n'existe pas ou a été supprimé</p>
            <Button onClick={() => navigate('/products')} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux produits
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const categoryConfig = CATEGORY_CONFIG[product.category] || CATEGORY_CONFIG.produit_fini;
  const statusConfig = STATUS_CONFIG[product.status] || STATUS_CONFIG.active;
  const isLowStock = product.stock_quantity !== undefined &&
    product.stock_minimum !== undefined &&
    product.stock_quantity <= product.stock_minimum;

  // Filter customers that have this product in their codes
  const productCustomers = customers.filter(customer => 
    product.customer_codes?.includes(customer.code)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div className="flex items-start gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/products')} className="mt-1">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                  {product.name}
                </h1>
                <Badge className={categoryConfig.class}>{categoryConfig.label}</Badge>
                <Badge className={statusConfig.class}>{statusConfig.label}</Badge>
                {isLowStock && (
                  <Badge className="bg-red-100 text-red-700">
                    <AlertTriangle className="w-3 h-3 mr-1" /> Stock bas
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <p className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                  {product.reference}
                </p>
                <Button variant="ghost" size="icon" onClick={copyProductReference} className="h-8 w-8">
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
              <p className="text-slate-500 mt-1">
                {product.description ? product.description.substring(0, 100) + (product.description.length > 100 ? '...' : '') : 'Aucune description'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setFormOpen(true)} className="bg-slate-900 hover:bg-slate-800">
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Fiche technique
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Product info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Informations produit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Tag className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Catégorie</p>
                      <p className="font-medium">{categoryConfig.label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Unité</p>
                      <p className="font-medium">{UNIT_LABELS[product.unit] || product.unit}</p>
                    </div>
                  </div>
                  {product.customer_code && (
                    <div className="flex items-center gap-3">
                      <Building className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-500">Code client</p>
                        <p className="font-medium">{product.customer_code}</p>
                      </div>
                    </div>
                  )}
                  {product.notes && (
                    <div>
                      <p className="text-sm text-slate-500">Notes</p>
                      <p className="font-medium text-sm">{product.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stock info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-slate-500">Quantité actuelle</p>
                      <p className={`text-2xl font-bold ${isLowStock ? 'text-red-600' : 'text-slate-900'}`}>
                        {product.stock_quantity || 0} {UNIT_LABELS[product.unit]}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Minimum</p>
                      <p className="text-lg font-medium text-slate-700">{product.stock_minimum || 0} {UNIT_LABELS[product.unit]}</p>
                    </div>
                  </div>
                  
                  {isLowStock && (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <p className="text-sm font-medium text-red-700">Stock bas</p>
                      </div>
                      <p className="text-xs text-red-600 mt-1">
                        Le stock est inférieur ou égal au minimum défini
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={() => handleStockUpdate((product.stock_quantity || 0) + 1)} 
                      variant="outline" 
                      size="sm"
                      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    >
                      <TrendingUp className="w-3.5 h-3.5 mr-1" /> +1
                    </Button>
                    <Button 
                      onClick={() => handleStockUpdate((product.stock_quantity || 0) - 1)} 
                      variant="outline" 
                      size="sm"
                      className="border-rose-200 text-rose-700 hover:bg-rose-50"
                    >
                      <TrendingDown className="w-3.5 h-3.5 mr-1" /> -1
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Tarification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Coût d'achat</span>
                    <span className="font-bold">{product.cost_price?.toFixed(2) || '0.00'} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Prix de vente</span>
                    <span className="font-bold text-emerald-700">{product.sell_price?.toFixed(2) || '0.00'} €</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-slate-200">
                    <span className="font-bold text-slate-900">Marge</span>
                    <span className="font-bold text-slate-900">
                      {product.cost_price && product.sell_price 
                        ? `${((product.sell_price - product.cost_price) / product.cost_price * 100).toFixed(1)}%` 
                        : '0.0%'}
                    </span>
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
                <TabsTrigger value="customers">Clients</TabsTrigger>
                <TabsTrigger value="stock">Mouvements</TabsTrigger>
                <TabsTrigger value="manufacturing">OF</TabsTrigger>
              </TabsList>

              {/* Overview tab */}
              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Résumé</CardTitle>
                    <CardDescription>Vue d'ensemble du produit et de son statut</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <h4 className="font-semibold text-slate-900 mb-2">Statut actuel</h4>
                        <div className="flex items-center gap-3">
                          <Badge className={statusConfig.class}>{statusConfig.label}</Badge>
                          <p className="text-slate-600">
                            {product.status === 'active' 
                              ? 'Ce produit est actif et peut être utilisé dans les devis et commandes.'
                              : 'Ce produit est inactif et ne peut pas être utilisé dans les devis et commandes.'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-700">{productCustomers.length}</p>
                          <p className="text-sm text-blue-600">Clients associés</p>
                        </div>
                        <div className="text-center p-3 bg-amber-50 rounded-lg">
                          <p className="text-2xl font-bold text-amber-700">{manufacturingOrders.length}</p>
                          <p className="text-sm text-amber-600">OF générés</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Actions rapides</CardTitle>
                    <CardDescription>Gérez le statut et le stock de ce produit</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button 
                        onClick={() => handleStatusChange(product.status === 'active' ? 'inactive' : 'active')} 
                        className={product.status === 'active' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {product.status === 'active' ? 'Désactiver' : 'Activer'}
                      </Button>
                      <Button onClick={() => setFormOpen(true)} variant="outline">
                        <Edit className="w-4 h-4 mr-2" />
                        Modifier le produit
                      </Button>
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Fiche technique
                      </Button>
                      <Button variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Créer un OF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Customers tab */}
              <TabsContent value="customers">
                <Card>
                  <CardHeader>
                    <CardTitle>Clients associés</CardTitle>
                    <CardDescription>Clients qui utilisent ce produit</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingCustomers ? (
                      <Skeleton className="h-64 rounded-lg" />
                    ) : productCustomers.length === 0 ? (
                      <div className="text-center py-12">
                        <Building className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-600">Aucun client associé</h3>
                        <p className="text-slate-400 mt-1">Ce produit n'est associé à aucun client</p>
                        <Button onClick={() => setFormOpen(true)} className="mt-4">
                          <Edit className="w-4 h-4 mr-2" />
                          Associer des clients
                        </Button>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Société</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {productCustomers.map(customer => (
                            <TableRow key={customer.id}>
                              <TableCell className="font-mono font-bold">{customer.code}</TableCell>
                              <TableCell className="font-medium">{customer.company_name}</TableCell>
                              <TableCell>{customer.contact_name || '-'}</TableCell>
                              <TableCell>{customer.email}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" asChild>
                                  <Link to={`/customers/${customer.id}`}>
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

              {/* Stock movements tab */}
              <TabsContent value="stock">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Mouvements de stock</CardTitle>
                      <CardDescription>Historique des entrées et sorties de stock</CardDescription>
                    </div>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Nouveau mouvement
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isLoadingStockMovements ? (
                      <Skeleton className="h-64 rounded-lg" />
                    ) : stockMovements.length === 0 ? (
                      <div className="text-center py-12">
                        <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-600">Aucun mouvement</h3>
                        <p className="text-slate-400 mt-1">Aucun mouvement de stock enregistré pour ce produit</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Quantité</TableHead>
                            <TableHead>Référence</TableHead>
                            <TableHead>Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stockMovements.map(movement => (
                            <TableRow key={movement.id}>
                              <TableCell>
                                {movement.date ? format(new Date(movement.date), "dd MMM yyyy", { locale: fr }) : '-'}
                              </TableCell>
                              <TableCell>
                                <Badge className={
                                  movement.type === 'in' ? 'bg-emerald-100 text-emerald-700' :
                                  movement.type === 'out' ? 'bg-rose-100 text-rose-700' :
                                  'bg-slate-100 text-slate-700'
                                }>
                                  {movement.type === 'in' ? 'Entrée' : 'Sortie'}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">
                                {movement.quantity} {UNIT_LABELS[product.unit]}
                              </TableCell>
                              <TableCell>{movement.reference || '-'}</TableCell>
                              <TableCell>{movement.notes || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
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
                      <CardDescription>OF utilisant ce produit</CardDescription>
                    </div>
                    <Button size="sm" asChild>
                      <Link to="/manufacturing-orders">
                        <Eye className="w-4 h-4 mr-2" />
                        Voir tous les OF
                      </Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isLoadingManufacturingOrders ? (
                      <Skeleton className="h-64 rounded-lg" />
                    ) : manufacturingOrders.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-600">Aucun OF</h3>
                        <p className="text-slate-400 mt-1">Ce produit n'est utilisé dans aucun ordre de fabrication</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>N° OF</TableHead>
                            <TableHead>Commande</TableHead>
                            <TableHead>Quantité</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {manufacturingOrders.map((mo) => (
                            <TableRow key={mo.id}>
                              <TableCell className="font-mono font-bold">{mo.order_number}</TableCell>
                              <TableCell>
                                {mo.customer_order_code ? (
                                  <Link to={`/orders/${mo.customer_order_id}`} className="text-blue-600 hover:underline">
                                    {mo.customer_order_code}
                                  </Link>
                                ) : '-'}
                              </TableCell>
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
            </Tabs>
          </div>
        </div>

        {/* Product Form Modal */}
        <ProductForm 
          open={formOpen} 
          onOpenChange={setFormOpen} 
          product={product}
          onSave={(data) => {
            // Handle save logic here
            setFormOpen(false);
            toast.success('Produit mis à jour');
          }}
          allProducts={[]}
          customers={customers}
        />
      </div>
    </div>
  );
}
