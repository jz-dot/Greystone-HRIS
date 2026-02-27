-- =====================================================
-- Phase 1: Foundation Migration
-- Run this in your Supabase SQL Editor
-- Prerequisites: schema.sql must already be applied
-- =====================================================

-- =====================================================
-- NEW ENUM TYPES
-- =====================================================

CREATE TYPE data_scope AS ENUM ('self', 'direct_reports', 'department', 'site', 'company');
CREATE TYPE accrual_method AS ENUM ('accrual', 'entitlement');
CREATE TYPE event_scope AS ENUM ('company', 'site', 'team', 'personal');
CREATE TYPE event_type_enum AS ENUM ('holiday', 'company_event', 'team_event', 'birthday', 'anniversary', 'deadline');
CREATE TYPE training_status AS ENUM ('assigned', 'in_progress', 'complete', 'overdue', 'waived');
CREATE TYPE training_delivery AS ENUM ('lms', 'in_person', 'hybrid');
CREATE TYPE onboarding_role_type AS ENUM ('team', 'manager_leader');
CREATE TYPE onboarding_item_status AS ENUM ('not_started', 'in_progress', 'blocked', 'done', 'skipped');
CREATE TYPE requisition_status AS ENUM ('open', 'on_hold', 'filled', 'closed', 'cancelled');
CREATE TYPE severity_level AS ENUM ('low', 'med', 'high');
CREATE TYPE incident_type AS ENUM ('incident', 'near_miss');
CREATE TYPE er_case_status AS ENUM ('open', 'investigating', 'closed');
CREATE TYPE er_category AS ENUM ('attendance', 'conduct', 'policy', 'other');
CREATE TYPE compensation_type AS ENUM ('hourly', 'salary');

-- =====================================================
-- SITES
-- =====================================================

CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_code TEXT UNIQUE NOT NULL,
  site_name TEXT NOT NULL,
  address_line1 TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  region_state TEXT NOT NULL DEFAULT '',
  postal_code TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT 'CA',
  time_zone TEXT NOT NULL DEFAULT 'America/Toronto',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- DEPARTMENTS
-- =====================================================

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dept_code TEXT UNIQUE NOT NULL,
  dept_name TEXT NOT NULL,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  parent_dept_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  cost_center_code TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- JOB ROLES
-- =====================================================

CREATE TABLE job_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_code TEXT UNIQUE NOT NULL,
  job_title TEXT NOT NULL,
  job_level TEXT NOT NULL DEFAULT '',
  employment_type_default employment_type NOT NULL DEFAULT 'full_time',
  compensation_type_default compensation_type NOT NULL DEFAULT 'hourly',
  exempt_status TEXT NOT NULL DEFAULT 'non_exempt'
    CHECK (exempt_status IN ('exempt', 'non_exempt')),
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- SYSTEM ROLES (expanded permission model)
-- =====================================================

CREATE TABLE system_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_code TEXT UNIQUE NOT NULL,
  role_name TEXT NOT NULL,
  role_description TEXT NOT NULL DEFAULT '',
  data_scope_default data_scope NOT NULL DEFAULT 'self',
  can_view_paystubs_self_only BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- ROLE PERMISSIONS
-- =====================================================

CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES system_roles(id) ON DELETE CASCADE,
  permission_code TEXT NOT NULL,
  allowed BOOLEAN NOT NULL DEFAULT true,
  scope data_scope NOT NULL DEFAULT 'self',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role_id, permission_code)
);

-- =====================================================
-- PTO TYPES
-- =====================================================

CREATE TABLE pto_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pto_type_code TEXT UNIQUE NOT NULL,
  pto_type_name TEXT NOT NULL,
  is_payable_on_termination BOOLEAN NOT NULL DEFAULT false,
  counts_toward_liability BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- PTO POLICIES
-- =====================================================

CREATE TABLE pto_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_code TEXT UNIQUE NOT NULL,
  policy_name TEXT NOT NULL,
  pto_type_id UUID NOT NULL REFERENCES pto_types(id) ON DELETE CASCADE,
  applies_to_role_id UUID REFERENCES system_roles(id) ON DELETE SET NULL,
  accrual_method accrual_method NOT NULL DEFAULT 'entitlement',
  annual_entitlement_hours NUMERIC(8,2) NOT NULL DEFAULT 0,
  accrual_rate_hours_per_payperiod NUMERIC(8,4) NOT NULL DEFAULT 0,
  carryover_cap_hours NUMERIC(8,2) NOT NULL DEFAULT 0,
  balance_cap_hours NUMERIC(8,2) NOT NULL DEFAULT 0,
  waiting_period_days INTEGER NOT NULL DEFAULT 0,
  allow_negative_balance BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- PTO APPROVAL RULES
-- =====================================================

CREATE TABLE pto_approval_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_code TEXT UNIQUE NOT NULL,
  pto_type_id UUID NOT NULL REFERENCES pto_types(id) ON DELETE CASCADE,
  max_days_auto_approve INTEGER,
  approver_type TEXT NOT NULL DEFAULT 'manager'
    CHECK (approver_type IN ('manager', 'role_user', 'specific_user')),
  approver_identifier TEXT NOT NULL DEFAULT '',
  backup_approver_identifier TEXT NOT NULL DEFAULT '',
  escalation_threshold_days INTEGER DEFAULT 10,
  sla_hours INTEGER NOT NULL DEFAULT 48,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- HOLIDAYS
