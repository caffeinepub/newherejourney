import React from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { Loader2 } from 'lucide-react';
import LoginPage from '../pages/LoginPage';
import ProfileSetupModal from './ProfileSetupModal';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
}

export default function AuthGuard({ children, requireAdmin, requireSuperAdmin }: AuthGuardProps) {
  const { identity, isInitializing } = useInternetIdentity();
  const { isFetching: actorFetching } = useActor();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;

  // Show profile setup if: no profile yet, OR user has a role that doesn't meet the required level
  // Admin area allows: admin, superAdmin, pastor, volunteer (all church staff)
  // SuperAdmin area requires only: superAdmin
  const isChurchStaff = ['admin', 'superAdmin', 'pastor', 'volunteer'].includes(userProfile?.role ?? '');
  const hasSuperAdminRole = userProfile?.role === 'superAdmin';

  // Only consider "needs setup" when the actor is fully ready and the profile query has settled
  const needsSetup = isAuthenticated && !actorFetching && !profileLoading && isFetched && (
    userProfile === null ||
    (requireSuperAdmin && !hasSuperAdminRole) ||
    (requireAdmin && !isChurchStaff)
  );

  // Show spinner while: II is initializing, actor is fetching, or profile is loading
  if (isInitializing || (isAuthenticated && (actorFetching || profileLoading))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Show profile setup / role upgrade prompt before any access-denied block
  if (needsSetup) {
    return <ProfileSetupModal />;
  }

  return <>{children}</>;
}
