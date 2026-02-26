import { useState } from 'react';
import { useIsStripeConfigured, useSetStripeConfiguration } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Settings, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function StripeConfigSetup() {
  const { data: isConfigured, isLoading } = useIsStripeConfigured();
  const setConfig = useSetStripeConfiguration();
  const [secretKey, setSecretKey] = useState('');
  const [countries, setCountries] = useState('US,CA,GB,AU');
  const [open, setOpen] = useState(false);

  if (isLoading) return null;
  if (isConfigured) return null;

  const handleSave = async () => {
    if (!secretKey.trim()) {
      toast.error('Stripe secret key is required');
      return;
    }
    const allowedCountries = countries.split(',').map((c) => c.trim()).filter(Boolean);
    try {
      await setConfig.mutateAsync({ secretKey, allowedCountries });
      toast.success('Stripe configured successfully!');
      setOpen(false);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error?.message || 'Failed to configure Stripe');
    }
  };

  if (!open) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4 flex items-center gap-3">
          <Settings className="w-5 h-5 text-orange-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-orange-800">Stripe not configured</p>
            <p className="text-xs text-orange-600">Configure Stripe to enable subscription payments</p>
          </div>
          <Button
            size="sm"
            onClick={() => setOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
          >
            Configure
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gold-200">
      <CardHeader>
        <CardTitle className="font-serif text-lg flex items-center gap-2">
          <Settings className="w-5 h-5 text-gold-500" />
          Configure Stripe
        </CardTitle>
        <CardDescription>Enter your Stripe credentials to enable payments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Stripe Secret Key</Label>
          <Input
            type="password"
            placeholder="sk_live_..."
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            className="border-gold-200 font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label>Allowed Countries (comma-separated)</Label>
          <Input
            placeholder="US,CA,GB,AU"
            value={countries}
            onChange={(e) => setCountries(e.target.value)}
            className="border-gold-200"
          />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} className="border-gold-200">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={setConfig.isPending}
            className="bg-gold-500 hover:bg-gold-600 text-nearBlack font-semibold"
          >
            {setConfig.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
            ) : (
              <><CheckCircle2 className="w-4 h-4 mr-2" />Save Configuration</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
