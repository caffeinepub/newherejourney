import { useListAllChurches, useListAllSubscriptions, useListGuests } from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, ExternalLink } from 'lucide-react';
import { Church, Subscription, SubscriptionTier } from '../../backend';

const TIER_MRR: Record<string, number> = {
  starter: 49,
  growth: 99,
  pro: 199,
};

const TIER_COLORS: Record<string, string> = {
  starter: 'bg-blue-100 text-blue-700',
  growth: 'bg-gold-100 text-gold-700',
  pro: 'bg-purple-100 text-purple-700',
};

function getTierKey(tier: SubscriptionTier): string {
  if (tier === SubscriptionTier.starter) return 'starter';
  if (tier === SubscriptionTier.growth) return 'growth';
  if (tier === SubscriptionTier.pro) return 'pro';
  return 'starter';
}

export default function ChurchListPage() {
  const { data: churches = [], isLoading: churchesLoading } = useListAllChurches();
  const { data: subscriptions = [], isLoading: subsLoading } = useListAllSubscriptions();

  const isLoading = churchesLoading || subsLoading;

  const subMap = new Map<string, Subscription>();
  subscriptions.forEach((s) => subMap.set(s.churchId, s));

  const totalMRR = subscriptions.reduce((sum, s) => {
    const key = getTierKey(s.tier);
    return sum + (TIER_MRR[key] || 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-nearBlack">Churches</h1>
        <p className="text-muted-foreground mt-1">All churches on the platform</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Churches', value: churches.length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active Subscriptions', value: subscriptions.length, color: 'text-gold-600', bg: 'bg-gold-50' },
          { label: 'Monthly Revenue', value: `$${totalMRR}`, color: 'text-green-600', bg: 'bg-green-50' },
        ].map(({ label, value, color, bg }) => (
          <Card key={label} className="border-gold-100">
            <CardContent className="p-5">
              {isLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className={`font-serif text-3xl font-bold mt-1 ${color}`}>{value}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Church table */}
      <Card className="border-gold-100">
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gold-500" />
            Church Directory
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : churches.length === 0 ? (
            <div className="py-12 text-center">
              <Building2 className="w-12 h-12 text-gold-200 mx-auto mb-3" />
              <p className="font-semibold text-nearBlack">No churches yet</p>
              <p className="text-sm text-muted-foreground mt-1">Churches will appear here once they sign up.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gold-100">
                    <TableHead>Church</TableHead>
                    <TableHead>Subdomain</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>MRR</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {churches.map((church) => {
                    const sub = subMap.get(church.id);
                    const tierKey = sub ? getTierKey(sub.tier) : null;
                    const mrr = tierKey ? TIER_MRR[tierKey] : 0;
                    const createdAt = new Date(Number(church.createdAt) / 1_000_000);

                    return (
                      <TableRow key={church.id} className="hover:bg-gold-50/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gold-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-gold-600 text-xs font-bold">{church.name.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="font-medium text-nearBlack text-sm">{church.name}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[120px]">{church.id}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {church.subdomain ? (
                            <span className="flex items-center gap-1">
                              {church.subdomain}
                              <ExternalLink className="w-3 h-3" />
                            </span>
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          {tierKey ? (
                            <Badge className={`${TIER_COLORS[tierKey]} border-0 text-xs capitalize`}>
                              {tierKey}
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-500 border-0 text-xs">No plan</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold text-nearBlack text-sm">
                          {mrr > 0 ? `$${mrr}/mo` : '—'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {createdAt.toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {sub ? (
                            <Badge className="bg-green-100 text-green-700 border-0 text-xs">{sub.status}</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-500 border-0 text-xs">Free</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
