import React from 'react';
import { cn } from '@/lib/utils';

/**
 * EditorialHero — Reusable editorial hero section.
 * 
 * Pattern:
 *   Eyebrow (gold, uppercase, tracked)
 *   Headline (Instrument Serif — editorial)
 *   Support (Inter, muted)
 *   Optional actions
 *
 * Used on Events, Announcements, Residents, Partner Portal.
 */
export default function EditorialHero({
  eyebrow,
  headline,
  support,
  children,
  variant = 'light',
  className,
}) {
  const isDark = variant === 'dark';

  return (
    <div className={cn(
      'relative overflow-hidden',
      isDark ? 'bg-navy text-white' : 'bg-white border-b border-[var(--border-subtle)]',
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {eyebrow && (
          <p className={cn(
            'text-[11px] font-bold uppercase tracking-[0.22em] mb-2',
            isDark ? 'text-gold' : 'text-gold'
          )}>
            {eyebrow}
          </p>
        )}
        <h1 className={cn(
          'heading-serif text-3xl sm:text-4xl lg:text-[2.75rem] leading-[1.1] tracking-tight',
          isDark ? 'text-white' : 'text-navy'
        )}>
          {headline}
        </h1>
        {support && (
          <p className={cn(
            'text-sm sm:text-base mt-3 max-w-xl leading-relaxed',
            isDark ? 'text-white/55' : 'text-textSecondary'
          )}>
            {support}
          </p>
        )}
        {children && (
          <div className="mt-5">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}