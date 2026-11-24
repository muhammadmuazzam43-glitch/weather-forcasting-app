import React, { useMemo, useState } from 'react';
import {
  ForecastChartMetric,
  HourlyForecastPoint,
  UnitSystem,
} from '../types/weather';
import {
  convertTemp,
  convertWind,
  degToCompass,
  formatDayDate,
  formatHourLabel,
  formatPrecip,
  formatTemp,
  formatWind,
  getWmoInfo,
} from '../utils/weatherUtils';
import { WeatherIcon } from './WeatherIcon';

interface ForecastChartProps {
  hourlyPoints: HourlyForecastPoint[];
  selectedDateLabel: string;
  units: UnitSystem;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({
  hourlyPoints,
  selectedDateLabel,
  units,
}) => {
  const [metric, setMetric] = useState<ForecastChartMetric>('temperature');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // Sample 24 hours cleanly (every hour)
  const points = useMemo(() => hourlyPoints.slice(0, 24), [hourlyPoints]);

  const width = 840;
  const height = 220;
  const padLeft = 36;
  const padRight = 24;
  const padTop = 34;
  const padBottom = 34;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const series = useMemo(() => {
    return points.map((p) => {
      if (metric === 'temperature') {
        return convertTemp(p.temperature, units);
      }
      if (metric === 'precipitation') {
        return p.precipitationProbability;
      }
      return convertWind(p.windSpeed, units);
    });
  }, [points, metric, units]);

  const { minVal, maxVal, coords, smoothPath, areaPath } = useMemo(() => {
    if (series.length === 0) {
      return {
        minVal: 0,
        maxVal: 100,
        coords: [] as { x: number; y: number; val: number }[],
        smoothPath: '',
        areaPath: '',
      };
    }

    let min = Math.min(...series);
    let max = Math.max(...series);

    if (metric === 'precipitation') {
      min = 0;
      max = Math.max(100, max);
    } else if (metric === 'wind') {
      min = 0;
      max = Math.max(20, Math.ceil(max * 1.2));
    } else {
      const span = Math.max(4, max - min);
      min = Math.floor(min - span * 0.18);
      max = Math.ceil(max + span * 0.22);
    }

    const denom = Math.max(1, max - min);
    const pts = series.map((val, i) => {
      const x =
        padLeft + (series.length > 1 ? (i / (series.length - 1)) * plotW : plotW / 2);
      const y = padTop + plotH - ((val - min) / denom) * plotH;
      return { x, y, val };
    });

    // Build smooth Catmull-Rom / cubic Bezier curve
    let path = '';
    if (pts.length > 0) {
      path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(pts.length - 1, i + 2)];

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(
          1
        )} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
      }
    }

    const baselineY = padTop + plotH;
    const area =
      pts.length > 0
        ? `${path} L ${pts[pts.length - 1].x.toFixed(1)} ${baselineY} L ${pts[0].x.toFixed(
            1
          )} ${baselineY} Z`
        : '';

