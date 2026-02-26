import React, { useState } from 'react';
import {
  useGetCallerUserProfile,
  useListJourneySteps,
  useCreateJourneyStep,
  useUpdateJourneyStep,
  useDeleteJourneyStep,
  useReorderJourneySteps,
} from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Loader2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { JourneyStep } from '../../backend';
import { generateId } from '../../lib/guestSession';

interface StepForm {
  title: string;
  description: string;
  videoUrl: string;
  ctaText: string;
  automationConfig: string;
}

const emptyForm: StepForm = { title: '', description: '', videoUrl: '', ctaText: '', automationConfig: '' };

export default function JourneyBuilderPage() {
  const { data: profile } = useGetCallerUserProfile();
  const churchId = profile?.churchId || '';

  const { data: steps, isLoading } = useListJourneySteps(churchId);
  const createStep = useCreateJourneyStep();
  const updateStep = useUpdateJourneyStep();
  const deleteStep = useDeleteJourneyStep();
  const reorderSteps = useReorderJourneySteps();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<JourneyStep | null>(null);
  const [form, setForm] = useState<StepForm>(emptyForm);

  const openCreate = () => {
    setEditingStep(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (step: JourneyStep) => {
    setEditingStep(step);
    setForm({
      title: step.title,
      description: step.description,
      videoUrl: step.videoUrl,
      ctaText: step.ctaText,
      automationConfig: step.automationConfig,
    });
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }

    try {
      if (editingStep) {
        await updateStep.mutateAsync({
          id: editingStep.id,
          churchId,
          stepNumber: editingStep.stepNumber,
          title: form.title,
          description: form.description,
          videoUrl: form.videoUrl,
          ctaText: form.ctaText,
          automationConfig: form.automationConfig,
        });
        toast.success('Step updated!');
      } else {
        const nextStep = BigInt((steps?.length || 0) + 1);
        await createStep.mutateAsync({
          id: generateId(),
          churchId,
          stepNumber: nextStep,
          title: form.title,
          description: form.description,
          videoUrl: form.videoUrl,
          ctaText: form.ctaText,
          automationConfig: form.automationConfig,
        });
        toast.success('Step created!');
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save step');
    }
  };

  const handleDelete = async (step: JourneyStep) => {
    try {
      await deleteStep.mutateAsync({ id: step.id, churchId });
      toast.success('Step deleted');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete step');
    }
  };

  const handleMove = async (step: JourneyStep, direction: 'up' | 'down') => {
    if (!steps) return;
    const sorted = [...steps].sort((a, b) => Number(a.stepNumber) - Number(b.stepNumber));
    const idx = sorted.findIndex(s => s.id === step.id);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sorted.length - 1) return;

    const newOrder = [...sorted];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];

    try {
      await reorderSteps.mutateAsync({ orderedIds: newOrder.map(s => s.id), churchId });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reorder steps');
    }
  };

  const isSaving = createStep.isPending || updateStep.isPending;
  const sortedSteps = steps ? [...steps].sort((a, b) => Number(a.stepNumber) - Number(b.stepNumber)) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Journey Builder</h1>
          <p className="text-muted-foreground">{steps?.length || 0} steps in your journey</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Step
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : sortedSteps.length > 0 ? (
        <div className="space-y-3">
          {sortedSteps.map((step, idx) => (
            <Card key={step.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {String(step.stepNumber)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{step.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{step.description}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => handleMove(step, 'up')} disabled={idx === 0 || reorderSteps.isPending}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleMove(step, 'down')} disabled={idx === sortedSteps.length - 1 || reorderSteps.isPending}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(step)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Step</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{step.title}"? This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(step)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No journey steps yet. Create your first step to get started!</p>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Step
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingStep ? 'Edit Step' : 'Create New Step'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stepTitle">Title *</Label>
              <Input id="stepTitle" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g., Welcome & Connect" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stepDesc">Description</Label>
              <Textarea id="stepDesc" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What happens in this step?" rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stepVideo">Video URL</Label>
              <Input id="stepVideo" value={form.videoUrl} onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))} placeholder="https://youtube.com/embed/..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stepCta">Call to Action Text</Label>
              <Input id="stepCta" value={form.ctaText} onChange={e => setForm(f => ({ ...f, ctaText: e.target.value }))} placeholder="e.g., I attended this service" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : 'Save Step'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
