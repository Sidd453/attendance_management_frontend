import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, Pencil, Trash2, Grid3x3, List, Users, Check } from 'lucide-react';
import { Card, Avatar, Button, Input, Select, Modal, EmptyState, ConfirmDialog, Pagination, TableSkeleton } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Department {
  id: string;
  name: string;
}
interface Shift {
  id: string;
  name: string;
}
interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  departmentId: string;
  designation: string;
  shift: string;
  shiftId: string;
  role: string;
  status: 'active' | 'inactive';
  attendanceRate: number;
  avatarColor: string;
}

const pageSize = 12;

export function EmployeesPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [empList, setEmpList] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', id: '', email: '', phone: '', department: '', designation: '', joiningDate: '', shift: '', role: 'Employee', status: 'active' as 'active' | 'inactive' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    api.departments.list().then((res) => {
      const depts = (res.data ?? []) as Department[];
      setDepartments(depts);
      setForm((f) => ({ ...f, department: f.department || depts[0]?.id || '' }));
    }).catch(() => {});
    api.shifts.list().then((res) => {
      const s = (res.data ?? []) as Shift[];
      setShifts(s);
      setForm((f) => ({ ...f, shift: f.shift || s[0]?.id || '' }));
    }).catch(() => {});
  }, []);

  const loadEmployees = () => {
    setLoading(true);
    api.employees
      .list({
        page: String(page),
        limit: String(pageSize),
        search,
        ...(deptFilter !== 'all' ? { departmentId: deptFilter } : {}),
      })
      .then((res) => {
        setEmpList((res.data?.items ?? []) as Employee[]);
        setTotalPages(res.data?.pagination?.totalPages ?? 1);
        setTotalCount(res.data?.pagination?.total ?? 0);
      })
      .catch(() => toast('Failed to load employees. Is the backend running?', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, deptFilter]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setPage(1);
      loadEmployees();
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openEdit = (emp: Employee) => {
    setEditTarget(emp);
    setForm({
      name: emp.name,
      id: emp.employeeId,
      email: emp.email,
      phone: emp.phone || '',
      department: emp.departmentId || departments[0]?.id || '',
      designation: emp.designation || '',
      joiningDate: '',
      shift: emp.shiftId || shifts[0]?.id || '',
      role: emp.role || 'Employee',
      status: emp.status || 'active',
    });
    setFormErrors({});
    setAddOpen(true);
  };

  const closeModal = () => {
    setAddOpen(false);
    setEditTarget(null);
  };

  const handleSave = async () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.includes('@')) errs.email = 'Valid email required';
    if (!form.id.trim()) errs.id = 'Employee ID required';
    setFormErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      if (editTarget) {
        await api.employees.update(editTarget.employeeId, {
          name: form.name,
          email: form.email,
          phone: form.phone,
          departmentId: form.department,
          designation: form.designation || 'Staff',
          shiftId: form.shift,
          role: form.role,
          status: form.status,
        });
        toast('Employee updated successfully', 'success');
      } else {
        await api.employees.create({
          name: form.name,
          employeeId: form.id,
          email: form.email,
          phone: form.phone,
          departmentId: form.department,
          designation: form.designation || 'Staff',
          joiningDate: form.joiningDate || new Date().toISOString().slice(0, 10),
          shiftId: form.shift,
          role: form.role,
        });
        toast('Employee added successfully', 'success');
      }
      closeModal();
      setForm({ name: '', id: '', email: '', phone: '', department: departments[0]?.id ?? '', designation: '', joiningDate: '', shift: shifts[0]?.id ?? '', role: 'Employee', status: 'active' });
      loadEmployees();
    } catch (err) {
      toast(err instanceof Error ? err.message : `Failed to ${editTarget ? 'update' : 'add'} employee`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.employees.delete(deleteTarget);
      toast('Employee removed', 'success');
      loadEmployees();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to remove employee', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-ink-50">Employees</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{totalCount} employees across {departments.length} departments</p>
        </div>
        <Button onClick={() => { setEditTarget(null); setForm({ name: '', id: '', email: '', phone: '', department: departments[0]?.id ?? '', designation: '', joiningDate: '', shift: shifts[0]?.id ?? '', role: 'Employee', status: 'active' }); setFormErrors({}); setAddOpen(true); }}><Plus className="h-4 w-4" /> Add Employee</Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input placeholder="Search by name, ID, or email..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search className="h-4 w-4" />} className="flex-1" />
          <select value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }} className="h-10 rounded-xl border border-ink-200 bg-white px-3 text-sm dark:border-ink-700 dark:bg-ink-950 dark:text-ink-100">
            <option value="all">All Departments</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <div className="flex gap-1 rounded-lg bg-ink-100 p-1 dark:bg-ink-800">
            <button onClick={() => setView('grid')} className={cn('rounded-md p-1.5 transition-colors', view === 'grid' ? 'bg-white shadow-sm dark:bg-ink-700' : 'text-ink-400')}><Grid3x3 className="h-4 w-4" /></button>
            <button onClick={() => setView('table')} className={cn('rounded-md p-1.5 transition-colors', view === 'table' ? 'bg-white shadow-sm dark:bg-ink-700' : 'text-ink-400')}><List className="h-4 w-4" /></button>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card><TableSkeleton rows={6} cols={6} /></Card>
      ) : empList.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users className="h-7 w-7" />}
            title="No employees found"
            description="Try adjusting your search or filters"
            action={<Button variant="outline" size="sm" onClick={() => { setSearch(''); setDeptFilter('all'); }}>Clear filters</Button>}
          />
        </Card>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {empList.map((emp) => (
            <Card key={emp.id} hover className="p-4">
              <div className="flex items-start gap-3">
                <Avatar name={emp.name} color={emp.avatarColor} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink-900 dark:text-ink-50">{emp.name}</p>
                  <p className="truncate text-xs text-ink-500 dark:text-ink-400">{emp.designation}</p>
                  <p className="mt-0.5 text-xs text-ink-400">{emp.employeeId}</p>
                </div>
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', emp.status === 'active' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' : 'bg-ink-100 text-ink-500 dark:bg-ink-800')}>
                  {emp.status}
                </span>
              </div>
              <div className="mt-3 space-y-1.5 border-t border-ink-100 pt-3 dark:border-ink-800">
                <div className="flex justify-between text-xs"><span className="text-ink-400">Department</span><span className="font-medium text-ink-700 dark:text-ink-300">{emp.department}</span></div>
                <div className="flex justify-between text-xs"><span className="text-ink-400">Shift</span><span className="font-medium text-ink-700 dark:text-ink-300">{emp.shift}</span></div>
                <div className="flex justify-between text-xs"><span className="text-ink-400">Attendance</span><span className="font-semibold text-brand-600 dark:text-brand-400">{emp.attendanceRate}%</span></div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/employees/${emp.employeeId}`)}><Eye className="h-3.5 w-3.5" /> View</Button>
                <Button variant="ghost" size="sm" onClick={() => openEdit(emp)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(emp.employeeId)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs font-medium uppercase tracking-wide text-ink-400 dark:border-ink-800">
                  <th className="px-5 py-3">Employee</th>
                  <th className="hidden px-5 py-3 md:table-cell">Department</th>
                  <th className="hidden px-5 py-3 lg:table-cell">Designation</th>
                  <th className="hidden px-5 py-3 lg:table-cell">Shift</th>
                  <th className="hidden px-5 py-3 sm:table-cell">Attendance</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {empList.map((emp) => (
                  <tr key={emp.id} className="border-b border-ink-50 transition-colors hover:bg-ink-50/50 dark:border-ink-800/50 dark:hover:bg-ink-800/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={emp.name} color={emp.avatarColor} size="sm" />
                        <div>
                          <p className="font-medium text-ink-800 dark:text-ink-200">{emp.name}</p>
                          <p className="text-xs text-ink-400">{emp.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-5 py-3 text-ink-600 dark:text-ink-300 md:table-cell">{emp.department}</td>
                    <td className="hidden px-5 py-3 text-ink-600 dark:text-ink-300 lg:table-cell">{emp.designation}</td>
                    <td className="hidden px-5 py-3 text-ink-600 dark:text-ink-300 lg:table-cell">{emp.shift}</td>
                    <td className="hidden px-5 py-3 sm:table-cell"><span className="font-semibold text-brand-600 dark:text-brand-400">{emp.attendanceRate}%</span></td>
                    <td className="px-5 py-3">
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', emp.status === 'active' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' : 'bg-ink-100 text-ink-500 dark:bg-ink-800')}>{emp.status}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => navigate(`/employees/${emp.employeeId}`)} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-600 dark:hover:bg-ink-800"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => openEdit(emp)} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-600 dark:hover:bg-ink-800"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteTarget(emp.employeeId)} className="rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </Card>
      )}

      {view === 'grid' && empList.length > 0 && (
        <Card>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </Card>
      )}

      {/* Add / Edit Employee Modal */}
      <Modal
        open={addOpen}
        onClose={closeModal}
        title={editTarget ? 'Edit Employee' : 'Add New Employee'}
        description={editTarget ? "Update this employee's details" : 'Fill in the details below to add a new employee to the system'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editTarget ? (<><Check className="h-4 w-4" /> Save Changes</>) : (<><Plus className="h-4 w-4" /> Add Employee</>)}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Full Name" placeholder="Enter full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={formErrors.name} />
          <Input label="Employee ID" placeholder="Enter employee ID" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} error={formErrors.id} disabled={!!editTarget} />
          <Input label="Email" type="email" placeholder="Enter work email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={formErrors.email} />
          <Input label="Phone" placeholder="Enter phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Select label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} options={departments.map((d) => ({ value: d.id, label: d.name }))} />
          <Input label="Designation" placeholder="Enter job title" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
          {!editTarget && <Input label="Joining Date" type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} />}
          <Select label="Shift" value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })} options={shifts.map((s) => ({ value: s.id, label: s.name }))} />
          <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} options={[{ value: 'Employee', label: 'Employee' }, { value: 'Manager', label: 'Manager' }, { value: 'HR Admin', label: 'HR Admin' }]} />
          {editTarget && <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Employee"
        message="Are you sure you want to remove this employee? This action cannot be undone."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
