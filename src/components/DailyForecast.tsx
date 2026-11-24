import React from 'react';
import { Droplets } from 'lucide-react';
import { DailyForecastPoint, UnitSystem } from '../types/weather';
import {
  formatDayDate,
  formatDayName,
  formatTemp,
  getWmoInfo,
} from '../utils/weatherUtils';
import { WeatherIcon } from './WeatherIcon';

interface DailyForecastProps {
  daily: DailyForecastPoint[];
  selectedDayIndex: number;
  onSelectDay: (index: number) => void;
  units: UnitSystem;
}

export const DailyForecast: React.FC<DailyForecastProps> = ({
  daily,
  selectedDayIndex,
  onSelectDay,
  units,
}) => {
  const globalMin = Math.min(...daily.map((d) => d.tempMin));
  const globalMax = Math.max(...daily.map((d) => d.tempMax));
  const totalSpan = Math.max(1, globalMax - globalMin);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
            10-Day Temperature Forecast
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select any day to inspect its 24-hour trajectory
          </p>
        </div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {daily.map((day, idx) => {
          const info = getWmoInfo(day.weatherCode, true);
          const leftPct = ((day.tempMin - globalMin) / totalSpan) * 100;
          const widthPct = Math.max(
            6,
            ((day.tempMax - day.tempMin) / totalSpan) * 100
          );
          const isSelected = idx === selectedDayIndex;

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onSelectDay(idx)}
              className={`w-full py-3 px-3 -mx-3 rounded-lg flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-blue-50/80 dark:bg-blue-950/40'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="w-28 sm:w-32 shrink-0">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {formatDayName(day.date, idx)}
                </div>
                <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {formatDayDate(day.date)}
                </div>
              </div>

              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <WeatherIcon type={info.iconType} size={28} className="shrink-0" />
                <div className="min-w-0 hidden sm:block">
                  <div className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                    {info.shortLabel}
                  </div>
                  {day.precipitationProbabilityMax >= 15 && (
                    <div className="inline-flex items-center gap-1 text-[11px] font-mono tabular-nums text-blue-600 dark:text-blue-400">
                      <Droplets className="w-3 h-3" aria-hidden="true" />
                      <span>{day.precipitationProbabilityMax}%</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="w-9 text-right text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {formatTemp(day.tempMin, units)}
                </span>
                <div className="w-20 sm:w-32 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                  <div
                    className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-sky-500 via-amber-400 to-orange-500"
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                    }}
                  />
                </div>
                <span className="w-9 text-left text-xs font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  {formatTemp(day.tempMax, units)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
