import { useState, useEffect, useRef, useCallback } from 'react';
import { useGetCallerUserProfile, useGetChurch, useUpdateChurchBranding } from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Palette, Save, Loader2, Eye, Plus, X, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';

// ---- helpers ----------------------------------------------------------------

interface CampusSettings {
  campus: string;
  serviceTimes: string[];
}

function parseSettings(raw: string): CampusSettings {
  try {
    const parsed = JSON.parse(raw);
    return {
      campus: typeof parsed?.campus === 'string' ? parsed.campus : '',
      serviceTimes: Array.isArray(parsed?.serviceTimes) ? parsed.serviceTimes.map(String) : [],
    };
  } catch {
    return { campus: '', serviceTimes: [] };
  }
}

function serializeSettings(data: CampusSettings): string {
  return JSON.stringify({ campus: data.campus, serviceTimes: data.serviceTimes }, null, 2);
}

// ---- CampusSettingsEditor ---------------------------------------------------

interface ServiceTimeEntry {
  id: string;
  value: string;
}

interface CampusSettingsEditorProps {
  settings: string;
  onChange: (value: string) => void;
}

let _idCounter = 0;
function makeId() { return `st-${++_idCounter}`; }

function toEntries(times: string[]): ServiceTimeEntry[] {
  const list = times.length > 0 ? times : [''];
  return list.map((v) => ({ id: makeId(), value: v }));
}

