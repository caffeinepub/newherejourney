import React from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Loader2, LogIn, UserPlus } from 'lucide-react';

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();
  const navigate = useNavigate();
  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md px-4">
        <img src="/assets/generated/newherejourney-logo.dim_320x80.png" alt="NewHere Journey" className="h-16 object-contain mx-auto" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Portal</h1>
          <p className="text-muted-foreground mt-2">Sign in to manage your church's guest journey</p>
        </div>
        <div className="flex flex-col gap-3 items-center">
          <Button size="lg" onClick={login} disabled={isLoggingIn} className="w-full max-w-xs">
            {isLoggingIn ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Signing in...</>
            ) : (
              <><LogIn className="h-4 w-4 mr-2" />Sign In</>
            )}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full max-w-xs"
            onClick={() => navigate({ to: '/admin/signup' })}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Create Admin Account
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">New to NewHere Journey? Create an account to get your church set up in minutes.</p>
      </div>
    </div>
  );
}
