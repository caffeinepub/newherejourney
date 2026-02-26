import { useListAllChurches, useGetFeatureFlags, useSetFeatureFlag } from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Flag } from 'lucide-react';
import { toast } from 'sonner';
import { Church } from '../../backend';

function ChurchFlagRow({ church }: { church: Church }) {
  const { data: flags, isLoading } = useGetFeatureFlags(church.id);
  const setFlag = useSetFeatureFlag();

  const handleToggle = async (field: 'onboarding' | 'extraFeatures', value: boolean) => {
    const current = flags || { onboarding: false, extraFeatures: false };
    try {
      await setFlag.mutateAsync({
        churchId: church.id,
        onboarding: field === 'onboarding' ? value : current.onboarding,
        extraFeatures: field === 'extraFeatures' ? value : current.extraFeatures,
      });
      toast.success(`Feature flag updated for ${church.name}`);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error?.message || 'Failed to update flag');
    }
  };

  return (
    <div className="flex items-center gap-4 py-4 border-b border-gold-50 last:border-0">
      <div className="w-9 h-9 bg-gold-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <span className="text-gold-600 text-sm font-bold">{church.name.charAt(0)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-nearBlack truncate">{church.name}</p>
        <p className="text-xs text-muted-foreground truncate">{church.subdomain || church.id}</p>
      </div>
      {isLoading ? (
        <div className="flex gap-6">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
      ) : (
        <div className="flex items-center gap-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Switch
              checked={flags?.onboarding ?? false}
              onCheckedChange={(v) => handleToggle('onboarding', v)}
              disabled={setFlag.isPending}
              className="data-[state=checked]:bg-gold-500"
            />
            <span className="text-xs text-muted-foreground">Onboarding</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={flags?.extraFeatures ?? false}
              onCheckedChange={(v) => handleToggle('extraFeatures', v)}
              disabled={setFlag.isPending}
              className="data-[state=checked]:bg-gold-500"
            />
            <span className="text-xs text-muted-foreground">Extra Features</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FeatureFlagsPage() {
  const { data: churches = [], isLoading } = useListAllChurches();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-nearBlack">Feature Flags</h1>
        <p className="text-muted-foreground mt-1">Control feature availability per church</p>
      </div>

      <Card className="border-gold-100">
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Flag className="w-5 h-5 text-gold-500" />
            Church Feature Flags
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
            </div>
          ) : churches.length === 0 ? (
            <div className="py-12 text-center">
              <Flag className="w-10 h-10 text-gold-200 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No churches to configure</p>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="flex items-center gap-4 pb-3 border-b border-gold-100 mb-1">
                <div className="flex-1" />
                <div className="flex items-center gap-6 flex-shrink-0 text-xs font-semibold text-muted-foreground">
                  <span className="w-20 text-center">Onboarding</span>
                  <span className="w-24 text-center">Extra Features</span>
                </div>
              </div>
              {churches.map((church) => (
                <ChurchFlagRow key={church.id} church={church} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
