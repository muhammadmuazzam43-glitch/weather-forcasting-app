import React, { useEffect, useRef, useState } from 'react';
import {
  Search,
  Bookmark,
  BookmarkCheck,
  Sun,
  Moon,
  RefreshCw,
  X,
} from 'lucide-react';
import { GeoLocation, UnitSystem } from '../types/weather';
import { searchLocations } from '../services/weatherApi';

interface LocationToolbarProps {
  activeLocation: GeoLocation;
  savedLocations: GeoLocation[];
  onSelectLocation: (loc: GeoLocation) => void;
  onToggleSaveLocation: (loc: GeoLocation) => void;
  units: UnitSystem;
  onChangeUnits: (units: UnitSystem) => void;
  isDark: boolean;
  onToggleDark: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const LocationToolbar: React.FC<LocationToolbarProps> = ({
  activeLocation,
  savedLocations,
  onSelectLocation,
  onToggleSaveLocation,
  units,
  onChangeUnits,
  isDark,
  onToggleDark,
  onRefresh,
  isRefreshing,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const isSaved = savedLocations.some((l) => l.id === activeLocation.id);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearchError(null);
      setIsOpen(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const hits = await searchLocations(trimmed);
        setResults(hits);
        setIsOpen(true);
        setActiveIndex(-1);
      } catch (err) {
        setSearchError(
          err instanceof Error ? err.message : 'Search failed. Try again.'
        );
        setResults([]);
        setIsOpen(true);
      } finally {
        setIsSearching(false);
      }
    }, 240);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (loc: GeoLocation) => {
    onSelectLocation(loc);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <section
      aria-label="Location search and display preferences"
      className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Global Place Search */}
          <div ref={containerRef} className="relative flex-1 max-w-xl">
            <label htmlFor="city-search" className="sr-only">
              Search any city, town, or region worldwide
            </label>
            <div className="relative flex items-center">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="city-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => {
                  if (results.length > 0 || searchError) setIsOpen(true);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search any city, region, or place worldwide (e.g. Lahore, Mumbai, Tokyo, London)..."
                className="w-full h-10 pl-10 pr-10 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 transition-colors"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setResults([]);
                    setIsOpen(false);
                  }}
                  aria-label="Clear search"
                  className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {isOpen && (
              <div
                role="listbox"
                aria-label="Matching locations"
                className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-40 overflow-hidden"
              >
                {isSearching ? (
                  <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                    Searching global locations...
                  </div>
                ) : searchError ? (
                  <div className="px-4 py-3 text-sm text-red-600 dark:text-red-400">
                    {searchError}
                  </div>
                ) : results.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                    No matching places found. Try a broader city or town name.
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                    {results.map((loc, idx) => (
                      <li key={`${loc.id}-${idx}`}>
                        <button
                          type="button"
                          onClick={() => handleSelect(loc)}
                          className={`w-full px-4 py-2.5 text-left flex items-center justify-between gap-4 transition-colors cursor-pointer ${
                            idx === activeIndex
                              ? 'bg-blue-50 dark:bg-blue-950/50'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {loc.name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {[loc.admin1, loc.country]
                                .filter(Boolean)
                                .join(' · ')}
                            </div>
                          </div>
                          <span className="text-xs font-mono tabular-nums text-slate-400 shrink-0">
                            {loc.latitude.toFixed(2)}°, {loc.longitude.toFixed(2)}°
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Controls: Pin, Units, Theme, Refresh */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onToggleSaveLocation(activeLocation)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isSaved
                  ? 'border-blue-600/30 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {isSaved ? (
                <BookmarkCheck className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>{isSaved ? 'Saved City' : 'Save City'}</span>
            </button>

            <div
              role="group"
              aria-label="Measurement units"
              className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0"
            >
              <button
                type="button"
                onClick={() => onChangeUnits('metric')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  units === 'metric'
                    ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                °C · km/h
              </button>
              <button
                type="button"
                onClick={() => onChangeUnits('imperial')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  units === 'imperial'
                    ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                °F · mph
              </button>
            </div>

            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label="Refresh live weather data"
              title="Refresh live weather data"
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              onClick={onToggleDark}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isDark ? (
                <Sun className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Saved Locations Quick Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1 whitespace-nowrap shrink-0">
            Locations:
          </span>
          {savedLocations.map((loc) => {
            const active = loc.id === activeLocation.id;
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => onSelectLocation(loc)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-slate-900 dark:bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {loc.name}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
