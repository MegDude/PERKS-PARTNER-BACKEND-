import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Grid3x3, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// Smart bottom navigation: shows max 4 primary tabs + a "More" button
// that opens a bottom sheet with all secondary navigation items.
export default function BuildingBottomNav({ tabs, basePath }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();

  const currentPath = location.pathname.replace(basePath, '').replace(/^\//, '') || '';

  const isTabActive = (tabPath) => {
    if (tabPath === '') return currentPath === '';
    return currentPath === tabPath || currentPath.startsWith(tabPath + '/');
  };

  // If 5 or fewer tabs, show them all directly (no "More" needed)
  if (tabs.length <= 5) {
    return (
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-navy border-t border-white/10 safe-area-bottom">
        <div className="flex">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = isTabActive(tab.path);
            const href = tab.path ? `${basePath}/${tab.path}` : basePath;
            return (
              <Link
                key={tab.path}
                to={href}
                className={cn(
                  'flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold uppercase tracking-wide transition-colors relative min-w-0',
                  isActive ? 'text-gold' : 'text-white/50'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate max-w-full px-1">{tab.label}</span>
                {isActive && <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-gold rounded-full" />}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  // Split into primary (first 4) and secondary (rest)
  const primaryTabs = tabs.slice(0, 4);
  const secondaryTabs = tabs.slice(4);
  const activeSecondary = secondaryTabs.find(t => isTabActive(t.path));

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-navy border-t border-white/10 safe-area-bottom">
        <div className="flex">
          {primaryTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = isTabActive(tab.path);
            const href = tab.path ? `${basePath}/${tab.path}` : basePath;
            return (
              <Link
                key={tab.path}
                to={href}
                className={cn(
                  'flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold uppercase tracking-wide transition-colors relative',
                  isActive ? 'text-gold' : 'text-white/50'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate max-w-full px-0.5">{tab.label}</span>
                {isActive && <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-gold rounded-full" />}
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold uppercase tracking-wide transition-colors relative',
              activeSecondary ? 'text-gold' : 'text-white/50'
            )}
          >
            <Grid3x3 className="w-4 h-4 shrink-0" />
            <span>More</span>
            {activeSecondary && <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-gold rounded-full" />}
          </button>
        </div>
      </nav>

      {/* More Sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl p-0 h-auto pb-[env(safe-area-inset-bottom)]">
          <div className="pt-3 pb-2 flex justify-center">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>
          <div className="px-5 pb-6">
            <h3 className="text-sm font-bold text-navy mb-4 px-1">All Modules</h3>
            <div className="grid grid-cols-3 gap-3">
              {secondaryTabs.map(tab => {
                const Icon = tab.icon;
                const isActive = isTabActive(tab.path);
                const href = tab.path ? `${basePath}/${tab.path}` : basePath;
                return (
                  <Link
                    key={tab.path}
                    to={href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-2xl transition-all',
                      isActive
                        ? 'bg-navy text-white'
                        : 'bg-bgAlt text-textSecondary hover:bg-bgAlt/70'
                    )}
                  >
                    <Icon className={cn('w-5 h-5', isActive ? 'text-gold' : 'text-textSecondary')} />
                    <span className="text-[11px] font-semibold text-center leading-tight">{tab.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}