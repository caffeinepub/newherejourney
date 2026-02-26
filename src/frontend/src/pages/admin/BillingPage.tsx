import { useGetCallerUserProfile, useGetSubscription, useCreateCheckoutSession, useIsStripeConfigured } from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { SubscriptionTier, ShoppingItem } from '../../backend';
import { toast } from 'sonner';
import StripeConfigSetup from '../../components/StripeConfigSetup';

const PLANS = [
  {
    tier: SubscriptionTier.starter,
    name: 'Starter',
    price: 49,
    guestLimit: '500 guests/mo',
    smsLimit: '1,000 SMS',
    features: ['1 campus', '500 guests/month', '1,000 SMS', 'Journey builder', 'Basic analytics'],
    highlight: false,
  },
  {
    tier: SubscriptionTier.growth,
    name: 'Growth',
    price: 99,
    guestLimit: '2,000 guests/mo',
    smsLimit: '5,000 SMS',
    features: ['3 campuses', '2,000 guests/month', '5,000 SMS', 'Custom journey steps', 'Advanced analytics', 'Team management'],
    highlight: true,
  },
  {
    tier: SubscriptionTier.pro,
    name: 'Pro',
    price: 199,
    guestLimit: 'Unlimited',
    smsLimit: 'Unlimited SMS',
    features: ['Unlimited campuses', 'Unlimited guests', 'Unlimited SMS', 'API access', 'Priority support', 'White-label'],
    highlight: false,
  },
];

function getTierKey(tier: SubscriptionTier): string {
  if (tier === SubscriptionTier.starter) return 'starter';
  if (tier === SubscriptionTier.growth) return 'growth';
  if (tier === SubscriptionTier.pro) return 'pro';
  return 'starter';
}

export default function BillingPage() {
  const { data: profile } = useGetCallerUserProfile();
  const churchId = profile?.churchId || '';
  const { data: subscription, isLoading: subLoading } = useGetSubscription(churchId);
  const { data: stripeConfigured, isLoading: stripeLoading } = useIsStripeConfigured();
  const createCheckout = useCreateCheckoutSession();

  const currentTierKey = subscription ? getTierKey(subscription.tier) : null;

  const handleSubscribe = async (plan: typeof PLANS[0]) => {
    if (!stripeConfigured) {
      toast.error('Stripe is not configured yet. Contact your administrator.');
      return;
    }

    const item: ShoppingItem = {
      productName: `NewHereJourney ${plan.name}`,
      productDescription: `${plan.name} plan - ${plan.guestLimit}, ${plan.smsLimit}`,
      priceInCents: BigInt(plan.price * 100),
      quantity: BigInt(1),
      currency: 'usd',
    };

    try {
      const session = await createCheckout.mutateAsync([item]);
      if (!session?.url) throw new Error('Stripe session missing url');
      window.location.href = session.url;
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error?.message || 'Failed to start checkout');
    }
  };

  if (subLoading || stripeLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-nearBlack">Billing</h1>
        <p className="text-muted-foreground mt-1">Manage your subscription plan</p>
      </div>

      {/* Stripe config setup */}
      <StripeConfigSetup />

      {/* Current plan */}
      {subscription && (
        <Card className="border-gold-300 bg-gold-50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-gold-500 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-nearBlack" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-nearBlack">Current Plan: {currentTierKey ? currentTierKey.charAt(0).toUpperCase() + currentTierKey.slice(1) : 'Unknown'}</p>
              <p className="text-sm text-muted-foreground">Status: {subscription.status}</p>
            </div>
            <Badge className="bg-gold-500 text-nearBlack border-0 font-semibold">Active</Badge>
          </CardContent>
        </Card>
      )}

      {!subscription && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-5 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <p className="text-sm text-orange-700">You don't have an active subscription. Choose a plan below to get started.</p>
          </CardContent>
        </Card>
      )}

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isCurrentPlan = currentTierKey === plan.tier.toString();
          const isLoading = createCheckout.isPending;

          return (
            <Card
              key={plan.name}
              className={`border transition-shadow ${
                plan.highlight
                  ? 'border-gold-400 shadow-gold bg-nearBlack text-white'
                  : 'border-gold-100 hover:shadow-gold'
              }`}
            >
              <CardHeader className="pb-4">
                {plan.highlight && (
                  <div className="text-xs font-semibold text-gold-400 mb-1">MOST POPULAR</div>
                )}
                <CardTitle className={`font-serif text-2xl ${plan.highlight ? 'text-white' : 'text-nearBlack'}`}>
                  {plan.name}
                </CardTitle>
                <div className={`font-serif text-4xl font-bold ${plan.highlight ? 'text-white' : 'text-nearBlack'}`}>
                  ${plan.price}
                  <span className={`text-base font-normal ${plan.highlight ? 'text-white/60' : 'text-muted-foreground'}`}>/mo</span>
                </div>
                <CardDescription className={plan.highlight ? 'text-white/60' : ''}>
                  {plan.guestLimit} · {plan.smsLimit}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? 'text-gold-400' : 'text-gold-500'}`} />
                      <span className={plan.highlight ? 'text-white/80' : 'text-nearBlack'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleSubscribe(plan)}
                  disabled={isLoading || isCurrentPlan}
                  className={`w-full rounded-xl font-semibold ${
                    isCurrentPlan
                      ? 'bg-green-100 text-green-700 cursor-default'
                      : plan.highlight
                      ? 'bg-gold-500 hover:bg-gold-600 text-nearBlack'
                      : 'bg-gold-50 hover:bg-gold-100 text-nearBlack border border-gold-200'
                  }`}
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</>
                  ) : isCurrentPlan ? (
                    <><Check className="w-4 h-4 mr-2" />Current Plan</>
                  ) : (
                    `Subscribe to ${plan.name}`
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