-- =====================================================

CREATE TABLE holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  holiday_code TEXT UNIQUE NOT NULL,
  holiday_name TEXT NOT NULL,
  date DATE NOT NULL,
  country TEXT NOT NULL DEFAULT 'CA',
  region_state TEXT NOT NULL DEFAULT '',
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  is_paid BOOLEAN NOT NULL DEFAULT true,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- CALENDAR EVENTS
-- =====================================================

CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type event_type_enum NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  date_ts TIMESTAMPTZ NOT NULL,
  end_date_ts TIMESTAMPTZ,
  scope event_scope NOT NULL DEFAULT 'company',
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- TRAINING COURSES
-- =====================================================

CREATE TABLE training_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  training_code TEXT UNIQUE NOT NULL,
  training_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  default_expiry_months INTEGER,
  delivery_method training_delivery NOT NULL DEFAULT 'in_person',
  is_mandatory_possible BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- TRAINING REQUIREMENTS (which roles need which courses)
-- =====================================================

CREATE TABLE training_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  training_course_id UUID NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
  applies_to_role_id UUID REFERENCES system_roles(id) ON DELETE SET NULL,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  required_by_days_from_hire INTEGER,
  expiry_months_override INTEGER,
  block_work_if_incomplete BOOLEAN NOT NULL DEFAULT false,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- TRAINING ASSIGNMENTS (per employee)
-- =====================================================

CREATE TABLE training_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  training_course_id UUID NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
  required_by_date DATE,
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  status training_status NOT NULL DEFAULT 'assigned',
  completed_at TIMESTAMPTZ,
  expires_at DATE,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- ONBOARDING TEMPLATES
-- =====================================================

CREATE TABLE onboarding_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_code TEXT UNIQUE NOT NULL,
  template_name TEXT NOT NULL,
  role_type onboarding_role_type NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- ONBOARDING CHECKLIST ITEMS
-- =====================================================

CREATE TABLE onboarding_checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES onboarding_templates(id) ON DELETE CASCADE,
  item_code TEXT NOT NULL,
  segment_days TEXT NOT NULL DEFAULT '0-30',
  due_day INTEGER NOT NULL DEFAULT 1,
  category TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  owner_role TEXT NOT NULL DEFAULT '',
  evidence_type TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(template_id, item_code)
);

-- =====================================================
-- ONBOARDING PROGRESS (per employee per item)
-- =====================================================

CREATE TABLE onboarding_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES onboarding_templates(id) ON DELETE CASCADE,
  checklist_item_id UUID NOT NULL REFERENCES onboarding_checklist_items(id) ON DELETE CASCADE,
  status onboarding_item_status NOT NULL DEFAULT 'not_started',
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  evidence_url TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, checklist_item_id)
);

-- =====================================================
-- REQUISITIONS
-- =====================================================

CREATE TABLE requisitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  req_code TEXT UNIQUE NOT NULL,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  job_role_id UUID REFERENCES job_roles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  headcount_needed INTEGER NOT NULL DEFAULT 1,
  status requisition_status NOT NULL DEFAULT 'open',
  opened_date DATE NOT NULL DEFAULT CURRENT_DATE,
  closed_date DATE,
  hiring_manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- SAFETY INCIDENTS (stub for Phase 4)
-- =====================================================

CREATE TABLE safety_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  reported_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  incident_type incident_type NOT NULL DEFAULT 'incident',
  severity severity_level NOT NULL DEFAULT 'low',
  occurred_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'investigating', 'closed')),
  assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- EMPLOYEE RELATIONS CASES (stub for Phase 4)
-- =====================================================

CREATE TABLE er_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_code TEXT UNIQUE NOT NULL,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  status er_case_status NOT NULL DEFAULT 'open',
  severity severity_level NOT NULL DEFAULT 'low',
  category er_category NOT NULL DEFAULT 'other',
  opened_date DATE NOT NULL DEFAULT CURRENT_DATE,
  closed_date DATE,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- INTEGRATIONS REGISTRY
-- =====================================================

CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_code TEXT UNIQUE NOT NULL,
  system_name TEXT NOT NULL,
  integration_type TEXT NOT NULL
    CHECK (integration_type IN ('payroll', 'timeclock', 'benefits', 'sso', 'accounting', 'document_store')),
  direction TEXT NOT NULL DEFAULT 'inbound'
    CHECK (direction IN ('inbound', 'outbound', 'bidirectional')),
  enabled BOOLEAN NOT NULL DEFAULT false,
  owner_email TEXT NOT NULL DEFAULT '',
  frequency TEXT NOT NULL DEFAULT 'on_demand'
    CHECK (frequency IN ('realtime', 'daily', 'weekly', 'on_demand')),
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- ALTER EMPLOYEES — add new FK columns
-- =====================================================

