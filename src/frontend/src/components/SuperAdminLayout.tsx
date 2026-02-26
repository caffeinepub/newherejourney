import React from 'react';
import { Outlet, useNavigate, useLocation } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Building2, LayoutTemplate, Flag, CreditCard, BarChart3, LogOut, Menu, X, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/superadmin/churches', label: 'Churches', icon: Building2 },
  { path: '/superadmin/templates', label: 'Templates', icon: LayoutTemplate },
  { path: '/superadmin/feature-flags', label: 'Feature Flags', icon: Flag },
  { path: '/superadmin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { path: '/superadmin/analytics', label: 'Global Analytics', icon: BarChart3 },
] as const;

export default function SuperAdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: '/' });
  };

  return (
    <div className="min-h-screen flex bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={cn(
        'fixed inset-y-0 left-0 z-30 w-64 bg-card border-r border-border flex flex-col transition-transform duration-200',
        'lg:relative lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <img src="/assets/generated/newherejourney-logo.dim_320x80.png" alt="NewHere Journey" className="h-8 object-contain" />
            <p className="text-xs text-muted-foreground mt-1">SuperAdmin Panel</p>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate({ to: item.path });
                  setSidebarOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
          <button
            onClick={() => {
              navigate({ to: '/admin/dashboard' });
              setSidebarOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            Admin Portal
          </button>
        </nav>

        <div className="p-4 border-t border-border">
          <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center px-4 gap-4 bg-card">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-sm font-medium text-muted-foreground">SuperAdmin Dashboard</h1>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
