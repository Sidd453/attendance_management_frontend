import { useEffect, useState } from 'react';
import {
  TrendingUp, Award, Building2, Users,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import { Card, Avatar, Skeleton } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';

interface MonthlyTrend { month: string; present: number; late: number; absent: number; leave: number }
interface DeptPerf { name: string; employees: number; attendanceRate: number; lateRate: number; color: string }
interface TopEmployee { name: string; department: string; attendanceRate: number; avatarColor: string; employeeId: string }
interface LateWeek { week: string; late: number; severe: number }
interface AbsenceMonth { month: string; sick: number; casual: number; unexplained: number }
interface WorkingHoursDay { day: string; hours: number; overtime: number }

interface AnalyticsData {
  attendanceRate: number;
  monthlyTrend: MonthlyTrend[];
  departmentPerformance: DeptPerf[];
  topEmployees: TopEmployee[];
  lateArrivalAnalysis: LateWeek[];
  absenceTrends: AbsenceMonth[];
  workingHoursData: WorkingHoursDay[];
  totalEmployees: number;
}

export function AnalyticsPage() {
  const toast = useToast();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.analytics
      .get()
      .then((res) => setData(res.data as AnalyticsData))
      .catch(() => toast('Failed to load analytics. Is the backend running?', 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    );
  }

  const { attendanceRate, monthlyTrend, departmentPerformance, topEmployees, lateArrivalAnalysis, absenceTrends, workingHoursData } = data;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-ink-50">Analytics</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Advanced workforce analytics and insights</p>
      </div>

      {/* Attendance rate big card */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <div className="flex items-center gap-2 text-sm text-ink-500 dark:text-ink-400"><TrendingUp className="h-4 w-4" /> Overall Attendance Rate</div>
          <div className="mt-4 flex items-end gap-2">
            <p className="text-5xl font-bold tracking-tight text-ink-900 dark:text-ink-50">{attendanceRate}</p>
            <span className="pb-1.5 text-2xl font-semibold text-ink-400">%</span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-ink-400">Live workforce attendance rate</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400" style={{ width: `${attendanceRate}%` }} />
          </div>
        </Card>

        {/* Monthly trend */}
        <Card className="lg:col-span-2">
          <div className="border-b border-ink-100 px-5 py-4 dark:border-ink-800">
            <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">Monthly Attendance Trend</h2>
            <p className="text-xs text-ink-500 dark:text-ink-400">12-month overview</p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="present" stroke="#16a34a" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Department + Late arrival */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="border-b border-ink-100 px-5 py-4 dark:border-ink-800">
            <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">Department Performance</h2>
            <p className="text-xs text-ink-500 dark:text-ink-400">Attendance rate by department</p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={departmentPerformance.map((d) => ({ name: d.name.slice(0, 4), rate: d.attendanceRate, color: d.color }))} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} cursor={{ fill: '#f3f4f6' }} />
                <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                  {departmentPerformance.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="border-b border-ink-100 px-5 py-4 dark:border-ink-800">
            <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">Late Arrival Analysis</h2>
            <p className="text-xs text-ink-500 dark:text-ink-400">Weekly late arrivals and severe cases</p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={lateArrivalAnalysis}>
                <defs>
                  <linearGradient id="lateG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient>
                  <linearGradient id="severeG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} fill="url(#lateG)" />
                <Area type="monotone" dataKey="severe" stroke="#ef4444" strokeWidth={2} fill="url(#severeG)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Absence trends + Working hours */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="border-b border-ink-100 px-5 py-4 dark:border-ink-800">
            <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">Absence Trends</h2>
            <p className="text-xs text-ink-500 dark:text-ink-400">Breakdown by absence type</p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={absenceTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="sick" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="casual" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="unexplained" stroke="#a855f7" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="border-b border-ink-100 px-5 py-4 dark:border-ink-800">
            <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">Working Hours</h2>
            <p className="text-xs text-ink-500 dark:text-ink-400">Average hours and overtime per day</p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={workingHoursData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} cursor={{ fill: '#f3f4f6' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="hours" name="Regular Hours" fill="#16a34a" radius={[6, 6, 0, 0]} />
                <Bar dataKey="overtime" name="Overtime" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Leaderboard + Rankings */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="border-b border-ink-100 px-5 py-4 dark:border-ink-800">
            <h2 className="flex items-center gap-2 text-base font-semibold text-ink-900 dark:text-ink-50"><Award className="h-4 w-4 text-amber-500" /> Top Attendance Employees</h2>
            <p className="text-xs text-ink-500 dark:text-ink-400">Best attendance records this quarter</p>
          </div>
          <div className="p-3">
            {topEmployees.map((e, i) => (
              <div key={e.employeeId} className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-ink-50 dark:hover:bg-ink-800">
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' : i === 1 ? 'bg-ink-200 text-ink-700 dark:bg-ink-700 dark:text-ink-200' : i === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300' : 'bg-ink-100 text-ink-500 dark:bg-ink-800'}`}>{i + 1}</span>
                <Avatar name={e.name} color={e.avatarColor} size="sm" />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-ink-800 dark:text-ink-200">{e.name}</p><p className="truncate text-xs text-ink-400">{e.department}</p></div>
                <span className="text-sm font-bold text-brand-600 dark:text-brand-400">{e.attendanceRate}%</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="border-b border-ink-100 px-5 py-4 dark:border-ink-800">
            <h2 className="flex items-center gap-2 text-base font-semibold text-ink-900 dark:text-ink-50"><Building2 className="h-4 w-4 text-brand-500" /> Departments With Highest Attendance</h2>
            <p className="text-xs text-ink-500 dark:text-ink-400">Ranked by attendance rate</p>
          </div>
          <div className="p-3">
            {[...departmentPerformance].sort((a, b) => b.attendanceRate - a.attendanceRate).map((d, i) => (
              <div key={d.name} className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-ink-50 dark:hover:bg-ink-800">
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' : i === 1 ? 'bg-ink-200 text-ink-700 dark:bg-ink-700 dark:text-ink-200' : i === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300' : 'bg-ink-100 text-ink-500 dark:bg-ink-800'}`}>{i + 1}</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ backgroundColor: d.color }}><Users className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-ink-800 dark:text-ink-200">{d.name}</p><p className="text-xs text-ink-400">{d.employees} employees</p></div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800"><div className="h-full rounded-full" style={{ width: `${d.attendanceRate}%`, backgroundColor: d.color }} /></div>
                  <span className="text-sm font-bold text-ink-700 dark:text-ink-300">{d.attendanceRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
