'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getInitials, formatDate, maskSIN } from '@/lib/utils';
import type { Employee, Profile } from '@/types/database';
import { ROLE_LABELS } from '@/types/database';
import { Save } from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postal, setPostal] = useState('');
  const [ecName, setEcName] = useState('');
  const [ecRelation, setEcRelation] = useState('');
  const [ecPhone, setEcPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const supabase = createClient();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    setProfile(prof);

    if (prof?.employee_id) {
      const { data: emp } = await supabase
        .from('employees')
        .select('*')
        .eq('id', prof.employee_id)
        .single();
      if (emp) {
        setEmployee(emp);
        setPhone(emp.phone);
        setStreet(emp.address_street);
        setCity(emp.address_city);
        setProvince(emp.address_province);
        setPostal(emp.address_postal_code);
        setEcName(emp.emergency_contact_name);
        setEcRelation(emp.emergency_contact_relationship);
        setEcPhone(emp.emergency_contact_phone);
      }
    }
  }

  async function handleSave() {
    if (!employee) return;
    setSaving(true);
    setSuccess('');

    await supabase
      .from('employees')
      .update({
        phone,
        address_street: street,
        address_city: city,
        address_province: province,
        address_postal_code: postal,
        emergency_contact_name: ecName,
        emergency_contact_relationship: ecRelation,
        emergency_contact_phone: ecPhone,
      })
      .eq('id', employee.id);

    setEditing(false);
    setSaving(false);
    setSuccess('Profile updated successfully.');
    load();
  }

  if (!employee || !profile) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--spinner-track)] border-t-[var(--spinner-fill)]" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Profile</h1>

      {success && (
        <div className="rounded-lg bg-[var(--color-success-bg)] px-4 py-3 text-sm text-[var(--color-success-text)]">{success}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent>
            <div className="flex flex-col items-center py-4">
              <Avatar initials={getInitials(employee.first_name, employee.last_name)} size="lg" />
              <h2 className="mt-3 text-lg font-semibold text-[var(--text-primary)]">
                {employee.first_name} {employee.last_name}
              </h2>
              <p className="text-sm text-[var(--text-tertiary)]">{employee.job_title}</p>
              <div className="mt-2 flex gap-2">
                <Badge variant="info">{employee.department}</Badge>
                <Badge variant="default">{ROLE_LABELS[profile.role]}</Badge>
              </div>
            </div>
            <div className="mt-2 space-y-3 border-t border-[var(--border)] pt-4 text-sm">
              <div className="flex justify-between"><span className="text-[var(--text-tertiary)]">Email</span><span className="font-medium text-[var(--text-primary)]">{employee.email}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-tertiary)]">Start Date</span><span className="font-medium text-[var(--text-primary)]">{formatDate(employee.start_date)}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-tertiary)]">Type</span><span className="font-medium text-[var(--text-primary)]">{employee.employment_type.replace('_', '-')}</span></div>
            </div>
          </CardContent>
        </Card>

        {/* Editable details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Leave Balances */}
          <Card>
            <CardHeader><h3 className="font-semibold text-[var(--text-primary)]">Leave Balances</h3></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-[var(--blue-bg)] p-4">
                  <p className="text-sm text-[var(--blue-text)]">Vacation</p>
                  <p className="mt-1 text-2xl font-bold text-[var(--blue-text)]">{employee.vacation_days_remaining}</p>
                  <p className="text-xs text-[var(--blue-text-muted)]">of {employee.vacation_days_entitled} days</p>
                </div>
                <div className="rounded-lg bg-[var(--red-bg)] p-4">
                  <p className="text-sm text-[var(--red-text)]">Sick Days</p>
                  <p className="mt-1 text-2xl font-bold text-[var(--red-text)]">{employee.sick_days_remaining}</p>
                  <p className="text-xs text-[var(--red-text-muted)]">of {employee.sick_days_entitled} days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[var(--text-primary)]">Contact Information</h3>
                {!editing && (
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-4">
                  <Input label="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
                  <Input label="Street Address" value={street} onChange={e => setStreet(e.target.value)} />
                  <div className="grid grid-cols-3 gap-3">
                    <Input label="City" value={city} onChange={e => setCity(e.target.value)} />
                    <Input label="Province" value={province} onChange={e => setProvince(e.target.value)} />
                    <Input label="Postal Code" value={postal} onChange={e => setPostal(e.target.value)} />
                  </div>
                  <div className="border-t border-[var(--border)] pt-4">
                    <p className="mb-3 text-sm font-medium text-[var(--text-secondary)]">Emergency Contact</p>
                    <div className="grid grid-cols-3 gap-3">
                      <Input label="Name" value={ecName} onChange={e => setEcName(e.target.value)} />
                      <Input label="Relationship" value={ecRelation} onChange={e => setEcRelation(e.target.value)} />
                      <Input label="Phone" value={ecPhone} onChange={e => setEcPhone(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                    <Button onClick={handleSave} loading={saving}>
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-[var(--text-tertiary)]">Phone</span><span className="text-[var(--text-primary)]">{phone || 'Not set'}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-tertiary)]">Address</span><span className="text-[var(--text-primary)]">{street ? `${street}, ${city}, ${province} ${postal}` : 'Not set'}</span></div>
                  <div className="border-t border-[var(--border)] pt-3">
                    <p className="mb-2 font-medium text-[var(--text-secondary)]">Emergency Contact</p>
                    <div className="flex justify-between"><span className="text-[var(--text-tertiary)]">Name</span><span className="text-[var(--text-primary)]">{ecName || 'Not set'}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--text-tertiary)]">Relationship</span><span className="text-[var(--text-primary)]">{ecRelation || 'Not set'}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--text-tertiary)]">Phone</span><span className="text-[var(--text-primary)]">{ecPhone || 'Not set'}</span></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
