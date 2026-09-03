import { cn } from '@/lib/utils';

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'leave';

interface StatusBadgeProps {
  status: AttendanceStatus;
  className?: string;
}

const config: Record<AttendanceStatus, { label: string; classes: string; dot: string }> = {
  present: { label: 'Present', classes: 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300', dot: 'bg-brand-500' },
  late: { label: 'Late', classes: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300', dot: 'bg-amber-500' },
  absent: { label: 'Absent', classes: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300', dot: 'bg-red-500' },
  leave: { label: 'On Leave', classes: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300', dot: 'bg-blue-500' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const c = config[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', c.classes, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', c.dot)} />
      {c.label}
    </span>
  );
}
