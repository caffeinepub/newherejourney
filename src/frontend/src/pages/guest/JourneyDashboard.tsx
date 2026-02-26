import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useListJourneySteps } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Circle, ChevronRight, Heart, User, Zap } from 'lucide-react';
import { getGuestId, getChurchId } from '../../lib/guestSession';

export default function JourneyDashboard() {
  const navigate = useNavigate();
  const guestId = getGuestId();
  const churchId = getChurchId() || 'default-church';

  const { data: steps, isLoading } = useListJourneySteps(churchId);

  // Read current step from localStorage (updated after mark complete)
  const [currentStep, setCurrentStep] = React.useState<number>(() => {
    const stored = localStorage.getItem('nhj_current_step');
    return stored ? parseInt(stored, 10) : 0;
  });

  React.useEffect(() => {
    const handler = () => {
      const stored = localStorage.getItem('nhj_current_step');
      setCurrentStep(stored ? parseInt(stored, 10) : 0);
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  if (!guestId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">No guest session found</h2>
          <Button onClick={() => navigate({ to: '/guest/welcome' })}>Register as Guest</Button>
        </div>
      </div>
    );
  }

  const totalSteps = steps?.length || 0;
  const completedSteps = Math.min(currentStep, totalSteps);
  const progressPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const year = new Date().getFullYear();
  const appId = encodeURIComponent(window.location.hostname || 'newherejourney');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <img src="/assets/generated/newherejourney-logo.dim_320x80.png" alt="NewHere Journey" className="h-10 object-contain" />
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/guest/decisions' })}>
              <Zap className="h-4 w-4 mr-1" />
              Decisions
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/guest/profile' })}>
              <User className="h-4 w-4 mr-1" />
              Profile
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        {/* Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Journey Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{completedSteps} of {totalSteps} steps completed</span>
              <span>{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-3" />
            {progressPct === 100 && (
              <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Congratulations! You've completed your journey!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Steps */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Journey Steps</h2>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))
          ) : steps && steps.length > 0 ? (
            steps.map((step) => {
              const stepNum = Number(step.stepNumber);
              const isCompleted = stepNum <= completedSteps;
              const isCurrent = stepNum === completedSteps + 1;

              return (
                <Card
                  key={step.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${isCurrent ? 'border-primary ring-1 ring-primary' : ''} ${isCompleted ? 'opacity-75' : ''}`}
                  onClick={() => navigate({ to: '/guest/step/$stepId', params: { stepId: step.id } })}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${isCompleted ? 'bg-green-100 text-green-600' : isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground truncate">{step.title}</p>
                        {isCurrent && <Badge variant="default" className="text-xs">Current</Badge>}
                        {isCompleted && <Badge variant="secondary" className="text-xs">Done</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{step.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <p>No journey steps have been set up yet.</p>
                <p className="text-sm mt-1">Check back soon!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <footer className="border-t border-border bg-card py-4 text-center text-xs text-muted-foreground">
        © {year} NewHere Journey. Built with <Heart className="inline h-3 w-3 text-red-500" /> using{' '}
        <a href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">caffeine.ai</a>
      </footer>
    </div>
  );
}
