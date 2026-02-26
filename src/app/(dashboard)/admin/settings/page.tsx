'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Save } from 'lucide-react';
import type { CompanySettings } from '@/types/database';

const timeZoneOptions = [
  { value: 'America/St_Johns', label: 'America/St_Johns (NT)' },
  { value: 'America/Halifax', label: 'America/Halifax (AT)' },
  { value: 'America/Moncton', label: 'America/Moncton (AT)' },
  { value: 'America/Toronto', label: 'America/Toronto (ET)' },
  { value: 'America/Winnipeg', label: 'America/Winnipeg (CT)' },
  { value: 'America/Regina', label: 'America/Regina (CT - no DST)' },
  { value: 'America/Edmonton', label: 'America/Edmonton (MT)' },
  { value: 'America/Vancouver', label: 'America/Vancouver (PT)' },
];

const currencyOptions = [
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'USD', label: 'USD - US Dollar' },
];

const weekStartOptions = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

const payFrequencyOptions = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi_weekly', label: 'Bi-Weekly' },
  { value: 'semi_monthly', label: 'Semi-Monthly' },
  { value: 'monthly', label: 'Monthly' },
];

export default function CompanySettingsPage() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [operatingName, setOperatingName] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressProvince, setAddressProvince] = useState('');
  const [addressPostalCode, setAddressPostalCode] = useState('');
  const [country, setCountry] = useState('CA');
  const [timeZone, setTimeZone] = useState('America/Toronto');
  const [currency, setCurrency] = useState('CAD');
  const [weekStartsOn, setWeekStartsOn] = useState('monday');
  const [defaultLanguage, setDefaultLanguage] = useState('en-CA');
  const [hrContactEmail, setHrContactEmail] = useState('');
  const [defaultSickDays, setDefaultSickDays] = useState(0);
  const [defaultVacationDays, setDefaultVacationDays] = useState(0);
  const [defaultPayFrequency, setDefaultPayFrequency] = useState('bi_weekly');
  const [autoApproveEnabled, setAutoApproveEnabled] = useState(false);
  const [autoApproveSickThreshold, setAutoApproveSickThreshold] = useState(0);
  const [autoApprovePersonalThreshold, setAutoApprovePersonalThreshold] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1)
      .single();

    if (fetchError) {
      setError('Failed to load company settings.');
      setLoading(false);
      return;
    }

    if (data) {
      setSettings(data);
      setCompanyName(data.company_name ?? '');
      setOperatingName(data.operating_name ?? '');
      setBusinessNumber(data.business_number ?? '');
      setAddressStreet(data.address_street ?? '');
      setAddressCity(data.address_city ?? '');
      setAddressProvince(data.address_province ?? '');
      setAddressPostalCode(data.address_postal_code ?? '');
      setCountry(data.country ?? 'CA');
      setTimeZone(data.time_zone ?? 'America/Toronto');
      setCurrency(data.currency ?? 'CAD');
      setWeekStartsOn(data.week_starts_on ?? 'monday');
      setDefaultLanguage(data.default_language ?? 'en-CA');
      setHrContactEmail(data.hr_contact_email ?? '');
      setDefaultSickDays(data.default_sick_days ?? 0);
      setDefaultVacationDays(data.default_vacation_days ?? 0);
      setDefaultPayFrequency(data.default_pay_frequency ?? 'bi_weekly');
      setAutoApproveEnabled(data.auto_approve_enabled ?? false);
      setAutoApproveSickThreshold(data.auto_approve_sick_threshold ?? 0);
      setAutoApprovePersonalThreshold(data.auto_approve_personal_threshold ?? 0);
    }

    setLoading(false);
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setSuccess('');
    setError('');

    const { error: updateError } = await supabase
      .from('company_settings')
      .update({
        company_name: companyName,
        operating_name: operatingName,
        business_number: businessNumber,
        address_street: addressStreet,
        address_city: addressCity,
        address_province: addressProvince,
        address_postal_code: addressPostalCode,
        country,
        time_zone: timeZone,
        currency,
        week_starts_on: weekStartsOn,
        default_language: defaultLanguage,
        hr_contact_email: hrContactEmail,
        default_sick_days: defaultSickDays,
        default_vacation_days: defaultVacationDays,
        default_pay_frequency: defaultPayFrequency,
        auto_approve_enabled: autoApproveEnabled,
        auto_approve_sick_threshold: autoApproveSickThreshold,
        auto_approve_personal_threshold: autoApprovePersonalThreshold,
      })
      .eq('id', settings.id);

    if (updateError) {
      setError('Failed to save settings: ' + updateError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setSuccess('Company settings saved successfully.');
    loadSettings();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--spinner-track)] border-t-[var(--spinner-fill)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Company Settings</h2>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            Manage your organization details, defaults, and policies.
          </p>
        </div>
        <Button onClick={handleSave} loading={saving}>
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      {/* Success / Error messages */}
      {success && (
        <div className="rounded-lg bg-[var(--color-success-bg)] px-4 py-3 text-sm text-[var(--color-success-text)]">
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-[var(--color-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger-text)]">
          {error}
        </div>
      )}

      {/* Company Identity */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-[var(--text-primary)]">Company Identity</h3>
          <p className="text-sm text-[var(--text-tertiary)]">Legal and operating names for your business.</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Company Name"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="Legal company name"
            />
            <Input
              label="Operating Name"
              value={operatingName}
              onChange={e => setOperatingName(e.target.value)}
              placeholder="DBA or trade name"
            />
            <Input
              label="Business Number"
              value={businessNumber}
              onChange={e => setBusinessNumber(e.target.value)}
              placeholder="e.g. 123456789RC0001"
            />
            <Input
              label="HR Contact Email"
              type="email"
              value={hrContactEmail}
              onChange={e => setHrContactEmail(e.target.value)}
              placeholder="hr@company.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-[var(--text-primary)]">Address</h3>
          <p className="text-sm text-[var(--text-tertiary)]">Primary business address used for official documents.</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              label="Street"
              value={addressStreet}
              onChange={e => setAddressStreet(e.target.value)}
              placeholder="123 Main Street"
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="City"
                value={addressCity}
                onChange={e => setAddressCity(e.target.value)}
                placeholder="Toronto"
              />
              <Input
                label="Province"
                value={addressProvince}
                onChange={e => setAddressProvince(e.target.value)}
                placeholder="ON"
              />
              <Input
                label="Postal Code"
                value={addressPostalCode}
                onChange={e => setAddressPostalCode(e.target.value)}
                placeholder="M5V 1A1"
              />
            </div>
            <Input
              label="Country"
              value={country}
              onChange={e => setCountry(e.target.value)}
              placeholder="CA"
            />
          </div>
        </CardContent>
      </Card>

      {/* Regional & Locale */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-[var(--text-primary)]">Regional &amp; Locale</h3>
          <p className="text-sm text-[var(--text-tertiary)]">Time zone, currency, and language preferences.</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Time Zone"
              options={timeZoneOptions}
              value={timeZone}
              onChange={e => setTimeZone(e.target.value)}
            />
            <Select
              label="Currency"
              options={currencyOptions}
              value={currency}
              onChange={e => setCurrency(e.target.value)}
            />
            <Select
              label="Week Starts On"
              options={weekStartOptions}
              value={weekStartsOn}
              onChange={e => setWeekStartsOn(e.target.value)}
            />
            <Input
              label="Default Language"
              value={defaultLanguage}
              onChange={e => setDefaultLanguage(e.target.value)}
              placeholder="en-CA"
            />
          </div>
        </CardContent>
      </Card>

      {/* Leave & Payroll Defaults */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-[var(--text-primary)]">Leave &amp; Payroll Defaults</h3>
          <p className="text-sm text-[var(--text-tertiary)]">Default entitlements applied to new employees.</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Default Sick Days"
              type="number"
              min={0}
              value={defaultSickDays}
              onChange={e => setDefaultSickDays(Number(e.target.value))}
            />
            <Input
              label="Default Vacation Days"
              type="number"
              min={0}
              value={defaultVacationDays}
              onChange={e => setDefaultVacationDays(Number(e.target.value))}
            />
            <Select
              label="Default Pay Frequency"
              options={payFrequencyOptions}
              value={defaultPayFrequency}
              onChange={e => setDefaultPayFrequency(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Auto-Approval */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-[var(--text-primary)]">Auto-Approval Settings</h3>
          <p className="text-sm text-[var(--text-tertiary)]">
            Configure automatic approval for short leave requests.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {/* Toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <button
                type="button"
                role="switch"
                aria-checked={autoApproveEnabled}
                onClick={() => setAutoApproveEnabled(!autoApproveEnabled)}
                className={`
                  relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent
                  transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2
                  focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2
                  focus-visible:ring-offset-[var(--bg-primary)]
                  ${autoApproveEnabled ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}
                `}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm
                    ring-0 transition-transform duration-200
                    ${autoApproveEnabled ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                Enable Auto-Approve
              </span>
            </label>

            {autoApproveEnabled && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Auto-Approve Sick Threshold (days)"
                  type="number"
                  min={0}
                  value={autoApproveSickThreshold}
                  onChange={e => setAutoApproveSickThreshold(Number(e.target.value))}
                />
                <Input
                  label="Auto-Approve Personal Threshold (days)"
                  type="number"
                  min={0}
                  value={autoApprovePersonalThreshold}
                  onChange={e => setAutoApprovePersonalThreshold(Number(e.target.value))}
                />
              </div>
            )}

            {autoApproveEnabled && (
              <div className="rounded-lg bg-[var(--color-success-bg)] px-4 py-3 text-sm text-[var(--color-success-text)]">
                Sick leave requests of {autoApproveSickThreshold} day(s) or fewer and personal leave requests
                of {autoApprovePersonalThreshold} day(s) or fewer will be automatically approved.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bottom save button */}
      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} loading={saving}>
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
