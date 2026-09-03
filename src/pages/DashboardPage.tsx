import { useEffect, useMemo, useState } from 'react';
import {
  Users, UserCheck, UserX, Clock, CalendarOff, TrendingUp,
  Download, Filter, Search,
} from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Card, KpiCard, StatusBadge, Avatar, Button, Input, Skeleton } from '@/components/ui';
import { MyAttendanceCard } from '@/components/MyAttendanceCard';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const trendFilters = ['Today', 'This Week', 'This Month', 'Last 3 Months'] as const;
const trendFilterToPeriod: Record<(typeof trendFilters)[number], string> = {
  Today: 'week',
  'This Week': 'week',
  'This Month': 'month',
  'Last 3 Months': 'quarter',
};

interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateArrivals: number;
  onLeave: number;
  attendanceRate: number;
}

interface TrendPoint {
  date: string;
  present: number;
  late: number;
  absent: number;
  leave: number;
}

interface AttendanceRow {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  checkIn: string | null;
  checkOut: string | null;
  hours: number;
  status: 'present' | 'late' | 'absent' | 'leave';
}

interface LivePerson {
  employeeId: string;
  name: string;
  department: string;
  avatarColor: string;
  status: 'checked-in' | 'late' | 'break';
  checkIn: string;
}

interface DeptPerformance {
  name: string;
  attendanceRate: number;
  color: string;
}

