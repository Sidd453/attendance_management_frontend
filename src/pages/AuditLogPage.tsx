import { useEffect, useState } from 'react';
import { ShieldCheck, Search, UserCog, CalendarDays, ClipboardEdit, Building2, Filter } from 'lucide-react';
import { Card, Avatar, Input, EmptyState, Pagination, TableSkeleton } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface AuditLogEntry {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityLabel: string;
  createdAt: string;
}

const entityIcon: Record<string, typeof UserCog> = {
  Employee: UserCog,
  Leave: CalendarDays,
  Regularization: ClipboardEdit,
  Department: Building2,
};

const entityTypes = ['Employee', 'Leave', 'Regularization', 'Department'];

function actionLabel(action: string) {
  const map: Record<string, string> = {
    'employee.created': 'added employee',
    'employee.updated': 'updated employee',
    'employee.deleted': 'removed employee',
    'leave.approved': 'approved leave request for',
    'leave.rejected': 'rejected leave request for',
    'leave.deleted': 'deleted leave request for',
    'regularization.approved': 'approved correction request for',
    'regularization.rejected': 'rejected correction request for',
  };
  return map[action] || action;
}

const pageSize = 20;

export function AuditLogPage() {
  const toast = useToast();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    api.auditLogs
      .list({
        page: String(page),
        limit: String(pageSize),
        ...(entityType !== 'all' ? { entityType } : {}),
        ...(search ? { search } : {}),
      })
      .then((res) => {
        setLogs((res.data?.items ?? []) as AuditLogEntry[]);
        setTotalPages(res.data?.pagination?.totalPages ?? 1);
      })
      .catch(() => toast('Failed to load audit log. Is the backend running?', 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, entityType, search]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-ink-50">Audit Log</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Compliance trail of who did what, and when</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input placeholder="Search by employee, admin, or action..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-ink-200 bg-white p-1 dark:border-ink-800 dark:bg-ink-900">
          <Filter className="ml-2 h-3.5 w-3.5 shrink-0 text-ink-400" />
          {(['all', ...entityTypes] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setEntityType(t); setPage(1); }}
              className={cn(
                'shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                entityType === t ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800'
              )}
            >
              {t === 'all' ? 'All' : t}
            </button>
          ))}
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="p-4"><TableSkeleton rows={8} cols={4} /></div>
        ) : logs.length === 0 ? (
          <EmptyState icon={<ShieldCheck className="h-7 w-7" />} title="No activity yet" description="Admin actions — employee changes, leave & correction approvals — will appear here." />
        ) : (
          <ul className="divide-y divide-ink-100 dark:divide-ink-800">
            {logs.map((log) => {
              const Icon = entityIcon[log.entityType] || ShieldCheck;
              return (
                <li key={log.id} className="flex items-start gap-3 px-5 py-3.5">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-100 dark:bg-ink-800">
                    <Icon className="h-4 w-4 text-ink-500 dark:text-ink-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink-700 dark:text-ink-200">
                      <span className="font-semibold text-ink-900 dark:text-ink-50">{log.actorName}</span>
                      {' '}<span className="text-ink-400">({log.actorRole})</span>{' '}
                      {actionLabel(log.action)}{' '}
                      {log.entityLabel && <span className="font-medium text-ink-800 dark:text-ink-100">{log.entityLabel}</span>}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-400">{new Date(log.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </div>
                  <Avatar name={log.actorName} color="#6366f1" size="sm" />
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
