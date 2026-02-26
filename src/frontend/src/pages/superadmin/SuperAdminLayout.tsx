import { Outlet, useNavigate, useLocation } from '@tanstack/react-router';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  Building2, BarChart3, BookOpen, Flag, CreditCard,
  LogOut, Menu, ChevronRight, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
  { path: '/superadmin/churches', icon: Building2, label: 'Churches' },
  { path: '/superadmin/analytics', icon: BarChart3, label: 'Global Analytics' },
  { path: '/superadmin/templates', icon: BookOpen, label: 'Templates' },
  { path: '/superadmin/feature-flags', icon: Flag, label: 'Feature Flags' },
  { path: '/superadmin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
] as const;

type SuperAdminPath = typeof NAV_ITEMS[number]['path'];

export default function SuperAdminLayout() {
  const { identity, clear } = useInternetIdentity();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useGetCallerUserProfile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!identity && !isLoading) {
      navigate({ to: '/' });
    }
  }, [identity, isLoading, navigate]);

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: '/' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`fixed top-0 left-0 h-full w-64 flex flex-col z-30 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`} style={{ background: 'oklch(0.10 0.01 30)' }}>
        <div className="p-5 border-b border-white/10">
          <img
            src="/assets/generated/newherejourney-logo.dim_320x80.png"
            alt="NewHereJourney"
            className="h-9 w-auto brightness-0 invert opacity-90"
          />
          <div className="mt-2 inline-flex items-center gap-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-full px-2.5 py-0.5">
            <span className="text-yellow-400 text-xs font-semibold">SuperAdmin</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const isActive = currentPath === path;
            return (
              <button
                key={path}
                onClick={() => {
                  navigate({ to: path });
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
                {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground text-xs font-bold">
                {profile?.name?.charAt(0)?.toUpperCase() || 'S'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{profile?.name || 'SuperAdmin'}</p>
              <p className="text-white/40 text-xs">Super Administrator</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full text-white/60 hover:text-white hover:bg-white/10 justify-start"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="bg-card border-b border-border px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="font-semibold text-foreground">
              {NAV_ITEMS.find((n) => n.path === currentPath)?.label || 'SuperAdmin'}
            </h2>
            <p className="text-xs text-muted-foreground">Platform Administration</p>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>

        <footer className="bg-card border-t border-border px-6 py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} NewHereJourney · Built with ❤️ using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'newherejourney')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </footer>
      </div>
    </div>
  );
}
