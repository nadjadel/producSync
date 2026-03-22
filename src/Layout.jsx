import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Package, 
  ClipboardList, 
  Settings, 
  Boxes,
  Menu,
  X,
  Factory,
  Users,
  ShoppingCart,
  Truck,
  FileText,
  Building2,
  LogOut,
  UserCog
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Tableau de bord', page: 'Dashboard', icon: LayoutDashboard },
  { name: 'Clients', page: 'Customers', icon: Users },
  { name: 'Commandes', page: 'Orders', icon: ShoppingCart },
  { name: 'Produits', page: 'Products', icon: Package },
  { name: 'Ordres de fabrication', page: 'ManufacturingOrders', icon: ClipboardList },
  { name: 'Postes de travail', page: 'Workstations', icon: Settings },
  { name: 'Stocks', page: 'Stock', icon: Boxes },
  { name: 'Bons de livraison', page: 'DeliveryNotes', icon: Truck },
  { name: 'Factures', page: 'Invoices', icon: FileText },
  { name: 'Fournisseurs', page: 'Suppliers', icon: Building2 },
  { name: 'Utilisateurs', page: 'Users', icon: UserCog },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100">
            <Link to={createPageUrl('Dashboard')} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                <Factory className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900 tracking-tight">GPAO</span>
                <p className="text-xs text-slate-400">Production Manager</p>
              </div>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" 
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 space-y-2">
            {currentUser && (
              <div className="px-3 py-2 rounded-xl bg-slate-50 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {currentUser.full_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate">{currentUser.full_name}</p>
                  <p className="text-xs text-slate-400 truncate">{currentUser.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-sm"
              onClick={() => base44.auth.logout()}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
            <div className="px-4 py-2">
              <p className="text-xs text-slate-400">© 2024 GPAO System</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center h-16 px-4 bg-white/80 backdrop-blur-sm border-b border-slate-100 lg:hidden">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 ml-4">
            <Factory className="w-5 h-5 text-slate-900" />
            <span className="font-bold text-slate-900">GPAO</span>
          </div>
        </header>

        {/* Page content */}
        <main>
          {children}
        </main>
      </div>
    </div>
  );
}