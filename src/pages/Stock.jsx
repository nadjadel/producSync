import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, ArrowDownCircle, ArrowUpCircle, RotateCcw, Factory, Package, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

const MOVEMENT_TYPES = {
  in:         { label: 'Entrée',     icon: ArrowDownCircle, class: 'text-emerald-600 bg-emerald-50' },
  out:        { label: 'Sortie',     icon: ArrowUpCircle,   class: 'text-rose-600 bg-rose-50' },
  adjustment: { label: 'Ajustement', icon: RotateCcw,       class: 'text-blue-600 bg-blue-50' },
  production: { label: 'Production', icon: Factory,         class: 'text-purple-600 bg-purple-50' },
};

export default function Stock() {
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [movementForm, setMovementForm] = useState({ movement_type: 'in', quantity: 0, reference: '', notes: '' });
  const queryClient = useQueryClient();

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });
  const { data: movements = [], isLoading: loadingMovements } = useQuery({
    queryKey: ['stock-movements'],
    queryFn: () => base44.entities.StockMovement.list('-created_at'),
  });

  const createMovementMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.StockMovement.create(data);
      const product = products.find(p => p.id === data.product_id);
      if (product) {
        let newStock = product.stock_quantity || 0;
        if (data.movement_type === 'in' || data.movement_type === 'production') newStock += data.quantity;
        else if (data.movement_type === 'out') newStock -= data.quantity;
        else if (data.movement_type === 'adjustment') newStock = data.quantity;
        await base44.entities.Product.update(product.id, { stock_quantity: Math.max(0, newStock) });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Mouvement enregistré');
      setFormOpen(false);
      setSelectedProduct(null);
      setMovementForm({ movement_type: 'in', quantity: 0, reference: '', notes: '' });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    createMovementMutation.mutate({ product_id: selectedProduct.id, product_name: selectedProduct.name, ...movementForm });
  };

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockProducts = products.filter(p =>
    p.stock_quantity !== undefined && p.stock_minimum !== undefined && p.stock_quantity <= p.stock_minimum
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestion des stocks</h1>
            <p className="text-slate-500 mt-1">Suivez vos niveaux de stock et mouvements</p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="bg-slate-900 hover:bg-slate-800">
            <Plus className="w-4 h-4 mr-2" /> Nouveau mouvement
          </Button>
        </div>

        {lowStockProducts.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-2 text-amber-700 font-medium mb-2">
              <AlertTriangle className="w-5 h-5" />
              {lowStockProducts.length} produit(s) en stock bas
            </div>
            <div className="flex flex-wrap gap-2">
              {lowStockProducts.map(p => (
                <Badge key={p.id} className="bg-amber-100 text-amber-800">
                  {p.name}: {p.stock_quantity} (min: {p.stock_minimum})
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Tabs defaultValue="stock" className="space-y-6">
          <TabsList className="bg-white shadow-sm border-0">
            <TabsTrigger value="stock">État des stocks</TabsTrigger>
            <TabsTrigger value="movements">Mouvements</TabsTrigger>
          </TabsList>

          <TabsContent value="stock">
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Rechercher un produit..." value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-white" />
              </div>
            </div>
            {loadingProducts ? <Skeleton className="h-96 rounded-xl" /> : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-semibold">Référence</TableHead>
                      <TableHead className="font-semibold">Produit</TableHead>
                      <TableHead className="font-semibold">Catégorie</TableHead>
                      <TableHead className="font-semibold text-right">Stock actuel</TableHead>
                      <TableHead className="font-semibold text-right">Stock min.</TableHead>
                      <TableHead className="font-semibold">Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400">Aucun produit trouvé</TableCell></TableRow>
                    ) : filteredProducts.map((product) => {
                      const isLow = product.stock_quantity !== undefined && product.stock_minimum !== undefined && product.stock_quantity <= product.stock_minimum;
                      return (
                        <TableRow key={product.id} className="hover:bg-slate-50/50">
                          <TableCell className="font-medium text-slate-600">{product.reference}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-slate-400" />
                              <span className="font-medium">{product.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-500 capitalize">{product.category?.replace('_', ' ')}</TableCell>
                          <TableCell className={cn("text-right font-semibold", isLow ? "text-red-600" : "text-slate-900")}>
                            {product.stock_quantity || 0}
                          </TableCell>
                          <TableCell className="text-right text-slate-500">{product.stock_minimum || 0}</TableCell>
                          <TableCell>
                            {isLow
                              ? <Badge className="bg-red-100 text-red-700">Stock bas</Badge>
                              : <Badge className="bg-emerald-100 text-emerald-700">OK</Badge>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="movements">
            {loadingMovements ? <Skeleton className="h-96 rounded-xl" /> : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead className="font-semibold">Produit</TableHead>
                      <TableHead className="font-semibold text-right">Quantité</TableHead>
                      <TableHead className="font-semibold">Référence</TableHead>
                      <TableHead className="font-semibold">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400">Aucun mouvement enregistré</TableCell></TableRow>
                    ) : movements.map((mov) => {
                      const typeConfig = MOVEMENT_TYPES[mov.movement_type] || MOVEMENT_TYPES.adjustment;
                      const Icon = typeConfig.icon;
                      return (
                        <TableRow key={mov.id} className="hover:bg-slate-50/50">
                          <TableCell className="text-slate-500">
                            {mov.created_at && format(new Date(mov.created_at), "dd MMM yyyy HH:mm", { locale: fr })}
                          </TableCell>
                          <TableCell>
                            <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-sm", typeConfig.class)}>
                              <Icon className="w-3.5 h-3.5" />{typeConfig.label}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{mov.product_name}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {mov.movement_type === 'out' ? '-' : '+'}{mov.quantity}
                          </TableCell>
                          <TableCell className="text-slate-500">{mov.reference || '-'}</TableCell>
                          <TableCell className="text-slate-500 max-w-xs truncate">{mov.notes || '-'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Mouvement Dialog */}
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Nouveau mouvement de stock</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Produit *</Label>
                <Select value={selectedProduct?.id || ''} onValueChange={(v) => setSelectedProduct(products.find(p => p.id === v))}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un produit" /></SelectTrigger>
                  <SelectContent>
                    {products.map(p => <SelectItem key={p.id} value={p.id}>{p.reference} — {p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type de mouvement</Label>
                  <Select value={movementForm.movement_type} onValueChange={(v) => setMovementForm(prev => ({ ...prev, movement_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">Entrée</SelectItem>
                      <SelectItem value="out">Sortie</SelectItem>
                      <SelectItem value="adjustment">Ajustement (nouvelle valeur)</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quantité *</Label>
                  <Input type="number" min="0" value={movementForm.quantity}
                    onChange={(e) => setMovementForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Référence (BL, OF…)</Label>
                <Input value={movementForm.reference} onChange={(e) => setMovementForm(prev => ({ ...prev, reference: e.target.value }))} placeholder="Ex: BL00000001" />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={movementForm.notes} onChange={(e) => setMovementForm(prev => ({ ...prev, notes: e.target.value }))} rows={2} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Annuler</Button>
                <Button type="submit" className="bg-slate-900 hover:bg-slate-800" disabled={!selectedProduct}>Enregistrer</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
