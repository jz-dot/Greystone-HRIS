'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus, Shield, Pencil, Trash2, Save, ChevronDown, ChevronRight } from 'lucide-react';
import type { SystemRole, RolePermission, DataScope } from '@/types/database';
import { PERMISSION_CODES } from '@/types/database';

const DATA_SCOPE_OPTIONS = [
  { value: 'self', label: 'Self' },
  { value: 'direct_reports', label: 'Direct Reports' },
  { value: 'department', label: 'Department' },
  { value: 'site', label: 'Site' },
  { value: 'company', label: 'Company' },
];

const EMPTY_ROLE = {
  role_code: '',
  role_name: '',
  role_description: '',
  data_scope_default: 'self' as DataScope,
  can_view_paystubs_self_only: true,
  is_active: true,
};

// Group permission codes by category for UI
function groupPermissions(codes: readonly string[]) {
  const groups: Record<string, string[]> = {};
  for (const code of codes) {
    const [category] = code.split('.');
    if (!groups[category]) groups[category] = [];
    groups[category].push(code);
  }
  return groups;
}

const PERMISSION_GROUPS = groupPermissions(PERMISSION_CODES);

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState<(SystemRole & { permissions?: RolePermission[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<SystemRole | null>(null);
  const [form, setForm] = useState(EMPTY_ROLE);
  const [permissions, setPermissions] = useState<Record<string, { allowed: boolean; scope: DataScope }>>({});
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const supabase = createClient();

  const loadRoles = useCallback(async () => {
    const { data, error } = await supabase
      .from('system_roles')
      .select('*, permissions:role_permissions(*)')
      .order('role_name');

    if (error) {
      showMessage('error', 'Failed to load roles: ' + error.message);
    } else {
      setRoles(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  function openAddModal() {
    setEditingRole(null);
    setForm({ ...EMPTY_ROLE });
    // Initialize all permissions as denied
    const perms: Record<string, { allowed: boolean; scope: DataScope }> = {};
    for (const code of PERMISSION_CODES) {
      perms[code] = { allowed: false, scope: 'self' };
    }
    setPermissions(perms);
    setModalOpen(true);
  }

  function openEditModal(role: SystemRole & { permissions?: RolePermission[] }) {
    setEditingRole(role);
    setForm({
      role_code: role.role_code,
      role_name: role.role_name,
      role_description: role.role_description,
      data_scope_default: role.data_scope_default,
      can_view_paystubs_self_only: role.can_view_paystubs_self_only,
      is_active: role.is_active,
    });
    // Build permissions map from role's permissions
    const perms: Record<string, { allowed: boolean; scope: DataScope }> = {};
    for (const code of PERMISSION_CODES) {
      perms[code] = { allowed: false, scope: role.data_scope_default };
    }
    if (role.permissions) {
      for (const rp of role.permissions) {
        perms[rp.permission_code] = { allowed: rp.allowed, scope: rp.scope };
      }
    }
    setPermissions(perms);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingRole(null);
  }

  async function handleSave() {
    if (!form.role_code.trim() || !form.role_name.trim()) {
      showMessage('error', 'Role code and name are required.');
      return;
    }

    setSaving(true);

    const rolePayload = {
      role_code: form.role_code.trim().toUpperCase(),
      role_name: form.role_name.trim(),
      role_description: form.role_description.trim(),
      data_scope_default: form.data_scope_default,
      can_view_paystubs_self_only: form.can_view_paystubs_self_only,
      is_active: form.is_active,
    };

    let roleId: string;

    if (editingRole) {
      const { error } = await supabase
        .from('system_roles')
        .update(rolePayload)
        .eq('id', editingRole.id);
      if (error) {
        showMessage('error', 'Failed to update role: ' + error.message);
        setSaving(false);
        return;
      }
      roleId = editingRole.id;
    } else {
      const { data, error } = await supabase
        .from('system_roles')
        .insert(rolePayload)
        .select('id')
        .single();
      if (error) {
        showMessage('error', 'Failed to create role: ' + error.message);
        setSaving(false);
        return;
      }
      roleId = data.id;
    }

    // Save permissions: delete existing, then insert
    await supabase.from('role_permissions').delete().eq('role_id', roleId);

    const permRows = Object.entries(permissions)
      .filter(([, v]) => v.allowed)
      .map(([code, v]) => ({
        role_id: roleId,
        permission_code: code,
        allowed: true,
        scope: v.scope,
        notes: '',
      }));

    if (permRows.length > 0) {
      const { error: permError } = await supabase.from('role_permissions').insert(permRows);
      if (permError) {
        showMessage('error', 'Role saved but permissions failed: ' + permError.message);
        setSaving(false);
        await loadRoles();
        closeModal();
        return;
      }
    }

    showMessage('success', editingRole ? 'Role updated successfully.' : 'Role created successfully.');
    setSaving(false);
    await loadRoles();
    closeModal();
  }

  async function handleDelete(roleId: string) {
    // Delete permissions first, then role
    await supabase.from('role_permissions').delete().eq('role_id', roleId);
    const { error } = await supabase.from('system_roles').delete().eq('id', roleId);

    if (error) {
      showMessage('error', 'Failed to delete role: ' + error.message);
    } else {
      showMessage('success', 'Role deleted successfully.');
      await loadRoles();
    }
    setDeleteConfirmId(null);
  }

  function togglePermission(code: string) {
    setPermissions(prev => ({
      ...prev,
      [code]: { ...prev[code], allowed: !prev[code].allowed },
    }));
  }

  function setPermissionScope(code: string, scope: DataScope) {
    setPermissions(prev => ({
      ...prev,
      [code]: { ...prev[code], scope },
    }));
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Roles &amp; Permissions</h2>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            Manage system roles and their access permissions.
          </p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="h-4 w-4" />
          Add Role
        </Button>
      </div>

      {message && (
        <div
          className={
            message.type === 'success'
              ? 'rounded-lg bg-[var(--color-success-bg)] px-4 py-3 text-sm text-[var(--color-success-text)]'
              : 'rounded-lg bg-[var(--color-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger-text)]'
          }
        >
          {message.text}
        </div>
      )}

      {roles.length === 0 ? (
        <Card>
          <EmptyState
            icon={Shield}
            title="No roles yet"
            description="Create your first system role to manage permissions."
            action={
              <Button onClick={openAddModal} size="sm">
                <Plus className="h-4 w-4" />
                Add Role
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {roles.map(role => {
            const isExpanded = expandedRole === role.id;
            const permCount = role.permissions?.filter(p => p.allowed).length ?? 0;
            return (
              <Card key={role.id}>
                <div
                  className="flex items-center justify-between px-6 py-4 cursor-pointer"
                  onClick={() => setExpandedRole(isExpanded ? null : role.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
                    )}
                    <Shield className="h-5 w-5 text-[var(--accent)]" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[var(--text-primary)]">{role.role_name}</span>
                        <span className="font-mono text-xs text-[var(--text-muted)]">{role.role_code}</span>
                        <Badge variant={role.is_active ? 'success' : 'neutral'}>
                          {role.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-[var(--text-tertiary)]">
                        {role.role_description || 'No description'} &middot; {permCount} permission{permCount !== 1 ? 's' : ''} granted
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditModal(role); }}
                      className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] transition-colors"
                      title="Edit role"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(role.id); }}
                      className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--color-danger-bg)] hover:text-[var(--color-danger-text)] transition-colors"
                      title="Delete role"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {isExpanded && role.permissions && role.permissions.length > 0 && (
                  <div className="border-t border-[var(--border)] px-6 py-4">
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {role.permissions
                        .filter(p => p.allowed)
                        .map(p => (
                          <div key={p.id} className="flex items-center gap-2 text-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                            <span className="text-[var(--text-secondary)]">{p.permission_code}</span>
                            <Badge variant="default">{p.scope}</Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                {isExpanded && (!role.permissions || role.permissions.filter(p => p.allowed).length === 0) && (
                  <div className="border-t border-[var(--border)] px-6 py-4">
                    <p className="text-sm text-[var(--text-muted)]">No permissions granted.</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Role"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Are you sure you want to delete the role{' '}
            <span className="font-semibold text-[var(--text-primary)]">
              {roles.find(r => r.id === deleteConfirmId)?.role_name}
            </span>
            ? All associated permissions will also be removed. This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => { if (deleteConfirmId) handleDelete(deleteConfirmId); }}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingRole ? 'Edit Role' : 'Add Role'}
        size="lg"
      >
        <div className="space-y-5">
          {/* Basic Info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Role Code"
              placeholder="e.g. ADMIN"
              required
              value={form.role_code}
              onChange={e => setForm(f => ({ ...f, role_code: e.target.value.toUpperCase() }))}
            />
            <Input
              label="Role Name"
              placeholder="e.g. Administrator"
              required
              value={form.role_name}
              onChange={e => setForm(f => ({ ...f, role_name: e.target.value }))}
            />
          </div>

          <Textarea
            label="Description"
            placeholder="What this role is for..."
            value={form.role_description}
            onChange={e => setForm(f => ({ ...f, role_description: e.target.value }))}
            rows={2}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Default Data Scope"
              options={DATA_SCOPE_OPTIONS}
              value={form.data_scope_default}
              onChange={e => setForm(f => ({ ...f, data_scope_default: e.target.value as DataScope }))}
            />
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.can_view_paystubs_self_only}
                  onChange={e => setForm(f => ({ ...f, can_view_paystubs_self_only: e.target.checked }))}
                  className="h-4 w-4 rounded border-[var(--border)] bg-[var(--bg-surface)] text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <span className="text-sm text-[var(--text-secondary)]">Can view paystubs (self only)</span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
              className="h-4 w-4 rounded border-[var(--border)] bg-[var(--bg-surface)] text-[var(--accent)] focus:ring-[var(--accent)]"
            />
            <span className="text-sm font-medium text-[var(--text-secondary)]">Active</span>
          </div>

          {/* Permissions */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Permissions</h3>
            {Object.entries(PERMISSION_GROUPS).map(([category, codes]) => (
              <div key={category} className="rounded-lg border border-[var(--border)] p-3">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {category}
                </h4>
                <div className="space-y-2">
                  {codes.map(code => (
                    <div key={code} className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions[code]?.allowed ?? false}
                          onChange={() => togglePermission(code)}
                          className="h-4 w-4 rounded border-[var(--border)] bg-[var(--bg-surface)] text-[var(--accent)] focus:ring-[var(--accent)]"
                        />
                        <span className="text-sm text-[var(--text-secondary)]">{code}</span>
                      </label>
                      {permissions[code]?.allowed && (
                        <select
                          value={permissions[code]?.scope ?? 'self'}
                          onChange={e => setPermissionScope(code, e.target.value as DataScope)}
                          className="rounded border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-0.5 text-xs text-[var(--text-secondary)]"
                        >
                          {DATA_SCOPE_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] pt-4">
            <Button variant="ghost" onClick={closeModal} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>
              <Save className="h-4 w-4" />
              {editingRole ? 'Update Role' : 'Create Role'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
