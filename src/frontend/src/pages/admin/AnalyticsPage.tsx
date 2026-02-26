import { useMemo } from 'react';
import { useGetCallerUserProfile, useListGuests, useListJourneySteps } from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { BarChart3 } from 'lucide-react';

const GOLD_SHADES = ['#C9A84C', '#B8943A', '#A07F28', '#8A6B18', '#745708'];

export default function AnalyticsPage() {
  const { data: profile } = useGetCallerUserProfile();
  const churchId = profile?.churchId || '';
  const { data: guests = [], isLoading: guestsLoading } = useListGuests(churchId);
  const { data: steps = [], isLoading: stepsLoading } = useListJourneySteps(churchId);

  const isLoading = guestsLoading || stepsLoading;

  const stepRetentionData = useMemo(() => {
    if (!steps.length || !guests.length) return [];
    return steps.map((step) => {
      const stepNum = Number(step.stepNumber);
      const reached = guests.filter((g) => Number(g.currentStep) >= stepNum).length;
      return {
        name: `Step ${stepNum}`,
        label: step.title.length > 12 ? step.title.slice(0, 12) + '…' : step.title,
        guests: reached,
        pct: guests.length > 0 ? Math.round((reached / guests.length) * 100) : 0,
      };
    });
  }, [guests, steps]);

  const interestData = useMemo(() => {
    const counts: Record<string, number> = {};
    guests.forEach((g) => {
      g.interests.forEach((i) => {
        counts[i] = (counts[i] || 0) + 1;
      });
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.replace('_', ' '),
      value,
    }));
  }, [guests]);

  const dropOffData = useMemo(() => {
    if (!steps.length || !guests.length) return [];
    return steps.map((step, idx) => {
      const stepNum = Number(step.stepNumber);
      const atStep = guests.filter((g) => Number(g.currentStep) === stepNum - 1).length;
      return {
        name: `Step ${stepNum}`,
        stalled: atStep,
      };
    });
  }, [guests, steps]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  const hasData = guests.length > 0 && steps.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-nearBlack">Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your newcomer journey performance</p>
      </div>

      {!hasData ? (
        <Card className="border-gold-100 border-dashed">
          <CardContent className="py-16 text-center">
            <BarChart3 className="w-12 h-12 text-gold-200 mx-auto mb-3" />
            <h3 className="font-serif text-lg font-semibold text-nearBlack mb-1">No data yet</h3>
            <p className="text-muted-foreground text-sm">
              Analytics will appear once you have guests and journey steps set up.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Step Retention */}
          <Card className="border-gold-100">
            <CardHeader>
              <CardTitle className="font-serif text-lg">Step Retention</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stepRetentionData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0e8d0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number) => [`${value} guests`, 'Reached']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e8d9a0' }}
                  />
                  <Bar dataKey="guests" fill="#C9A84C" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Interest Distribution */}
          <Card className="border-gold-100">
            <CardHeader>
              <CardTitle className="font-serif text-lg">Guest Interests</CardTitle>
            </CardHeader>
            <CardContent>
              {interestData.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                  No interest data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={interestData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {interestData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={GOLD_SHADES[index % GOLD_SHADES.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e8d9a0' }} />
                    <Legend iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Drop-off Points */}
          <Card className="border-gold-100 md:col-span-2">
            <CardHeader>
              <CardTitle className="font-serif text-lg">Guests Stalled at Each Step</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dropOffData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0e8d0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number) => [`${value} guests`, 'Stalled']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e8d9a0' }}
                  />
                  <Bar dataKey="stalled" fill="#B8943A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
