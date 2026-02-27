// Database types matching Supabase schema

// ----- Enums (original) -----

export type UserRole = 'admin' | 'manager' | 'employee';

export type LeaveType = 'vacation' | 'sick' | 'personal' | 'bereavement' | 'parental' | 'unpaid';

export type LeaveStatus = 'pending' | 'approved' | 'denied' | 'cancelled' | 'auto_approved';

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern';

export type PayFrequency = 'weekly' | 'bi_weekly' | 'semi_monthly' | 'monthly';

// ----- Enums (Phase 1) -----

export type DataScope = 'self' | 'direct_reports' | 'department' | 'site' | 'company';

export type AccrualMethod = 'accrual' | 'entitlement';

export type EventScope = 'company' | 'site' | 'team' | 'personal';

export type EventType = 'holiday' | 'company_event' | 'team_event' | 'birthday' | 'anniversary' | 'deadline';

export type TrainingStatus = 'assigned' | 'in_progress' | 'complete' | 'overdue' | 'waived';

export type TrainingDelivery = 'lms' | 'in_person' | 'hybrid';

export type OnboardingRoleType = 'team' | 'manager_leader';

export type OnboardingItemStatus = 'not_started' | 'in_progress' | 'blocked' | 'done' | 'skipped';

export type RequisitionStatus = 'open' | 'on_hold' | 'filled' | 'closed' | 'cancelled';

export type SeverityLevel = 'low' | 'med' | 'high';

export type IncidentType = 'incident' | 'near_miss';

export type ERCaseStatus = 'open' | 'investigating' | 'closed';

export type ERCategory = 'attendance' | 'conduct' | 'policy' | 'other';

export type CompensationType = 'hourly' | 'salary';

export type ApproverType = 'manager' | 'role_user' | 'specific_user';

// ----- Core Tables (original) -----

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  employee_id: string | null;
  system_role_id: string | null;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
  // Joined
  system_role?: SystemRole;
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  job_title: string;
  department: string;
  manager_id: string | null;
  start_date: string;
  termination_date: string | null;
  employment_type: EmploymentType;
  salary: number;
  pay_frequency: PayFrequency;
  compensation_type: CompensationType;
  pay_rate: number;
  sin_encrypted: string;
  address_street: string;
  address_city: string;
  address_province: string;
  address_postal_code: string;
  emergency_contact_name: string;
  emergency_contact_relationship: string;
  emergency_contact_phone: string;
  bank_institution: string;
  bank_transit: string;
  bank_account: string;
  sick_days_remaining: number;
  vacation_days_remaining: number;
  sick_days_entitled: number;
  vacation_days_entitled: number;
  // Phase 1 FK columns
  site_id: string | null;
  department_id: string | null;
  job_role_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  site?: Site;
  department_ref?: Department;
  job_role?: JobRole;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string;
  status: LeaveStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  is_auto_approved: boolean;
  created_at: string;
  employee?: Employee;
  reviewer?: Profile;
}

export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  invited_by: string;
  status: InvitationStatus;
  invite_code: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
}

export interface CompanySettings {
  id: string;
  company_name: string;
  operating_name: string;
  business_number: string;
  address_street: string;
  address_city: string;
  address_province: string;
  address_postal_code: string;
  country: string;
  time_zone: string;
  currency: string;
  week_starts_on: string;
  default_language: string;
  hr_contact_email: string;
  default_sick_days: number;
  default_vacation_days: number;
  default_pay_frequency: PayFrequency;
  auto_approve_enabled: boolean;
  auto_approve_sick_threshold: number;
  auto_approve_personal_threshold: number;
  created_at: string;
  updated_at: string;
}

// ----- Phase 1 Tables -----

export interface Site {
  id: string;
  site_code: string;
  site_name: string;
  address_line1: string;
  city: string;
  region_state: string;
  postal_code: string;
  country: string;
  time_zone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  dept_code: string;
  dept_name: string;
  site_id: string | null;
  parent_dept_id: string | null;
  cost_center_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  site?: Site;
  parent?: Department;
}

