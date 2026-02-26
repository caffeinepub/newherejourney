import { useListAllSubscriptions, useListAllChurches, useUpdateSubscriptionTier } from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard } from 'lucide-react';
import { SubscriptionTier, Subscription, Church } from '../../backend';
import { toast } from 'sonner';

const TIER_MRR: Record<string, number> = { starter: 49, growth: 99, pro: 199 };
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

function getTierEnum(key: string): SubscriptionTier {
  if (key === 'growth') return SubscriptionTier.growth;
  if (key === 'pro') return SubscriptionTier.pro;
  return SubscriptionTier.starter;
}

function SubscriptionRow({
  sub,
  church,
}: {
  sub: Subscription;
  church: Church | undefined;
}) {
  const updateTier = useUpdateSubscriptionTier();
  const tierKey = getTierKey(sub.tier);

  const handleTierChange = async (newTierKey: string) => {
    try {
      await updateTier.mutateAsync({
        churchId: sub.churchId,
        tier: getTierEnum(newTierKey),
        status: sub.status,
      });
      toast.success('Subscription tier updated');
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error?.message || 'Failed to update tier');
    }
  };

  const updatedAt = new Date(Number(sub.updatedAt) / 1_000_000);

  return (
    <TableRow className="hover:bg-gold-50/50">
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gold-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-gold-600 text-xs font-bold">
              {church?.name?.charAt(0) || '?'}
            </span>
          </div>
          <div>
            <p className="font-medium text-nearBlack text-sm">{church?.name || sub.churchId}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[120px]">{sub.churchId}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Select value={tierKey} onValueChange={handleTierChange} disabled={updateTier.isPending}>
          <SelectTrigger className="w-32 h-8 text-xs border-gold-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="growth">Growth</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="font-semibold text-nearBlack text-sm">
        ${TIER_MRR[tierKey] || 0}/mo
      </TableCell>
      <TableCell>
        <Badge className={`${TIER_COLORS[tierKey]} border-0 text-xs`}>
          {sub.status}
        </Badge>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {sub.stripeCustomerId ? sub.stripeCustomerId.slice(0, 14) + '...' : '—'}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {updatedAt.toLocaleDateString()}
      </TableCell>
    </TableRow>
  );
}

export default function SubscriptionManagementPage() {
  const { data: subscriptions = [], isLoading: subsLoading } = useListAllSubscriptions();
  const { data: churches = [], isLoading: churchesLoading } = useListAllChurches();

  const isLoading = subsLoading || churchesLoading;

  const churchMap = new Map<string, Church>();
  churches.forEach((c) => churchMap.set(c.id, c));

  const totalMRR = subscriptions.reduce((sum, s) => {
    const key = getTierKey(s.tier);
    return sum + (TIER_MRR[key] || 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-nearBlack">Subscription Management</h1>
        <p className="text-muted-foreground mt-1">View and manage all church subscriptions</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Subscriptions', value: subscriptions.length },
          { label: 'Monthly Revenue', value: `$${totalMRR}` },
          { label: 'Annual Run Rate', value: `$${totalMRR * 12}` },
        ].map(({ label, value }) => (
          <Card key={label} className="border-gold-100">
            <CardContent className="p-5">
              {isLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="font-serif text-3xl font-bold text-gold-600 mt-1">{value}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="border-gold-100">
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gold-500" />
            All Subscriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="py-12 text-center">
              <CreditCard className="w-10 h-10 text-gold-200 mx-auto mb-2" />
              <p className="font-semibold text-nearBlack">No subscriptions yet</p>
              <p className="text-sm text-muted-foreground mt-1">Subscriptions will appear here once churches subscribe.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gold-100">
                    <TableHead>Church</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>MRR</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Stripe Customer</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => (
                    <SubscriptionRow
                      key={sub.id}
                      sub={sub}
                      church={churchMap.get(sub.churchId)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
