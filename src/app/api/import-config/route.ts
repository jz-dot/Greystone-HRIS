import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type IdRow = { id: string; [key: string]: string };

// POST /api/import-config
// Accepts an HRIS configuration import payload (matching HRIS-config-import.schema.json)
// and upserts all reference data into the database.

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await request.json();
  const dryRun = body.dry_run === true;
  const results: Record<string, { inserted: number; errors: string[] }> = {};

  try {
    // 1. Company settings
    if (body.company) {
      const c = body.company;
      const { error } = dryRun
        ? { error: null }
        : await supabase
            .from('company_settings')
            .update({
              company_name: c.legal_name,
              operating_name: c.operating_name || '',
              country: c.country || 'CA',
              time_zone: c.time_zone || 'America/Toronto',
              currency: c.currency || 'CAD',
              week_starts_on: c.week_starts_on || 'Mon',
              default_language: c.default_language || 'en-CA',
              hr_contact_email: c.hr_contact_email || '',
            })
            .not('id', 'is', null); // update the singleton row
      results.company = { inserted: error ? 0 : 1, errors: error ? [error.message] : [] };
    }

    // 2. Sites
    if (body.sites?.length) {
      const rows = body.sites.map((s: Record<string, unknown>) => ({
        site_code: s.site_id,
        site_name: s.site_name,
        address_line1: s.address_line1 || '',
        city: s.city || '',
        region_state: s.region_state || '',
        postal_code: s.postal_code || '',
        country: s.country || 'CA',
        time_zone: s.time_zone_override || 'America/Toronto',
        is_active: s.is_active === 'Y',
      }));
      if (!dryRun) {
        const { error } = await supabase.from('sites').upsert(rows, { onConflict: 'site_code' });
        results.sites = { inserted: rows.length, errors: error ? [error.message] : [] };
      } else {
        results.sites = { inserted: rows.length, errors: [] };
      }
    }

    // 3. Departments
    if (body.departments?.length) {
      // Need to resolve site_id references
      const { data: sites } = await supabase.from('sites').select('id, site_code');
      const siteMap = new Map((sites as IdRow[] || []).map(s => [s.site_code, s.id]));

      const rows = body.departments.map((d: Record<string, unknown>) => ({
        dept_code: d.dept_id,
        dept_name: d.dept_name,
        site_id: siteMap.get(d.site_id as string) || null,
        cost_center_code: d.cost_center_code || '',
        is_active: d.is_active === 'Y',
      }));
      if (!dryRun) {
        const { error } = await supabase.from('departments').upsert(rows, { onConflict: 'dept_code' });
        results.departments = { inserted: rows.length, errors: error ? [error.message] : [] };
      } else {
        results.departments = { inserted: rows.length, errors: [] };
      }
    }

    // 4. Job Roles
    if (body.jobs_roles?.length) {
      const { data: depts } = await supabase.from('departments').select('id, dept_code');
      const deptMap = new Map((depts as IdRow[] || []).map(d => [d.dept_code, d.id]));

      const rows = body.jobs_roles.map((j: Record<string, unknown>) => ({
        job_code: j.job_code,
        job_title: j.job_title,
        job_level: j.job_level || '',
        employment_type_default: j.employment_type_default === 'hourly' ? 'part_time' : 'full_time',
        compensation_type_default: j.employment_type_default || 'hourly',
        exempt_status: j.exempt_status || 'non_exempt',
        department_id: deptMap.get(j.dept_id_default as string) || null,
        is_active: j.is_active === 'Y',
      }));
      if (!dryRun) {
        const { error } = await supabase.from('job_roles').upsert(rows, { onConflict: 'job_code' });
        results.jobs_roles = { inserted: rows.length, errors: error ? [error.message] : [] };
      } else {
        results.jobs_roles = { inserted: rows.length, errors: [] };
      }
    }

    // 5. System Roles
    if (body.roles?.length) {
      const rows = body.roles.map((r: Record<string, unknown>) => ({
        role_code: r.role_code,
        role_name: r.role_name,
        role_description: r.role_description || '',
        data_scope_default: r.data_scope_default || 'self',
        can_view_paystubs_self_only: r.can_view_paystubs_self_only === 'Y',
        is_active: r.is_active === 'Y',
      }));
      if (!dryRun) {
        const { error } = await supabase.from('system_roles').upsert(rows, { onConflict: 'role_code' });
        results.roles = { inserted: rows.length, errors: error ? [error.message] : [] };
      } else {
        results.roles = { inserted: rows.length, errors: [] };
      }
    }

    // 6. Role Permissions
    if (body.role_permissions?.length) {
      const { data: roles } = await supabase.from('system_roles').select('id, role_code');
      const roleMap = new Map((roles as IdRow[] || []).map(r => [r.role_code, r.id]));

      const rows = body.role_permissions
        .filter((rp: Record<string, unknown>) => roleMap.has(rp.role_code as string))
        .map((rp: Record<string, unknown>) => ({
          role_id: roleMap.get(rp.role_code as string),
          permission_code: rp.permission_code,
          allowed: rp.allowed === 'Y',
          scope: rp.scope || 'self',
          notes: rp.notes || '',
        }));
      if (!dryRun) {
        // Delete existing permissions for these roles, then insert
        const roleIds = [...new Set(rows.map((r: { role_id: string }) => r.role_id))];
        for (const rid of roleIds) {
          await supabase.from('role_permissions').delete().eq('role_id', rid);
        }
        const { error } = await supabase.from('role_permissions').insert(rows);
        results.role_permissions = { inserted: rows.length, errors: error ? [error.message] : [] };
      } else {
        results.role_permissions = { inserted: rows.length, errors: [] };
      }
    }

    // 7. PTO Types
    if (body.pto_types?.length) {
      const rows = body.pto_types.map((pt: Record<string, unknown>) => ({
        pto_type_code: pt.pto_type_code,
        pto_type_name: pt.pto_type_name,
        is_payable_on_termination: pt.is_payable_on_termination === 'Y',
        counts_toward_liability: pt.counts_toward_liability === 'Y',
        is_active: pt.is_active === 'Y',
      }));
      if (!dryRun) {
        const { error } = await supabase.from('pto_types').upsert(rows, { onConflict: 'pto_type_code' });
        results.pto_types = { inserted: rows.length, errors: error ? [error.message] : [] };
      } else {
        results.pto_types = { inserted: rows.length, errors: [] };
      }
    }

    // 8. PTO Policies
    if (body.pto_policies?.length) {
      const { data: ptoTypes } = await supabase.from('pto_types').select('id, pto_type_code');
      const ptoMap = new Map((ptoTypes as IdRow[] || []).map(p => [p.pto_type_code, p.id]));
      const { data: roles } = await supabase.from('system_roles').select('id, role_code');
      const roleMap = new Map((roles as IdRow[] || []).map(r => [r.role_code, r.id]));

      const rows = body.pto_policies.map((pp: Record<string, unknown>) => ({
        policy_code: pp.policy_id,
        policy_name: pp.policy_name,
        pto_type_id: ptoMap.get(pp.pto_type_code as string) || null,
        applies_to_role_id: roleMap.get(pp.applies_to_role_code as string) || null,
        accrual_method: pp.accrual_method || 'entitlement',
        annual_entitlement_hours: pp.annual_entitlement_hours || 0,
        accrual_rate_hours_per_payperiod: pp.accrual_rate_hours_per_payperiod || 0,
        carryover_cap_hours: pp.carryover_cap_hours || 0,
        balance_cap_hours: pp.balance_cap_hours || 0,
        waiting_period_days: pp.waiting_period_days || 0,
        allow_negative_balance: pp.allow_negative_balance === 'Y',
      }));
      if (!dryRun) {
        const { error } = await supabase.from('pto_policies').upsert(rows, { onConflict: 'policy_code' });
        results.pto_policies = { inserted: rows.length, errors: error ? [error.message] : [] };
      } else {
        results.pto_policies = { inserted: rows.length, errors: [] };
      }
    }

    // 9. PTO Approval Rules
    if (body.pto_approval_rules?.length) {
      const { data: ptoTypes } = await supabase.from('pto_types').select('id, pto_type_code');
      const ptoMap = new Map((ptoTypes as IdRow[] || []).map(p => [p.pto_type_code, p.id]));

      const rows = body.pto_approval_rules.map((ar: Record<string, unknown>) => ({
        rule_code: ar.rule_id,
        pto_type_id: ptoMap.get(ar.pto_type_code as string) || null,
        approver_type: ar.approver_type || 'manager',
        approver_identifier: ar.approver_identifier || '',
        backup_approver_identifier: ar.backup_approver_identifier || '',
        sla_hours: ar.sla_hours || 48,
        notes: ar.notes || '',
      }));
      if (!dryRun) {
        const { error } = await supabase.from('pto_approval_rules').upsert(rows, { onConflict: 'rule_code' });
        results.pto_approval_rules = { inserted: rows.length, errors: error ? [error.message] : [] };
      } else {
        results.pto_approval_rules = { inserted: rows.length, errors: [] };
      }
    }

    // 10. Holidays
    if (body.holidays?.length) {
      const { data: sites } = await supabase.from('sites').select('id, site_code');
      const siteMap = new Map((sites as IdRow[] || []).map(s => [s.site_code, s.id]));

      const rows = body.holidays.map((h: Record<string, unknown>) => ({
        holiday_code: h.holiday_id,
        holiday_name: h.holiday_name,
        date: h.date,
        country: h.country || 'CA',
        region_state: h.region_state || '',
        site_id: siteMap.get(h.site_id as string) || null,
        is_paid: h.is_paid === 'Y',
        notes: h.notes || '',
      }));
      if (!dryRun) {
        const { error } = await supabase.from('holidays').upsert(rows, { onConflict: 'holiday_code' });
        results.holidays = { inserted: rows.length, errors: error ? [error.message] : [] };
      } else {
        results.holidays = { inserted: rows.length, errors: [] };
      }
    }

    // 11. Calendar Events
    if (body.events?.length) {
      const { data: sites } = await supabase.from('sites').select('id, site_code');
      const siteMap = new Map((sites as IdRow[] || []).map(s => [s.site_code, s.id]));

      const rows = body.events.map((e: Record<string, unknown>) => ({
        event_type: e.event_type,
        title: e.title,
        date_ts: e.date_ts,
        scope: e.scope || 'company',
        site_id: siteMap.get(e.site_id as string) || null,
        description: e.notes || '',
      }));
      if (!dryRun) {
        const { error } = await supabase.from('calendar_events').insert(rows);
        results.events = { inserted: rows.length, errors: error ? [error.message] : [] };
      } else {
        results.events = { inserted: rows.length, errors: [] };
      }
    }

    // 12. Training Courses
    if (body.training_courses?.length) {
      const rows = body.training_courses.map((tc: Record<string, unknown>) => ({
        training_code: tc.training_code,
        training_name: tc.training_name,
        category: tc.category || '',
        default_expiry_months: tc.default_expiry_months || null,
        delivery_method: tc.delivery_method || 'in_person',
        is_mandatory_possible: tc.is_mandatory_possible === 'Y',
        is_active: tc.is_active === 'Y',
      }));
      if (!dryRun) {
        const { error } = await supabase.from('training_courses').upsert(rows, { onConflict: 'training_code' });
        results.training_courses = { inserted: rows.length, errors: error ? [error.message] : [] };
      } else {
        results.training_courses = { inserted: rows.length, errors: [] };
      }
    }

    // 13. Training Requirements
    if (body.training_requirements?.length) {
      const { data: courses } = await supabase.from('training_courses').select('id, training_code');
      const courseMap = new Map((courses as IdRow[] || []).map(c => [c.training_code, c.id]));
      const { data: roles } = await supabase.from('system_roles').select('id, role_code');
      const roleMap = new Map((roles as IdRow[] || []).map(r => [r.role_code, r.id]));
      const { data: sites } = await supabase.from('sites').select('id, site_code');
      const siteMap = new Map((sites as IdRow[] || []).map(s => [s.site_code, s.id]));

      const rows = body.training_requirements.map((tr: Record<string, unknown>) => ({
        training_course_id: courseMap.get(tr.training_code as string) || null,
        applies_to_role_id: roleMap.get(tr.applies_to_role_code as string) || null,
        site_id: siteMap.get(tr.site_id as string) || null,
        required_by_days_from_hire: tr.required_by_days_from_hire || null,
        expiry_months_override: tr.expiry_months_override || null,
        block_work_if_incomplete: tr.block_work_if_incomplete === 'Y',
        notes: tr.notes || '',
      }));
      if (!dryRun) {
        const { error } = await supabase.from('training_requirements').insert(rows);
        results.training_requirements = { inserted: rows.length, errors: error ? [error.message] : [] };
      } else {
        results.training_requirements = { inserted: rows.length, errors: [] };
      }
    }

    // 14. Integrations
    if (body.integrations?.length) {
      const rows = body.integrations.map((i: Record<string, unknown>) => ({
        integration_code: i.integration_id,
        system_name: i.system_name,
        integration_type: i.integration_type,
        direction: i.direction || 'inbound',
        enabled: i.enabled === 'Y',
        owner_email: i.owner_email || '',
        frequency: i.frequency || 'on_demand',
        notes: i.notes || '',
      }));
      if (!dryRun) {
        const { error } = await supabase.from('integrations').upsert(rows, { onConflict: 'integration_code' });
        results.integrations = { inserted: rows.length, errors: error ? [error.message] : [] };
      } else {
        results.integrations = { inserted: rows.length, errors: [] };
      }
    }

    const hasErrors = Object.values(results).some(r => r.errors.length > 0);

    return NextResponse.json({
      success: !hasErrors,
      dry_run: dryRun,
      import_id: body.import_id || null,
      results,
    }, { status: hasErrors ? 207 : 200 });

  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 });
  }
}
