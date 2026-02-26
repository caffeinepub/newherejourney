import { Outlet, useNavigate, useLocation } from '@tanstack/react-router';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../../hooks/useQueries';
import { Map, Heart, User, Loader2 } from 'lucide-react';
import { useEffect } from 'react';

export default function GuestLayout() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: profile, isLoading } = useGetCallerUserProfile();

  useEffect(() => {
    if (!identity && !isLoading) {
      navigate({ to: '/' });
    }
  }, [identity, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-offWhite flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    );
  }

  const navItems = [
    { path: '/guest/journey', icon: Map, label: 'Journey' },
    { path: '/guest/decisions', icon: Heart, label: 'Decisions' },
    { path: '/guest/profile', icon: User, label: 'Profile' },
  ];

  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-offWhite flex flex-col max-w-md mx-auto">
      {/* Top bar */}
      <header className="bg-white border-b border-gold-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <img
          src="/assets/generated/newherejourney-logo.dim_320x80.png"
          alt="NewHereJourney"
          className="h-8 w-auto"
        />
        {profile && (
          <span className="text-sm text-muted-foreground font-medium">
            Hi, {profile.name.split(' ')[0]}!
          </span>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gold-100 flex z-10">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = currentPath === path || currentPath.startsWith(path + '/');
          return (
            <button
              key={path}
              onClick={() => navigate({ to: path as '/guest/journey' | '/guest/decisions' | '/guest/profile' })}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                isActive ? 'text-gold-600' : 'text-muted-foreground hover:text-gold-500'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-gold-500' : ''}`} />
              <span className="text-xs font-medium">{label}</span>
              {isActive && <div className="absolute bottom-0 w-8 h-0.5 bg-gold-500 rounded-full" />}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
