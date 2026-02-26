import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useRegisterGuest, useListAllChurches } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { setGuestId, setChurchId, generateId } from '../../lib/guestSession';

const INTERESTS = ['Worship', 'Small Groups', 'Volunteering', 'Youth Ministry', 'Prayer', 'Bible Study', 'Community Service', 'Family Ministry'];

export default function WelcomePage() {
  const navigate = useNavigate();
  const registerGuest = useRegisterGuest();
  const { data: churches, isLoading: churchesLoading } = useListAllChurches();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedChurchId, setSelectedChurchId] = useState('');

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    const churchId = selectedChurchId;

    if (!churchId) {
      toast.error('Please select your church');
      return;
    }

    try {
      const guestId = generateId();

      const guest = await registerGuest.mutateAsync({
        id: guestId,
        churchId,
        name,
        phone,
        email,
        interests: selectedInterests,
      });

      setGuestId(guest.id);
      setChurchId(guest.churchId);

      toast.success(`Welcome, ${guest.name}! Let's start your journey.`);
      navigate({ to: '/guest/journey' });
    } catch (err: any) {
      toast.error(err?.message || 'Registration failed. Please try again.');
    }
  };

  const showChurchPicker = !churchesLoading && churches && churches.length >= 1;
  const singleChurch = null; // always show church picker explicitly

  const year = new Date().getFullYear();
  const appId = encodeURIComponent(window.location.hostname || 'newherejourney');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center">
          <img src="/assets/generated/newherejourney-logo.dim_320x80.png" alt="NewHere Journey" className="h-10 object-contain" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <>
              <CardTitle className="text-2xl">Welcome! We're glad you're here</CardTitle>
              <CardDescription>Tell us a little about yourself so we can personalize your experience</CardDescription>
            </>
          </CardHeader>
          <CardContent>
            {churchesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : churches && churches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No churches have been set up yet. Please check back later.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Church picker — only shown when multiple churches exist */}
                {showChurchPicker && (
                  <div className="space-y-2">
                    <Label htmlFor="church">Select Your Church *</Label>
                    <Select value={selectedChurchId} onValueChange={setSelectedChurchId}>
                      <SelectTrigger id="church">
                        <SelectValue placeholder="Choose a church..." />
                      </SelectTrigger>
                      <SelectContent>
                        {churches!.map(church => (
                          <SelectItem key={church.id} value={church.id}>
                            {church.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Your Name *</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="First and last name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 123-4567" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <div className="space-y-3">
                  <Label>What are you interested in? (optional)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {INTERESTS.map(interest => (
                      <div key={interest} className="flex items-center space-x-2">
                        <Checkbox
                          id={interest}
                          checked={selectedInterests.includes(interest)}
                          onCheckedChange={() => toggleInterest(interest)}
                        />
                        <label htmlFor={interest} className="text-sm cursor-pointer">{interest}</label>
                      </div>
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={registerGuest.isPending}>
                  {registerGuest.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Registering...</>
                  ) : (
                    "Start My Journey →"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-border bg-card py-4 text-center text-xs text-muted-foreground">
        © {year} NewHere Journey. Built with <Heart className="inline h-3 w-3 text-red-500" /> using{' '}
        <a href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">caffeine.ai</a>
      </footer>
    </div>
  );
}
