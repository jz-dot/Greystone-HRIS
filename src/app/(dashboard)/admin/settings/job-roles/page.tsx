'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { createClient } from '@/lib/supabase/client';
import { Plus, Briefcase, Pencil, Trash2, Save } from 'lucide-react';
import type { JobRole, Department } from '@/types/database';

type JobRoleWithDepartment = JobRole & {
  department?: Pick<Department, 'id' | 'dept_name'> | null;
};

interface JobRoleFormData {
  job_code: string;
  job_title: string;
  job_level: string;
  employment_type_default: JobRole['employment_type_default'];
  compensation_type_default: JobRole['compensation_type_default'];
  exempt_status: JobRole['exempt_status'];
  department_id: string;
  is_active: boolean;
}

const EMPTY_FORM: JobRoleFormData = {
  job_code: '',
  job_title: '',
  job_level: '',
  employment_type_default: 'full_time',
  compensation_type_default: 'salary',
  exempt_status: 'non_exempt',
  department_id: '',
  is_active: true,
};

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'intern', label: 'Intern' },
];

const COMPENSATION_TYPE_OPTIONS = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'salary', label: 'Salary' },
];

const EXEMPT_STATUS_OPTIONS = [
  { value: 'exempt', label: 'Exempt' },
  { value: 'non_exempt', label: 'Non-Exempt' },
];

