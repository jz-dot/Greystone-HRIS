// Database types matching Supabase schema

export type UserRole = 'admin' | 'manager' | 'employee';

export type LeaveType = 'vacation' | 'sick' | 'personal' | 'bereavement' | 'parental' | 'unpaid';

export type LeaveStatus = 'pending' | 'approved' | 'denied' | 'cancelled' | 'auto_approved';

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern';

export type PayFrequency = 'weekly' | 'bi_weekly' | 'semi_monthly' | 'monthly';

// ----- Core Tables -----

export interface Profile {
  id: string; // references auth.users.id
  email: string;
  role: UserRole;
  employee_id: string | null;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
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
  created_at: string;
  updated_at: string;
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
  // Joined fields
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
  business_number: string;
  address_street: string;
  address_city: string;
  address_province: string;
  address_postal_code: string;
  default_sick_days: number;
  default_vacation_days: number;
  default_pay_frequency: PayFrequency;
  auto_approve_enabled: boolean;
  auto_approve_sick_threshold: number;
  auto_approve_personal_threshold: number;
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
