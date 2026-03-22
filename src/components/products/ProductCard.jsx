import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, Package, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_CONFIG = {
  matiere_premiere: { label: 'Matière première', class: 'bg-amber-100 text-amber-700' },
  semi_fini:        { label: 'Semi-fini',         class: 'bg-blue-100 text-blue-700' },
  produit_fini:     { label: 'Produit fini',       class: 'bg-emerald-100 text-emerald-700' },
};

const UNIT_LABELS = { piece: 'pcs', kg: 'kg', litre: 'L', metre: 'm' };

export default function ProductCard({ product, onEdit, onDelete }) {
  const isLowStock = product.stock_quantity !== undefined &&
    product.stock_minimum !== undefined &&
    product.stock_quantity <= product.stock_minimum;

  const catConfig = CATEGORY_CONFIG[product.category] || CATEGORY_CONFIG.produit_fini;

  return (
    <Card className="group relative overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white">
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(product)}>
              <Pencil className="w-4 h-4 mr-2" /> Modifier
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(product)} className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" /> Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-100 shrink-0">
            <Package className="w-6 h-6 text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={catConfig.class}>{catConfig.label}</Badge>
              {isLowStock && (
                <Badge className="bg-red-100 text-red-700">
                  <AlertTriangle className="w-3 h-3 mr-1" /> Stock bas
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-slate-900 truncate">{product.name}</h3>
            <p className="text-sm text-slate-500">{product.reference}</p>
            {product.customer_code && (
              <p className="text-xs text-slate-400 mt-0.5">Client: {product.customer_code}</p>
            )}
          </div>
        </div>

        {product.description && (
          <p className="mt-4 text-sm text-slate-500 line-clamp-2">{product.description}</p>
        )}

        <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Stock</p>
            <p className={cn("font-semibold mt-1", isLowStock ? "text-red-600" : "text-slate-900")}>
              {product.stock_quantity || 0} {UNIT_LABELS[product.unit]}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Coût</p>
            <p className="font-semibold text-slate-900 mt-1">{(product.cost_price || 0).toFixed(2)} €</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Vente</p>
            <p className="font-semibold text-slate-900 mt-1">{(product.sell_price || 0).toFixed(2)} €</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