export default function JobRolesPage() {
  const [jobRoles, setJobRoles] = useState<JobRoleWithDepartment[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<JobRoleFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof JobRoleFormData, string>>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const supabase = createClient();

  const loadData = useCallback(async () => {
    setLoading(true);
    const [rolesResult, deptsResult] = await Promise.all([
      supabase
        .from('job_roles')
        .select('*, department:departments(id, dept_name)')
        .order('job_code'),
      supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('dept_name'),
    ]);
    setJobRoles(rolesResult.data ?? []);
    setDepartments(deptsResult.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(role: JobRoleWithDepartment) {
    setEditingId(role.id);
    setForm({
      job_code: role.job_code,
      job_title: role.job_title,
      job_level: role.job_level ?? '',
      employment_type_default: role.employment_type_default,
      compensation_type_default: role.compensation_type_default,
      exempt_status: role.exempt_status,
      department_id: role.department_id ?? '',
      is_active: role.is_active,
    });
    setErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof JobRoleFormData, string>> = {};
    if (!form.job_code.trim()) newErrors.job_code = 'Job code is required';
    if (!form.job_title.trim()) newErrors.job_title = 'Job title is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);

    const payload = {
      job_code: form.job_code.trim(),
      job_title: form.job_title.trim(),
      job_level: form.job_level.trim() || null,
      employment_type_default: form.employment_type_default,
      compensation_type_default: form.compensation_type_default,
      exempt_status: form.exempt_status,
      department_id: form.department_id || null,
      is_active: form.is_active,
    };

    if (editingId) {
      const { error } = await supabase
        .from('job_roles')
        .update(payload)
        .eq('id', editingId);
      if (error) {
        setErrors({ job_code: error.message });
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from('job_roles').insert(payload);
      if (error) {
        setErrors({ job_code: error.message });
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    closeModal();
    loadData();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('job_roles').delete().eq('id', id);
    if (!error) {
      setDeleteConfirmId(null);
      loadData();
    }
  }

  function updateField<K extends keyof JobRoleFormData>(key: K, value: JobRoleFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  const departmentOptions = [
    { value: '', label: 'No Department' },
    ...departments.map(d => ({ value: d.id, label: d.dept_name })),
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--spinner-track)] border-t-[var(--spinner-fill)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Job Roles</h1>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            Manage job roles, levels, and compensation defaults.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Job Role
        </Button>
      </div>

      {/* List */}
      {jobRoles.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No job roles defined"
          description="Create your first job role to get started."
          action={
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Add Job Role
            </Button>
          }
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-6 py-3 text-left font-medium text-[var(--text-tertiary)]">Job Code</th>
                  <th className="px-6 py-3 text-left font-medium text-[var(--text-tertiary)]">Job Title</th>
                  <th className="px-6 py-3 text-left font-medium text-[var(--text-tertiary)]">Level</th>
                  <th className="px-6 py-3 text-left font-medium text-[var(--text-tertiary)]">Department</th>
                  <th className="px-6 py-3 text-left font-medium text-[var(--text-tertiary)]">Compensation</th>
                  <th className="px-6 py-3 text-left font-medium text-[var(--text-tertiary)]">Exempt Status</th>
                  <th className="px-6 py-3 text-left font-medium text-[var(--text-tertiary)]">Status</th>
                  <th className="px-6 py-3 text-right font-medium text-[var(--text-tertiary)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobRoles.map(role => (
                  <tr
                    key={role.id}
                    className="border-b border-[var(--border)] last:border-0 cursor-pointer transition-colors hover:bg-[var(--bg-surface-hover)]"
                    onClick={() => openEdit(role)}
                  >
                    <td className="px-6 py-3 font-mono text-[var(--text-primary)]">{role.job_code}</td>
                    <td className="px-6 py-3 font-medium text-[var(--text-primary)]">{role.job_title}</td>
                    <td className="px-6 py-3 text-[var(--text-secondary)]">{role.job_level || '--'}</td>
                    <td className="px-6 py-3 text-[var(--text-secondary)]">
                      {role.department?.dept_name || '--'}
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant={role.compensation_type_default === 'salary' ? 'info' : 'default'}>
                        {role.compensation_type_default === 'salary' ? 'Salary' : 'Hourly'}
                      </Badge>
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant={role.exempt_status === 'exempt' ? 'warning' : 'neutral'}>
                        {role.exempt_status === 'exempt' ? 'Exempt' : 'Non-Exempt'}
                      </Badge>
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant={role.is_active ? 'success' : 'neutral'}>
                        {role.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(role);
                          }}
                          className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(role.id);
                          }}
                          className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--color-danger-bg)] hover:text-[var(--color-danger-text)] transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Job Role' : 'Add Job Role'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Job Code"
              placeholder="e.g. SWE-001"
              value={form.job_code}
              onChange={e => updateField('job_code', e.target.value)}
              error={errors.job_code}
              required
            />
            <Input
              label="Job Title"
              placeholder="e.g. Software Engineer"
              value={form.job_title}
              onChange={e => updateField('job_title', e.target.value)}
              error={errors.job_title}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Job Level"
              placeholder="e.g. Senior, L5, Manager"
              value={form.job_level}
              onChange={e => updateField('job_level', e.target.value)}
            />
            <Select
              label="Default Department"
              options={departmentOptions}
              value={form.department_id}
              onChange={e => updateField('department_id', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Select
              label="Employment Type Default"
              options={EMPLOYMENT_TYPE_OPTIONS}
              value={form.employment_type_default}
              onChange={e =>
                updateField(
                  'employment_type_default',
                  e.target.value as JobRoleFormData['employment_type_default']
                )
              }
            />
            <Select
              label="Compensation Type Default"
              options={COMPENSATION_TYPE_OPTIONS}
              value={form.compensation_type_default}
              onChange={e =>
                updateField(
                  'compensation_type_default',
                  e.target.value as JobRoleFormData['compensation_type_default']
                )
              }
            />
            <Select
              label="Exempt Status"
              options={EXEMPT_STATUS_OPTIONS}
              value={form.exempt_status}
              onChange={e =>
                updateField(
                  'exempt_status',
                  e.target.value as JobRoleFormData['exempt_status']
                )
              }
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is-active"
              checked={form.is_active}
              onChange={e => updateField('is_active', e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border)] bg-[var(--bg-surface)] text-[var(--accent)] focus:ring-[var(--accent)]"
            />
            <label htmlFor="is-active" className="text-sm font-medium text-[var(--text-secondary)]">
              Active
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] pt-4">
            <Button variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              <Save className="h-4 w-4" />
              {editingId ? 'Update Job Role' : 'Create Job Role'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Job Role"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Are you sure you want to delete this job role? This action cannot be undone.
            Any employees currently assigned to this role may be affected.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
