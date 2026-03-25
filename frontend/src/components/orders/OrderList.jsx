import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MoreVertical, Pencil, Trash2, ShoppingCart, Cog, CheckCircle, Play, Truck, XCircle, Eye } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const STATUS_CONFIG = {
  draft:         { label: 'Brouillon',     class: 'bg-slate-100 text-slate-700' },
  confirmed:     { label: 'Confirmée',     class: 'bg-blue-100 text-blue-700' },
  in_production: { label: 'En production', class: 'bg-amber-100 text-amber-700' },
  ready:         { label: 'Prête',         class: 'bg-purple-100 text-purple-700' },
  delivered:     { label: 'Livrée',        class: 'bg-emerald-100 text-emerald-700' },
  cancelled:     { label: 'Annulée',       class: 'bg-rose-100 text-rose-700' },
};

const OrderList = ({ 
  orders = [], 
  isLoading = false, 
  searchTerm = '', 
  onSearchChange = () => {},
  onEdit = () => {},
  onDelete = () => {},
  onConfirm = () => {},
  onMarkInProduction = () => {},
  onMarkReady = () => {},
  onMarkDelivered = () => {},
  onCancel = () => {},
  showSearch = true,
  showActions = true
}) => {
  const filtered = orders.filter(o =>
    o.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <Skeleton className="h-96 rounded-xl" />;
  }

  if (filtered.length === 0 && orders.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow-sm">
        <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-600">Aucune commande</h3>
        <p className="text-slate-400 mt-1">Créez votre première commande client</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showSearch && (
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Rechercher une commande..." 
              value={searchTerm} 
              onChange={(e) => onSearchChange(e.target.value)} 
              className="pl-10 bg-white" 
            />
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold">N° Commande</TableHead>
              <TableHead className="font-semibold">Client</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Livraison</TableHead>
              <TableHead className="font-semibold">Montant TTC</TableHead>
              <TableHead className="font-semibold">Statut</TableHead>
              {showActions && <TableHead className="w-12"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((order) => {
              const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.draft;
              const orderId = order.id || order._id;
              return (
                <TableRow key={orderId} className="hover:bg-slate-50/50">
                  <TableCell>
                    <Link to={`/orders/${orderId}`} className="font-semibold text-blue-600 hover:text-blue-800 hover:underline">
                      {order.order_number}
                    </Link>
                  </TableCell>
                  <TableCell>{order.customer_name}</TableCell>
                  <TableCell className="text-slate-500">
                    {order.order_date && format(new Date(order.order_date), "dd MMM yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {order.delivery_date_requested 
                      ? format(new Date(order.delivery_date_requested), "dd MMM yyyy", { locale: fr }) 
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="font-semibold">{order.total_ttc?.toFixed(2)} €</TableCell>
                  <TableCell>
                    <Badge className={statusConfig.class}>
                      {statusConfig.label}
                    </Badge>
                  </TableCell>
                  {showActions && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/orders/${orderId}`} className="flex items-center">
                              <Eye className="w-4 h-4 mr-2" /> Voir détails
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(order)}>
                            <Pencil className="w-4 h-4 mr-2" /> Modifier
                          </DropdownMenuItem>
                          
                          {order.status === 'draft' && (
                            <DropdownMenuItem onClick={() => onConfirm(order)}>
                              <CheckCircle className="w-4 h-4 mr-2" /> Confirmer
                            </DropdownMenuItem>
                          )}
                          
                          {order.status === 'confirmed' && (
                            <DropdownMenuItem onClick={() => onMarkInProduction(order)}>
                              <Play className="w-4 h-4 mr-2" /> Marquer en production
                            </DropdownMenuItem>
                          )}
                          
                          {order.status === 'in_production' && (
                            <DropdownMenuItem onClick={() => onMarkReady(order)}>
                              <CheckCircle className="w-4 h-4 mr-2" /> Marquer prête
                            </DropdownMenuItem>
                          )}
                          
                          {order.status === 'ready' && (
                            <DropdownMenuItem onClick={() => onMarkDelivered(order)}>
                              <Truck className="w-4 h-4 mr-2" /> Marquer livrée
                            </DropdownMenuItem>
                          )}
                          
                          {order.status === 'confirmed' && (
                            <DropdownMenuItem asChild>
                              <Link to={createPageUrl("ManufacturingOrders")}>
                                <Cog className="w-4 h-4 mr-2" /> Voir les OF
                              </Link>
                            </DropdownMenuItem>
                          )}
                          
                          {order.status !== 'cancelled' && order.status !== 'delivered' && (
                            <DropdownMenuItem onClick={() => onCancel(order)}>
                              <XCircle className="w-4 h-4 mr-2" /> Annuler
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem 
                            onClick={() => onDelete(order)} 
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default OrderList;