import { useEffect, useState } from 'react';
import { Users, MoreVertical, Plus, Pencil, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, Button, Skeleton, Modal, Input, ConfirmDialog } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface DeptData {
  id: string;
  name: string;
  manager: string;
  color: string;
  employees: number;
  attendanceRate: number;
  lateRate: number;
}

const colorOptions = ['#6366f1', '#16a34a', '#f59e0b', '#3b82f6', '#a855f7', '#ef4444', '#0ea5e9', '#ec4899'];

export function DepartmentsPage() {
  const toast = useToast();
  const [deptData, setDeptData] = useState<DeptData[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editTarget, setEditTarget] = useState<DeptData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', manager: '', color: colorOptions[0] });

  const loadDepartments = () => {
    setLoading(true);
    api.departments
      .list()
      .then((res) => setDeptData((res.data ?? []) as DeptData[]))
      .catch(() => toast('Failed to load departments. Is the backend running?', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => {
    setForm({ name: '', manager: '', color: colorOptions[0] });
    setEditTarget(null);
    setAddOpen(true);
  };

  const openEdit = (d: DeptData) => {
    setForm({ name: d.name, manager: d.manager, color: d.color });
    setEditTarget(d);
    setOpenMenuId(null);
    setAddOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast('Department name is required', 'error'); return; }
    if (!form.manager.trim()) { toast('Manager name is required', 'error'); return; }
    setSaving(true);
    try {
      const payload = { name: form.name, manager: form.manager, managerId: form.manager, color: form.color };
      if (editTarget) {
        await api.departments.update(editTarget.id, payload);
        toast('Department updated successfully', 'success');
      } else {
        await api.departments.create(payload);
        toast('Department created successfully', 'success');
      }
      setAddOpen(false);
      loadDepartments();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save department', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.departments.delete(deleteTarget);
      toast('Department deleted', 'success');
      loadDepartments();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete department', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-ink-50">Departments</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{deptData.length} departments across the organization</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4" /> Add Department</Button>
      </div>

      {/* Department cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {deptData.map((d) => (
          <Card key={d.id} hover className="relative p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl text-white" style={{ backgroundColor: d.color }}>
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-ink-900 dark:text-ink-50">{d.name}</p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">Manager: {d.manager || 'Not assigned'}</p>
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => setOpenMenuId(openMenuId === d.id ? null : d.id)}
                  className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {openMenuId === d.id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                    <div className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-xl border border-ink-200 bg-white py-1 shadow-float dark:border-ink-800 dark:bg-ink-900">
                      <button
                        onClick={() => openEdit(d)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-800"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => { setDeleteTarget(d.id); setOpenMenuId(null); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-ink-50 p-2.5 text-center dark:bg-ink-800">
                <p className="text-lg font-bold text-ink-800 dark:text-ink-200">{d.employees}</p>
                <p className="text-[10px] text-ink-400">Employees</p>
              </div>
              <div className="rounded-lg bg-brand-50 p-2.5 text-center dark:bg-brand-500/10">
                <p className="text-lg font-bold text-brand-700 dark:text-brand-300">{d.attendanceRate}%</p>
                <p className="text-[10px] text-ink-400">Attendance</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-2.5 text-center dark:bg-amber-500/10">
                <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{d.lateRate}%</p>
                <p className="text-[10px] text-ink-400">Late Rate</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-400">Attendance Rate</span>
                <span className="font-semibold text-ink-700 dark:text-ink-300">{d.attendanceRate}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                <div className="h-full rounded-full transition-all" style={{ width: `${d.attendanceRate}%`, backgroundColor: d.color }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Performance chart */}
      <Card>
        <div className="border-b border-ink-100 px-5 py-4 dark:border-ink-800">
          <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">Department Performance Comparison</h2>
          <p className="text-xs text-ink-500 dark:text-ink-400">Attendance rates and late arrivals by department</p>
        </div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={deptData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} cursor={{ fill: '#f3f4f6' }} />
              <Bar dataKey="attendanceRate" name="Attendance %" radius={[6, 6, 0, 0]}>
                {deptData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
              <Bar dataKey="lateRate" name="Late %" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={editTarget ? 'Edit Department' : 'Add New Department'}
        description={editTarget ? 'Update department details' : 'Create a new department'}
        footer={<><Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Create Department'}</Button></>}
      >
        <div className="space-y-4">
          <Input label="Department Name" placeholder="Enter department name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Manager Name" placeholder="Enter manager's name" value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} />
          <div>
            <p className="mb-2 text-sm font-medium text-ink-700 dark:text-ink-300">Color</p>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={cn('h-8 w-8 rounded-full ring-offset-2 transition-all dark:ring-offset-ink-900', form.color === c ? 'ring-2 ring-ink-900 dark:ring-white' : '')}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Department"
        message="Are you sure you want to delete this department? Employees assigned to it will need reassignment."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}

