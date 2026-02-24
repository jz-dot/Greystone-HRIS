'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Update last login
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', user.id);
    }

    router.push('/');
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
      {/* Background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'var(--gradient-hero)' }}
      />

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg" style={{ background: 'var(--gradient-accent)', boxShadow: 'var(--shadow-glow)' }}>
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Greystone</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Human Resources, Simplified</p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 backdrop-blur-sm">
          <h2 className="mb-6 text-lg font-semibold text-[var(--text-primary)]">Sign in to your account</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoFocus
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Your password"
              required
            />

            {error && (
              <div className="rounded-lg bg-[var(--color-danger-bg)] border border-[var(--color-danger-text)]/20 px-4 py-3 text-sm text-[var(--color-danger-text)]">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full">
              Sign In
            </Button>
          </form>

          <div className="mt-6 border-t border-[var(--border)] pt-4">
            <p className="text-center text-sm text-[var(--text-muted)]">
              Have an invitation code?{' '}
              <Link href="/auth/invite" className="font-medium text-[var(--accent)] hover:text-[var(--accent-light)] transition-colors">
                Accept Invitation
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-[var(--text-muted)]">
          First time? Ask your administrator for an invitation.
        </p>
      </div>
    </div>
  );
}
