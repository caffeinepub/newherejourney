import React, { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useListJourneySteps, useUpdateGuestStep, useAddGuestAction } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, CheckCircle2, ArrowLeft, Heart, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { getGuestId, generateId } from '../../lib/guestSession';

export default function StepDetailPage() {
  const navigate = useNavigate();
  const { stepId } = useParams({ from: '/guest/step/$stepId' });
  const guestId = getGuestId();

  const { data: steps, isLoading } = useListJourneySteps(
    localStorage.getItem('nhj_church_id') || 'default-church'
  );

  const updateGuestStep = useUpdateGuestStep();
  const addGuestAction = useAddGuestAction();

  const [prayerRequest, setPrayerRequest] = useState('');
  const [showPrayerForm, setShowPrayerForm] = useState(false);
  const [completed, setCompleted] = useState(false);

  const step = steps?.find(s => s.id === stepId);
  const currentStepNum = Number(step?.stepNumber || 0);

  const handleMarkComplete = async () => {
    if (!guestId || !step) return;

    try {
      await updateGuestStep.mutateAsync({
        id: guestId,
        newStep: BigInt(currentStepNum),
      });

      localStorage.setItem('nhj_current_step', String(currentStepNum));
      setCompleted(true);
      toast.success('Step completed! Great progress!');

      setTimeout(() => navigate({ to: '/guest/journey' }), 1500);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to mark step complete');
    }
  };

  const handlePrayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestId || !prayerRequest.trim()) return;

    try {
      await addGuestAction.mutateAsync({
        id: generateId(),
        guestId,
        actionType: 'prayer_request',
        status: prayerRequest,
        assignedTo: '',
      });

      toast.success('Prayer request submitted!');
      setPrayerRequest('');
      setShowPrayerForm(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit prayer request');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto space-y-4 pt-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!step) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Step not found</p>
          <Button onClick={() => navigate({ to: '/guest/journey' })}>Back to Journey</Button>
        </div>
      </div>
    );
  }

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
          <p className="text-sm text-muted-foreground mb-1">Step {step.stepNumber}</p>
          <h1 className="text-2xl font-bold text-foreground">{step.title}</h1>
        </div>

        {step.videoUrl && (
          <div className="aspect-video rounded-xl overflow-hidden bg-muted">
            <iframe
              src={step.videoUrl}
              className="w-full h-full"
              allowFullScreen
              title={step.title}
            />
          </div>
        )}

        <Card>
          <CardContent className="p-6">
            <p className="text-foreground leading-relaxed">{step.description}</p>
          </CardContent>
        </Card>

        {/* CTA */}
        {step.ctaText && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-6 text-center">
              <p className="text-foreground font-medium mb-4">{step.ctaText}</p>
              {!completed ? (
                <Button
                  onClick={handleMarkComplete}
                  disabled={updateGuestStep.isPending || !guestId}
                  className="w-full sm:w-auto"
                >
                  {updateGuestStep.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4 mr-2" />Mark Complete</>
                  )}
                </Button>
              ) : (
                <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
                  <CheckCircle2 className="h-5 w-5" />
                  Completed!
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Prayer Request */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              Prayer Request
            </CardTitle>
            <CardDescription>Share a prayer request with our team</CardDescription>
          </CardHeader>
          <CardContent>
            {!showPrayerForm ? (
              <Button variant="outline" onClick={() => setShowPrayerForm(true)}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Submit a Prayer Request
              </Button>
            ) : (
              <form onSubmit={handlePrayerSubmit} className="space-y-3">
                <Textarea
                  value={prayerRequest}
                  onChange={e => setPrayerRequest(e.target.value)}
                  placeholder="Share your prayer request..."
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={addGuestAction.isPending || !prayerRequest.trim()}>
                    {addGuestAction.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowPrayerForm(false)}>Cancel</Button>
                </div>
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
