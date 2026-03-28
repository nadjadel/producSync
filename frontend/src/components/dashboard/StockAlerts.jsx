import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertTriangle, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function StockAlerts({ products = [] }) {
  const lowStockProducts = products.filter(
    p => p.stock_quantity != null && p.stock_minimum != null && p.stock_quantity <= p.stock_minimum
  );

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Alertes stock
        </CardTitle>
      </CardHeader>
      <CardContent>
        {lowStockProducts.length === 0 ? (
          <div className="py-6 text-center text-slate-400 flex flex-col items-center gap-2">
            <Package className="w-8 h-8" />
            <p>Tous les stocks sont suffisants</p>
          </div>
        ) : (
          <div className="space-y-2">
            {lowStockProducts.slice(0, 5).map((product) => (
              <Link key={product.id || product._id} to={createPageUrl("Products")}
                className="flex items-center justify-between p-3 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors">
                <div>
                  <p className="font-medium text-slate-800">{product.name}</p>
                  <p className="text-xs text-slate-500">{product.reference}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-amber-600">{product.stock_quantity}</p>
                  <p className="text-xs text-slate-400">min: {product.stock_minimum}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
