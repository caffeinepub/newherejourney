import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { Role } from '../backend';
import { Loader2 } from 'lucide-react';

export default function RoleBasedRouter() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: profile, isLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/' });
      return;
    }

    if (!isLoading && isFetched) {
      if (!profile) {
        // No profile yet — send to signup to complete setup
        navigate({ to: '/admin/signup' });
        return;
      }

      // Route based on role
      switch (profile.role) {
        case Role.superAdmin:
          navigate({ to: '/superadmin/churches' });
          break;
        case Role.admin:
        case Role.pastor:
          navigate({ to: '/admin/dashboard' });
          break;
        case Role.volunteer:
          // Volunteers have limited access — send to admin dashboard
          // (they can see it but with limited actions)
          navigate({ to: '/admin/dashboard' });
          break;
        default:
          navigate({ to: '/guest/journey' });
          break;
      }
    }
  }, [isAuthenticated, isLoading, isFetched, profile, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <p className="text-muted-foreground font-medium">Loading your journey...</p>
      </div>
    </div>
  );
}
