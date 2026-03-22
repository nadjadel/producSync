import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function KPICard({ title, value, subtitle, icon: Icon, trend, trendValue, color = "blue" }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    orange: "bg-amber-50 text-amber-600",
    purple: "bg-violet-50 text-violet-600",
    red: "bg-rose-50 text-rose-600",
  };

  return (
    <Card className="relative overflow-hidden border-0 bg-white shadow-sm hover:shadow-md transition-all duration-300">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-500 tracking-wide uppercase">{title}</p>
            <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
            {trend && trendValue && (
              <div className={cn(
                "inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                trend === "up" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
              )}>
                {trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {trendValue}
              </div>
            )}
          </div>
          {Icon && (
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colorClasses[color])}>
              <Icon className="w-6 h-6" />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
