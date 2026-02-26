import { Outlet, useNavigate, useLocation } from '@tanstack/react-router';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Users, Map, Palette, UserCog, BarChart3,
  CreditCard, LogOut, Menu, X, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/guests', icon: Users, label: 'Guests' },
  { path: '/admin/journey-builder', icon: Map, label: 'Journey Builder' },
  { path: '/admin/branding', icon: Palette, label: 'Branding' },
  { path: '/admin/team', icon: UserCog, label: 'Team' },
  { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/admin/billing', icon: CreditCard, label: 'Billing' },
];

export default function AdminLayout() {
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
      <div className="min-h-screen bg-offWhite flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    );
  }

  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-offWhite flex">
      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-nearBlack flex flex-col z-30 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Logo */}
        <div className="p-5 border-b border-white/10">
          <img
            src="/assets/generated/newherejourney-logo.dim_320x80.png"
            alt="NewHereJourney"
            className="h-9 w-auto brightness-0 invert opacity-90"
          />
          <p className="text-white/40 text-xs mt-1">Admin Portal</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const isActive = currentPath === path;
            return (
              <button
                key={path}
                onClick={() => {
                  navigate({ to: path as '/admin/dashboard' });
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gold-500 text-nearBlack'
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

        {/* User */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-nearBlack text-xs font-bold">
                {profile?.name?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{profile?.name || 'Admin'}</p>
              <p className="text-white/40 text-xs truncate">{profile?.role}</p>
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

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white border-b border-gold-100 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-muted-foreground hover:text-nearBlack"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="font-semibold text-nearBlack">
              {NAV_ITEMS.find((n) => n.path === currentPath)?.label || 'Admin Portal'}
            </h2>
            {profile?.churchId && (
              <p className="text-xs text-muted-foreground">Church ID: {profile.churchId}</p>
            )}
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>

        <footer className="bg-white border-t border-gold-100 px-6 py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} NewHereJourney · Built with ❤️ using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'newherejourney')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold-600 hover:text-gold-500"
          >
            caffeine.ai
          </a>
        </footer>
      </div>
    </div>
  );
}
