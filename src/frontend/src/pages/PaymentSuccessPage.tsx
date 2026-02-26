import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md px-4">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        <h1 className="text-3xl font-bold text-foreground">Payment Successful!</h1>
        <p className="text-muted-foreground">Your subscription has been activated. Welcome to NewHere Journey!</p>
        <Button onClick={() => navigate({ to: '/admin/dashboard' })}>Go to Dashboard</Button>
      </div>
    </div>
  );
}