    return { minVal: min, maxVal: max, coords: pts, smoothPath: path, areaPath: area };
  }, [series, metric, plotW, plotH]);

  const activeIdx = hoverIdx !== null && points[hoverIdx] ? hoverIdx : 0;
  const activePoint = points[activeIdx];
  const activeCoord = coords[activeIdx];

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (points.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    const clamped = Math.max(padLeft, Math.min(width - padRight, relX));
    const ratio = (clamped - padLeft) / plotW;
    const idx = Math.round(ratio * (points.length - 1));
    setHoverIdx(Math.max(0, Math.min(points.length - 1, idx)));
  };

  const strokeColor =
    metric === 'temperature'
      ? '#D97706'
      : metric === 'precipitation'
      ? '#2563EB'
      : '#0284C7';

  const gradId = `forecast-grad-${metric}`;

  if (points.length === 0) {
    return (
      <div className="p-6 text-sm text-slate-500 dark:text-slate-400">
        Hourly forecast data unavailable for this date.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header & Google Weather style Metric Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
            Hourly Trajectory · {selectedDateLabel}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Move cursor across chart to inspect exact hourly readings
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Hourly forecast metric"
          className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start sm:self-auto"
        >
          {(
            [
              { id: 'temperature', label: 'Temperature' },
              { id: 'precipitation', label: 'Precipitation' },
              { id: 'wind', label: 'Wind' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={metric === tab.id}
              onClick={() => setMetric(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                metric === tab.id
                  ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Crosshair Readout */}
      {activePoint && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-3">
            <WeatherIcon
              type={getWmoInfo(activePoint.weatherCode, activePoint.isDay).iconType}
              size={28}
            />
            <div>
              <div className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {formatDayDate(activePoint.time.split('T')[0])} ·{' '}
                {formatHourLabel(activePoint.time)}
              </div>
              <div className="text-slate-500 dark:text-slate-400">
                {getWmoInfo(activePoint.weatherCode, activePoint.isDay).label}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 font-mono tabular-nums">
            <div>
              <span className="text-slate-500 dark:text-slate-400 mr-1.5">Temp</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {formatTemp(activePoint.temperature, units, true)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 mr-1.5">Rain</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {activePoint.precipitationProbability}% ({formatPrecip(activePoint.precipitation, units)})
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 mr-1.5">Wind</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {formatWind(activePoint.windSpeed, units)}{' '}
                {degToCompass(activePoint.windDirection)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 mr-1.5">Humidity</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {Math.round(activePoint.relativeHumidity)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SVG Smooth Forecast Curve */}
      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-52 sm:h-56 select-none cursor-crosshair touch-none"
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoverIdx(null)}
          role="img"
          aria-label={`24-hour ${metric} forecast chart`}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.22" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Horizontal reference gridlines */}
          {[0, 0.5, 1].map((ratio) => {
            const y = padTop + plotH * ratio;
            const val = Math.round(maxVal - (maxVal - minVal) * ratio);
            return (
              <g key={ratio}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  className="stroke-slate-200 dark:stroke-slate-800"
                  strokeDasharray="3 4"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 dark:fill-slate-500 font-mono text-[10px]"
                >
                  {val}
                  {metric === 'temperature' ? '°' : metric === 'precipitation' ? '%' : ''}
                </text>
              </g>
            );
          })}

          {/* Precipitation bars underneath when precipitation tab is active */}
          {metric === 'precipitation' &&
            coords.map((c, idx) => {
              const barH = Math.max(0, padTop + plotH - c.y);
              return (
                <rect
                  key={idx}
                  x={c.x - 8}
                  y={c.y}
                  width={16}
                  height={barH}
                  rx={3}
                  className="fill-blue-500/20 dark:fill-blue-400/20"
                />
              );
            })}

          {/* Area & Line */}
          {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}
          {smoothPath && (
            <path
              d={smoothPath}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}

          {/* Sparse value annotations every 3 hours */}
          {coords.map((c, idx) => {
            if (idx % 3 !== 0 && idx !== coords.length - 1) return null;
            const label =
              metric === 'temperature'
                ? `${Math.round(c.val)}°`
                : metric === 'precipitation'
                ? `${Math.round(c.val)}%`
                : `${Math.round(c.val)}`;
            return (
              <g key={idx}>
                <circle
                  cx={c.x}
                  cy={c.y}
                  r="3"
                  fill={strokeColor}
                  className="stroke-white dark:stroke-slate-900"
                  strokeWidth="1.5"
                />
                <text
                  x={c.x}
                  y={c.y - 10}
                  textAnchor="middle"
                  className="fill-slate-700 dark:fill-slate-300 font-mono text-[11px] font-medium"
                >
                  {label}
                </text>
                <text
                  x={c.x}
                  y={height - 10}
                  textAnchor="middle"
                  className="fill-slate-500 dark:fill-slate-400 font-mono text-[10px]"
                >
                  {formatHourLabel(points[idx].time)}
                </text>
              </g>
            );
          })}

          {/* Active crosshair indicator */}
          {activeCoord && (
            <g>
              <line
                x1={activeCoord.x}
                y1={padTop}
                x2={activeCoord.x}
                y2={padTop + plotH}
                stroke={strokeColor}
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
              <circle
                cx={activeCoord.x}
                cy={activeCoord.y}
                r="5"
                fill={strokeColor}
                className="stroke-white dark:stroke-slate-900"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Synchronized Google Weather Hourly Strip */}
      <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
        {points.map((pt, idx) => {
          const isSelected = idx === activeIdx;
          const info = getWmoInfo(pt.weatherCode, pt.isDay);
          return (
            <button
              key={pt.time}
              type="button"
              onClick={() => setHoverIdx(idx)}
              className={`flex flex-col items-center justify-between gap-1.5 min-w-[70px] px-2.5 py-2.5 rounded-lg border text-center transition-colors shrink-0 cursor-pointer ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {formatHourLabel(pt.time)}
              </span>
              <WeatherIcon type={info.iconType} size={26} />
              <span className="text-sm font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {formatTemp(pt.temperature, units)}
              </span>
              <span className="text-[11px] font-mono tabular-nums text-blue-600 dark:text-blue-400">
                {pt.precipitationProbability > 0
                  ? `${pt.precipitationProbability}%`
                  : '—'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
