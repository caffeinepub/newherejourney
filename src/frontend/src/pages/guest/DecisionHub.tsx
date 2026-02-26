import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAddGuestAction } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Heart, Droplets, Users, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { getGuestId, generateId } from '../../lib/guestSession';

const decisions = [
  {
    id: 'follow_jesus',
    title: 'Follow Jesus',
    description: 'I want to make a commitment to follow Jesus Christ as my Lord and Savior.',
    icon: Heart,
    color: 'text-red-500',
    bg: 'bg-red-50 border-red-200',
  },
  {
    id: 'baptism',
    title: 'Baptism',
    description: 'I want to be baptized as a public declaration of my faith.',
    icon: Droplets,
    color: 'text-blue-500',
    bg: 'bg-blue-50 border-blue-200',
  },
  {
    id: 'membership',
    title: 'Church Membership',
    description: 'I want to become an official member of this church.',
    icon: Users,
    color: 'text-green-500',
    bg: 'bg-green-50 border-green-200',
  },
];

export default function DecisionHub() {
  const navigate = useNavigate();
  const guestId = getGuestId();
  const addGuestAction = useAddGuestAction();
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<string | null>(null);

  const handleDecision = async (actionType: string) => {
    if (!guestId) {
      toast.error('Please register first');
      navigate({ to: '/guest/welcome' });
      return;
    }

    setLoading(actionType);
    try {
      await addGuestAction.mutateAsync({
        id: generateId(),
        guestId,
        actionType,
        status: 'pending',
        assignedTo: '',
      });

      setSubmitted(prev => new Set([...prev, actionType]));
      const decision = decisions.find(d => d.id === actionType);
      toast.success(`${decision?.title} decision recorded! Our team will follow up with you.`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to record decision');
    } finally {
      setLoading(null);
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

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Decision Hub</h1>
          <p className="text-muted-foreground mt-1">Take the next step in your faith journey</p>
        </div>

        <div className="space-y-4">
          {decisions.map((decision) => {
            const Icon = decision.icon;
            const isSubmitted = submitted.has(decision.id);
            const isLoading = loading === decision.id;

            return (
              <Card key={decision.id} className={`${decision.bg} border`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <Icon className={`h-6 w-6 ${decision.color}`} />
                    {decision.title}
                  </CardTitle>
                  <CardDescription className="text-foreground/70">{decision.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {isSubmitted ? (
                    <div className="flex items-center gap-2 text-green-600 font-medium">
                      <CheckCircle2 className="h-5 w-5" />
                      Decision recorded! Our team will reach out soon.
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleDecision(decision.id)}
                      disabled={isLoading || addGuestAction.isPending}
                      variant="outline"
                      className="border-current"
                    >
                      {isLoading ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Recording...</>
                      ) : (
                        `I want ${decision.title}`
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      <footer className="border-t border-border bg-card py-4 text-center text-xs text-muted-foreground">
        © {year} NewHere Journey. Built with <Heart className="inline h-3 w-3 text-red-500" /> using{' '}
        <a href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">caffeine.ai</a>
      </footer>
    </div>
  );
}