function CampusSettingsEditor({ settings, onChange }: CampusSettingsEditorProps) {
  const initialParsed = parseSettings(settings);

  const [campusName, setCampusName] = useState(initialParsed.campus);
  const [entries, setEntries] = useState<ServiceTimeEntry[]>(() => toEntries(initialParsed.serviceTimes));

  // Track the last settings value we synced from so we don't re-sync during
  // user edits (only sync when the parent resets the value, e.g. after load).
  const lastSyncedRef = useRef(settings);

  useEffect(() => {
    // Sync only when the parent provides a *new* settings string that differs
    // from what we last emitted (i.e. an external reset, not our own onChange).
    if (settings !== lastSyncedRef.current) {
      lastSyncedRef.current = settings;
      const p = parseSettings(settings);
      setCampusName(p.campus);
      setEntries(toEntries(p.serviceTimes));
    }
  }, [settings]);

  const emit = useCallback((campus: string, times: ServiceTimeEntry[]) => {
    const json = serializeSettings({ campus, serviceTimes: times.map((e) => e.value) });
    lastSyncedRef.current = json;
    onChange(json);
  }, [onChange]);

  const handleCampusChange = (val: string) => {
    setCampusName(val);
    emit(val, entries);
  };

  const handleTimeChange = (id: string, val: string) => {
    const updated = entries.map((e) => e.id === id ? { ...e, value: val } : e);
    setEntries(updated);
    emit(campusName, updated);
  };

  const addTime = () => {
    const updated = [...entries, { id: makeId(), value: '' }];
    setEntries(updated);
    emit(campusName, updated);
  };

  const removeTime = (id: string) => {
    const filtered = entries.filter((e) => e.id !== id);
    const final = filtered.length > 0 ? filtered : [{ id: makeId(), value: '' }];
    setEntries(final);
    emit(campusName, final);
  };

  const handleJsonChange = (val: string) => {
    lastSyncedRef.current = val;
    onChange(val);
    const p = parseSettings(val);
    setCampusName(p.campus);
    setEntries(toEntries(p.serviceTimes));
  };

  const hasAnyPreview = campusName || entries.some((e) => e.value.trim());
  const isEmptySettings = settings.trim() === '';

  return (
    <div className="space-y-2">
      <Label>Campus & Service Times</Label>
      <Tabs defaultValue="simple">
        <TabsList className="mb-3 bg-muted border border-border">
          <TabsTrigger value="simple" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
            Simple View
          </TabsTrigger>
          <TabsTrigger value="json" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
            JSON Editor
          </TabsTrigger>
        </TabsList>

        {/* ---- Simple View ---- */}
        <TabsContent value="simple" className="space-y-4 mt-0">
          {isEmptySettings && (
            <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              No campus info configured yet. Fill in the fields below to get started.
            </div>
          )}

          {/* Campus Name */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Campus Name
            </Label>
            <Input
              placeholder="Main Campus"
              value={campusName}
              onChange={(e) => handleCampusChange(e.target.value)}
            />
          </div>

          {/* Service Times */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Service Times
            </Label>
            <div className="space-y-2">
              {entries.map((entry, idx) => (
                <div key={entry.id} className="flex items-center gap-2">
                  <Input
                    placeholder={idx === 0 ? 'Sunday 9:00 AM' : 'Sunday 11:00 AM'}
                    value={entry.value}
                    onChange={(e) => handleTimeChange(entry.id, e.target.value)}
                  />
                  {entries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTime(entry.id)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      aria-label="Remove service time"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTime}
              className="gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add service time
            </Button>
          </div>

          {/* Live preview */}
          {hasAnyPreview && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preview</p>
              {campusName && (
                <p className="font-semibold text-foreground text-sm">{campusName}</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {entries.filter((e) => e.value.trim()).map((e) => (
                  <Badge
                    key={e.id}
                    variant="outline"
                    className="text-xs"
                  >
                    {e.value}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ---- JSON Editor ---- */}
        <TabsContent value="json" className="mt-0">
          <Textarea
            placeholder={'{\n  "campus": "Main Campus",\n  "serviceTimes": ["Sunday 9am", "Sunday 11am"]\n}'}
            value={settings}
            onChange={(e) => handleJsonChange(e.target.value)}
            className="font-mono text-xs resize-none"
            rows={6}
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Advanced: edit raw JSON. Switching back to Simple View will parse this automatically.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---- Page -------------------------------------------------------------------

export default function BrandingPage() {
  const { data: profile } = useGetCallerUserProfile();
  const churchId = profile?.churchId || '';
  const { data: church, isLoading } = useGetChurch(churchId);
  const updateBranding = useUpdateChurchBranding();

  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#C9A84C');
  const [subdomain, setSubdomain] = useState('');
  const [settings, setSettings] = useState('');

  useEffect(() => {
    if (church) {
      setLogoUrl(church.logoUrl || '');
      setPrimaryColor(church.primaryColor || '#C9A84C');
      setSubdomain(church.subdomain || '');
      setSettings(church.settings || '');
    }
  }, [church]);

  const handleSave = async () => {
    if (!churchId) {
      toast.error('No church associated');
      return;
    }
    try {
      await updateBranding.mutateAsync({ id: churchId, logoUrl, primaryColor, subdomain, settings });
      toast.success('Branding updated!');
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error?.message || 'Failed to update branding');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-serif text-3xl font-bold text-nearBlack">Branding</h1>
        <p className="text-muted-foreground mt-1">Customize your church's look and feel</p>
      </div>

      {/* Preview */}
      <Card className="border-border overflow-hidden">
        <div
          className="h-16 w-full"
          style={{ backgroundColor: primaryColor || '#C9A84C' }}
        />
        <CardContent className="p-5 flex items-center gap-4">
          {logoUrl ? (
            <img src={logoUrl} alt="Church logo" className="h-12 w-auto object-contain rounded" />
          ) : (
            <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
              <Palette className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="font-serif font-bold text-nearBlack">{church?.name || 'Your Church'}</p>
            <p className="text-sm text-muted-foreground">{subdomain ? `${subdomain}.newherejourney.com` : 'subdomain.newherejourney.com'}</p>
          </div>
          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-border text-foreground hover:bg-muted"
              onClick={() => {
                const url = subdomain
                  ? `https://${subdomain}.newherejourney.com`
                  : `${window.location.origin}/guest`;
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
            >
              <Eye className="w-4 h-4" />
              Preview
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-serif text-lg">Church Identity</CardTitle>
          <CardDescription>Update your church's visual identity and settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Logo URL</Label>
            <Input
              placeholder="https://yourchurch.com/logo.png"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Enter a direct URL to your church logo image</p>
          </div>

          <div className="space-y-2">
            <Label>Primary Color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-10 rounded-lg border border-border cursor-pointer p-1"
              />
              <Input
                placeholder="#C9A84C"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Subdomain</Label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="gracechurch"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">.newherejourney.com</span>
            </div>
          </div>

          {/* Campus & Service Times — Simple View / JSON Editor */}
          <CampusSettingsEditor settings={settings} onChange={setSettings} />

          <Button
            onClick={handleSave}
            disabled={updateBranding.isPending}
            className="w-full"
          >
            {updateBranding.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" />Save Branding</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
