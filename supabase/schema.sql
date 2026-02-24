-- =====================================================
-- Greystone HRIS Database Schema
-- Run this in your Supabase SQL Editor to set up tables
-- =====================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- =====================================================
-- ENUM TYPES
-- =====================================================

create type user_role as enum ('admin', 'manager', 'employee');
create type leave_type as enum ('vacation', 'sick', 'personal', 'bereavement', 'parental', 'unpaid');
create type leave_status as enum ('pending', 'approved', 'denied', 'cancelled', 'auto_approved');
create type invitation_status as enum ('pending', 'accepted', 'expired', 'revoked');
create type employment_type as enum ('full_time', 'part_time', 'contract', 'intern');
create type pay_frequency as enum ('weekly', 'bi_weekly', 'semi_monthly', 'monthly');

-- =====================================================
-- COMPANY SETTINGS (singleton row)
-- =====================================================

create table company_settings (
  id uuid primary key default uuid_generate_v4(),
  company_name text not null default 'My Company',
  business_number text not null default '',
  address_street text not null default '',
  address_city text not null default '',
  address_province text not null default 'ON',
  address_postal_code text not null default '',
  default_sick_days numeric(5,1) not null default 10,
  default_vacation_days numeric(5,1) not null default 15,
  default_pay_frequency pay_frequency not null default 'bi_weekly',
  auto_approve_enabled boolean not null default true,
  auto_approve_sick_threshold integer not null default 3,
  auto_approve_personal_threshold integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================
-- PROFILES (extends Supabase auth.users)
-- =====================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role user_role not null default 'employee',
  employee_id uuid,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

-- =====================================================
-- EMPLOYEES
-- =====================================================

create table employees (
  id uuid primary key default uuid_generate_v4(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null default '',
  job_title text not null default '',
  department text not null default 'Unassigned',
  manager_id uuid references employees(id) on delete set null,
  start_date date not null default current_date,
  termination_date date,
  employment_type employment_type not null default 'full_time',
  salary numeric(12,2) not null default 0,
  pay_frequency pay_frequency not null default 'bi_weekly',
  sin_encrypted text not null default '',
  address_street text not null default '',
  address_city text not null default '',
  address_province text not null default '',
  address_postal_code text not null default '',
  emergency_contact_name text not null default '',
  emergency_contact_relationship text not null default '',
  emergency_contact_phone text not null default '',
  bank_institution text not null default '',
  bank_transit text not null default '',
  bank_account text not null default '',
  sick_days_remaining numeric(5,1) not null default 10,
  vacation_days_remaining numeric(5,1) not null default 15,
  sick_days_entitled numeric(5,1) not null default 10,
  vacation_days_entitled numeric(5,1) not null default 15,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add foreign key from profiles to employees
alter table profiles
  add constraint fk_profiles_employee
  foreign key (employee_id) references employees(id) on delete set null;

-- =====================================================
-- LEAVE REQUESTS
-- =====================================================

create table leave_requests (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid not null references employees(id) on delete cascade,
  leave_type leave_type not null,
  start_date date not null,
  end_date date not null,
  reason text not null default '',
  status leave_status not null default 'pending',
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  is_auto_approved boolean not null default false,
  created_at timestamptz not null default now(),
  constraint valid_dates check (end_date >= start_date)
);

-- =====================================================
-- INVITATIONS
-- =====================================================

create table invitations (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  role user_role not null default 'employee',
  invited_by uuid not null references profiles(id) on delete cascade,
  status invitation_status not null default 'pending',
  invite_code text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz
);

-- =====================================================
-- INDEXES
-- =====================================================

create index idx_employees_department on employees(department);
create index idx_employees_manager on employees(manager_id);
create index idx_leave_requests_employee on leave_requests(employee_id);
create index idx_leave_requests_status on leave_requests(status);
create index idx_invitations_code on invitations(invite_code);
create index idx_invitations_email on invitations(email);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

alter table profiles enable row level security;
alter table employees enable row level security;
alter table leave_requests enable row level security;
alter table invitations enable row level security;
alter table company_settings enable row level security;

-- Profiles: users can read their own; admins can read all
create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Admins can read all profiles"
  on profiles for select
  using (
    exists (
      select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admins can update all profiles"
  on profiles for update
  using (
    exists (
      select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Employees: employees see their own; managers see direct reports; admins see all
create policy "Employees can read own record"
  on employees for select
  using (
    exists (
      select 1 from profiles p where p.id = auth.uid() and p.employee_id = employees.id
    )
  );

create policy "Managers can read direct reports"
  on employees for select
  using (
    exists (
      select 1 from profiles p
      join employees mgr on p.employee_id = mgr.id
      where p.id = auth.uid() and p.role = 'manager' and employees.manager_id = mgr.id
    )
  );

create policy "Admins can CRUD all employees"
  on employees for all
  using (
    exists (
      select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Leave requests: employees see own; managers see team; admins see all
create policy "Employees can read own leave"
  on leave_requests for select
  using (
    exists (
      select 1 from profiles p where p.id = auth.uid() and p.employee_id = leave_requests.employee_id
    )
  );

create policy "Employees can insert own leave"
  on leave_requests for insert
  with check (
    exists (
      select 1 from profiles p where p.id = auth.uid() and p.employee_id = leave_requests.employee_id
    )
  );

create policy "Admins can manage all leave"
  on leave_requests for all
  using (
    exists (
      select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Managers can read team leave"
  on leave_requests for select
  using (
    exists (
      select 1 from profiles p
      join employees mgr on p.employee_id = mgr.id
      join employees emp on emp.manager_id = mgr.id
      where p.id = auth.uid() and p.role = 'manager'
        and leave_requests.employee_id = emp.id
    )
  );

create policy "Managers can update team leave"
  on leave_requests for update
  using (
    exists (
      select 1 from profiles p
      join employees mgr on p.employee_id = mgr.id
      join employees emp on emp.manager_id = mgr.id
      where p.id = auth.uid() and p.role = 'manager'
        and leave_requests.employee_id = emp.id
    )
  );

-- Invitations: only admins
create policy "Admins can manage invitations"
  on invitations for all
  using (
    exists (
      select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Company settings: admins can read/update; all authenticated can read
create policy "Authenticated users can read settings"
  on company_settings for select
  using (auth.uid() is not null);

create policy "Admins can update settings"
  on company_settings for update
  using (
    exists (
      select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Auto-create profile when a new auth user is created
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'employee');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Calculate business days between two dates
create or replace function calculate_business_days(start_date date, end_date date)
returns integer as $$
declare
  total integer := 0;
  current_date_val date := start_date;
begin
  while current_date_val <= end_date loop
    if extract(dow from current_date_val) not in (0, 6) then
      total := total + 1;
    end if;
    current_date_val := current_date_val + 1;
  end loop;
  return greatest(total, 1);
end;
$$ language plpgsql immutable;

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger employees_updated_at
  before update on employees
  for each row execute procedure update_updated_at();

create trigger company_settings_updated_at
  before update on company_settings
  for each row execute procedure update_updated_at();

-- Insert default company settings row
insert into company_settings (company_name) values ('My Company');
