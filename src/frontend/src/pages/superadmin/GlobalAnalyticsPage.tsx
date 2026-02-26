import { useGetGlobalAnalytics, useListAllChurches, useListAllSubscriptions } from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Building2, Users, CreditCard, TrendingUp } from 'lucide-react';
import { SubscriptionTier } from '../../backend';

const TIER_MRR: Record<string, number> = { starter: 49, growth: 99, pro: 199 };

function getTierKey(tier: SubscriptionTier): string {
  if (tier === SubscriptionTier.starter) return 'starter';
  if (tier === SubscriptionTier.growth) return 'growth';
  if (tier === SubscriptionTier.pro) return 'pro';
  return 'starter';
}

export default function GlobalAnalyticsPage() {
  const { data: analytics, isLoading: analyticsLoading } = useGetGlobalAnalytics();
  const { data: churches = [], isLoading: churchesLoading } = useListAllChurches();
  const { data: subscriptions = [], isLoading: subsLoading } = useListAllSubscriptions();

  const isLoading = analyticsLoading || churchesLoading || subsLoading;

  const totalMRR = subscriptions.reduce((sum, s) => {
    const key = getTierKey(s.tier);
    return sum + (TIER_MRR[key] || 0);
  }, 0);

  const tierDistribution = [
    { name: 'Starter', count: subscriptions.filter((s) => getTierKey(s.tier) === 'starter').length, fill: '#C9A84C' },
    { name: 'Growth', count: subscriptions.filter((s) => getTierKey(s.tier) === 'growth').length, fill: '#B8943A' },
    { name: 'Pro', count: subscriptions.filter((s) => getTierKey(s.tier) === 'pro').length, fill: '#A07F28' },
  ];

  const summaryCards = [
    {
      label: 'Total Churches',
      value: analytics ? Number(analytics.totalChurches) : 0,
      icon: Building2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Total Guests',
      value: analytics ? Number(analytics.totalGuests) : 0,
      icon: Users,
      color: 'text-gold-600',
      bg: 'bg-gold-50',
    },
    {
      label: 'Active Subscriptions',
      value: analytics ? Number(analytics.totalSubscriptions) : 0,
      icon: CreditCard,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Monthly Revenue',
      value: `$${totalMRR}`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-nearBlack">Global Analytics</h1>
        <p className="text-muted-foreground mt-1">Platform-wide metrics across all churches</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border-gold-100">
            <CardContent className="p-6">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ) : (
                <>
                  <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className={`font-serif text-3xl font-bold mt-1 ${color}`}>{value}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tier distribution chart */}
      {!isLoading && subscriptions.length > 0 && (
        <Card className="border-gold-100">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Subscription Tier Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={tierDistribution} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0e8d0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value: number) => [`${value} churches`, 'Count']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e8d9a0' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {tierDistribution.map((entry, index) => (
                    <Bar key={`bar-${index}`} dataKey="count" fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Church list summary */}
      {!isLoading && churches.length > 0 && (
        <Card className="border-gold-100">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Recent Churches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {churches.slice(0, 5).map((church) => (
                <div key={church.id} className="flex items-center gap-3 py-2 border-b border-gold-50 last:border-0">
                  <div className="w-8 h-8 bg-gold-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-gold-600 text-xs font-bold">{church.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-nearBlack truncate">{church.name}</p>
                    <p className="text-xs text-muted-foreground">{church.subdomain || 'No subdomain'}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(Number(church.createdAt) / 1_000_000).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
