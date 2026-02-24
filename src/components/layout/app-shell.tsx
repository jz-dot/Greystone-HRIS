'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sidebar } from './sidebar';
import type { Profile, Employee } from '@/types/database';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        if (profileData.employee_id) {
          const { data: empData } = await supabase
            .from('employees')
            .select('*')
            .eq('id', profileData.employee_id)
            .single();
          if (empData) setEmployee(empData);
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/auth/login');
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--spinner-track)] border-t-[var(--spinner-fill)]" />
          <p className="text-sm text-[var(--text-muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const userName = employee
    ? `${employee.first_name} ${employee.last_name}`
    : profile.email;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Sidebar role={profile.role} userName={userName} onLogout={handleLogout} />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 pt-16 lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