ALTER TABLE employees ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id) ON DELETE SET NULL;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS job_role_id UUID REFERENCES job_roles(id) ON DELETE SET NULL;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS compensation_type compensation_type NOT NULL DEFAULT 'salary';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pay_rate NUMERIC(12,2) NOT NULL DEFAULT 0;

-- =====================================================
-- ALTER PROFILES — add system_role_id
-- =====================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS system_role_id UUID REFERENCES system_roles(id) ON DELETE SET NULL;

-- =====================================================
-- EXPAND COMPANY SETTINGS
-- =====================================================

ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'CA';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS time_zone TEXT NOT NULL DEFAULT 'America/Toronto';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'CAD';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS week_starts_on TEXT NOT NULL DEFAULT 'Mon';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS default_language TEXT NOT NULL DEFAULT 'en-CA';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS hr_contact_email TEXT NOT NULL DEFAULT '';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS operating_name TEXT NOT NULL DEFAULT '';

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_departments_site ON departments(site_id);
CREATE INDEX idx_departments_parent ON departments(parent_dept_id);
CREATE INDEX idx_job_roles_dept ON job_roles(department_id);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_pto_policies_type ON pto_policies(pto_type_id);
CREATE INDEX idx_pto_approval_rules_type ON pto_approval_rules(pto_type_id);
CREATE INDEX idx_holidays_date ON holidays(date);
CREATE INDEX idx_calendar_events_date ON calendar_events(date_ts);
CREATE INDEX idx_calendar_events_scope ON calendar_events(scope);
CREATE INDEX idx_training_assignments_employee ON training_assignments(employee_id);
CREATE INDEX idx_training_assignments_status ON training_assignments(status);
CREATE INDEX idx_training_requirements_course ON training_requirements(training_course_id);
CREATE INDEX idx_onboarding_progress_employee ON onboarding_progress(employee_id);
CREATE INDEX idx_onboarding_items_template ON onboarding_checklist_items(template_id);
CREATE INDEX idx_requisitions_status ON requisitions(status);
CREATE INDEX idx_requisitions_site ON requisitions(site_id);
CREATE INDEX idx_employees_site ON employees(site_id);
CREATE INDEX idx_employees_department_id ON employees(department_id);
CREATE INDEX idx_employees_job_role ON employees(job_role_id);
CREATE INDEX idx_safety_incidents_site ON safety_incidents(site_id);
CREATE INDEX idx_er_cases_status ON er_cases(status);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pto_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE pto_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE pto_approval_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE er_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Reference/config tables: all authenticated can read, admins can manage
-- (Using a pattern to keep it DRY)

-- Sites
CREATE POLICY "auth_read_sites" ON sites FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_all_sites" ON sites FOR ALL USING (is_admin());

-- Departments
CREATE POLICY "auth_read_departments" ON departments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_all_departments" ON departments FOR ALL USING (is_admin());

-- Job Roles
CREATE POLICY "auth_read_job_roles" ON job_roles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_all_job_roles" ON job_roles FOR ALL USING (is_admin());

-- System Roles
CREATE POLICY "auth_read_system_roles" ON system_roles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_all_system_roles" ON system_roles FOR ALL USING (is_admin());

-- Role Permissions
CREATE POLICY "auth_read_role_permissions" ON role_permissions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_all_role_permissions" ON role_permissions FOR ALL USING (is_admin());

-- PTO Types
CREATE POLICY "auth_read_pto_types" ON pto_types FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_all_pto_types" ON pto_types FOR ALL USING (is_admin());

-- PTO Policies
CREATE POLICY "auth_read_pto_policies" ON pto_policies FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_all_pto_policies" ON pto_policies FOR ALL USING (is_admin());

-- PTO Approval Rules
CREATE POLICY "auth_read_pto_approval_rules" ON pto_approval_rules FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_all_pto_approval_rules" ON pto_approval_rules FOR ALL USING (is_admin());

-- Holidays
CREATE POLICY "auth_read_holidays" ON holidays FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_all_holidays" ON holidays FOR ALL USING (is_admin());

-- Calendar Events
CREATE POLICY "auth_read_calendar_events" ON calendar_events FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_all_calendar_events" ON calendar_events FOR ALL USING (is_admin());

-- Training Courses
CREATE POLICY "auth_read_training_courses" ON training_courses FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_all_training_courses" ON training_courses FOR ALL USING (is_admin());

-- Training Requirements
CREATE POLICY "auth_read_training_requirements" ON training_requirements FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_all_training_requirements" ON training_requirements FOR ALL USING (is_admin());

-- Training Assignments (employees see own, managers see team, admins see all)
CREATE POLICY "own_training_assignments" ON training_assignments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.employee_id = training_assignments.employee_id
  ));
CREATE POLICY "manager_training_assignments" ON training_assignments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles p
    JOIN employees mgr ON p.employee_id = mgr.id
    JOIN employees emp ON emp.manager_id = mgr.id
    WHERE p.id = auth.uid() AND p.role = 'manager'
      AND training_assignments.employee_id = emp.id
  ));
CREATE POLICY "admin_all_training_assignments" ON training_assignments FOR ALL USING (is_admin());

