import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useSaveCallerUserProfile, useCreateChurch } from '../hooks/useQueries';
import { Role } from '../backend';
import { generateId } from '../lib/guestSession';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  LogIn,
  Church,
  User,
  CheckCircle2,
  ArrowRight,
  Users,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

const SUPER_ADMIN_EMAIL = 'erskinecurrie3@gmail.com';

type OnboardingTab = 'create' | 'join';

type StepState =
  | { step: 1 }
  | { step: 2 }
  | { step: 3; churchName: string; isNew: boolean };

// ── Step Indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const active = n === current;
        const done = n < current;
        return (
          <React.Fragment key={n}>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all duration-300
                ${done ? 'bg-primary text-primary-foreground' : active ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : 'bg-muted text-muted-foreground'}`}
            >
              {done ? <CheckCircle2 className="h-4 w-4" /> : n}
            </div>
            {n < total && (
              <div className={`h-0.5 w-8 transition-all duration-300 ${done ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </React.Fragment>
        );
      })}
      <span className="ml-3 text-sm text-muted-foreground font-medium">
        Step {current} of {total}
      </span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminSignupPage() {
  const navigate = useNavigate();
  const { identity, login, loginStatus } = useInternetIdentity();
  const saveProfile = useSaveCallerUserProfile();
  const createChurch = useCreateChurch();

  const [stepState, setStepState] = useState<StepState>({ step: 1 });
  const [tab, setTab] = useState<OnboardingTab>('create');

  // Step 1 fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Step 2 — Create
  const [churchName, setChurchName] = useState('');
  const [subdomain, setSubdomain] = useState('');

  // Step 2 — Join
  const [existingChurchId, setExistingChurchId] = useState('');

  const isLoggingIn = loginStatus === 'logging-in';
  const isMutating = saveProfile.isPending || createChurch.isPending;

  // ── Step 1: Personal Info ──────────────────────────────────────────────────

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    setStepState({ step: 2 });
  };

  // ── Step 2: Church setup ───────────────────────────────────────────────────

  const handleCreateChurch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchName.trim() || !subdomain.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      const churchId = generateId();
      const church = await createChurch.mutateAsync({
        id: churchId,
        name: churchName,
        subdomain: subdomain.toLowerCase().replace(/\s+/g, '-'),
      });

      const isSuperAdmin = email.trim().toLowerCase() === SUPER_ADMIN_EMAIL;
      await saveProfile.mutateAsync({
        name,
        email,
        churchId: church.id,
        role: isSuperAdmin ? Role.superAdmin : Role.admin,
      });

      setStepState({ step: 3, churchName: church.name, isNew: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create church';
      toast.error(message);
    }
  };

  const handleJoinChurch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingChurchId.trim()) {
      toast.error('Please enter the Church ID');
      return;
    }
    try {
      const isSuperAdmin = email.trim().toLowerCase() === SUPER_ADMIN_EMAIL;
      await saveProfile.mutateAsync({
        name,
        email,
        churchId: existingChurchId,
        role: isSuperAdmin ? Role.superAdmin : Role.volunteer,
      });
      setStepState({ step: 3, churchName: existingChurchId, isNew: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to join church';
      toast.error(message);
    }
  };

  // ── Step 3: Go to dashboard ────────────────────────────────────────────────

  const goToDashboard = () => {
    const isSuperAdmin = email.trim().toLowerCase() === SUPER_ADMIN_EMAIL;
    if (isSuperAdmin) {
      navigate({ to: '/superadmin/churches' });
    } else {
      navigate({ to: '/admin/dashboard' });
    }
  };

  // ── Not logged in ──────────────────────────────────────────────────────────

  if (!identity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center pb-4">
            <img
              src="/assets/generated/newherejourney-logo.dim_320x80.png"
              alt="NewHere Journey"
              className="h-12 object-contain mx-auto mb-4"
            />
            <CardTitle className="text-2xl font-bold">Create Admin Account</CardTitle>
            <CardDescription>
              Sign in first to create your admin account and set up your church.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 border border-border p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Sign in with Internet Identity</p>
                  <p className="text-xs text-muted-foreground mt-0.5">No password needed — uses your device's secure authentication</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Church className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Set up your church</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Create a new church or join an existing one as staff</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Start welcoming guests</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Manage newcomer journeys from day one</p>
                </div>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={login}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Signing in...</>
              ) : (
                <><LogIn className="h-4 w-4 mr-2" />Sign In to Continue</>
              )}
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => navigate({ to: '/admin/dashboard' })}
            >
              Already have an account? Go to dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Logged in — Onboarding steps ───────────────────────────────────────────

  const currentStep = stepState.step;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <img
            src="/assets/generated/newherejourney-logo.dim_320x80.png"
            alt="NewHere Journey"
            className="h-12 object-contain mx-auto"
          />
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold">
              {currentStep === 1 && 'Create Admin Account'}
              {currentStep === 2 && 'Set Up Your Church'}
              {currentStep === 3 && "You're All Set!"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Tell us about yourself so we can personalize your experience."}
              {currentStep === 2 && (tab === 'create' ? "Create a new church account to get started." : "Join an existing church as a staff member.")}
              {currentStep === 3 && "Your account is ready. Let's start welcoming guests!"}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            <StepIndicator current={currentStep} total={3} />

            {/* ── Step 1: Your Info ───────────────────────────────────────── */}
            {currentStep === 1 && (
              <form onSubmit={handleStep1} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Your Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="signup-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Pastor John Smith"
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email Address</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@mychurch.org"
                  />
                  <p className="text-xs text-muted-foreground">Used for notifications and team identification</p>
                </div>
                <div className="rounded-md bg-muted/40 border border-border px-3 py-2 text-xs text-muted-foreground">
                  Authenticated as: <span className="font-mono text-foreground">{identity.getPrincipal().toString().slice(0, 16)}…</span>
                </div>
                <Button type="submit" className="w-full" size="lg">
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </form>
            )}

            {/* ── Step 2: Church Setup ────────────────────────────────────── */}
            {currentStep === 2 && (
              <Tabs value={tab} onValueChange={(v) => setTab(v as OnboardingTab)}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="create">
                    <Church className="h-4 w-4 mr-2" />
                    New Church
                  </TabsTrigger>
                  <TabsTrigger value="join">
                    <Users className="h-4 w-4 mr-2" />
                    Join Church
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="create">
                  <form onSubmit={handleCreateChurch} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="church-name">Church Name <span className="text-destructive">*</span></Label>
                      <Input
                        id="church-name"
                        value={churchName}
                        onChange={(e) => setChurchName(e.target.value)}
                        placeholder="Grace Community Church"
                        required
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subdomain">Church Subdomain <span className="text-destructive">*</span></Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="subdomain"
                          value={subdomain}
                          onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          placeholder="grace-community"
                          required
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Your church's guest portal URL: <span className="text-foreground font-medium">{subdomain || 'your-church'}.newherejourney.com</span>
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setStepState({ step: 1 })}>
                        Back
                      </Button>
                      <Button type="submit" className="grow" disabled={isMutating}>
                        {isMutating ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
                        ) : (
                          <>Create Church <ChevronRight className="h-4 w-4 ml-1" /></>
                        )}
                      </Button>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="join">
                  <form onSubmit={handleJoinChurch} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="church-id">Church ID <span className="text-destructive">*</span></Label>
                      <Input
                        id="church-id"
                        value={existingChurchId}
                        onChange={(e) => setExistingChurchId(e.target.value)}
                        placeholder="e.g. 1735000000000-abc1234"
                        required
                        autoFocus
                      />
                      <p className="text-xs text-muted-foreground">
                        Ask your church admin for the Church ID. It can be found on the Team page of the admin portal.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setStepState({ step: 1 })}>
                        Back
                      </Button>
                      <Button type="submit" className="grow" disabled={isMutating}>
                        {isMutating ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Joining...</>
                        ) : (
                          <>Join Church <ChevronRight className="h-4 w-4 ml-1" /></>
                        )}
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            )}

            {/* ── Step 3: Success ─────────────────────────────────────────── */}
            {currentStep === 3 && stepState.step === 3 && (
              <div className="text-center space-y-6">
                <div className="flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-primary" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    Welcome, {name}!
                  </h3>
                  {stepState.isNew ? (
                    <p className="text-muted-foreground text-sm">
                      Your church <span className="font-semibold text-foreground">"{stepState.churchName}"</span> has been created. You're now an admin and ready to start welcoming guests!
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      You've successfully joined the church. Your account is pending role assignment by an admin.
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Button className="w-full" size="lg" onClick={goToDashboard}>
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  {stepState.isNew && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate({ to: '/admin/branding' })}
                    >
                      <Church className="h-4 w-4 mr-2" />
                      Set Up Church Branding
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate({ to: '/admin/dashboard' })}
            className="text-primary hover:underline font-medium"
          >
            Go to Dashboard
          </button>
        </p>
      </div>
    </div>
  );
}
