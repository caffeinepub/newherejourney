import { useState } from 'react';
import { useListAllChurches, useCreateJourneyStep } from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Download, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TemplateStep {
  title: string;
  description: string;
  ctaText: string;
  videoUrl: string;
}

interface JourneyTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: TemplateStep[];
}

const TEMPLATES: JourneyTemplate[] = [
  {
    id: 'standard-6-week',
    name: 'Standard 6-Week Journey',
    description: 'A classic newcomer journey covering first visit through membership.',
    category: 'General',
    steps: [
      { title: 'Your First Sunday', description: 'Welcome to your first Sunday! Learn about parking, service times, and what to expect.', ctaText: 'I Was Here!', videoUrl: '' },
      { title: 'Newcomer Lunch', description: 'Join us for a casual lunch to meet the pastoral team and other newcomers.', ctaText: 'RSVP Now', videoUrl: '' },
      { title: 'Join a Small Group', description: 'Find your community in one of our interest-based small groups.', ctaText: 'Find a Group', videoUrl: '' },
      { title: 'Serve Somewhere', description: 'Discover your gifts and find a place to serve in our church family.', ctaText: 'Explore Teams', videoUrl: '' },
      { title: 'Foundations Class', description: 'Learn about our church\'s beliefs, vision, and values in this 2-hour class.', ctaText: 'Register', videoUrl: '' },
      { title: 'Membership', description: 'Take the final step and officially join our church family as a member.', ctaText: 'Become a Member', videoUrl: '' },
    ],
  },
  {
    id: 'quick-connect',
    name: 'Quick Connect (3 Steps)',
    description: 'A streamlined 3-step journey for smaller churches or faster assimilation.',
    category: 'Simple',
    steps: [
      { title: 'Welcome & Connect', description: 'Fill out a connection card and meet our welcome team.', ctaText: 'Connect Now', videoUrl: '' },
      { title: 'Next Steps Class', description: 'A one-hour class covering faith basics and church life.', ctaText: 'Attend Class', videoUrl: '' },
      { title: 'Get Involved', description: 'Choose a small group or serving team to join.', ctaText: 'Get Involved', videoUrl: '' },
    ],
  },
  {
    id: 'decision-focused',
    name: 'Decision-Focused Journey',
    description: 'Designed to guide guests toward key faith decisions.',
    category: 'Evangelism',
    steps: [
      { title: 'Explore Faith', description: 'An open, no-pressure introduction to the Christian faith.', ctaText: 'Learn More', videoUrl: '' },
      { title: 'Alpha Course', description: 'Join our Alpha course to explore life\'s big questions.', ctaText: 'Join Alpha', videoUrl: '' },
      { title: 'Follow Jesus', description: 'Ready to make a decision? We\'d love to walk with you.', ctaText: 'I\'m Ready', videoUrl: '' },
      { title: 'Baptism', description: 'Celebrate your new faith publicly through baptism.', ctaText: 'Get Baptized', videoUrl: '' },
    ],
  },
];

export default function TemplatePage() {
  const { data: churches = [], isLoading: churchesLoading } = useListAllChurches();
  const createStep = useCreateJourneyStep();
  const [selectedChurch, setSelectedChurch] = useState('');
  const [importing, setImporting] = useState<string | null>(null);
  const [imported, setImported] = useState<string[]>([]);

  const handleImport = async (template: JourneyTemplate) => {
    if (!selectedChurch) {
      toast.error('Please select a church first');
      return;
    }

    setImporting(template.id);
    try {
      for (let i = 0; i < template.steps.length; i++) {
        const step = template.steps[i];
        const id = `step_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`;
        await createStep.mutateAsync({
          id,
          churchId: selectedChurch,
          stepNumber: BigInt(i + 1),
          title: step.title,
          description: step.description,
          videoUrl: step.videoUrl,
          ctaText: step.ctaText,
          automationConfig: '',
        });
      }
      setImported((prev) => [...prev, `${template.id}-${selectedChurch}`]);
      toast.success(`"${template.name}" imported successfully!`);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error?.message || 'Failed to import template');
    } finally {
      setImporting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-nearBlack">Template Library</h1>
        <p className="text-muted-foreground mt-1">Pre-built journey templates to import into any church</p>
      </div>

      {/* Church selector */}
      <Card className="border-gold-100">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-nearBlack mb-1">Target Church</p>
            <Select value={selectedChurch} onValueChange={setSelectedChurch}>
              <SelectTrigger className="border-gold-200">
                <SelectValue placeholder="Select a church to import into..." />
              </SelectTrigger>
              <SelectContent>
                {churches.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedChurch && (
            <div className="text-xs text-muted-foreground">
              Templates will be added to this church's journey builder
            </div>
          )}
        </CardContent>
      </Card>

      {/* Templates */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {TEMPLATES.map((template) => {
          const isImporting = importing === template.id;
          const isImported = imported.includes(`${template.id}-${selectedChurch}`);

          return (
            <Card key={template.id} className="border-gold-100 hover:shadow-gold transition-shadow flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 bg-gold-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-gold-600" />
                  </div>
                  <Badge className="bg-gold-50 text-gold-700 border border-gold-200 text-xs">
                    {template.category}
                  </Badge>
                </div>
                <CardTitle className="font-serif text-lg mt-2">{template.name}</CardTitle>
                <CardDescription className="text-sm">{template.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                  {template.steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="w-5 h-5 bg-gold-100 rounded-full flex items-center justify-center text-gold-600 font-bold flex-shrink-0">
                        {i + 1}
                      </span>
                      {step.title}
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => handleImport(template)}
                  disabled={isImporting || isImported || !selectedChurch}
                  className={`w-full rounded-xl font-semibold ${
                    isImported
                      ? 'bg-green-100 text-green-700 cursor-default'
                      : 'bg-gold-500 hover:bg-gold-600 text-nearBlack'
                  }`}
                >
                  {isImporting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importing...</>
                  ) : isImported ? (
                    <><CheckCircle2 className="w-4 h-4 mr-2" />Imported!</>
                  ) : (
                    <><Download className="w-4 h-4 mr-2" />Import Template</>
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