-- Onboarding Templates + Items
CREATE POLICY "auth_read_onboarding_templates" ON onboarding_templates FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_all_onboarding_templates" ON onboarding_templates FOR ALL USING (is_admin());
CREATE POLICY "auth_read_onboarding_items" ON onboarding_checklist_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_all_onboarding_items" ON onboarding_checklist_items FOR ALL USING (is_admin());

-- Onboarding Progress (employees see own, admins manage all)
CREATE POLICY "own_onboarding_progress" ON onboarding_progress FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.employee_id = onboarding_progress.employee_id
  ));
CREATE POLICY "admin_all_onboarding_progress" ON onboarding_progress FOR ALL USING (is_admin());

-- Requisitions
CREATE POLICY "auth_read_requisitions" ON requisitions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_all_requisitions" ON requisitions FOR ALL USING (is_admin());

-- Safety Incidents
CREATE POLICY "auth_read_safety_incidents" ON safety_incidents FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_all_safety_incidents" ON safety_incidents FOR ALL USING (is_admin());

-- ER Cases (only admins and assigned owners)
CREATE POLICY "admin_all_er_cases" ON er_cases FOR ALL USING (is_admin());
CREATE POLICY "owner_read_er_cases" ON er_cases FOR SELECT
  USING (er_cases.owner_id = auth.uid());

-- Integrations
CREATE POLICY "auth_read_integrations" ON integrations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_all_integrations" ON integrations FOR ALL USING (is_admin());

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

CREATE TRIGGER sites_updated_at BEFORE UPDATE ON sites FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER job_roles_updated_at BEFORE UPDATE ON job_roles FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER system_roles_updated_at BEFORE UPDATE ON system_roles FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER pto_types_updated_at BEFORE UPDATE ON pto_types FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER pto_policies_updated_at BEFORE UPDATE ON pto_policies FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER pto_approval_rules_updated_at BEFORE UPDATE ON pto_approval_rules FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER calendar_events_updated_at BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER training_courses_updated_at BEFORE UPDATE ON training_courses FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER training_assignments_updated_at BEFORE UPDATE ON training_assignments FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER onboarding_templates_updated_at BEFORE UPDATE ON onboarding_templates FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER onboarding_progress_updated_at BEFORE UPDATE ON onboarding_progress FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER requisitions_updated_at BEFORE UPDATE ON requisitions FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER safety_incidents_updated_at BEFORE UPDATE ON safety_incidents FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER er_cases_updated_at BEFORE UPDATE ON er_cases FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER integrations_updated_at BEFORE UPDATE ON integrations FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

-- =====================================================
-- SEED: DEFAULT SYSTEM ROLES
-- =====================================================

INSERT INTO system_roles (role_code, role_name, role_description, data_scope_default, can_view_paystubs_self_only) VALUES
  ('hr_admin',        'HR Administrator',   'Full system access for HR operations',                        'company',        false),
  ('payroll_admin',   'Payroll Administrator','Payroll processing and compensation data access',            'company',        false),
  ('ceo_leadership',  'CEO / Leadership',    'Enterprise-wide visibility with aggregated data',             'company',        true),
  ('manager_leader',  'Manager / Leader',    'Team operational visibility, approvals, and roster management','direct_reports', true),
  ('supervisor',      'Supervisor',          'Shift-level operational visibility and punch approvals',      'direct_reports', true),
  ('team',            'Team Member',         'Self-service access: own schedule, pay, PTO, profile',        'self',           true);

-- =====================================================
-- SEED: DEFAULT ROLE PERMISSIONS
-- =====================================================

-- HR Admin: full access
INSERT INTO role_permissions (role_id, permission_code, allowed, scope) VALUES
  ((SELECT id FROM system_roles WHERE role_code = 'hr_admin'), 'employees.view',       true, 'company'),
  ((SELECT id FROM system_roles WHERE role_code = 'hr_admin'), 'employees.edit',       true, 'company'),
  ((SELECT id FROM system_roles WHERE role_code = 'hr_admin'), 'employees.create',     true, 'company'),
  ((SELECT id FROM system_roles WHERE role_code = 'hr_admin'), 'employees.terminate',  true, 'company'),
  ((SELECT id FROM system_roles WHERE role_code = 'hr_admin'), 'pto.approve',          true, 'company'),
  ((SELECT id FROM system_roles WHERE role_code = 'hr_admin'), 'pto.view_balances',    true, 'company'),
  ((SELECT id FROM system_roles WHERE role_code = 'hr_admin'), 'payroll.view',         true, 'company'),
  ((SELECT id FROM system_roles WHERE role_code = 'hr_admin'), 'payroll.run',          true, 'company'),
  ((SELECT id FROM system_roles WHERE role_code = 'hr_admin'), 'payroll.view_individual', true, 'company'),
  ((SELECT id FROM system_roles WHERE role_code = 'hr_admin'), 'roster.view',          true, 'company'),
  ((SELECT id FROM system_roles WHERE role_code = 'hr_admin'), 'roster.edit',          true, 'company'),
  ((SELECT id FROM system_roles WHERE role_code = 'hr_admin'), 'training.assign',      true, 'company'),
  ((SELECT id FROM system_roles WHERE role_code = 'hr_admin'), 'training.view',        true, 'company'),
  ((SELECT id FROM system_roles WHERE role_code = 'hr_admin'), 'onboarding.manage',    true, 'company'),
  ((SELECT id FROM system_roles WHERE role_code = 'hr_admin'), 'er_cases.view',        true, 'company'),
  ((SELECT id FROM system_roles WHERE role_code = 'hr_admin'), 'er_cases.manage',      true, 'company'),
  ((SELECT id FROM system_roles WHERE role_code = 'hr_admin'), 'safety.view',          true, 'company'),
  ((SELECT id FROM system_roles WHERE role_code = 'hr_admin'), 'safety.manage',        true, 'company'),
  ((SELECT id FROM system_roles WHERE role_code = 'hr_admin'), 'settings.manage',      true, 'company'),
  ((SELECT id FROM system_roles WHERE role_code = 'hr_admin'), 'reports.view',         true, 'company');