export function DashboardPage() {
  const { user } = useAuth();
  const [trendFilter, setTrendFilter] = useState<(typeof trendFilters)[number]>('This Month');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRow[]>([]);
  const [liveAttendance, setLiveAttendance] = useState<LivePerson[]>([]);
  const [deptPerformance, setDeptPerformance] = useState<DeptPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.attendance.dashboardStats(),
      api.attendance.trend(trendFilterToPeriod[trendFilter]),
      api.attendance.today({ limit: '50' }),
      api.attendance.live(),
      api.analytics.get(),
    ])
      .then(([statsRes, trendRes, todayRes, liveRes, analyticsRes]) => {
        if (cancelled) return;
        setStats(statsRes.data as DashboardStats);
        setTrend((trendRes.data ?? []) as TrendPoint[]);
        setTodayAttendance((todayRes.data ?? []) as AttendanceRow[]);
        setLiveAttendance((liveRes.data ?? []) as LivePerson[]);
        setDeptPerformance((analyticsRes.data?.departmentPerformance ?? []) as DeptPerformance[]);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [trendFilter]);

  const filteredAttendance = useMemo(
    () =>
      todayAttendance
        .filter((r) => {
          const matchesSearch =
            r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
            r.employeeId.toLowerCase().includes(search.toLowerCase());
          const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
          return matchesSearch && matchesStatus;
        })
        .slice(0, 8),
    [todayAttendance, search, statusFilter]
  );

  const donutData = stats
    ? [
        { name: 'Present', value: stats.presentToday - stats.lateArrivals, color: '#16a34a' },
        { name: 'Late', value: stats.lateArrivals, color: '#f59e0b' },
        { name: 'Absent', value: stats.absentToday, color: '#ef4444' },
        { name: 'On Leave', value: stats.onLeave, color: '#3b82f6' },
      ]
    : [];

  const deptBarData = deptPerformance.map((d) => ({ name: d.name.slice(0, 4), rate: d.attendanceRate, color: d.color }));

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ink-900 via-ink-950 to-brand-950 p-6 shadow-pop">
        <div className="pattern-dots absolute inset-0 opacity-40" />
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white">
              {greeting}, {user?.name?.split(' ')[0] ?? 'there'}
            </h1>
            <p className="mt-1 text-sm text-white/60">Here's what's happening with your workforce today.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="md" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button size="md">
              <TrendingUp className="h-4 w-4" /> View Reports
            </Button>
          </div>
        </div>
      </div>

      {/* Self check-in / check-out */}
      <MyAttendanceCard />

      {/* KPI Cards */}
      {loading || !stats ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard label="Total Employees" value={stats.totalEmployees.toLocaleString()} icon={Users} accent="bg-brand-500" iconBg="bg-brand-50 text-brand-600 dark:bg-brand-500/10" />
          <KpiCard label="Present Today" value={stats.presentToday} icon={UserCheck} accent="bg-brand-500" iconBg="bg-brand-50 text-brand-600 dark:bg-brand-500/10" />
          <KpiCard label="Absent Today" value={stats.absentToday} icon={UserX} accent="bg-red-500" iconBg="bg-red-50 text-red-600 dark:bg-red-500/10" />
          <KpiCard label="Late Arrivals" value={stats.lateArrivals} icon={Clock} accent="bg-amber-500" iconBg="bg-amber-50 text-amber-600 dark:bg-amber-500/10" />
          <KpiCard label="On Leave" value={stats.onLeave} icon={CalendarOff} accent="bg-blue-500" iconBg="bg-blue-50 text-blue-600 dark:bg-blue-500/10" />
          <KpiCard label="Attendance Rate" value={`${stats.attendanceRate}%`} icon={TrendingUp} accent="bg-brand-500" iconBg="bg-brand-50 text-brand-600 dark:bg-brand-500/10" />
        </div>
      )}

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Trend chart */}
        <Card className="lg:col-span-2">
          <div className="flex flex-col gap-3 border-b border-ink-100 px-5 py-4 dark:border-ink-800 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">Attendance Trend</h2>
              <p className="text-xs text-ink-500 dark:text-ink-400">Present, late, absent and leave over time</p>
            </div>
            <div className="flex gap-1 rounded-lg bg-ink-100 p-1 dark:bg-ink-800">
              {trendFilters.map((f) => (
                <button
                  key={f}
                  onClick={() => setTrendFilter(f)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                    trendFilter === f ? 'bg-white text-ink-900 shadow-sm dark:bg-ink-700 dark:text-ink-50' : 'text-ink-500 hover:text-ink-700 dark:text-ink-400'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="p-4">
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trend.slice(-14)}>
                  <defs>
                    <linearGradient id="cPresent" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} /><stop offset="95%" stopColor="#16a34a" stopOpacity={0} /></linearGradient>
                    <linearGradient id="cLate" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient>
                    <linearGradient id="cAbsent" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="present" stroke="#16a34a" strokeWidth={2} fill="url(#cPresent)" />
                  <Area type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} fill="url(#cLate)" />
                  <Area type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} fill="url(#cAbsent)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Donut */}
        <Card>
          <div className="border-b border-ink-100 px-5 py-4 dark:border-ink-800">
            <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">Attendance Distribution</h2>
            <p className="text-xs text-ink-500 dark:text-ink-400">Today's workforce breakdown</p>
          </div>
          <div className="flex flex-col items-center p-4">
            <div className="relative h-48 w-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} dataKey="value" innerRadius={60} outerRadius={85} paddingAngle={3} stroke="none">
                    {donutData.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-bold text-ink-900 dark:text-ink-50">{stats?.attendanceRate ?? 0}%</p>
                <p className="text-xs text-ink-500 dark:text-ink-400">Attendance Rate</p>
              </div>
            </div>
            <div className="mt-4 grid w-full grid-cols-2 gap-2">
              {donutData.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-xs text-ink-600 dark:text-ink-300">{d.name}</span>
                  <span className="ml-auto text-xs font-semibold text-ink-800 dark:text-ink-200">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Department performance + Live attendance */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="border-b border-ink-100 px-5 py-4 dark:border-ink-800">
            <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">Department Performance</h2>
            <p className="text-xs text-ink-500 dark:text-ink-400">Attendance rate by department</p>
          </div>
          <div className="p-4">
            {loading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={deptBarData} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} cursor={{ fill: '#f3f4f6' }} />
                  <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                    {deptBarData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Live attendance */}
        <Card>
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4 dark:border-ink-800">
            <div>
              <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">Live Attendance</h2>
              <p className="text-xs text-ink-500 dark:text-ink-400">Currently in office</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-red-500" /> Live
            </span>
          </div>
          <div className="max-h-[260px] space-y-1 overflow-y-auto p-3">
            {liveAttendance.length === 0 && !loading && (
              <p className="px-2 py-6 text-center text-sm text-ink-400">No one currently checked in</p>
            )}
            {liveAttendance.slice(0, 8).map((p, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-ink-50 dark:hover:bg-ink-800">
                <Avatar name={p.name} color={p.avatarColor} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-800 dark:text-ink-200">{p.name}</p>
                  <p className="truncate text-xs text-ink-400">{p.department} · {p.checkIn}</p>
                </div>
                <span className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-medium capitalize',
                  p.status === 'late' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                  p.status === 'break' ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' :
                  'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                )}>
                  {p.status.replace('-', ' ')}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Today's attendance table */}
      <Card>
        <div className="flex flex-col gap-3 border-b border-ink-100 px-5 py-4 dark:border-ink-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">Today's Attendance</h2>
            <p className="text-xs text-ink-500 dark:text-ink-400">Real-time employee attendance records</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search className="h-4 w-4" />} className="h-9 w-40" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink-700 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-200"
            >
              <option value="all">All Status</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="leave">On Leave</option>
            </select>
            <Button variant="outline" size="sm"><Filter className="h-3.5 w-3.5" /> Filter</Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs font-medium uppercase tracking-wide text-ink-400 dark:border-ink-800">
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">ID</th>
                  <th className="hidden px-5 py-3 md:table-cell">Department</th>
                  <th className="px-5 py-3">Check In</th>
                  <th className="hidden px-5 py-3 sm:table-cell">Check Out</th>
                  <th className="hidden px-5 py-3 lg:table-cell">Hours</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.map((r) => (
                  <tr key={r.id} className="border-b border-ink-50 transition-colors hover:bg-ink-50/50 dark:border-ink-800/50 dark:hover:bg-ink-800/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={r.employeeName} color="#6366f1" size="sm" />
                        <span className="font-medium text-ink-800 dark:text-ink-200">{r.employeeName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-ink-500 dark:text-ink-400">{r.employeeId}</td>
                    <td className="hidden px-5 py-3 text-ink-600 dark:text-ink-300 md:table-cell">{r.department}</td>
                    <td className="px-5 py-3 text-ink-600 dark:text-ink-300">{r.checkIn || '—'}</td>
                    <td className="hidden px-5 py-3 text-ink-600 dark:text-ink-300 sm:table-cell">{r.checkOut || '—'}</td>
                    <td className="hidden px-5 py-3 text-ink-600 dark:text-ink-300 lg:table-cell">{r.hours > 0 ? `${r.hours}h` : '—'}</td>
                    <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
