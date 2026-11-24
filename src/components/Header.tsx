import React from 'react';
import { LocateFixed, Loader2 } from 'lucide-react';

interface HeaderProps {
  onUseMyLocation: () => void;
  isLocating: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onUseMyLocation,
  isLocating,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
        <a
          href="#overview"
          className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600 rounded"
        >
          AtmosScope
        </a>

        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          <a
            href="#overview"
            className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Overview
          </a>
          <a
            href="#forecast"
            className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Forecast
          </a>
          <a
            href="#systems"
            className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Systems
          </a>
          <a
            href="#radar"
            className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Radar
          </a>
          <a
            href="#alerts"
            className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Alerts
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onUseMyLocation}
            disabled={isLocating}
            className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            {isLocating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <LocateFixed className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            <span>{isLocating ? 'Locating...' : 'Use My Location'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