-- CEO/Leadership: read-only aggregates
INSERT INTO role_permissions (role_id, permission_code, allowed, scope) VALUES
  ((SELECT id FROM system_roles WHERE role_code = 'ceo_leadership'), 'employees.view',      true, 'company'),
  ((SELECT id FROM system_roles WHERE role_code = 'ceo_leadership'), 'pto.view_balances',   true, 'company'),
  ((SELECT id FROM system_roles WHERE role_code = 'ceo_leadership'), 'payroll.view',        true, 'company'),
  ((SELECT id FROM system_roles WHERE role_code = 'ceo_leadership'), 'roster.view',         true, 'company'),
  ((SELECT id FROM system_roles WHERE role_code = 'ceo_leadership'), 'training.view',       true, 'company'),
  ((SELECT id FROM system_roles WHERE role_code = 'ceo_leadership'), 'er_cases.view',       true, 'company'),
  ((SELECT id FROM system_roles WHERE role_code = 'ceo_leadership'), 'safety.view',         true, 'company'),
  ((SELECT id FROM system_roles WHERE role_code = 'ceo_leadership'), 'reports.view',        true, 'company');

-- Manager/Leader: team operations
INSERT INTO role_permissions (role_id, permission_code, allowed, scope) VALUES
  ((SELECT id FROM system_roles WHERE role_code = 'manager_leader'), 'employees.view',     true, 'direct_reports'),
  ((SELECT id FROM system_roles WHERE role_code = 'manager_leader'), 'pto.approve',        true, 'direct_reports'),
  ((SELECT id FROM system_roles WHERE role_code = 'manager_leader'), 'pto.view_balances',  true, 'direct_reports'),
  ((SELECT id FROM system_roles WHERE role_code = 'manager_leader'), 'roster.view',        true, 'direct_reports'),
  ((SELECT id FROM system_roles WHERE role_code = 'manager_leader'), 'roster.edit',        true, 'direct_reports'),
  ((SELECT id FROM system_roles WHERE role_code = 'manager_leader'), 'training.view',      true, 'direct_reports'),
  ((SELECT id FROM system_roles WHERE role_code = 'manager_leader'), 'training.assign',    true, 'direct_reports'),
  ((SELECT id FROM system_roles WHERE role_code = 'manager_leader'), 'safety.view',        true, 'site'),
  ((SELECT id FROM system_roles WHERE role_code = 'manager_leader'), 'safety.manage',      true, 'site');

-- Supervisor: shift-level
INSERT INTO role_permissions (role_id, permission_code, allowed, scope) VALUES
  ((SELECT id FROM system_roles WHERE role_code = 'supervisor'), 'employees.view',      true, 'direct_reports'),
  ((SELECT id FROM system_roles WHERE role_code = 'supervisor'), 'pto.approve',         true, 'direct_reports'),
  ((SELECT id FROM system_roles WHERE role_code = 'supervisor'), 'pto.view_balances',   true, 'direct_reports'),
  ((SELECT id FROM system_roles WHERE role_code = 'supervisor'), 'roster.view',         true, 'direct_reports'),
  ((SELECT id FROM system_roles WHERE role_code = 'supervisor'), 'training.view',       true, 'direct_reports'),
  ((SELECT id FROM system_roles WHERE role_code = 'supervisor'), 'safety.view',         true, 'site'),
  ((SELECT id FROM system_roles WHERE role_code = 'supervisor'), 'safety.manage',       true, 'site');

-- Team: self-service only
INSERT INTO role_permissions (role_id, permission_code, allowed, scope) VALUES
  ((SELECT id FROM system_roles WHERE role_code = 'team'), 'employees.view',       true, 'self'),
  ((SELECT id FROM system_roles WHERE role_code = 'team'), 'pto.request',          true, 'self'),
  ((SELECT id FROM system_roles WHERE role_code = 'team'), 'pto.view_balances',    true, 'self'),
  ((SELECT id FROM system_roles WHERE role_code = 'team'), 'roster.view',          true, 'self'),
  ((SELECT id FROM system_roles WHERE role_code = 'team'), 'training.view',        true, 'self'),
  ((SELECT id FROM system_roles WHERE role_code = 'team'), 'payroll.view',         true, 'self');

-- =====================================================
-- SEED: DEFAULT PTO TYPES
-- =====================================================

