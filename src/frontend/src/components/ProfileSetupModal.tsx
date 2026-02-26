import React, { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useSaveCallerUserProfile, useCreateChurch, useGetCallerUserProfile } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Church, User, ShieldAlert, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Role } from '../backend';
import { generateId } from '../lib/guestSession';

export default function ProfileSetupModal() {
  const { identity } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const saveProfile = useSaveCallerUserProfile();
  const createChurch = useCreateChurch();
  const navigate = useNavigate();
  const { data: existingProfile } = useGetCallerUserProfile();

  const [tab, setTab] = useState<'join' | 'create'>('create');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [churchName, setChurchName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [existingChurchId, setExistingChurchId] = useState('');

  const isLoading = saveProfile.isPending || createChurch.isPending;
  const actorReady = !!actor && !actorFetching;

  const SUPER_ADMIN_EMAIL = 'erskinecurrie3@gmail.com';

  // If user already has a profile but with insufficient role (e.g. volunteer trying to access admin area)
  const hasExistingProfile = existingProfile !== null && existingProfile !== undefined;
  const isVolunteerOrLower = hasExistingProfile && existingProfile.role === 'volunteer';

  const handleCreateChurch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !churchName.trim() || !subdomain.trim()) {
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
        name: name || existingProfile?.name || '',
        email: email || existingProfile?.email || '',
        churchId: church.id,
        role: isSuperAdmin ? Role.superAdmin : Role.admin,
      });

      toast.success(`Church "${church.name}" created! Welcome${name ? `, ${name}` : ''}!`);
      if (isSuperAdmin) {
        navigate({ to: '/superadmin/churches' });
      } else {
        navigate({ to: '/admin/dashboard' });
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create church');
    }
  };

  const handleJoinAsStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingChurchId.trim()) {
      toast.error('Please enter the Church ID');
      return;
    }
    if (!hasExistingProfile && !name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    try {
      await saveProfile.mutateAsync({
        name: name || existingProfile?.name || '',
        email: email || existingProfile?.email || '',
        churchId: existingChurchId,
        role: Role.volunteer,
      });

      toast.success(`Welcome${name ? `, ${name}` : ''}! Your request has been submitted.`);
      navigate({ to: '/admin/dashboard' });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save profile');
    }
  };

  // Special view for users who already have a profile but with insufficient permissions
  if (isVolunteerOrLower) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img src="/assets/generated/newherejourney-logo.dim_320x80.png" alt="NewHere Journey" className="h-12 object-contain" />
            </div>
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <ShieldAlert className="h-7 w-7 text-amber-600" />
              </div>
            </div>
            <CardTitle className="text-xl">Waiting for Admin Approval</CardTitle>
            <CardDescription className="mt-2">
              You've joined as a volunteer. An admin at your church needs to promote you before you can access the portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 border border-border p-4 text-sm text-muted-foreground space-y-2">
              <p><span className="font-medium text-foreground">Current role:</span> Volunteer (pending approval)</p>
              <p><span className="font-medium text-foreground">Church ID:</span> <span className="font-mono text-xs">{existingProfile.churchId}</span></p>
              <p>Ask your church admin to go to the <span className="font-medium text-foreground">Team</span> page and promote your account to Admin or Pastor.</p>
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              <p className="text-sm text-muted-foreground text-center">Or create your own church instead:</p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setName(existingProfile.name);
                  setEmail(existingProfile.email);
                }}
              >
                <Church className="h-4 w-4 mr-2" />
                Create a New Church
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/assets/generated/newherejourney-logo.dim_320x80.png" alt="NewHere Journey" className="h-12 object-contain" />
          </div>
          <CardTitle className="text-2xl">Welcome! Let's get you set up</CardTitle>
          <CardDescription>
            Logged in as {identity?.getPrincipal().toString().slice(0, 12)}...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'join' | 'create')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="create">
                <Church className="h-4 w-4 mr-2" />
                Create a Church
              </TabsTrigger>
              <TabsTrigger value="join">
                <User className="h-4 w-4 mr-2" />
                Join as Staff
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create">
              <form onSubmit={handleCreateChurch} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Pastor John Smith"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@mychurch.org"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="churchName">Church Name *</Label>
                  <Input
                    id="churchName"
                    value={churchName}
                    onChange={(e) => setChurchName(e.target.value)}
                    placeholder="Grace Community Church"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subdomain">Church Subdomain *</Label>
                  <Input
                    id="subdomain"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="grace-community"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Used for your church's guest portal URL</p>
                </div>
                {!actorReady && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Connecting to backend...
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={isLoading || !actorReady}>
                  {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</> : 'Create Church & Continue'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="join">
              <form onSubmit={handleJoinAsStaff} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="joinName">Your Name *</Label>
                  <Input
                    id="joinName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joinEmail">Email</Label>
                  <Input
                    id="joinEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@church.org"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="churchId">Church ID *</Label>
                  <Input
                    id="churchId"
                    value={existingChurchId}
                    onChange={(e) => setExistingChurchId(e.target.value)}
                    placeholder="Ask your church admin for the Church ID"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Your admin will see your request and can promote you to a higher role on the Team page.</p>
                </div>
                {!actorReady && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Connecting to backend...
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={isLoading || !actorReady}>
                  {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : 'Join Church & Continue'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
