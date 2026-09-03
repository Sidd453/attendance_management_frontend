import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-ink-200/70 bg-white shadow-card dark:border-ink-800 dark:bg-ink-900',
        hover && 'transition-shadow hover:shadow-pop',
        className
      )}
    >
      {children}
    </div>
  );
}