INSERT INTO pto_types (pto_type_code, pto_type_name, is_payable_on_termination, counts_toward_liability) VALUES
  ('vacation', 'Vacation',     true,  true),
  ('personal', 'Personal Day', false, false),
  ('sick',     'Sick Leave',   false, false);

-- =====================================================
-- SEED: DEFAULT SITE + DEPARTMENT (for existing data)
-- =====================================================

INSERT INTO sites (site_code, site_name, country, time_zone)
VALUES ('HQ', 'Headquarters', 'CA', 'America/Toronto');

INSERT INTO departments (dept_code, dept_name, site_id)
VALUES ('HR', 'Human Resources', (SELECT id FROM sites WHERE site_code = 'HQ'));

-- =====================================================
-- MIGRATE EXISTING DATA
-- =====================================================

-- Link existing employees to default site/department
UPDATE employees SET
  site_id = (SELECT id FROM sites WHERE site_code = 'HQ'),
  department_id = (SELECT id FROM departments WHERE dept_code = 'HR')
WHERE site_id IS NULL;

-- Link existing admin profile to hr_admin system role
UPDATE profiles SET
  system_role_id = (SELECT id FROM system_roles WHERE role_code = 'hr_admin')
WHERE role = 'admin' AND system_role_id IS NULL;

-- =====================================================
-- SEED: ONBOARDING TEMPLATES + CHECKLIST ITEMS
-- =====================================================

-- Team onboarding template
INSERT INTO onboarding_templates (template_code, template_name, role_type)
VALUES ('TEAM_V1', 'Team Member Onboarding (90-day)', 'team');

INSERT INTO onboarding_checklist_items (template_id, item_code, segment_days, due_day, category, title, description, owner_role, evidence_type, sort_order) VALUES
  ((SELECT id FROM onboarding_templates WHERE template_code = 'TEAM_V1'), 'team-001', '0-30',  1,  'Access',      'Preboarding access + essentials ready',                    'HR/IT issues HRIS + timeclock/kiosk access, confirms badge/PPE sizing, and posts first-week schedule.',                              'hr_it',      'system_access',       1),
  ((SELECT id FROM onboarding_templates WHERE template_code = 'TEAM_V1'), 'team-002', '0-30',  1,  'Welcome',     'Welcome orientation + Deliver WOW expectations',           'Supervisor reviews site norms, what good looks like, and 3 concrete WOW behaviors.',                                                  'supervisor',  'acknowledgement',     2),
  ((SELECT id FROM onboarding_templates WHERE template_code = 'TEAM_V1'), 'team-003', '0-30',  3,  'Social',      'Buddy assigned + first 2 weeks check-ins scheduled',       'Assign a buddy and schedule check-ins (Day 3/7/14) to accelerate social onboarding.',                                                 'supervisor',  'calendar_event',      3),
  ((SELECT id FROM onboarding_templates WHERE template_code = 'TEAM_V1'), 'team-004', '0-30',  7,  'Safety',      'Safety foundation completed (mandatory)',                   'Complete required safety training (WHMIS/HAZCOM, PPE, emergency routes, incident reporting) before independent work.',                 'ehs',         'training_complete',   4),
  ((SELECT id FROM onboarding_templates WHERE template_code = 'TEAM_V1'), 'team-005', '0-30',  7,  'Role',        'Role clarity + performance baseline set',                  'Review role expectations: quality standards, attendance rules, escalation path, and accountable metrics.',                              'supervisor',  'acknowledgement',     5),
  ((SELECT id FROM onboarding_templates WHERE template_code = 'TEAM_V1'), 'team-006', '0-30',  14, 'Training',    'Station training Phase 1 (shadow to supervised execution)','SOP walkthrough, critical control points, required documentation, and first competency sign-off.',                                     'supervisor',  'competency_signoff',  6),
  ((SELECT id FROM onboarding_templates WHERE template_code = 'TEAM_V1'), 'team-007', '31-60', 35, 'Training',    'Independent work certification (primary station)',         'Employee performs core tasks independently with periodic checks; competency reaches independent level.',                                'supervisor',  'competency_signoff',  7),
  ((SELECT id FROM onboarding_templates WHERE template_code = 'TEAM_V1'), 'team-008', '31-60', 40, 'Quality',     'Quality + documentation accuracy check',                   'Mini-audit of logs/records and process compliance. Gaps documented with corrective actions.',                                          'qa',          'audit_result',        8),
  ((SELECT id FROM onboarding_templates WHERE template_code = 'TEAM_V1'), 'team-009', '31-60', 45, 'Training',    'Cross-training plan started (1 adjacent station)',         'Begin cross-training on one adjacent station to improve coverage and reduce single-point-of-failure risk.',                             'supervisor',  'training_assigned',   9),
  ((SELECT id FROM onboarding_templates WHERE template_code = 'TEAM_V1'), 'team-010', '31-60', 45, 'Policy',      'Attendance + PTO rules understood',                        'Employee confirms how to request time off, cutoff times, and how balances work.',                                                      'hr',          'acknowledgement',     10),
  ((SELECT id FROM onboarding_templates WHERE template_code = 'TEAM_V1'), 'team-011', '31-60', 55, 'Culture',     'First WOW contribution captured',                          'Log one small improvement, risk flagged, or teammate-support story to reinforce ownership culture.',                                   'employee',    'submission',          11),
  ((SELECT id FROM onboarding_templates WHERE template_code = 'TEAM_V1'), 'team-012', '31-60', 60, 'Check-in',    '30/60-day check-in completed',                             'Structured feedback both ways: what is clear, what is blocked, what would improve onboarding.',                                        'supervisor',  'form_completed',      12),
  ((SELECT id FROM onboarding_templates WHERE template_code = 'TEAM_V1'), 'team-013', '61-90', 70, 'Training',    'Cross-training certification (backup station)',            'Employee can cover at least one secondary station at a basic operational level with documented sign-off.',                              'supervisor',  'competency_signoff',  13),
  ((SELECT id FROM onboarding_templates WHERE template_code = 'TEAM_V1'), 'team-014', '61-90', 75, 'Safety',      'Safety + quality reliability milestone',                   'Sustains compliant work habits; no avoidable incidents for a defined period (e.g., 30 days).',                                         'supervisor',  'manager_attestation', 14),
  ((SELECT id FROM onboarding_templates WHERE template_code = 'TEAM_V1'), 'team-015', '61-90', 80, 'Performance', 'Full effectiveness milestone achieved',                    'Meets role output + quality targets for 2 consecutive weeks.',                                                                         'supervisor',  'kpi_threshold',       15),
  ((SELECT id FROM onboarding_templates WHERE template_code = 'TEAM_V1'), 'team-016', '61-90', 85, 'Compliance',  'Training completion sweep',                                'All mandatory trainings complete; recertifications scheduled where applicable.',                                                        'employee',    'training_compliance', 16),
  ((SELECT id FROM onboarding_templates WHERE template_code = 'TEAM_V1'), 'team-017', '61-90', 90, 'Development', 'Skill ladder + next 90-day growth goals reviewed',         'Supervisor and employee review next skills to learn and document 2-3 development goals.',                                              'supervisor',  'goal_record',         17),
  ((SELECT id FROM onboarding_templates WHERE template_code = 'TEAM_V1'), 'team-018', '61-90', 90, 'Improve',     'Onboarding retro submitted',                               'Employee submits short feedback (keep/change/add) to improve onboarding continuously.',                                                'employee',    'survey_submitted',    18);

