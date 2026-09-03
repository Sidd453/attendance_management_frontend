import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Users } from 'lucide-react';
import { Card, Avatar, EmptyState, TableSkeleton } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface CalendarLeave {
  employeeName: string;
  department: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
}

const typeColor: Record<string, string> = {
  'Casual Leave': 'bg-brand-500',
  'Sick Leave': 'bg-red-500',
  'Annual Leave': 'bg-amber-500',
  'Emergency Leave': 'bg-purple-500',
  'Unpaid Leave': 'bg-ink-400',
};

function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function TeamCalendarPage() {
  const toast = useToast();
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
  const [leaves, setLeaves] = useState<CalendarLeave[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthKey = `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}`;

  useEffect(() => {
    setLoading(true);
    api.leave
      .calendar(monthKey)
      .then((res) => setLeaves((res.data ?? []) as CalendarLeave[]))
      .catch(() => toast('Failed to load team calendar. Is the backend running?', 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey]);

  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const firstWeekday = new Date(cursor.year, cursor.month, 1).getDay();

  const leavesByDay = useMemo(() => {
    const map: Record<string, CalendarLeave[]> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = toISO(cursor.year, cursor.month, d);
      map[iso] = leaves.filter((l) => l.startDate <= iso && l.endDate >= iso);
    }
    return map;
  }, [leaves, cursor, daysInMonth]);

  const todayISO = new Date().toISOString().slice(0, 10);
  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const selectedLeaves = selectedDate ? leavesByDay[selectedDate] ?? [] : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-ink-50">Team Calendar</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">See who's on approved leave, at a glance</p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-ink-200 bg-white p-1 dark:border-ink-800 dark:bg-ink-900">
          <button onClick={() => setCursor((c) => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 })} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[140px] text-center text-sm font-semibold text-ink-800 dark:text-ink-100">
            {new Date(cursor.year, cursor.month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => setCursor((c) => c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 })} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <Card className="p-4">
          {loading ? (
            <TableSkeleton rows={5} cols={7} />
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="py-2">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {cells.map((day, i) => {
                  if (day === null) return <div key={`empty-${i}`} />;
                  const iso = toISO(cursor.year, cursor.month, day);
                  const dayLeaves = leavesByDay[iso] ?? [];
                  const isToday = iso === todayISO;
                  const isSelected = iso === selectedDate;
                  return (
                    <button
                      key={iso}
                      onClick={() => setSelectedDate(iso)}
                      className={cn(
                        'flex min-h-[74px] flex-col items-start gap-1 rounded-xl border p-1.5 text-left transition-colors',
                        isSelected ? 'border-brand-400 bg-brand-50 dark:border-brand-500/50 dark:bg-brand-500/10' : 'border-ink-100 hover:bg-ink-50 dark:border-ink-800 dark:hover:bg-ink-800/50'
                      )}
                    >
                      <span className={cn('flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium', isToday ? 'bg-brand-600 text-white' : 'text-ink-600 dark:text-ink-300')}>{day}</span>
                      <div className="flex flex-wrap gap-0.5">
                        {dayLeaves.slice(0, 4).map((l, idx) => (
                          <span key={idx} className={cn('h-1.5 w-1.5 rounded-full', typeColor[l.type] || 'bg-ink-400')} title={l.employeeName} />
                        ))}
                        {dayLeaves.length > 4 && <span className="text-[9px] text-ink-400">+{dayLeaves.length - 4}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-800 dark:text-ink-100">
            <Users className="h-4 w-4 text-ink-400" />
            {selectedDate ? new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }) : 'Select a date'}
          </h2>
          <div className="mt-3 space-y-2">
            {!selectedDate ? (
              <p className="text-sm text-ink-400">Click any day to see who's on leave.</p>
            ) : selectedLeaves.length === 0 ? (
              <EmptyState icon={<CalendarDays className="h-6 w-6" />} title="No one is out" description="Everyone is expected in on this day." />
            ) : (
              selectedLeaves.map((l, idx) => (
                <div key={idx} className="flex items-center gap-2.5 rounded-xl bg-ink-50 p-2.5 dark:bg-ink-800">
                  <Avatar name={l.employeeName} color="#6366f1" size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-800 dark:text-ink-100">{l.employeeName}</p>
                    <p className="text-xs text-ink-400">{l.type} · {l.department}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
