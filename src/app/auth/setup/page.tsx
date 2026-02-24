'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2 } from 'lucide-react';

export default function SetupPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSetup(e: React.FormEvent) {
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

    setLoading(true);

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError || !authData.user) {
      setError(signUpError?.message || 'Failed to create account.');
      setLoading(false);
      return;
    }

    const { data: emp, error: empError } = await supabase
      .from('employees')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email,
        job_title: 'HR Administrator',
        department: 'Human Resources',
        employment_type: 'full_time',
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
        role: 'admin',
        employee_id: emp.id,
        last_login_at: new Date().toISOString(),
      })
      .eq('id', authData.user.id);

    if (companyName) {
      const { data: settings } = await supabase
        .from('company_settings')
        .select('id')
        .limit(1)
        .single();

      if (settings) {
        await supabase
          .from('company_settings')
          .update({ company_name: companyName })
          .eq('id', settings.id);
      }
    }

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
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg" style={{ background: 'var(--gradient-accent)', boxShadow: 'var(--shadow-glow)' }}>
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Welcome to Greystone</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Set up your administrator account</p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 backdrop-blur-sm">
          {/* Step indicators */}
          <div className="mb-6 flex gap-2">
            {[1, 2].map(s => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'bg-[var(--accent)]' : 'bg-[var(--bg-surface-hover)]'}`}
              />
            ))}
          </div>

          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleSetup} className="space-y-4">
            {step === 1 ? (
              <>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Company & Admin Details</h2>
                <Input
                  label="Company Name"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Your Company Inc."
                  required
                  autoFocus
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="First Name"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    required
                  />
                  <Input
                    label="Last Name"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    required
                  />
                </div>
                <Input
                  label="Admin Email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  required
                />
                <Button type="submit" className="w-full">
                  Continue
                </Button>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Create Your Password</h2>
                <p className="text-sm text-[var(--text-tertiary)]">
                  Setting up account for <strong className="text-[var(--text-primary)]">{email}</strong>
                </p>
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  autoFocus
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

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Back
                  </Button>
                  <Button type="submit" loading={loading} className="flex-1">
                    Create Account
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