-- Manager/Leader onboarding template
INSERT INTO onboarding_templates (template_code, template_name, role_type)
VALUES ('ML_V1', 'Manager/Leader Onboarding (90-day)', 'manager_leader');

INSERT INTO onboarding_checklist_items (template_id, item_code, segment_days, due_day, category, title, description, owner_role, evidence_type, sort_order) VALUES
  ((SELECT id FROM onboarding_templates WHERE template_code = 'ML_V1'), 'ml-001', '0-30',  1,  'Access',       'Manager access + approvals enabled',                       'Provision HRIS dashboards, PTO approvals, roster views, training matrix, ER/safety workflows.',                                        'hr_it',           'system_access',         1),
  ((SELECT id FROM onboarding_templates WHERE template_code = 'ML_V1'), 'ml-002', '0-30',  3,  'Role',         'Role charter + success metrics agreed',                    'Define scope, decision rights, and KPIs (safety, quality, delivery, labor/OT). Document 30/60/90 outcomes.',                           'leadership',      'document',              2),
  ((SELECT id FROM onboarding_templates WHERE template_code = 'ML_V1'), 'ml-003', '0-30',  3,  'Social',       'Peer mentor assigned (leader-level buddy)',                'Assign an internal peer mentor and schedule recurring check-ins.',                                                                      'leadership',      'calendar_event',        3),
  ((SELECT id FROM onboarding_templates WHERE template_code = 'ML_V1'), 'ml-004', '0-30',  7,  'Stakeholders', 'Stakeholder map + introductions completed',                'Meet HR, QA, EHS, Maintenance, Scheduling, Finance, and key shift leads. Capture expectations.',                                       'manager_leader',  'notes_logged',          4),
  ((SELECT id FROM onboarding_templates WHERE template_code = 'ML_V1'), 'ml-005', '0-30',  10, 'Operations',   'Gemba walk + top risks/constraints identified',           'Walk the floor; document top 5 safety/quality risks and top 5 throughput constraints.',                                                'manager_leader',  'risk_register',         5),
  ((SELECT id FROM onboarding_templates WHERE template_code = 'ML_V1'), 'ml-006', '0-30',  14, 'Cadence',      'Operating cadence installed',                              'Set daily shift huddles, weekly coverage review, weekly KPI review, and 1:1s with direct reports.',                                    'manager_leader',  'calendar_event',        6),
  ((SELECT id FROM onboarding_templates WHERE template_code = 'ML_V1'), 'ml-007', '31-60', 35, 'People',       'Team capability snapshot (skills + coverage)',             'Publish a skills matrix: who can run what, training gaps, coverage vulnerabilities by shift.',                                         'manager_leader',  'document',              7),
  ((SELECT id FROM onboarding_templates WHERE template_code = 'ML_V1'), 'ml-008', '31-60', 40, 'Hiring',       'Hiring plan + requisition hygiene',                        'Validate open roles, address aging reqs, define interview loop/scorecards.',                                                           'manager_leader',  'workflow_configured',   8),
  ((SELECT id FROM onboarding_templates WHERE template_code = 'ML_V1'), 'ml-009', '31-60', 45, 'Coverage',     'PTO approvals + coverage standards implemented',          'Standardize PTO approval rules; ensure coverage gaps visible 7 days out.',                                                             'manager_leader',  'process_attestation',   9),
  ((SELECT id FROM onboarding_templates WHERE template_code = 'ML_V1'), 'ml-010', '31-60', 50, 'Compliance',   'Training compliance reaches target',                       'Bring mandatory training compliance to target threshold (95-100%).',                                                                   'manager_leader',  'training_compliance',   10),
  ((SELECT id FROM onboarding_templates WHERE template_code = 'ML_V1'), 'ml-011', '31-60', 55, 'ER',           'ER baseline established with HR',                          'Review open ER cases, confirm escalation protocol and documentation standards.',                                                       'manager_leader',  'case_review_logged',    11),
  ((SELECT id FROM onboarding_templates WHERE template_code = 'ML_V1'), 'ml-012', '31-60', 60, 'WOW',          'One WOW improvement systemized into standard work',       'Select one internal-customer reliability improvement and codify it as SOP/checklist.',                                                 'manager_leader',  'sop_published',         12),
  ((SELECT id FROM onboarding_templates WHERE template_code = 'ML_V1'), 'ml-013', '61-90', 70, 'Results',      'First measurable improvement delivered (before/after)',    'Deliver a documented KPI win (safety, quality, delivery, labor/OT) with baseline and outcome.',                                        'manager_leader',  'kpi_impact',            13),
  ((SELECT id FROM onboarding_templates WHERE template_code = 'ML_V1'), 'ml-014', '61-90', 75, 'Performance',  'Performance management rhythm running',                    'Probation reviews done, coaching plans created, recognition cadence established.',                                                     'manager_leader',  'reviews_completed',     14),
  ((SELECT id FROM onboarding_templates WHERE template_code = 'ML_V1'), 'ml-015', '61-90', 80, 'Bench',        'Succession + bench plan started',                          'Identify backups for key roles/shift leads and launch cross-training plan with dates.',                                                'manager_leader',  'plan_published',        15),
  ((SELECT id FROM onboarding_templates WHERE template_code = 'ML_V1'), 'ml-016', '61-90', 85, 'Engagement',   'Engagement feedback loop established',                     'Run a short monthly pulse and publish a visible action list; close the loop with the floor.',                                          'manager_leader',  'pulse_completed',       16),
  ((SELECT id FROM onboarding_templates WHERE template_code = 'ML_V1'), 'ml-017', '61-90', 90, 'Improve',      'Manager onboarding retro submitted',                       'Submit improvements to reduce ramp time. Propose checklist edits and new templates.',                                                  'manager_leader',  'survey_submitted',      17),
  ((SELECT id FROM onboarding_templates WHERE template_code = 'ML_V1'), 'ml-018', '61-90', 90, 'Effectiveness','Time-to-effectiveness milestone confirmed',                'Leader confirms manager independently runs cadence, coverage, approvals, and KPI reviews.',                                            'leadership',      'leader_attestation',    18);

