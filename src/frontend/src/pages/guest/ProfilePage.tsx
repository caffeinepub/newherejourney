import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useUpdateGuestInfo } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Save, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { getGuestId } from '../../lib/guestSession';

const INTERESTS = ['Worship', 'Small Groups', 'Volunteering', 'Youth Ministry', 'Prayer', 'Bible Study', 'Community Service', 'Family Ministry'];

export default function ProfilePage() {
  const navigate = useNavigate();
  const guestId = getGuestId();
  const updateGuestInfo = useUpdateGuestInfo();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Load from localStorage as fallback
  useEffect(() => {
    const storedName = localStorage.getItem('nhj_guest_name') || '';
    const storedPhone = localStorage.getItem('nhj_guest_phone') || '';
    const storedEmail = localStorage.getItem('nhj_guest_email') || '';
    const storedInterests = JSON.parse(localStorage.getItem('nhj_guest_interests') || '[]');
    setName(storedName);
    setPhone(storedPhone);
    setEmail(storedEmail);
    setSelectedInterests(storedInterests);
  }, []);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestId) {
      toast.error('No guest session found');
      return;
    }

    try {
      await updateGuestInfo.mutateAsync({
        id: guestId,
        name,
        phone,
        email,
        interests: selectedInterests,
      });

      // Update localStorage cache
      localStorage.setItem('nhj_guest_name', name);
      localStorage.setItem('nhj_guest_phone', phone);
      localStorage.setItem('nhj_guest_email', email);
      localStorage.setItem('nhj_guest_interests', JSON.stringify(selectedInterests));

      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update profile');
    }
  };

  const year = new Date().getFullYear();
  const appId = encodeURIComponent(window.location.hostname || 'newherejourney');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/guest/journey' })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <img src="/assets/generated/newherejourney-logo.dim_320x80.png" alt="NewHere Journey" className="h-8 object-contain" />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">My Profile</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 123-4567" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div className="space-y-3">
                <Label>Interests</Label>
                <div className="grid grid-cols-2 gap-2">
                  {INTERESTS.map(interest => (
                    <div key={interest} className="flex items-center space-x-2">
                      <Checkbox
                        id={`profile-${interest}`}
                        checked={selectedInterests.includes(interest)}
                        onCheckedChange={() => toggleInterest(interest)}
                      />
                      <label htmlFor={`profile-${interest}`} className="text-sm cursor-pointer">{interest}</label>
                    </div>
                  ))}
                </div>
              </div>
              <Button type="submit" disabled={updateGuestInfo.isPending || !guestId}>
                {updateGuestInfo.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" />Save Profile</>
                )}
              </Button>
            </form>
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
