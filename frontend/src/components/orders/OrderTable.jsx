import React from 'react';
import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, Play, CheckCircle, XCircle, ArrowRightLeft, Eye } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const STATUS_CONFIG = {
  draft: { label: 'Brouillon', class: 'bg-slate-100 text-slate-700' },
  planned: { label: 'Planifié', class: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'En cours', class: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Terminé', class: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Annulé', class: 'bg-rose-100 text-rose-700' }
};

const PRIORITY_CONFIG = {
  low: { label: 'Basse', class: 'text-slate-500' },
  medium: { label: 'Moyenne', class: 'text-blue-500' },
  high: { label: 'Haute', class: 'text-orange-500' },
  urgent: { label: 'Urgente', class: 'text-red-500 font-semibold' }
};

export default function OrderTable({ orders, onEdit, onDelete, onStatusChange }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border-0 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="font-semibold">N° Ordre</TableHead>
            <TableHead className="font-semibold">Produit</TableHead>
            <TableHead className="font-semibold">Quantité</TableHead>
            <TableHead className="font-semibold">Statut</TableHead>
            <TableHead className="font-semibold">Priorité</TableHead>
            <TableHead className="font-semibold">Poste</TableHead>
            <TableHead className="font-semibold">Date début</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                Aucun ordre de fabrication
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => {
              const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.draft;
              const priorityConfig = PRIORITY_CONFIG[order.priority] || PRIORITY_CONFIG.medium;
              
              return (
                <TableRow key={order.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/manufacturing-orders/${order.id || order._id}`}
                        className="hover:text-blue-600 hover:underline"
                      >
                        {order.order_number}
                      </Link>
                      {order.is_subcontracted && (
                        <span title={`Sous-traitance: ${order.supplier_name || '?'}`}>
                          <ArrowRightLeft className="w-3.5 h-3.5 text-amber-500" />
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-800">{order.product_name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{order.quantity_produced || 0}</span>
                    <span className="text-slate-400"> / {order.quantity_planned}</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusConfig.class}>{statusConfig.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className={priorityConfig.class}>{priorityConfig.label}</span>
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {order.is_subcontracted
                      ? <span className="text-amber-600 font-medium text-xs">🏭 {order.supplier_name || 'ST'}</span>
                      : (order.workstation_name || '-')
                    }
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {order.planned_start 
                      ? format(new Date(order.planned_start), "dd MMM yyyy", { locale: fr })
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/manufacturing-orders/${order.id || order._id}`} className="flex items-center">
                            <Eye className="w-4 h-4 mr-2" /> Voir détails
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(order)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        {order.status === 'planned' && (
                          <DropdownMenuItem onClick={() => onStatusChange(order, 'in_progress')}>
                            <Play className="w-4 h-4 mr-2" />
                            Démarrer
                          </DropdownMenuItem>
                        )}
                        {order.status === 'in_progress' && (
                          <DropdownMenuItem onClick={() => onStatusChange(order, 'completed')}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Terminer
                          </DropdownMenuItem>
                        )}
                        {order.status === 'completed' && !order.ready_for_delivery && (
                          <DropdownMenuItem onClick={() => onStatusChange(order, 'ready_for_delivery')}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Prêt pour livraison
                          </DropdownMenuItem>
                        )}
                        {order.status !== 'completed' && order.status !== 'cancelled' && (
                          <DropdownMenuItem onClick={() => onStatusChange(order, 'cancelled')}>
                            <XCircle className="w-4 h-4 mr-2" />
                            Annuler
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onDelete(order)} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}