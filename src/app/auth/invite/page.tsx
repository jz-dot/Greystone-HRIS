'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail } from 'lucide-react';

export default function InviteAcceptPage() {
  const [step, setStep] = useState<'code' | 'register'>('code');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteData, setInviteData] = useState<{ email: string; role: string } | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: fetchError } = await supabase
      .from('invitations')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase().trim())
      .eq('status', 'pending')
      .single();

    if (fetchError || !data) {
      setError('Invalid or expired invitation code.');
      setLoading(false);
      return;
    }

    if (new Date(data.expires_at) < new Date()) {
      setError('This invitation has expired. Please request a new one.');
      setLoading(false);
      return;
    }

    setInviteData({ email: data.email, role: data.role });
    setStep('register');
    setLoading(false);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!inviteData) return;

    setLoading(true);

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: inviteData.email,
      password,
    });

    if (signUpError || !authData.user) {
      setError(signUpError?.message || 'Failed to create account.');
      setLoading(false);
      return;
    }

    const { data: settings } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1)
      .single();

    const { data: emp, error: empError } = await supabase
      .from('employees')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: inviteData.email,
        department: 'Unassigned',
        sick_days_remaining: settings?.default_sick_days ?? 10,
        vacation_days_remaining: settings?.default_vacation_days ?? 15,
        sick_days_entitled: settings?.default_sick_days ?? 10,
        vacation_days_entitled: settings?.default_vacation_days ?? 15,
        pay_frequency: settings?.default_pay_frequency ?? 'bi_weekly',
      })
      .select()
      .single();

    if (empError || !emp) {
      setError('Failed to create employee record.');
      setLoading(false);
      return;
    }

    await supabase
      .from('profiles')
      .update({
        role: inviteData.role,
        employee_id: emp.id,
        last_login_at: new Date().toISOString(),
      })
      .eq('id', authData.user.id);

    await supabase
      .from('invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('invite_code', inviteCode.toUpperCase().trim());

    router.push('/');
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'var(--gradient-hero)' }}
      />

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg" style={{ background: 'var(--gradient-accent)', boxShadow: 'var(--shadow-glow)' }}>
            <Mail className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Accept Invitation</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {step === 'code'
              ? 'Enter the invitation code from your administrator'
              : `Creating account for ${inviteData?.email}`}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 backdrop-blur-sm">
          {step === 'code' ? (
            <form onSubmit={verifyCode} className="space-y-4">
              <Input
                label="Invitation Code"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)}
                placeholder="e.g. ABC12345"
                required
                autoFocus
                className="text-center text-lg tracking-widest uppercase"
              />

              {error && (
                <div className="rounded-lg bg-[var(--color-danger-bg)] border border-[var(--color-danger-text)]/20 px-4 py-3 text-sm text-[var(--color-danger-text)]">{error}</div>
              )}

              <Button type="submit" loading={loading} variant="secondary" className="w-full">
                Verify Code
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="rounded-lg bg-[var(--color-success-bg)] border border-[var(--accent)]/20 px-4 py-3 text-sm text-[var(--color-success-text)]">
                You&apos;ve been invited as <strong className="capitalize">{inviteData?.role}</strong>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  required
                  autoFocus
                />
                <Input
                  label="Last Name"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />

              {error && (
                <div className="rounded-lg bg-[var(--color-danger-bg)] border border-[var(--color-danger-text)]/20 px-4 py-3 text-sm text-[var(--color-danger-text)]">{error}</div>
              )}

              <Button type="submit" loading={loading} className="w-full">
                Create Account
              </Button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-[var(--text-muted)]">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-[var(--accent)] hover:text-[var(--accent-light)] transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
