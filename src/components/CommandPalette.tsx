import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Users, Building2, CalendarCheck, FileBarChart, Settings, LayoutDashboard, CalendarDays, BarChart3, Bell, FileText, CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface SearchEmployee {
  employeeId: string;
  name: string;
}
interface SearchDepartment {
  id: string;
  name: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const pageResults = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Attendance', path: '/attendance', icon: CalendarCheck },
  { label: 'Employees', path: '/employees', icon: Users },
  { label: 'Departments', path: '/departments', icon: Building2 },
  { label: 'Leave Management', path: '/leave', icon: CalendarDays },
  { label: 'Team Calendar', path: '/team-calendar', icon: CalendarRange },
  { label: 'Documents', path: '/documents', icon: FileText },
  { label: 'Reports', path: '/reports', icon: FileBarChart },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Notifications', path: '/notifications', icon: Bell },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [employees, setEmployees] = useState<SearchEmployee[]>([]);
  const [departments, setDepartments] = useState<SearchDepartment[]>([]);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
      api.departments.list().then((res) => setDepartments((res.data ?? []) as SearchDepartment[])).catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    if (!open || !query) {
      setEmployees([]);
      return;
    }
    const handle = setTimeout(() => {
      api.employees
        .list({ search: query, limit: '5' })
        .then((res) => setEmployees(((res.data?.items ?? []) as SearchEmployee[])))
        .catch(() => {});
    }, 200);
    return () => clearTimeout(handle);
  }, [query, open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!open) return;
      }
      if (!open) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, results.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && results[activeIndex]) {
        navigate(results[activeIndex].path);
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  });

  if (!open) return null;

  const q = query.toLowerCase();
  const matchedPages = pageResults.filter((p) => p.label.toLowerCase().includes(q)).map((p) => ({ label: p.label, path: p.path, icon: p.icon, type: 'page' as const }));
  const matchedEmployees = q
    ? employees.slice(0, 4).map((e) => ({ label: e.name, path: `/employees/${e.employeeId}`, icon: Users, type: 'employee' as const }))
    : [];
  const matchedDepts = departments.filter((d) => d.name.toLowerCase().includes(q)).map((d) => ({ label: d.name, path: `/departments`, icon: Building2, type: 'dept' as const }));
  const results = [...matchedPages, ...matchedEmployees, ...matchedDepts];

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center p-4 pt-[15vh]">
      <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-float animate-scale-in dark:border-ink-700 dark:bg-ink-900">
        <div className="flex items-center gap-3 border-b border-ink-100 px-4 dark:border-ink-800">
          <Search className="h-5 w-5 text-ink-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
            placeholder="Search pages, employees, departments..."
            className="h-14 flex-1 bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none dark:text-ink-100"
          />
          <kbd className="rounded border border-ink-200 px-1.5 py-0.5 text-[10px] text-ink-400 dark:border-ink-600">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-400">No results found</p>
          ) : (
            results.map((r, i) => (
              <button
                key={r.path + r.label}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => { navigate(r.path); onClose(); }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                  i === activeIndex ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300' : 'text-ink-700 dark:text-ink-300'
                )}
              >
                <r.icon className="h-4 w-4 text-ink-400" />
                <span className="flex-1">{r.label}</span>
                <span className="text-[10px] uppercase tracking-wide text-ink-400">{r.type}</span>
                <ArrowRight className="h-3.5 w-3.5 text-ink-300" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
