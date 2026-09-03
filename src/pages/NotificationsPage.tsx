import { useEffect, useState } from 'react';
import { Bell, CheckCheck, AlertCircle, Info, Clock, CalendarDays, FileBarChart, UserCheck } from 'lucide-react';
import { Card, Button, EmptyState, Skeleton } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type NotifType = 'check-in' | 'absent' | 'leave' | 'report' | 'late' | 'system';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const typeConfig: Record<NotifType, { icon: typeof Bell; color: string }> = {
  'check-in': { icon: UserCheck, color: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' },
  absent: { icon: AlertCircle, color: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' },
  leave: { icon: CalendarDays, color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' },
  report: { icon: FileBarChart, color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
  late: { icon: Clock, color: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400' },
  system: { icon: Info, color: 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300' },
};

export function NotificationsPage() {
  const toast = useToast();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const loadNotifs = () => {
    setLoading(true);
    api.notifications
      .list(filter === 'all' ? undefined : filter)
      .then((res) => setNotifs((res.data?.items ?? []) as Notification[]))
      .catch(() => toast('Failed to load notifications. Is the backend running?', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadNotifs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const unreadCount = notifs.filter((n) => !n.read).length;

  const markAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      toast('All notifications marked as read', 'success');
      loadNotifs();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update notifications', 'error');
    }
  };

  const toggleRead = async (id: string) => {
    setNotifs((n) => n.map((x) => (x.id === id ? { ...x, read: !x.read } : x)));
    try {
      await api.notifications.markRead(id);
    } catch {
      loadNotifs();
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-ink-50">Notifications</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="outline" onClick={markAllRead} disabled={unreadCount === 0}><CheckCheck className="h-4 w-4" /> Mark all as read</Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-xl border border-ink-200 bg-white p-1 dark:border-ink-800 dark:bg-ink-900">
        {(['all', 'unread', 'read'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={cn('flex-1 rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors', filter === f ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800')}>
            {f}
            {f === 'unread' && unreadCount > 0 && <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-xs">{unreadCount}</span>}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      <Card>
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : notifs.length === 0 ? (
          <EmptyState
            icon={<Bell className="h-7 w-7" />}
            title="No notifications"
            description={filter === 'unread' ? 'You have no unread notifications' : 'Notifications will appear here'}
          />
        ) : (
          <div className="divide-y divide-ink-50 dark:divide-ink-800/50">
            {notifs.map((n) => {
              const tc = typeConfig[n.type];
              return (
                <div
                  key={n.id}
                  className={cn('flex items-start gap-4 px-5 py-4 transition-colors hover:bg-ink-50/50 dark:hover:bg-ink-800/30', !n.read && 'bg-brand-50/30 dark:bg-brand-500/5')}
                >
                  <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tc.color)}>
                    <tc.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-ink-800 dark:text-ink-200">{n.title}</p>
                      {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                    </div>
                    <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">{n.message}</p>
                    <p className="mt-1 text-xs text-ink-400">{n.timestamp}</p>
                  </div>
                  <button
                    onClick={() => toggleRead(n.id)}
                    className={cn('shrink-0 rounded-lg p-1.5 text-xs font-medium transition-colors', n.read ? 'text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800' : 'text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10')}
                  >
                    {n.read ? 'Mark unread' : 'Mark read'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