-- =====================================================
-- SEED: 2026 CANADIAN STATUTORY HOLIDAYS (Ontario)
-- =====================================================

INSERT INTO holidays (holiday_code, holiday_name, date, country, region_state, is_paid, notes) VALUES
  ('CA_ON_NEW_YEAR_2026',      'New Year''s Day',        '2026-01-01', 'CA', 'ON', true, 'Stat holiday'),
  ('CA_ON_FAMILY_DAY_2026',    'Family Day',             '2026-02-16', 'CA', 'ON', true, 'Stat holiday'),
  ('CA_ON_GOOD_FRIDAY_2026',   'Good Friday',            '2026-04-03', 'CA', 'ON', true, 'Stat holiday'),
  ('CA_ON_VICTORIA_DAY_2026',  'Victoria Day',           '2026-05-18', 'CA', 'ON', true, 'Stat holiday'),
  ('CA_ON_CANADA_DAY_2026',    'Canada Day',             '2026-07-01', 'CA', 'ON', true, 'Stat holiday'),
  ('CA_ON_CIVIC_HOLIDAY_2026', 'Civic Holiday',          '2026-08-03', 'CA', 'ON', true, 'Optional stat (employer policy)'),
  ('CA_ON_LABOUR_DAY_2026',    'Labour Day',             '2026-09-07', 'CA', 'ON', true, 'Stat holiday'),
  ('CA_ON_THANKSGIVING_2026',  'Thanksgiving',           '2026-10-12', 'CA', 'ON', true, 'Stat holiday'),
  ('CA_ON_CHRISTMAS_2026',     'Christmas Day',          '2026-12-25', 'CA', 'ON', true, 'Stat holiday'),
  ('CA_ON_BOXING_DAY_2026',    'Boxing Day',             '2026-12-26', 'CA', 'ON', true, 'Stat holiday');
