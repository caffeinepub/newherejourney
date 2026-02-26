import React, { useState, useMemo } from 'react';
import { useGetCallerUserProfile, useListGuests, useListJourneySteps } from '../../hooks/useQueries';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Phone, MessageSquare, Search } from 'lucide-react';
import { Guest } from '../../backend';

export default function GuestsTablePage() {
  const { data: profile } = useGetCallerUserProfile();
  const churchId = profile?.churchId || '';

  const { data: guests, isLoading } = useListGuests(churchId);
  const { data: steps } = useListJourneySteps(churchId);

  const [search, setSearch] = useState('');
  const [filterStep, setFilterStep] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'step' | 'date'>('date');

  const totalSteps = steps?.length || 0;

  const filtered = useMemo(() => {
    if (!guests) return [];
    let result = [...guests];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(g =>
        g.name.toLowerCase().includes(q) ||
        g.email.toLowerCase().includes(q) ||
        g.phone.includes(q)
      );
    }

    if (filterStep !== 'all') {
      const stepNum = parseInt(filterStep, 10);
      result = result.filter(g => Number(g.currentStep) === stepNum);
    }

    result.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'step') return Number(b.currentStep) - Number(a.currentStep);
      return Number(b.createdAt) - Number(a.createdAt);
    });

    return result;
  }, [guests, search, filterStep, sortBy]);

  const getStepBadge = (guest: Guest) => {
    const step = Number(guest.currentStep);
    if (step === 0) return <Badge variant="secondary">Not Started</Badge>;
    if (step >= totalSteps && totalSteps > 0) return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
    return <Badge variant="outline">Step {step}/{totalSteps}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Guests</h1>
        <p className="text-muted-foreground">{guests?.length || 0} total guests</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search guests..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStep} onValueChange={setFilterStep}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by step" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Steps</SelectItem>
            <SelectItem value="0">Not Started</SelectItem>
            {steps?.map(s => (
              <SelectItem key={s.id} value={String(s.stepNumber)}>Step {String(s.stepNumber)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={v => setSortBy(v as any)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Newest First</SelectItem>
            <SelectItem value="name">Name A-Z</SelectItem>
            <SelectItem value="step">Most Progress</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Interests</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length > 0 ? (
              filtered.map(guest => (
                <TableRow key={guest.id}>
                  <TableCell className="font-medium">{guest.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {guest.email && <p className="text-muted-foreground">{guest.email}</p>}
                      {guest.phone && <p className="text-muted-foreground">{guest.phone}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {guest.interests.slice(0, 2).map(i => (
                        <Badge key={i} variant="secondary" className="text-xs">{i}</Badge>
                      ))}
                      {guest.interests.length > 2 && (
                        <Badge variant="secondary" className="text-xs">+{guest.interests.length - 2}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStepBadge(guest)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {guest.phone && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={`tel:${guest.phone}`}><Phone className="h-4 w-4" /></a>
                        </Button>
                      )}
                      {guest.phone && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={`sms:${guest.phone}`}><MessageSquare className="h-4 w-4" /></a>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                  {search ? 'No guests match your search' : 'No guests yet'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
