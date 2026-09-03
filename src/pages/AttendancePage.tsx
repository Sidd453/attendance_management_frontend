import { useEffect, useState } from 'react';
import { Search, Download, FileText, Printer, MapPin, MapPinOff, MapPinned, Home } from 'lucide-react';
import { Card, StatusBadge, Avatar, Button, Input, Pagination, EmptyState, TableSkeleton } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';

interface Department {
  id: string;
  name: string;
}
interface Shift {
  id: string;
  name: string;
}
interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  hours: number;
  status: 'present' | 'late' | 'absent' | 'leave';
  workMode: 'office' | 'wfh';
  withinGeofence: boolean | null;
}

const pageSize = 10;

export function AttendancePage() {
  const toast = useToast();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [shiftFilter, setShiftFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.departments.list().then((res) => setDepartments((res.data ?? []) as Department[])).catch(() => {});
    api.shifts.list().then((res) => setShifts((res.data ?? []) as Shift[])).catch(() => {});
  }, []);

  // Debounce the search box so we don't fire a request on every keystroke,
  // and jump back to page 1 once the debounced term actually changes.
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const deptName = departments.find((d) => d.id === deptFilter)?.name;
    api.attendance
      .list({
        page: String(page),
        limit: String(pageSize),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        ...(deptFilter !== 'all' && deptName ? { department: deptName } : {}),
        ...(shiftFilter !== 'all' ? { shiftId: shiftFilter } : {}),
        ...(dateFilter ? { date: dateFilter } : {}),
      })
      .then((res) => {
        setRecords((res.data?.items ?? []) as AttendanceRecord[]);
        setTotalPages(res.data?.pagination?.totalPages ?? 1);
        // Drop any selections that no longer apply to the freshly loaded page.
        setSelected(new Set());
      })
      .catch(() => toast('Failed to load attendance records. Is the backend running?', 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, deptFilter, shiftFilter, dateFilter, debouncedSearch, departments]);

  const toggleSelect = (id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === records.length) setSelected(new Set());
    else setSelected(new Set(records.map((r) => r.id)));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-ink-50">Attendance Management</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Track and manage employee attendance records</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="md" onClick={() => toast('PDF export started...', 'info')}><FileText className="h-4 w-4" /> Export PDF</Button>
          <Button variant="outline" size="md" onClick={() => toast('CSV export started...', 'info')}><Download className="h-4 w-4" /> Export CSV</Button>
          <Button variant="outline" size="md" onClick={() => toast('Preparing print view...', 'info')}><Printer className="h-4 w-4" /> Print</Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Input placeholder="Search employee..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search className="h-4 w-4" />} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-300">Department</label>
            <select value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }} className="h-10 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm dark:border-ink-700 dark:bg-ink-950 dark:text-ink-100">
              <option value="all">All Departments</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-300">Status</label>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="h-10 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm dark:border-ink-700 dark:bg-ink-950 dark:text-ink-100">
              <option value="all">All Status</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="leave">On Leave</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-300">Shift</label>
            <select value={shiftFilter} onChange={(e) => { setShiftFilter(e.target.value); setPage(1); }} className="h-10 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm dark:border-ink-700 dark:bg-ink-950 dark:text-ink-100">
              <option value="all">All Shifts</option>
              {shifts.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-300">Date</label>
            <div className="flex gap-1.5">
              <Input type="date" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setPage(1); }} />
              {dateFilter && (
                <button
                  type="button"
                  onClick={() => { setDateFilter(''); setPage(1); }}
                  className="shrink-0 rounded-xl border border-ink-200 px-2.5 text-xs font-medium text-ink-500 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-400 dark:hover:bg-ink-800"
                  title="Show all dates"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {selected.size > 0 && (
          <div className="flex items-center justify-between border-b border-brand-100 bg-brand-50/50 px-5 py-2.5 dark:border-brand-500/20 dark:bg-brand-500/5">
            <span className="text-sm font-medium text-brand-700 dark:text-brand-300">{selected.size} records selected</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => toast('Bulk export started...', 'info')}><Download className="h-3.5 w-3.5" /> Export Selected</Button>
              <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={8} cols={8} />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs font-medium uppercase tracking-wide text-ink-400 dark:border-ink-800">
                  <th className="px-5 py-3">
                    <input type="checkbox" checked={selected.size === records.length && records.length > 0} onChange={toggleSelectAll} className="h-4 w-4 rounded border-ink-300 text-brand-600" />
                  </th>
                  <th className="px-5 py-3">Employee</th>
                  <th className="hidden px-5 py-3 md:table-cell">Department</th>
                  <th className="hidden px-5 py-3 sm:table-cell">Date</th>
                  <th className="px-5 py-3">Check In</th>
                  <th className="hidden px-5 py-3 sm:table-cell">Check Out</th>
                  <th className="px-5 py-3">Hours</th>
                  <th className="hidden px-5 py-3 lg:table-cell">Location</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b border-ink-50 transition-colors hover:bg-ink-50/50 dark:border-ink-800/50 dark:hover:bg-ink-800/30">
                    <td className="px-5 py-3">
                      <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} className="h-4 w-4 rounded border-ink-300 text-brand-600" />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={r.employeeName} color="#6366f1" size="sm" />
                        <div>
                          <p className="font-medium text-ink-800 dark:text-ink-200">{r.employeeName}</p>
                          <p className="text-xs text-ink-400">{r.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-5 py-3 text-ink-600 dark:text-ink-300 md:table-cell">{r.department}</td>
                    <td className="hidden px-5 py-3 text-ink-600 dark:text-ink-300 sm:table-cell">{r.date}</td>
                    <td className="px-5 py-3 text-ink-600 dark:text-ink-300">{r.checkIn || '—'}</td>
                    <td className="hidden px-5 py-3 text-ink-600 dark:text-ink-300 sm:table-cell">{r.checkOut || '—'}</td>
                    <td className="px-5 py-3 text-ink-600 dark:text-ink-300">{r.hours > 0 ? `${r.hours}h` : '—'}</td>
                    <td className="hidden px-5 py-3 lg:table-cell">
                      {!r.checkIn ? (
                        <span className="text-ink-300">—</span>
                      ) : r.workMode === 'wfh' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400" title="Work From Home"><Home className="h-3.5 w-3.5" /> WFH</span>
                      ) : r.withinGeofence === null ? (
                        <span className="inline-flex items-center gap-1 text-xs text-ink-400" title="Location not shared"><MapPinOff className="h-3.5 w-3.5" /> Unknown</span>
                      ) : r.withinGeofence ? (
                        <span className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400" title="Verified at office"><MapPin className="h-3.5 w-3.5" /> Office</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400" title="Outside geofence"><MapPinned className="h-3.5 w-3.5" /> Outside</span>
                      )}
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && records.length === 0 && (
            <EmptyState
              icon={<Search className="h-7 w-7" />}
              title="No attendance records found"
              description="Try adjusting your filters or search terms"
              action={<Button variant="outline" size="sm" onClick={() => { setSearch(''); setDeptFilter('all'); setStatusFilter('all'); setShiftFilter('all'); setDateFilter(''); }}>Clear filters</Button>}
            />
          )}
        </div>
        {!loading && records.length > 0 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
      </Card>
    </div>
  );
}
