import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Heart, Users, MapPin, BarChart3, ArrowRight, Church } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const year = new Date().getFullYear();
  const appId = encodeURIComponent(window.location.hostname || 'newherejourney');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <img src="/assets/generated/newherejourney-logo.dim_320x80.png" alt="NewHere Journey" className="h-10 object-contain" />
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate({ to: '/guest/welcome' })}>
              I'm a Guest
            </Button>
            <Button onClick={() => navigate({ to: '/admin/dashboard' })}>
              Admin Portal
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src="/assets/generated/hero-bg.dim_1440x600.png"
          alt="Hero"
          className="w-full h-[500px] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/40 flex items-center">
          <div className="max-w-6xl mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Welcome New Guests<br />with Confidence
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-xl">
              NewHere Journey helps churches guide first-time visitors through a personalized onboarding experience.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" variant="secondary" onClick={() => navigate({ to: '/guest/welcome' })}>
                Start Guest Journey
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20" onClick={() => navigate({ to: '/admin/signup' })}>
                <Church className="h-4 w-4 mr-2" />
                Set Up Your Church
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">Everything your church needs</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, title: 'Guest Tracking', desc: 'Track every first-time visitor through their journey' },
              { icon: MapPin, title: 'Journey Builder', desc: 'Create custom onboarding steps for your church' },
              { icon: Heart, title: 'Decision Hub', desc: 'Record spiritual decisions and follow-up actions' },
              { icon: BarChart3, title: 'Analytics', desc: 'Understand guest retention and engagement' },
            ].map((f) => (
              <div key={f.title} className="p-6 rounded-xl border border-border bg-card text-center">
                <f.icon className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to welcome your guests?</h2>
          <p className="text-primary-foreground/80 mb-8">Create your church account in minutes and start tracking guest journeys today.</p>
          <Button size="lg" variant="secondary" onClick={() => navigate({ to: '/admin/signup' })}>
            Get Started Free
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {year} NewHere Journey. Built with <Heart className="inline h-3 w-3 text-red-500" /> using{' '}
            <a href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">caffeine.ai</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
