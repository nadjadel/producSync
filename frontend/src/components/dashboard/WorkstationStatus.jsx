import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, CheckCircle, Loader2, Wrench, XCircle } from "lucide-react";

const STATUS_CONFIG = {
  available:   { label: 'Disponible', class: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, iconClass: 'text-emerald-500' },
  busy:        { label: 'Occupé',     class: 'bg-amber-100 text-amber-700',     icon: Loader2,     iconClass: 'text-amber-500' },
  maintenance: { label: 'Maintenance',class: 'bg-blue-100 text-blue-700',       icon: Wrench,      iconClass: 'text-blue-500' },
  offline:     { label: 'Hors ligne', class: 'bg-slate-100 text-slate-700',     icon: XCircle,     iconClass: 'text-slate-500' },
};

export default function WorkstationStatus({ workstations }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-500" />
          Postes de travail
        </CardTitle>
      </CardHeader>
      <CardContent>
        {workstations.length === 0 ? (
          <div className="py-6 text-center text-slate-400">Aucun poste configuré</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {workstations.map((ws) => {
              const config = STATUS_CONFIG[ws.status] || STATUS_CONFIG.offline;
              const Icon = config.icon;
              return (
                <div key={ws.id} className="p-4 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <Icon className={`w-5 h-5 ${config.iconClass}`} />
                    <Badge className={config.class}>{config.label}</Badge>
                  </div>
                  <p className="font-semibold text-slate-800">{ws.name}</p>
                  <p className="text-xs text-slate-400">{ws.code}</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
