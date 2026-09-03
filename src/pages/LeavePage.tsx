import { useEffect, useState } from 'react';
import { CalendarDays, Check, X, Eye, Plus, CheckCircle2, XCircle, Hourglass, ClipboardEdit } from 'lucide-react';
import { Card, Avatar, Button, Modal, Input, Select, EmptyState, ConfirmDialog, TableSkeleton } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { isAdminRole } from '@/lib/roles';
import { cn } from '@/lib/utils';

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  type: 'Casual Leave' | 'Sick Leave' | 'Annual Leave' | 'Emergency Leave' | 'Unpaid Leave';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedOn: string;
}

interface RegularizationRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  requestedCheckIn: string | null;
  requestedCheckOut: string | null;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy: string | null;
}

const statusConfig = {
  pending: { label: 'Pending', classes: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300', icon: Hourglass },
  approved: { label: 'Approved', classes: 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300', icon: CheckCircle2 },
  rejected: { label: 'Rejected', classes: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300', icon: XCircle },
};

const leaveTypes = ['Casual Leave', 'Sick Leave', 'Annual Leave', 'Emergency Leave', 'Unpaid Leave'];

export function LeavePage() {
  const toast = useToast();
  const { user } = useAuth();
  const [tab, setTab] = useState<'leave' | 'regularization'>('leave');

  // ── Leave state ──────────────────────────────────────────────
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewTarget, setViewTarget] = useState<LeaveRequest | null>(null);
  const [actionTarget, setActionTarget] = useState<{ req: LeaveRequest; action: 'approve' | 'reject' } | null>(null);
  const [form, setForm] = useState({ type: 'Casual Leave', startDate: '', endDate: '', reason: '' });

  // ── Regularization state ─────────────────────────────────────
  const [regRequests, setRegRequests] = useState<RegularizationRequest[]>([]);
  const [regLoading, setRegLoading] = useState(true);
  const [regFilter, setRegFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [regAddOpen, setRegAddOpen] = useState(false);
  const [regSaving, setRegSaving] = useState(false);
  const [regActionTarget, setRegActionTarget] = useState<{ req: RegularizationRequest; action: 'approve' | 'reject' } | null>(null);
  const [regForm, setRegForm] = useState({ date: '', requestedCheckIn: '', requestedCheckOut: '', reason: '' });

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.leave.list({ limit: '50', ...(filter !== 'all' ? { status: filter } : {}) }),
      api.leave.stats(),
    ])
      .then(([listRes, statsRes]) => {
        setRequests((listRes.data?.items ?? []) as LeaveRequest[]);
        setStats(statsRes.data as typeof stats);
      })
      .catch(() => toast('Failed to load leave requests. Is the backend running?', 'error'))
      .finally(() => setLoading(false));
  };

  const loadRegData = () => {
    setRegLoading(true);
    api.regularizations
      .list({ limit: '50', ...(regFilter !== 'all' ? { status: regFilter } : {}) })
      .then((res) => setRegRequests((res.data?.items ?? []) as RegularizationRequest[]))
      .catch(() => toast('Failed to load regularization requests. Is the backend running?', 'error'))
      .finally(() => setRegLoading(false));
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    loadRegData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regFilter]);

  const handleAction = async () => {
    if (!actionTarget) return;
    const { req, action } = actionTarget;
    try {
      await api.leave.updateStatus(req.id, action === 'approve' ? 'approved' : 'rejected');
      toast(`Leave request ${action === 'approve' ? 'approved' : 'rejected'}`, action === 'approve' ? 'success' : 'info');
      loadData();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update request', 'error');
    } finally {
      setActionTarget(null);
    }
  };

  const handleAdd = async () => {
    if (!form.startDate || !form.endDate || !form.reason.trim()) {
      toast('Please fill all fields', 'error');
      return;
    }
    if (!user?.employeeId) {
      toast('Unable to determine your employee ID', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.leave.create({
        employeeId: user.employeeId,
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
      });
      setAddOpen(false);
      setForm({ type: 'Casual Leave', startDate: '', endDate: '', reason: '' });
      toast('Leave request submitted', 'success');
      loadData();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to submit request', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRegAction = async () => {
    if (!regActionTarget) return;
    const { req, action } = regActionTarget;
    try {
      await api.regularizations.updateStatus(req.id, action === 'approve' ? 'approved' : 'rejected');
      toast(`Regularization request ${action === 'approve' ? 'approved' : 'rejected'}`, action === 'approve' ? 'success' : 'info');
      loadRegData();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update request', 'error');
    } finally {
      setRegActionTarget(null);
    }
  };

  const handleRegAdd = async () => {
    if (!regForm.date || !regForm.reason.trim()) {
      toast('Please fill the date and reason', 'error');
      return;
    }
    if (!regForm.requestedCheckIn && !regForm.requestedCheckOut) {
      toast('Enter a corrected check-in and/or check-out time', 'error');
      return;
    }
    setRegSaving(true);
    try {
      await api.regularizations.create({
        date: regForm.date,
        requestedCheckIn: regForm.requestedCheckIn || null,
        requestedCheckOut: regForm.requestedCheckOut || null,
        reason: regForm.reason,
      });
      setRegAddOpen(false);
      setRegForm({ date: '', requestedCheckIn: '', requestedCheckOut: '', reason: '' });
      toast('Regularization request submitted', 'success');
      loadRegData();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to submit request', 'error');
    } finally {
      setRegSaving(false);
    }
  };

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter);
  const regFiltered = regFilter === 'all' ? regRequests : regRequests.filter((r) => r.status === regFilter);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-ink-50">
            {tab === 'leave' ? (isAdminRole(user?.role) ? 'Leave Management' : 'My Leave') : (isAdminRole(user?.role) ? 'Attendance Regularization' : 'Correction Requests')}
          </h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            {tab === 'leave'
              ? (isAdminRole(user?.role) ? 'Review and manage employee leave requests' : 'Apply for leave and track your requests')
              : (isAdminRole(user?.role) ? 'Review requests to correct a missed or incorrect punch' : 'Request a correction for a missed or wrong check-in/check-out')}
          </p>
        </div>
        {tab === 'leave' ? (
          <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Request Leave</Button>
        ) : (
          <Button onClick={() => setRegAddOpen(true)}><ClipboardEdit className="h-4 w-4" /> Request Correction</Button>
        )}
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 rounded-xl border border-ink-200 bg-white p-1 dark:border-ink-800 dark:bg-ink-900">
        <button onClick={() => setTab('leave')} className={cn('flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors', tab === 'leave' ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800')}>
          Leave Requests
        </button>
        <button onClick={() => setTab('regularization')} className={cn('flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors', tab === 'regularization' ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800')}>
          Attendance Regularization
        </button>
      </div>

      {tab === 'leave' ? (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100 dark:bg-ink-800"><CalendarDays className="h-5 w-5 text-ink-600 dark:text-ink-300" /></div><div><p className="text-2xl font-bold text-ink-900 dark:text-ink-50">{stats.total}</p><p className="text-xs text-ink-500 dark:text-ink-400">Total Requests</p></div></div></Card>
            <Card className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/10"><Hourglass className="h-5 w-5 text-amber-600" /></div><div><p className="text-2xl font-bold text-ink-900 dark:text-ink-50">{stats.pending}</p><p className="text-xs text-ink-500 dark:text-ink-400">Pending</p></div></div></Card>
            <Card className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10"><CheckCircle2 className="h-5 w-5 text-brand-600" /></div><div><p className="text-2xl font-bold text-ink-900 dark:text-ink-50">{stats.approved}</p><p className="text-xs text-ink-500 dark:text-ink-400">Approved</p></div></div></Card>
            <Card className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10"><XCircle className="h-5 w-5 text-red-600" /></div><div><p className="text-2xl font-bold text-ink-900 dark:text-ink-50">{stats.rejected}</p><p className="text-xs text-ink-500 dark:text-ink-400">Rejected</p></div></div></Card>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 rounded-xl border border-ink-200 bg-white p-1 dark:border-ink-800 dark:bg-ink-900">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={cn('flex-1 rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors', filter === f ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800')}>
                {f === 'all' ? 'All Requests' : f}
              </button>
            ))}
          </div>

          {/* Table */}
          <Card>
            <div className="overflow-x-auto">
              {loading ? (
                <TableSkeleton rows={6} cols={8} />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink-100 text-left text-xs font-medium uppercase tracking-wide text-ink-400 dark:border-ink-800">
                      <th className="px-5 py-3">Employee</th>
                      <th className="hidden px-5 py-3 md:table-cell">Leave Type</th>
                      <th className="hidden px-5 py-3 lg:table-cell">Start</th>
                      <th className="hidden px-5 py-3 lg:table-cell">End</th>
                      <th className="px-5 py-3">Days</th>
                      <th className="hidden px-5 py-3 xl:table-cell">Reason</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 20).map((r) => {
                      const sc = statusConfig[r.status];
                      return (
                        <tr key={r.id} className="border-b border-ink-50 transition-colors hover:bg-ink-50/50 dark:border-ink-800/50 dark:hover:bg-ink-800/30">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={r.employeeName} color="#6366f1" size="sm" />
                              <div><p className="font-medium text-ink-800 dark:text-ink-200">{r.employeeName}</p><p className="text-xs text-ink-400">{r.department}</p></div>
                            </div>
                          </td>
                          <td className="hidden px-5 py-3 md:table-cell"><span className="rounded-lg bg-ink-100 px-2 py-1 text-xs font-medium text-ink-700 dark:bg-ink-800 dark:text-ink-200">{r.type}</span></td>
                          <td className="hidden px-5 py-3 text-ink-600 dark:text-ink-300 lg:table-cell">{r.startDate}</td>
                          <td className="hidden px-5 py-3 text-ink-600 dark:text-ink-300 lg:table-cell">{r.endDate}</td>
                          <td className="px-5 py-3 font-medium text-ink-700 dark:text-ink-300">{r.days}</td>
                          <td className="hidden max-w-[160px] truncate px-5 py-3 text-ink-500 dark:text-ink-400 xl:table-cell">{r.reason}</td>
                          <td className="px-5 py-3"><span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium', sc.classes)}><sc.icon className="h-3 w-3" /> {sc.label}</span></td>
                          <td className="px-5 py-3">
                            <div className="flex justify-end gap-1">
                              {r.status === 'pending' && isAdminRole(user?.role) && (
                                <>
                                  <button onClick={() => setActionTarget({ req: r, action: 'approve' })} className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10" title="Approve"><Check className="h-4 w-4" /></button>
                                  <button onClick={() => setActionTarget({ req: r, action: 'reject' })} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10" title="Reject"><X className="h-4 w-4" /></button>
                                </>
                              )}
                              <button onClick={() => setViewTarget(r)} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800" title="View"><Eye className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              {!loading && filtered.length === 0 && (
                <EmptyState icon={<CalendarDays className="h-7 w-7" />} title="No leave requests" description="Leave requests will appear here when submitted" />
              )}
            </div>
          </Card>
        </>
      ) : (
        <>
          {/* Filter tabs */}
          <div className="flex gap-1 rounded-xl border border-ink-200 bg-white p-1 dark:border-ink-800 dark:bg-ink-900">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
              <button key={f} onClick={() => setRegFilter(f)} className={cn('flex-1 rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors', regFilter === f ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800')}>
                {f === 'all' ? 'All Requests' : f}
              </button>
            ))}
          </div>

          {/* Table */}
          <Card>
            <div className="overflow-x-auto">
              {regLoading ? (
                <TableSkeleton rows={6} cols={7} />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink-100 text-left text-xs font-medium uppercase tracking-wide text-ink-400 dark:border-ink-800">
                      <th className="px-5 py-3">Employee</th>
                      <th className="hidden px-5 py-3 md:table-cell">Date</th>
                      <th className="hidden px-5 py-3 lg:table-cell">Requested Check-in</th>
                      <th className="hidden px-5 py-3 lg:table-cell">Requested Check-out</th>
                      <th className="hidden px-5 py-3 xl:table-cell">Reason</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regFiltered.slice(0, 20).map((r) => {
                      const sc = statusConfig[r.status];
                      return (
                        <tr key={r.id} className="border-b border-ink-50 transition-colors hover:bg-ink-50/50 dark:border-ink-800/50 dark:hover:bg-ink-800/30">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={r.employeeName} color="#6366f1" size="sm" />
                              <div><p className="font-medium text-ink-800 dark:text-ink-200">{r.employeeName}</p><p className="text-xs text-ink-400">{r.department}</p></div>
                            </div>
                          </td>
                          <td className="hidden px-5 py-3 text-ink-600 dark:text-ink-300 md:table-cell">{r.date}</td>
                          <td className="hidden px-5 py-3 text-ink-600 dark:text-ink-300 lg:table-cell">{r.requestedCheckIn || '—'}</td>
                          <td className="hidden px-5 py-3 text-ink-600 dark:text-ink-300 lg:table-cell">{r.requestedCheckOut || '—'}</td>
                          <td className="hidden max-w-[200px] truncate px-5 py-3 text-ink-500 dark:text-ink-400 xl:table-cell">{r.reason}</td>
                          <td className="px-5 py-3"><span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium', sc.classes)}><sc.icon className="h-3 w-3" /> {sc.label}</span></td>
                          <td className="px-5 py-3">
                            <div className="flex justify-end gap-1">
                              {r.status === 'pending' && isAdminRole(user?.role) && (
                                <>
                                  <button onClick={() => setRegActionTarget({ req: r, action: 'approve' })} className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10" title="Approve"><Check className="h-4 w-4" /></button>
                                  <button onClick={() => setRegActionTarget({ req: r, action: 'reject' })} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10" title="Reject"><X className="h-4 w-4" /></button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              {!regLoading && regFiltered.length === 0 && (
                <EmptyState icon={<ClipboardEdit className="h-7 w-7" />} title="No regularization requests" description="Attendance correction requests will appear here when submitted" />
              )}
            </div>
          </Card>
        </>
      )}

      {/* Add leave modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Request Leave" description="Submit a new leave request for approval" footer={<><Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={handleAdd} disabled={saving}>{saving ? 'Submitting...' : 'Submit Request'}</Button></>}>
        <div className="space-y-4">
          <Select label="Leave Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} options={leaveTypes.map((t) => ({ value: t, label: t }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <Input label="End Date" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-300">Reason</label>
            <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={3} placeholder="Brief reason for leave..." className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950 dark:text-ink-100 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
          </div>
        </div>
      </Modal>

      {/* Add regularization modal */}
      <Modal open={regAddOpen} onClose={() => setRegAddOpen(false)} title="Request Attendance Correction" description="Ask your manager to fix a missed or incorrect punch for a specific day" footer={<><Button variant="outline" onClick={() => setRegAddOpen(false)}>Cancel</Button><Button onClick={handleRegAdd} disabled={regSaving}>{regSaving ? 'Submitting...' : 'Submit Request'}</Button></>}>
        <div className="space-y-4">
          <Input label="Date" type="date" value={regForm.date} onChange={(e) => setRegForm({ ...regForm, date: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Correct Check-in" type="time" value={regForm.requestedCheckIn} onChange={(e) => setRegForm({ ...regForm, requestedCheckIn: e.target.value })} />
            <Input label="Correct Check-out" type="time" value={regForm.requestedCheckOut} onChange={(e) => setRegForm({ ...regForm, requestedCheckOut: e.target.value })} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-300">Reason</label>
            <textarea value={regForm.reason} onChange={(e) => setRegForm({ ...regForm, reason: e.target.value })} rows={3} placeholder="Why does this entry need correction?" className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950 dark:text-ink-100 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
          </div>
        </div>
      </Modal>

      {/* View leave modal */}
      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title="Leave Request Details" size="md">
        {viewTarget && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={viewTarget.employeeName} color="#6366f1" size="md" />
              <div><p className="font-semibold text-ink-800 dark:text-ink-200">{viewTarget.employeeName}</p><p className="text-xs text-ink-400">{viewTarget.employeeId} · {viewTarget.department}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-ink-50 p-3 dark:bg-ink-800"><p className="text-xs text-ink-400">Leave Type</p><p className="text-sm font-medium text-ink-700 dark:text-ink-200">{viewTarget.type}</p></div>
              <div className="rounded-xl bg-ink-50 p-3 dark:bg-ink-800"><p className="text-xs text-ink-400">Duration</p><p className="text-sm font-medium text-ink-700 dark:text-ink-200">{viewTarget.days} day{viewTarget.days > 1 ? 's' : ''}</p></div>
              <div className="rounded-xl bg-ink-50 p-3 dark:bg-ink-800"><p className="text-xs text-ink-400">Start Date</p><p className="text-sm font-medium text-ink-700 dark:text-ink-200">{viewTarget.startDate}</p></div>
              <div className="rounded-xl bg-ink-50 p-3 dark:bg-ink-800"><p className="text-xs text-ink-400">End Date</p><p className="text-sm font-medium text-ink-700 dark:text-ink-200">{viewTarget.endDate}</p></div>
            </div>
            <div className="rounded-xl bg-ink-50 p-3 dark:bg-ink-800"><p className="text-xs text-ink-400">Reason</p><p className="text-sm text-ink-700 dark:text-ink-200">{viewTarget.reason}</p></div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-400">Status:</span>
              <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium', statusConfig[viewTarget.status].classes)}>{statusConfig[viewTarget.status].label}</span>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!actionTarget}
        onClose={() => setActionTarget(null)}
        onConfirm={handleAction}
        title={actionTarget?.action === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
        message={actionTarget?.action === 'approve' ? 'Are you sure you want to approve this leave request?' : 'Are you sure you want to reject this leave request?'}
        confirmLabel={actionTarget?.action === 'approve' ? 'Approve' : 'Reject'}
        danger={actionTarget?.action === 'reject'}
      />

      <ConfirmDialog
        open={!!regActionTarget}
        onClose={() => setRegActionTarget(null)}
        onConfirm={handleRegAction}
        title={regActionTarget?.action === 'approve' ? 'Approve Correction' : 'Reject Correction'}
        message={regActionTarget?.action === 'approve' ? 'This will update the attendance record for that day. Continue?' : 'Are you sure you want to reject this correction request?'}
        confirmLabel={regActionTarget?.action === 'approve' ? 'Approve' : 'Reject'}
        danger={regActionTarget?.action === 'reject'}
      />
    </div>
  );
}
