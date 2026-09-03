import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  accent: string;
  iconBg: string;
}

export function KpiCard({ label, value, icon: Icon, trend, trendLabel = 'vs yesterday', accent, iconBg }: KpiCardProps) {
  const positive = (trend ?? 0) >= 0;
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card transition-all hover:shadow-pop dark:border-ink-800 dark:bg-ink-900">
      <div className={cn('absolute left-0 top-0 h-1 w-full', accent)} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-ink-500 dark:text-ink-400">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-ink-900 dark:text-ink-50">{value}</p>
        </div>
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', iconBg)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold',
              positive ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'
            )}
          >
            {positive ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
          <span className="text-xs text-ink-400 dark:text-ink-500">{trendLabel}</span>
        </div>
      )}
    </div>
  );
}
