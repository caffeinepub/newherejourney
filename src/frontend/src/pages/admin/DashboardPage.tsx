import React from 'react';
import { useGetCallerUserProfile, useListGuests, useListJourneySteps } from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, TrendingUp, AlertTriangle, Star } from 'lucide-react';

export default function AdminDashboardPage() {
  const { data: profile } = useGetCallerUserProfile();
  const churchId = profile?.churchId || '';

  const { data: guests, isLoading: guestsLoading } = useListGuests(churchId);
  const { data: steps, isLoading: stepsLoading } = useListJourneySteps(churchId);

  const isLoading = guestsLoading || stepsLoading;

  const totalGuests = guests?.length || 0;
  const totalSteps = steps?.length || 0;

  const completedGuests = guests?.filter(g => Number(g.currentStep) >= totalSteps && totalSteps > 0).length || 0;
  const completionRate = totalGuests > 0 ? Math.round((completedGuests / totalGuests) * 100) : 0;

  const stalledGuests = guests?.filter(g => Number(g.currentStep) === 0).length || 0;

  // Top interest
  const interestCounts: Record<string, number> = {};
  guests?.forEach(g => g.interests.forEach(i => { interestCounts[i] = (interestCounts[i] || 0) + 1; }));
  const topInterest = Object.entries(interestCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  const cards = [
    { title: 'Total Guests', value: totalGuests, icon: Users, color: 'text-blue-500' },
    { title: 'Completion Rate', value: `${completionRate}%`, icon: TrendingUp, color: 'text-green-500' },
    { title: 'Not Started', value: stalledGuests, icon: AlertTriangle, color: 'text-yellow-500' },
    { title: 'Top Interest', value: topInterest, icon: Star, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {profile?.name || 'Admin'}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent guests */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Guests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : guests && guests.length > 0 ? (
            <div className="space-y-2">
              {guests.slice(-5).reverse().map(guest => (
                <div key={guest.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{guest.name}</p>
                    <p className="text-xs text-muted-foreground">{guest.email || guest.phone || 'No contact info'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Step {Number(guest.currentStep)} / {totalSteps}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">No guests yet. Share your guest portal link to get started!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
