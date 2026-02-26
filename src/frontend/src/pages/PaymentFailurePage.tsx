import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function PaymentFailurePage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md px-4">
        <XCircle className="h-16 w-16 text-destructive mx-auto" />
        <h1 className="text-3xl font-bold text-foreground">Payment Cancelled</h1>
        <p className="text-muted-foreground">Your payment was not completed. You can try again from the billing page.</p>
        <Button onClick={() => navigate({ to: '/admin/billing' })}>Back to Billing</Button>
      </div>
    </div>
  );
}
