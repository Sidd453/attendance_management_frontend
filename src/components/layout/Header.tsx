import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, Menu, Sun, Moon, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';

interface HeaderProps {
  onOpenMobile: () => void;
  onOpenSearch: () => void;
}

const routeNames: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/attendance': 'Attendance',
  '/employees': 'Employees',
  '/departments': 'Departments',
  '/leave': 'Leave Management',
  '/team-calendar': 'Team Calendar',
  '/documents': 'Documents',
  '/reports': 'Reports',
  '/analytics': 'Analytics',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
  '/profile': 'Profile',
  '/audit-log': 'Audit Log',
};

interface HeaderNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export function Header({ onOpenMobile, onOpenSearch }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { resolved, toggle } = useTheme();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifData, setNotifData] = useState<HeaderNotification[]>([]);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const path = location.pathname.split('/')[1] ? `/${location.pathname.split('/')[1]}` : '/dashboard';
  const pageName = routeNames[path] || 'Dashboard';
  const unread = notifData.filter((n) => !n.read).length;

  useEffect(() => {
    let cancelled = false;
    api.notifications
      .list()
      .then((res) => {
        if (cancelled) return;
        const items = (res.data?.items ?? res.data ?? []) as HeaderNotification[];
        setNotifData(items);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center gap-3 border-b border-ink-200 bg-white/80 px-4 backdrop-blur-md lg:px-6 dark:border-ink-800 dark:bg-ink-900/80">
      <button onClick={onOpenMobile} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 lg:hidden dark:hover:bg-ink-800">
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden lg:block">
        <p className="text-sm text-ink-400">Home / <span className="text-ink-600 dark:text-ink-300">{pageName}</span></p>
        <h1 className="font-display text-xl font-bold tracking-tight text-ink-900 dark:text-ink-50">{pageName}</h1>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2">
        {/* Search */}
        <button
          onClick={onOpenSearch}
          className="flex h-11 items-center gap-2 rounded-xl border border-ink-200 bg-ink-50 px-3 text-base text-ink-400 transition-colors hover:border-ink-300 hover:bg-white dark:border-ink-700 dark:bg-ink-800 dark:hover:border-ink-600 md:w-64 lg:w-72"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="ml-auto hidden rounded border border-ink-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-ink-400 sm:inline dark:border-ink-600 dark:bg-ink-700">⌘K</kbd>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 text-ink-500 transition-colors hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
        >
          {resolved === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 text-ink-500 transition-colors hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-ink-200 bg-white shadow-float animate-scale-in dark:border-ink-700 dark:bg-ink-900">
              <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3 dark:border-ink-800">
                <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">Notifications</p>
                <span className="text-xs text-brand-600 dark:text-brand-400">{unread} new</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifData.slice(0, 5).map((n) => (
                  <div key={n.id} className={cn('flex gap-3 border-b border-ink-50 px-4 py-3 last:border-0 dark:border-ink-800/50', !n.read && 'bg-brand-50/40 dark:bg-brand-500/5')}>
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                    <div className={cn('flex-1', n.read && 'ml-5')}>
                      <p className="text-sm font-medium text-ink-800 dark:text-ink-200">{n.title}</p>
                      <p className="text-xs text-ink-500 dark:text-ink-400">{n.message}</p>
                      <p className="mt-1 text-[10px] text-ink-400">{n.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { setNotifOpen(false); navigate('/notifications'); }}
                className="block w-full border-t border-ink-100 py-2.5 text-center text-sm font-medium text-brand-600 hover:bg-ink-50 dark:border-ink-800 dark:text-brand-400 dark:hover:bg-ink-800"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2 rounded-xl border border-ink-200 p-1 pr-2 transition-colors hover:bg-ink-50 dark:border-ink-700 dark:hover:bg-ink-800"
          >
            <Avatar name={user?.name ?? '?'} color={user?.avatarColor ?? '#6366f1'} size="sm" />
            <span className="hidden text-base font-medium text-ink-700 dark:text-ink-200 sm:block">{user?.name?.split(' ')[0] ?? ''}</span>
            <ChevronDown className="hidden h-4 w-4 text-ink-400 sm:block" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-ink-200 bg-white shadow-float animate-scale-in dark:border-ink-700 dark:bg-ink-900">
              <div className="border-b border-ink-100 px-4 py-3 dark:border-ink-800">
                <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">{user?.name}</p>
                <p className="text-xs text-ink-500 dark:text-ink-400">{user?.email}</p>
              </div>
              <div className="p-1.5">
                <button onClick={() => { setProfileOpen(false); navigate('/profile'); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-600 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800">
                  <User className="h-4 w-4" /> My Profile
                </button>
                <button onClick={() => { setProfileOpen(false); navigate('/settings'); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-600 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800">
                  <Settings className="h-4 w-4" /> Settings
                </button>
                <div className="my-1 h-px bg-ink-100 dark:bg-ink-800" />
                <button onClick={handleLogout} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
