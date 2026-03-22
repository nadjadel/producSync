import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Package, ClipboardList, Factory, TrendingUp } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import KPICard from '@/components/dashboard/KPICard';
import OrderStatusChart from '@/components/dashboard/OrderStatusChart';
import RecentOrders from '@/components/dashboard/RecentOrders';
import StockAlerts from '@/components/dashboard/StockAlerts';
import WorkstationStatus from '@/components/dashboard/WorkstationStatus';

export default function Dashboard() {
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });
  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['manufacturing-orders'],
    queryFn: () => base44.entities.ManufacturingOrder.list('-created_at'),
  });
  const { data: workstations = [], isLoading: loadingWorkstations } = useQuery({
    queryKey: ['workstations'],
    queryFn: () => base44.entities.Workstation.list(),
  });

  const isLoading = loadingProducts || loadingOrders || loadingWorkstations;

  const stats = {
    totalProducts: products.length,
    totalOrders: orders.length,
    ordersInProgress: orders.filter(o => o.status === 'in_progress').length,
    completedToday: orders.filter(o => {
      if (!o.actual_end) return false;
      return new Date(o.actual_end).toDateString() === new Date().toDateString();
    }).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tableau de bord</h1>
          <p className="text-slate-500 mt-1">Vue d'ensemble de votre production</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isLoading ? (
            [1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)
          ) : (
            <>
              <KPICard title="Produits" value={stats.totalProducts} icon={Package} color="blue" />
              <KPICard title="Ordres de fabrication" value={stats.totalOrders} icon={ClipboardList} color="purple" />
              <KPICard title="En production" value={stats.ordersInProgress} icon={Factory} color="orange" />
              <KPICard title="Terminés aujourd'hui" value={stats.completedToday} icon={TrendingUp} color="green" />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RecentOrders orders={orders} />
            <OrderStatusChart orders={orders} />
          </div>
          <div className="space-y-6">
            <StockAlerts products={products} />
            <WorkstationStatus workstations={workstations} />
          </div>
        </div>
      </div>
    </div>
  );
}
