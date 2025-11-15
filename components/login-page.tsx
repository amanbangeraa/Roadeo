'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/context';
import type { UserRole } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Activity } from 'lucide-react';

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  municipal_agent: 'Full access to all reports, analytics, and management features',
  vehicle_owner: 'View pothole data and your vehicle contribution statistics',
  public: 'View pothole reports and basic statistics',
};

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('municipal_agent');
  const { login } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      login(email, selectedRole);
    }
  };

  const roles: UserRole[] = ['municipal_agent', 'vehicle_owner', 'public'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 shadow-2xl">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <Activity className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">RoadPulse</h1>
          </div>
          <p className="text-center text-muted-foreground text-sm mb-8">
            AI-Driven Road Condition Monitoring
          </p>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-input border-border/50"
                required
              />
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Select Your Role
              </label>
              <div className="space-y-2">
                {roles.map((role) => (
                  <label
                    key={role}
                    className="flex items-start p-3 rounded-lg border border-border/50 cursor-pointer hover:bg-secondary/50 transition-colors"
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={selectedRole === role}
                      onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-foreground capitalize">
                        {role.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ROLE_DESCRIPTIONS[role]}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={!email.trim()}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              Sign In
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Demo mode: Any email accepted for testing
          </p>
        </div>
      </Card>
    </div>
  );
}
