import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Building2, Briefcase, Calendar, Clock, TrendingUp, CheckCircle2, XCircle, Hourglass, CalendarOff } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, Avatar, Button, Skeleton, EmptyState } from '@/components/ui';
import { api } from '@/lib/api';

interface EmployeeDetail {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joiningDate: string;
  shift: string;
  role: string;
  status: 'active' | 'inactive';
  attendanceRate: number;
  avatarColor: string;
}

interface EmployeeStats {
  attendanceRate: number;
  totalDays: number;
  present: number;
  late: number;
  absent: number;
  leave: number;
}

export function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    Promise.all([api.employees.get(id), api.employees.getStats(id)])
      .then(([empRes, statsRes]) => {
        setEmployee(empRes.data as EmployeeDetail);
        setStats(statsRes.data as EmployeeStats);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  if (notFound || !employee) {
    return (
      <Card>
        <EmptyState
          icon={<XCircle className="h-7 w-7" />}
          title="Employee not found"
          description="The employee you're looking for doesn't exist or was removed."
          action={<Button variant="outline" size="sm" onClick={() => navigate('/employees')}>Back to Employees</Button>}
        />
      </Card>
    );
  }

  const donutData = stats
    ? [
        { name: 'Present', value: stats.present, color: '#16a34a' },
        { name: 'Late', value: stats.late, color: '#f59e0b' },
        { name: 'Absent', value: stats.absent, color: '#ef4444' },
        { name: 'Leave', value: stats.leave, color: '#3b82f6' },
      ]
    : [];

  return (
    <div className="space-y-5">
      <button onClick={() => navigate('/employees')} className="flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200">
        <ArrowLeft className="h-4 w-4" /> Back to Employees
      </button>

      {/* Profile header */}
      <Card className="p-6">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <Avatar name={employee.name} color={employee.avatarColor} size="xl" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-ink-50">{employee.name}</h1>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${employee.status === 'active' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' : 'bg-ink-100 text-ink-500 dark:bg-ink-800'}`}>
                {employee.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{employee.designation} · {employee.department}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-ink-600 dark:text-ink-300">
              <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-ink-400" /> {employee.email}</span>
              <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-ink-400" /> {employee.phone}</span>
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-ink-400" /> Joined {employee.joiningDate}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-brand-600 dark:text-brand-400">{employee.attendanceRate}%</p>
            <p className="text-xs text-ink-400">Attendance Rate</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Info card */}
        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold text-ink-900 dark:text-ink-50">Employee Info</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2.5"><Briefcase className="h-4 w-4 text-ink-400" /><span className="text-ink-400">Employee ID</span><span className="ml-auto font-medium text-ink-700 dark:text-ink-300">{employee.employeeId}</span></div>
            <div className="flex items-center gap-2.5"><Building2 className="h-4 w-4 text-ink-400" /><span className="text-ink-400">Department</span><span className="ml-auto font-medium text-ink-700 dark:text-ink-300">{employee.department}</span></div>
            <div className="flex items-center gap-2.5"><Clock className="h-4 w-4 text-ink-400" /><span className="text-ink-400">Shift</span><span className="ml-auto font-medium text-ink-700 dark:text-ink-300">{employee.shift}</span></div>
            <div className="flex items-center gap-2.5"><TrendingUp className="h-4 w-4 text-ink-400" /><span className="text-ink-400">Role</span><span className="ml-auto font-medium text-ink-700 dark:text-ink-300">{employee.role}</span></div>
          </div>
        </Card>

        {/* Attendance breakdown donut */}
        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold text-ink-900 dark:text-ink-50">Attendance Breakdown</h2>
          {stats ? (
            <>
              <div className="mx-auto h-40 w-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={3} stroke="none">
                      {donutData.map((d) => <Cell key={d.name} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {donutData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-ink-500">{d.name}</span>
                    <span className="ml-auto font-semibold text-ink-700 dark:text-ink-300">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="py-8 text-center text-sm text-ink-400">No attendance data yet</p>
          )}
        </Card>

        {/* Stat tiles */}
        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold text-ink-900 dark:text-ink-50">This Period</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-brand-50 p-3 text-center dark:bg-brand-500/10">
              <CheckCircle2 className="mx-auto h-4 w-4 text-brand-600" />
              <p className="mt-1 text-xl font-bold text-ink-900 dark:text-ink-50">{stats?.present ?? 0}</p>
              <p className="text-xs text-ink-400">Present</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 text-center dark:bg-amber-500/10">
              <Hourglass className="mx-auto h-4 w-4 text-amber-600" />
              <p className="mt-1 text-xl font-bold text-ink-900 dark:text-ink-50">{stats?.late ?? 0}</p>
              <p className="text-xs text-ink-400">Late</p>
            </div>
            <div className="rounded-xl bg-red-50 p-3 text-center dark:bg-red-500/10">
              <XCircle className="mx-auto h-4 w-4 text-red-600" />
              <p className="mt-1 text-xl font-bold text-ink-900 dark:text-ink-50">{stats?.absent ?? 0}</p>
              <p className="text-xs text-ink-400">Absent</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-center dark:bg-blue-500/10">
              <CalendarOff className="mx-auto h-4 w-4 text-blue-600" />
              <p className="mt-1 text-xl font-bold text-ink-900 dark:text-ink-50">{stats?.leave ?? 0}</p>
              <p className="text-xs text-ink-400">Leave</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