export interface JobRole {
  id: string;
  job_code: string;
  job_title: string;
  job_level: string;
  employment_type_default: EmploymentType;
  compensation_type_default: CompensationType;
  exempt_status: 'exempt' | 'non_exempt';
  department_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  department?: Department;
}

export interface SystemRole {
  id: string;
  role_code: string;
  role_name: string;
  role_description: string;
  data_scope_default: DataScope;
  can_view_paystubs_self_only: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  permissions?: RolePermission[];
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_code: string;
  allowed: boolean;
  scope: DataScope;
  notes: string;
  created_at: string;
}

export interface PTOType {
  id: string;
  pto_type_code: string;
  pto_type_name: string;
  is_payable_on_termination: boolean;
  counts_toward_liability: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PTOPolicy {
  id: string;
  policy_code: string;
  policy_name: string;
  pto_type_id: string;
  applies_to_role_id: string | null;
  accrual_method: AccrualMethod;
  annual_entitlement_hours: number;
  accrual_rate_hours_per_payperiod: number;
  carryover_cap_hours: number;
  balance_cap_hours: number;
  waiting_period_days: number;
  allow_negative_balance: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  pto_type?: PTOType;
  applies_to_role?: SystemRole;
}

export interface PTOApprovalRule {
  id: string;
  rule_code: string;
  pto_type_id: string;
  max_days_auto_approve: number | null;
  approver_type: ApproverType;
  approver_identifier: string;
  backup_approver_identifier: string;
  escalation_threshold_days: number | null;
  sla_hours: number;
  notes: string;
  created_at: string;
  updated_at: string;
  // Joined
  pto_type?: PTOType;
}

export interface Holiday {
  id: string;
  holiday_code: string;
  holiday_name: string;
  date: string;
  country: string;
  region_state: string;
  site_id: string | null;
  is_paid: boolean;
  notes: string;
  created_at: string;
  // Joined
  site?: Site;
}

export interface CalendarEvent {
  id: string;
  event_type: EventType;
  title: string;
  description: string;
  date_ts: string;
  end_date_ts: string | null;
  scope: EventScope;
  site_id: string | null;
  department_id: string | null;
  owner_id: string | null;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrainingCourse {
  id: string;
  training_code: string;
  training_name: string;
  category: string;
  description: string;
  default_expiry_months: number | null;
  delivery_method: TrainingDelivery;
  is_mandatory_possible: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrainingRequirement {
  id: string;
  training_course_id: string;
  applies_to_role_id: string | null;
  site_id: string | null;
  department_id: string | null;
  required_by_days_from_hire: number | null;
  expiry_months_override: number | null;
  block_work_if_incomplete: boolean;
  notes: string;
  created_at: string;
  // Joined
  training_course?: TrainingCourse;
  applies_to_role?: SystemRole;
}

export interface TrainingAssignment {
  id: string;
  employee_id: string;
  training_course_id: string;
  required_by_date: string | null;
  is_mandatory: boolean;
  status: TrainingStatus;
  completed_at: string | null;
  expires_at: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
  // Joined
  training_course?: TrainingCourse;
  employee?: Employee;
}

export interface OnboardingTemplate {
  id: string;
  template_code: string;
  template_name: string;
  role_type: OnboardingRoleType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  items?: OnboardingChecklistItem[];
}

export interface OnboardingChecklistItem {
  id: string;
  template_id: string;
  item_code: string;
  segment_days: string;
  due_day: number;
  category: string;
  title: string;
  description: string;
  owner_role: string;
  evidence_type: string;
  sort_order: number;
  created_at: string;
}

export interface OnboardingProgress {
  id: string;
  employee_id: string;
  template_id: string;
  checklist_item_id: string;
  status: OnboardingItemStatus;
  completed_at: string | null;
  completed_by: string | null;
  evidence_url: string;
  notes: string;
  created_at: string;
  updated_at: string;
  // Joined
  checklist_item?: OnboardingChecklistItem;
}

export interface Requisition {
  id: string;
  req_code: string;
  site_id: string | null;
  department_id: string | null;
  job_role_id: string | null;
  title: string;
  description: string;
  headcount_needed: number;
  status: RequisitionStatus;
  opened_date: string;
  closed_date: string | null;
  hiring_manager_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  site?: Site;
  department?: Department;
  job_role?: JobRole;
}

export interface SafetyIncident {
  id: string;
  site_id: string | null;
  department_id: string | null;
  reported_by: string | null;
  incident_type: IncidentType;
  severity: SeverityLevel;
  occurred_ts: string;
  description: string;
  status: 'open' | 'investigating' | 'closed';
  assigned_to: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ERCase {
  id: string;
  case_code: string;
  site_id: string | null;
  department_id: string | null;
  employee_id: string | null;
  status: ERCaseStatus;
  severity: SeverityLevel;
  category: ERCategory;
  opened_date: string;
  closed_date: string | null;
  owner_id: string | null;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Integration {
  id: string;
  integration_code: string;
  system_name: string;
  integration_type: 'payroll' | 'timeclock' | 'benefits' | 'sso' | 'accounting' | 'document_store';
  direction: 'inbound' | 'outbound' | 'bidirectional';
  enabled: boolean;
  owner_email: string;
  frequency: 'realtime' | 'daily' | 'weekly' | 'on_demand';
  notes: string;
  created_at: string;
  updated_at: string;
}

// ----- UI Helpers -----

export interface LeaveBalance {
  vacation_remaining: number;
  vacation_entitled: number;
  sick_remaining: number;
  sick_entitled: number;
}

export interface DashboardStats {
  total_employees: number;
  pending_leave_count: number;
  approved_today: number;
  departments: number;
}

export const LEAVE_TYPE_CONFIG: Record<LeaveType, {
  label: string;
  icon: string;
  color: string;
  autoApprovable: boolean;
}> = {
  vacation: { label: 'Vacation', icon: 'Sun', color: 'text-blue-500', autoApprovable: false },
  sick: { label: 'Sick Day', icon: 'Heart', color: 'text-red-500', autoApprovable: true },
  personal: { label: 'Personal', icon: 'User', color: 'text-purple-500', autoApprovable: true },
  bereavement: { label: 'Bereavement', icon: 'Heart', color: 'text-gray-500', autoApprovable: false },
  parental: { label: 'Parental', icon: 'Users', color: 'text-green-500', autoApprovable: false },
  unpaid: { label: 'Unpaid', icon: 'CalendarMinus', color: 'text-gray-400', autoApprovable: false },
};

export const LEAVE_STATUS_CONFIG: Record<LeaveStatus, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  pending: { label: 'Pending', color: 'text-amber-700', bgColor: 'bg-amber-50' },
  approved: { label: 'Approved', color: 'text-green-700', bgColor: 'bg-green-50' },
  denied: { label: 'Denied', color: 'text-red-700', bgColor: 'bg-red-50' },
  cancelled: { label: 'Cancelled', color: 'text-gray-500', bgColor: 'bg-gray-50' },
  auto_approved: { label: 'Auto-Approved', color: 'text-green-700', bgColor: 'bg-emerald-50' },
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  employee: 'Employee',
};

// Permission codes used by the system
export const PERMISSION_CODES = [
  'employees.view',
  'employees.edit',
  'employees.create',
  'employees.terminate',
  'pto.request',
  'pto.approve',
  'pto.view_balances',
  'payroll.view',
  'payroll.run',
  'payroll.view_individual',
  'roster.view',
  'roster.edit',
  'training.view',
  'training.assign',
  'onboarding.manage',
  'er_cases.view',
  'er_cases.manage',
  'safety.view',
  'safety.manage',
  'settings.manage',
  'reports.view',
] as const;

export type PermissionCode = typeof PERMISSION_CODES[number];
