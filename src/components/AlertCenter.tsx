import React, { useState } from 'react';
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Info,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import {
  AlertPreferences,
  UnitSystem,
  WeatherAlert,
} from '../types/weather';
import { convertTemp, formatTemp, formatWind } from '../utils/weatherUtils';

interface AlertCenterProps {
  locationName: string;
  alerts: WeatherAlert[];
  prefs: AlertPreferences;
  onUpdatePrefs: (prefs: AlertPreferences) => void;
  units: UnitSystem;
}

export const AlertCenter: React.FC<AlertCenterProps> = ({
  locationName,
  alerts,
  prefs,
  onUpdatePrefs,
  units,
}) => {
  const [showSettings, setShowSettings] = useState(false);

  const getSeverityVisuals = (severity: WeatherAlert['severity']) => {
    switch (severity) {
      case 'warning':
        return {
          label: 'Warning',
          icon: ShieldAlert,
          container:
            'border-red-300 dark:border-red-900/70 bg-red-50/70 dark:bg-red-950/30',
          badgeText: 'text-red-700 dark:text-red-300',
        };
      case 'watch':
        return {
          label: 'Watch',
          icon: AlertTriangle,
          container:
            'border-amber-300 dark:border-amber-900/70 bg-amber-50/70 dark:bg-amber-950/30',
          badgeText: 'text-amber-700 dark:text-amber-300',
        };
      case 'advisory':
        return {
          label: 'Advisory',
          icon: Info,
          container:
            'border-sky-300 dark:border-sky-900/70 bg-sky-50/70 dark:bg-sky-950/30',
          badgeText: 'text-sky-700 dark:text-sky-300',
        };
      case 'custom':
        return {
          label: 'Custom Alert',
          icon: BellRing,
          container:
            'border-blue-300 dark:border-blue-900/70 bg-blue-50/70 dark:bg-blue-950/30',
          badgeText: 'text-blue-700 dark:text-blue-300',
        };
    }
  };

  return (
    <section
      id="alerts"
      aria-label="Real-time weather alerts"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
            Real-Time Weather Alerts · {locationName}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Active official advisories, severe weather triggers, and personal threshold monitors
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowSettings((s) => !s)}
          className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[40px] text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{showSettings ? 'Hide Alert Rules' : 'Configure Alert Rules'}</span>
        </button>
      </div>

      {/* Custom Threshold Configuration Panel */}
      {showSettings && (
        <div className="mb-5 p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Personal Real-Time Alert Thresholds
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Evaluated automatically across the next 48 hours whenever you load a city
              </p>
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.enabled}
                onChange={(e) =>
                  onUpdatePrefs({ ...prefs, enabled: e.target.checked })
                }
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
              <span>Enable Custom Rules</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-medium text-slate-600 dark:text-slate-400">
                High Temp ({formatTemp(prefs.highTempC, units, true)})
              </span>
              <input
                type="range"
                min={20}
                max={48}
                step={1}
                value={prefs.highTempC}
                onChange={(e) =>
                  onUpdatePrefs({ ...prefs, highTempC: Number(e.target.value) })
                }
                className="accent-blue-600 cursor-pointer"
              />
              <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                Triggers ≥ {Math.round(convertTemp(prefs.highTempC, units))}°
              </span>
            </label>

            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-medium text-slate-600 dark:text-slate-400">
                Low Temp ({formatTemp(prefs.lowTempC, units, true)})
              </span>
              <input
                type="range"
                min={-15}
                max={18}
                step={1}
                value={prefs.lowTempC}
                onChange={(e) =>
                  onUpdatePrefs({ ...prefs, lowTempC: Number(e.target.value) })
                }
                className="accent-blue-600 cursor-pointer"
              />
              <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                Triggers ≤ {Math.round(convertTemp(prefs.lowTempC, units))}°
              </span>
            </label>

            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-medium text-slate-600 dark:text-slate-400">
                Wind Gusts ({formatWind(prefs.windGustKmh, units)})
              </span>
              <input
                type="range"
                min={20}
                max={90}
                step={5}
                value={prefs.windGustKmh}
                onChange={(e) =>
                  onUpdatePrefs({
                    ...prefs,
                    windGustKmh: Number(e.target.value),
                  })
                }
                className="accent-blue-600 cursor-pointer"
              />
              <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                Triggers ≥ {formatWind(prefs.windGustKmh, units)}
              </span>
            </label>

            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-medium text-slate-600 dark:text-slate-400">
                Rain Chance ({prefs.precipProbPct}%)
              </span>
              <input
                type="range"
                min={20}
                max={95}
                step={5}
                value={prefs.precipProbPct}
                onChange={(e) =>
                  onUpdatePrefs({
                    ...prefs,
                    precipProbPct: Number(e.target.value),
                  })
                }
                className="accent-blue-600 cursor-pointer"
              />
              <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                Triggers ≥ {prefs.precipProbPct}%
              </span>
            </label>

            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-medium text-slate-600 dark:text-slate-400">
                US AQI Limit ({prefs.aqiThreshold})
              </span>
              <input
                type="range"
                min={50}
                max={200}
                step={10}
                value={prefs.aqiThreshold}
                onChange={(e) =>
                  onUpdatePrefs({
                    ...prefs,
                    aqiThreshold: Number(e.target.value),
                  })
                }
                className="accent-blue-600 cursor-pointer"
              />
              <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                Triggers ≥ {prefs.aqiThreshold} AQI
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Active Alerts List or Nominal State */}
      {alerts.length === 0 ? (
        <div className="p-4 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-start gap-3">
          <CheckCircle2
            className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Nominal Conditions · No Active Weather Warnings
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              No severe thunderstorms, extreme heat/freeze, high wind gusts, flood rainfall, or custom threshold breaches are projected for {locationName} in the next 48 hours.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.map((alert) => {
            const vis = getSeverityVisuals(alert.severity);
            const Icon = vis.icon;
            return (
              <article
                key={alert.id}
                className={`p-4 rounded-lg border ${vis.container} flex flex-col justify-between gap-3`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div
                      className={`inline-flex items-center gap-1.5 font-semibold ${vis.badgeText}`}
                    >
                      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>{vis.label}</span>
                      <span aria-hidden="true">·</span>
                      <span>{alert.source}</span>
                    </div>
                    <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      {alert.metricLabel}
                    </span>
                  </div>

                  <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                    {alert.title}
                  </h3>

                  <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    {alert.description}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-slate-200/70 dark:border-slate-800/70 flex flex-col gap-1 text-xs">
                  <div className="font-mono text-slate-500 dark:text-slate-400">
                    Window: {alert.timeframe}
                  </div>
                  <div className="text-slate-700 dark:text-slate-200">
                    {alert.instruction}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
