import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight } from "lucide-react";

const STATUS_CONFIG = {
  draft:       { label: 'Brouillon', class: 'bg-slate-100 text-slate-700' },
  planned:     { label: 'Planifié',  class: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'En cours',  class: 'bg-amber-100 text-amber-700' },
  completed:   { label: 'Terminé',   class: 'bg-emerald-100 text-emerald-700' },
  cancelled:   { label: 'Annulé',    class: 'bg-rose-100 text-rose-700' },
};

export default function RecentOrders({ orders }) {
  const recentOrders = orders.slice(0, 5);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold text-slate-800">Ordres de fabrication récents</CardTitle>
        <Link to={createPageUrl("ManufacturingOrders")} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
          Voir tout <ArrowRight className="w-4 h-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {recentOrders.length === 0 ? (
          <div className="py-8 text-center text-slate-400">Aucun ordre de fabrication</div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-900">{order.order_number}</span>
                    <Badge className={STATUS_CONFIG[order.status]?.class || 'bg-slate-100'}>
                      {STATUS_CONFIG[order.status]?.label || order.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500">{order.product_name}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-medium text-slate-700">{order.quantity_planned} unités</p>
                  {order.planned_start && (
                    <p className="text-xs text-slate-400">
                      {format(new Date(order.planned_start), "dd MMM yyyy", { locale: fr })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
