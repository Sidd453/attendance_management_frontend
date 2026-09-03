import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';
type Resolved = 'light' | 'dark';

interface ThemeCtx {
  theme: Theme;
  resolved: Resolved;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx | undefined>(undefined);

function getSystem(): Resolved {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('srujan-theme') as Theme) || 'light';
  });
  const [resolved, setResolved] = useState<Resolved>(() =>
    (localStorage.getItem('srujan-theme') as Theme) === 'dark' ||
    ((localStorage.getItem('srujan-theme') as Theme) === 'system' || !(localStorage.getItem('srujan-theme'))) &&
      getSystem() === 'dark'
      ? 'dark'
      : 'light'
  );

  useEffect(() => {
    const apply = () => {
      const r = theme === 'system' ? getSystem() : theme;
      setResolved(r);
      document.documentElement.classList.toggle('dark', r === 'dark');
    };
    apply();
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [theme]);

  const setTheme = (t: Theme) => {
    localStorage.setItem('srujan-theme', t);
    setThemeState(t);
  };

  const toggle = () => setTheme(resolved === 'dark' ? 'light' : 'dark');

  return <Ctx.Provider value={{ theme, resolved, setTheme, toggle }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useTheme must be used within ThemeProvider');
  return c;
}
