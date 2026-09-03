import { useEffect, useState } from 'react';
import { LogIn, LogOut, Clock3, MapPin, MapPinOff, MapPinned, Home, Building2, Coffee, CoffeeIcon } from 'lucide-react';
import { Card, Button, StatusBadge } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface MyAttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  hours: number;
  status: 'present' | 'late' | 'absent' | 'leave';
  workMode: 'office' | 'wfh';
  withinGeofence: boolean | null;
  checkInDistanceMeters: number | null;
  breaks: { start: string; end: string | null }[];
  totalBreakMinutes: number;
}

// Reads the browser's GPS location for geofence verification. Resolves to
// null (instead of rejecting) on denial/timeout so check-in still proceeds
// without location data.
function getLocation(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 6000 }
    );
  });
}

function GeofenceBadge({ workMode, within, distance }: { workMode: 'office' | 'wfh'; within: boolean | null; distance: number | null }) {
  if (workMode === 'wfh') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
        <Home className="h-3 w-3" /> Work From Home
      </span>
    );
  }
  if (within === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-500 dark:bg-ink-800 dark:text-ink-400">
        <MapPinOff className="h-3 w-3" /> Location not shared
      </span>
    );
  }
  if (within) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
        <MapPin className="h-3 w-3" /> Verified at office
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
      <MapPinned className="h-3 w-3" /> Outside geofence{distance != null ? ` (${distance}m away)` : ''}
    </span>
  );
}

export function MyAttendanceCard() {
  const toast = useToast();
  const [record, setRecord] = useState<MyAttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(new Date());
  const [wfhToday, setWfhToday] = useState(false);

  const load = () => {
    setLoading(true);
    api.attendance
      .myToday()
      .then((res) => setRecord((res.data ?? null) as MyAttendanceRecord | null))
      .catch(() => toast('Could not load your attendance status.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const clock = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(clock);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCheckIn = async () => {
    setSubmitting(true);
    try {
      const loc = wfhToday ? null : await getLocation();
      const res = await api.attendance.checkIn({
        workMode: wfhToday ? 'wfh' : 'office',
        ...(loc ? { latitude: loc.latitude, longitude: loc.longitude } : {}),
      });
      setRecord(res.data as MyAttendanceRecord);
      toast(wfhToday ? 'Checked in (Work From Home)' : loc ? 'Checked in successfully' : 'Checked in (location not shared)', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Check-in failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    setSubmitting(true);
    try {
      const res = await api.attendance.checkOut();
      setRecord(res.data as MyAttendanceRecord);
      toast('Checked out successfully', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Check-out failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBreak = async (isOnBreak: boolean) => {
    setSubmitting(true);
    try {
      const res = isOnBreak ? await api.attendance.endBreak() : await api.attendance.startBreak();
      setRecord(res.data as MyAttendanceRecord);
      toast(isOnBreak ? 'Break ended' : 'Break started', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update break', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const hasCheckedIn = !!record?.checkIn;
  const hasCheckedOut = !!record?.checkOut;
  const isOnBreak = !!record?.breaks?.some((b) => !b.end);
  const totalBreakMinutes = record?.totalBreakMinutes || 0;

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10">
            <Clock3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">My Attendance</h2>
            <p className="text-xs text-ink-500 dark:text-ink-400">
              {now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} ·{' '}
              {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {!loading && (
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-4">
              <div className="text-sm text-ink-600 dark:text-ink-300">
                <span className="mr-1 text-ink-400">In:</span>
                <span className="font-medium text-ink-800 dark:text-ink-100">{record?.checkIn || '—'}</span>
                <span className="mx-2 text-ink-300">|</span>
                <span className="mr-1 text-ink-400">Out:</span>
                <span className="font-medium text-ink-800 dark:text-ink-100">{record?.checkOut || '—'}</span>
                {record?.hours ? <span className="ml-2 text-ink-400">({record.hours}h)</span> : null}
              </div>
              {record?.status && <StatusBadge status={record.status} />}
            </div>
            {hasCheckedIn && <GeofenceBadge workMode={record?.workMode ?? 'office'} within={record?.withinGeofence ?? null} distance={record?.checkInDistanceMeters ?? null} />}
          </div>
        )}
      </div>

      {!hasCheckedIn && !loading && (
        <button
          onClick={() => setWfhToday((v) => !v)}
          className={cn(
            'mt-4 flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors',
            wfhToday ? 'border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300' : 'border-ink-200 text-ink-600 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800'
          )}
        >
          <span className="flex items-center gap-2">
            {wfhToday ? <Home className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
            Working from home today
          </span>
          <span className={cn('relative h-5 w-9 rounded-full transition-colors', wfhToday ? 'bg-brand-600' : 'bg-ink-200 dark:bg-ink-700')}>
            <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform', wfhToday ? 'translate-x-[18px]' : 'translate-x-0.5')} />
          </span>
        </button>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {!hasCheckedIn ? (
          <Button onClick={handleCheckIn} disabled={loading || submitting}>
            <LogIn className="h-4 w-4" /> Check In
          </Button>
        ) : !hasCheckedOut ? (
          <>
            <Button variant="secondary" onClick={handleCheckOut} disabled={loading || submitting}>
              <LogOut className="h-4 w-4" /> Check Out
            </Button>
            <Button variant="outline" onClick={() => handleBreak(isOnBreak)} disabled={loading || submitting}>
              {isOnBreak ? <><CoffeeIcon className="h-4 w-4" /> End Break</> : <><Coffee className="h-4 w-4" /> Start Break</>}
            </Button>
            {(isOnBreak || totalBreakMinutes > 0) && (
              <span className="text-xs text-ink-400">
                {isOnBreak ? 'On break' : `Break time today: ${totalBreakMinutes} min`}
              </span>
            )}
          </>
        ) : (
          <span className="inline-flex items-center rounded-xl bg-ink-100 px-4 py-2 text-sm font-medium text-ink-500 dark:bg-ink-800 dark:text-ink-400">
            You're done for today 🎉{totalBreakMinutes > 0 ? ` (${totalBreakMinutes} min break)` : ''}
          </span>
        )}
        {!hasCheckedIn && !wfhToday && (
          <span className="text-xs text-ink-400">We'll ask to confirm your location for office verification.</span>
        )}
      </div>
    </Card>
  );
}
