import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CalendarCheck, Users, Building2, CalendarDays,
  FileBarChart, BarChart3, Bell, Settings, LogOut, X, ChevronRight, ShieldCheck,
  FileText, CalendarRange,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';
import { isAdminRole } from '@/lib/roles';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/employees', label: 'Employees', icon: Users, adminOnly: true },
  { to: '/departments', label: 'Departments', icon: Building2, adminOnly: true },
  { to: '/leave', label: 'Leave', icon: CalendarDays },
  { to: '/team-calendar', label: 'Team Calendar', icon: CalendarRange, adminOnly: true },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/reports', label: 'Reports', icon: FileBarChart, adminOnly: true },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, adminOnly: true },
  { to: '/audit-log', label: 'Audit Log', icon: ShieldCheck, superAdminOnly: true },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings, adminOnly: true },
];

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const visibleNavItems = navItems.filter((item) => {
    if (item.superAdminOnly) return ['Super Admin', 'HR Admin'].includes(user?.role || '');
    return !item.adminOnly || isAdminRole(user?.role);
  });

  const handleLogout = (e: React.MouseEvent) => {
    e.stopPropagation();
    logout();
    onCloseMobile();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-ink-950/40 backdrop-blur-sm lg:hidden" onClick={onCloseMobile} />}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-ink-200 bg-white transition-transform duration-300 lg:translate-x-0 dark:border-ink-800 dark:bg-ink-900',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b border-ink-100 px-5 dark:border-ink-800">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white ring-1 ring-ink-100 dark:bg-ink-800 dark:ring-ink-700">
              <img src="/logo.png" alt="Srujan Infotech" className="h-12 w-12 object-contain" />
            </div>
            <div>
              <p className="font-display text-lg font-bold tracking-tight text-ink-900 dark:text-ink-50">Srujan Infotech</p>
              <p className="-mt-0.5 text-[11px] font-medium uppercase tracking-wider text-gold-600 dark:text-gold-400">Workforce</p>
            </div>
          </div>
          <button onClick={onCloseMobile} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 lg:hidden dark:hover:bg-ink-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">Menu</p>
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium transition-all',
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                    : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-100'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-600 dark:bg-brand-400" />}
                  <item.icon className={cn('h-5 w-5', isActive && 'text-brand-600 dark:text-brand-400')} />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight className="h-4 w-4 text-brand-500" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-ink-100 p-3 dark:border-ink-800">
          <button
            onClick={() => { onCloseMobile(); navigate('/profile'); }}
            className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-ink-50 dark:hover:bg-ink-800"
          >
            <Avatar name={user?.name ?? '?'} color={user?.avatarColor ?? '#6366f1'} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-100">{user?.name}</p>
              <p className="truncate text-xs text-ink-500 dark:text-ink-400">{user?.role}</p>
            </div>
            <LogOut className="h-4 w-4 text-ink-400" onClick={handleLogout} />
          </button>
        </div>
      </aside>
    </>
  );
}
