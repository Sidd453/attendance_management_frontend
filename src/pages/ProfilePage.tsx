import { useEffect, useState } from 'react';
import { Pencil, Download, Mail, Phone, Calendar, Building2, Briefcase, Clock, Shield, KeyRound } from 'lucide-react';
import { Card, Avatar, Button, Skeleton, Modal, Input } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface EmployeeStats {
  attendanceRate: number;
  totalDays: number;
  present: number;
  late: number;
  absent: number;
  leave: number;
}

export function ProfilePage() {
  const toast = useToast();
  const { user: currentUser, refreshUser } = useAuth();
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (!currentUser?.employeeId) return;
    api.employees
      .getStats(currentUser.employeeId)
      .then((res) => setStats(res.data as EmployeeStats))
      .catch(() => toast('Failed to load attendance summary', 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.employeeId]);

  if (!currentUser) return <Skeleton className="h-64 w-full" />;
  const s = stats ?? { attendanceRate: currentUser.attendanceRate ?? 0, totalDays: 0, present: 0, late: 0, absent: 0, leave: 0 };

  const openEdit = () => {
    setEditForm({ name: currentUser.name, phone: currentUser.phone || '' });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) { toast('Name cannot be empty', 'error'); return; }
    setSavingEdit(true);
    try {
      await api.auth.updateMe({ name: editForm.name.trim(), phone: editForm.phone });
      await refreshUser();
      toast('Profile updated successfully', 'success');
      setEditOpen(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update profile', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleChangePassword = async () => {
    if (!pwForm.current || !pwForm.next) { toast('Please fill all fields', 'error'); return; }
    if (pwForm.next.length < 6) { toast('New password must be at least 6 characters', 'error'); return; }
    if (pwForm.next !== pwForm.confirm) { toast('New passwords do not match', 'error'); return; }
    setSavingPw(true);
    try {
      await api.auth.changePassword(pwForm.current, pwForm.next);
      toast('Password changed successfully', 'success');
      setPwOpen(false);
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to change password', 'error');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card className="overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-brand-500/15 via-amber-500/8 to-blue-500/12" />
        <div className="px-6 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="-mt-12">
                <Avatar name={currentUser.name} color={currentUser.avatarColor} size="xl" className="ring-4 ring-white dark:ring-ink-900" />
              </div>
              <div className="pb-1">
                <h1 className="text-xl font-bold text-ink-900 dark:text-ink-50">{currentUser.name}</h1>
                <p className="text-sm text-ink-500 dark:text-ink-400">{currentUser.role} · {currentUser.employeeId}</p>
                <div className="mt-1.5 flex items-center gap-3">
                  <span className="flex items-center gap-1 text-xs text-ink-500 dark:text-ink-400"><Building2 className="h-3.5 w-3.5" /> {currentUser.department}</span>
                  <span className="flex items-center gap-1 text-xs text-ink-500 dark:text-ink-400"><Briefcase className="h-3.5 w-3.5" /> {currentUser.designation}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setPwOpen(true)}><KeyRound className="h-3.5 w-3.5" /> Change Password</Button>
              <Button variant="outline" size="sm" onClick={openEdit}><Pencil className="h-3.5 w-3.5" /> Edit Profile</Button>
              <Button size="sm" onClick={() => toast('Profile report downloaded', 'success')}><Download className="h-3.5 w-3.5" /> Download Report</Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Contact info */}
        <Card className="p-5 lg:col-span-1">
          <h2 className="mb-4 text-base font-semibold text-ink-900 dark:text-ink-50">Personal Information</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-100 dark:bg-ink-800"><Mail className="h-4 w-4 text-ink-500" /></div><div><p className="text-xs text-ink-400">Email</p><p className="text-sm font-medium text-ink-700 dark:text-ink-200">{currentUser.email}</p></div></div>
            <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-100 dark:bg-ink-800"><Phone className="h-4 w-4 text-ink-500" /></div><div><p className="text-xs text-ink-400">Phone</p><p className="text-sm font-medium text-ink-700 dark:text-ink-200">{currentUser.phone}</p></div></div>
            <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-100 dark:bg-ink-800"><Calendar className="h-4 w-4 text-ink-500" /></div><div><p className="text-xs text-ink-400">Joined</p><p className="text-sm font-medium text-ink-700 dark:text-ink-200">{currentUser.joiningDate}</p></div></div>
            <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-100 dark:bg-ink-800"><Clock className="h-4 w-4 text-ink-500" /></div><div><p className="text-xs text-ink-400">Shift</p><p className="text-sm font-medium text-ink-700 dark:text-ink-200">{currentUser.shift}</p></div></div>
            <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-100 dark:bg-ink-800"><Shield className="h-4 w-4 text-ink-500" /></div><div><p className="text-xs text-ink-400">Role</p><p className="text-sm font-medium text-ink-700 dark:text-ink-200">{currentUser.role}</p></div></div>
          </div>
        </Card>

        {/* Stats */}
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold text-ink-900 dark:text-ink-50">My Attendance Summary</h2>
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[68px]" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-brand-50 p-4 dark:bg-brand-500/10"><p className="text-2xl font-bold text-brand-700 dark:text-brand-300">{s.attendanceRate}%</p><p className="text-xs text-ink-500 dark:text-ink-400">Attendance Rate</p></div>
                <div className="rounded-xl bg-ink-50 p-4 dark:bg-ink-800"><p className="text-2xl font-bold text-ink-800 dark:text-ink-200">{s.totalDays}</p><p className="text-xs text-ink-500 dark:text-ink-400">Working Days</p></div>
                <div className="rounded-xl bg-brand-50 p-4 dark:bg-brand-500/10"><p className="text-2xl font-bold text-brand-700 dark:text-brand-300">{s.present}</p><p className="text-xs text-ink-500 dark:text-ink-400">Present Days</p></div>
                <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-500/10"><p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{s.late}</p><p className="text-xs text-ink-500 dark:text-ink-400">Late Arrivals</p></div>
                <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-500/10"><p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{s.leave}</p><p className="text-xs text-ink-500 dark:text-ink-400">Leave Days</p></div>
                <div className="rounded-xl bg-red-50 p-4 dark:bg-red-500/10"><p className="text-2xl font-bold text-red-700 dark:text-red-300">{s.absent}</p><p className="text-xs text-ink-500 dark:text-ink-400">Absent Days</p></div>
              </div>
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-ink-500 dark:text-ink-400">Attendance Progress</span>
                  <span className="font-semibold text-ink-700 dark:text-ink-300">{s.attendanceRate}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                  <div className={cn('h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400')} style={{ width: `${s.attendanceRate}%` }} />
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Profile"
        description="Update your basic information"
        footer={<><Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button><Button onClick={handleSaveEdit} disabled={savingEdit}>{savingEdit ? 'Saving...' : 'Save Changes'}</Button></>}
      >
        <div className="space-y-4">
          <Input label="Full Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          <Input label="Phone" placeholder="Enter phone number" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
          <p className="text-xs text-ink-400">Email, role, and department are managed by your admin.</p>
        </div>
      </Modal>

      <Modal
        open={pwOpen}
        onClose={() => setPwOpen(false)}
        title="Change Password"
        description="Choose a new password for your account"
        footer={<><Button variant="outline" onClick={() => setPwOpen(false)}>Cancel</Button><Button onClick={handleChangePassword} disabled={savingPw}>{savingPw ? 'Saving...' : 'Update Password'}</Button></>}
      >
        <div className="space-y-4">
          <Input label="Current Password" type="password" value={pwForm.current} onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })} />
          <Input label="New Password" type="password" value={pwForm.next} onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })} />
          <Input label="Confirm New Password" type="password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
