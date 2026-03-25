import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MoreVertical, Pencil, Trash2, FileSearch, Send, ShoppingCart, XCircle, Eye } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const STATUS_CONFIG = {
  draft:    { label: 'Brouillon', class: 'bg-slate-100 text-slate-700' },
  sent:     { label: 'Envoyé',    class: 'bg-blue-100 text-blue-700' },
  accepted: { label: 'Accepté',   class: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Refusé',    class: 'bg-rose-100 text-rose-700' },
  expired:  { label: 'Expiré',    class: 'bg-orange-100 text-orange-700' },
};

const QuoteList = ({ 
  quotes = [], 
  isLoading = false, 
  searchTerm = '', 
  onSearchChange = () => {},
  onEdit = () => {},
  onDelete = () => {},
  onSend = () => {},
  onConvertToOrder = () => {},
  onReject = () => {},
  showSearch = true,
  showActions = true
}) => {
  const filtered = quotes.filter(q =>
    q.quote_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <Skeleton className="h-96 rounded-xl" />;
  }

  if (filtered.length === 0 && quotes.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow-sm">
        <FileSearch className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-600">Aucun devis</h3>
        <p className="text-slate-400 mt-1">Créez votre premier devis</p>
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
              placeholder="Rechercher un devis..." 
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
              <TableHead className="font-semibold">N° Devis</TableHead>
              <TableHead className="font-semibold">Client</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Valide jusqu'au</TableHead>
              <TableHead className="font-semibold">Montant TTC</TableHead>
              <TableHead className="font-semibold">Statut</TableHead>
              {showActions && <TableHead className="w-12"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((quote) => {
              const statusConfig = STATUS_CONFIG[quote.status] || STATUS_CONFIG.draft;
              const quoteId = quote.id || quote._id;
              return (
                <TableRow key={quoteId} className="hover:bg-slate-50/50">
                  <TableCell>
                    <Link to={`/quotes/${quoteId}`} className="font-semibold text-blue-600 hover:text-blue-800 hover:underline">
                      {quote.quote_number}
                    </Link>
                  </TableCell>
                  <TableCell>{quote.customer_name}</TableCell>
                  <TableCell className="text-slate-500">
                    {quote.quote_date && format(new Date(quote.quote_date), "dd MMM yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {quote.valid_until && format(new Date(quote.valid_until), "dd MMM yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell className="font-semibold">{quote.total_ttc?.toFixed(2)} €</TableCell>
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
                            <Link to={`/quotes/${quoteId}`} className="flex items-center">
                              <Eye className="w-4 h-4 mr-2" /> Voir détails
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(quote)}>
                            <Pencil className="w-4 h-4 mr-2" /> Modifier
                          </DropdownMenuItem>
                          {quote.status === 'draft' && (
                            <DropdownMenuItem onClick={() => onSend(quote)}>
                              <Send className="w-4 h-4 mr-2" /> Envoyer
                            </DropdownMenuItem>
                          )}
                          {quote.status === 'sent' && (
                            <DropdownMenuItem onClick={() => onConvertToOrder(quote)}>
                              <ShoppingCart className="w-4 h-4 mr-2" /> Convertir en commande
                            </DropdownMenuItem>
                          )}
                          {quote.status === 'sent' && (
                            <DropdownMenuItem onClick={() => onReject(quote)}>
                              <XCircle className="w-4 h-4 mr-2" /> Marquer refusé
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => onDelete(quote)} 
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

export default QuoteList;