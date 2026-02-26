import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useSaveCallerUserProfile, useCreateChurch } from '../hooks/useQueries';
import { Role } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Cross, Building2, Users, Loader2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

type SetupMode = 'choose' | 'create-church' | 'join-church';

export default function FirstTimeSetup() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [mode, setMode] = useState<SetupMode>('choose');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [churchName, setChurchName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [churchId, setChurchId] = useState('');

  const saveProfile = useSaveCallerUserProfile();
  const createChurch = useCreateChurch();

  const handleCreateChurch = async () => {
    if (!name.trim() || !email.trim() || !churchName.trim() || !subdomain.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    const newChurchId = `church_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    try {
      await createChurch.mutateAsync({ id: newChurchId, name: churchName, subdomain });
      await saveProfile.mutateAsync({
        name,
        email,
        churchId: newChurchId,
        role: Role.admin,
      });
      toast.success('Church created successfully!');
      navigate({ to: '/admin/dashboard' });
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error?.message || 'Failed to create church');
    }
  };

  const handleJoinChurch = async () => {
    if (!name.trim() || !email.trim() || !churchId.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await saveProfile.mutateAsync({
        name,
        email,
        churchId,
        role: Role.volunteer,
      });
      toast.success('Welcome to the team!');
      navigate({ to: '/guest/journey' });
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error?.message || 'Failed to join church');
    }
  };

  const isLoading = saveProfile.isPending || createChurch.isPending;

  return (
    <div className="min-h-screen bg-offWhite flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/assets/generated/newherejourney-logo.dim_320x80.png"
            alt="NewHereJourney"
            className="h-12 w-auto mx-auto mb-3"
          />
          <p className="text-muted-foreground">Let's get you set up</p>
        </div>

        {mode === 'choose' && (
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-bold text-nearBlack text-center mb-6">
              How are you joining?
            </h2>
            <Card
              className="cursor-pointer hover:shadow-gold transition-all border-gold-100 hover:border-gold-300"
              onClick={() => setMode('create-church')}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="w-12 h-12 bg-gold-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-gold-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-nearBlack">Create a Church</h3>
                  <p className="text-sm text-muted-foreground">Set up your church and become the admin</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-gold transition-all border-gold-100 hover:border-gold-300"
              onClick={() => setMode('join-church')}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="w-12 h-12 bg-gold-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-gold-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-nearBlack">Join a Church</h3>
                  <p className="text-sm text-muted-foreground">Enter your church code to join as a guest or staff</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </div>
        )}

        {mode === 'create-church' && (
          <Card className="border-gold-100 shadow-gold">
            <CardHeader>
              <CardTitle className="font-serif text-2xl">Create Your Church</CardTitle>
              <CardDescription>Set up your church profile and admin account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="Pastor John Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-gold-200 focus:ring-gold-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Your Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@gracechurch.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-gold-200 focus:ring-gold-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="churchName">Church Name</Label>
                <Input
                  id="churchName"
                  placeholder="Grace Community Church"
                  value={churchName}
                  onChange={(e) => setChurchName(e.target.value)}
                  className="border-gold-200 focus:ring-gold-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="subdomain"
                    placeholder="gracechurch"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="border-gold-200 focus:ring-gold-400"
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">.newherejourney.com</span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setMode('choose')}
                  className="flex-1 border-gold-200"
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  onClick={handleCreateChurch}
                  disabled={isLoading}
                  className="flex-1 bg-gold-500 hover:bg-gold-600 text-nearBlack font-semibold"
                >
                  {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create Church'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {mode === 'join-church' && (
          <Card className="border-gold-100 shadow-gold">
            <CardHeader>
              <CardTitle className="font-serif text-2xl">Join a Church</CardTitle>
              <CardDescription>Enter your details and church code</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="joinName">Your Name</Label>
                <Input
                  id="joinName"
                  placeholder="John Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-gold-200 focus:ring-gold-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="joinEmail">Your Email</Label>
                <Input
                  id="joinEmail"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-gold-200 focus:ring-gold-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="churchCode">Church ID / Code</Label>
                <Input
                  id="churchCode"
                  placeholder="church_abc123..."
                  value={churchId}
                  onChange={(e) => setChurchId(e.target.value)}
                  className="border-gold-200 focus:ring-gold-400"
                />
                <p className="text-xs text-muted-foreground">Ask your church admin for the Church ID</p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setMode('choose')}
                  className="flex-1 border-gold-200"
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  onClick={handleJoinChurch}
                  disabled={isLoading}
                  className="flex-1 bg-gold-500 hover:bg-gold-600 text-nearBlack font-semibold"
                >
                  {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Joining...</> : 'Join Church'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
