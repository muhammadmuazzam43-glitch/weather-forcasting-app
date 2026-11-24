import React, { useMemo } from 'react';
import {
  AirQualityData,
  UnitSystem,
  WeatherData,
} from '../types/weather';
import {
  analyzePressureSystem,
  degToCompass,
  findCurrentHourIndex,
  formatClockTime,
  formatPrecip,
  formatTemp,
  formatVisibility,
  formatWind,
  getAqiCategory,
  getUvCategory,
} from '../utils/weatherUtils';

interface AtmosphericSystemsProps {
  weather: WeatherData;
  airQuality: AirQualityData | null;
  units: UnitSystem;
}

export const AtmosphericSystems: React.FC<AtmosphericSystemsProps> = ({
  weather,
  airQuality,
  units,
}) => {
  const currentIdx = findCurrentHourIndex(weather);
  const currentHour = weather.hourly[currentIdx] || weather.hourly[0];
  const today = weather.daily[0];

  const pressureAnalysis = useMemo(
    () =>
      analyzePressureSystem(
        weather.current.pressureMsl,
        weather.hourly,
        currentIdx
      ),
    [weather.current.pressureMsl, weather.hourly, currentIdx]
  );

  // Build 24h barometric sparkline path
  const pressureSparkline = useMemo(() => {
    const slice = weather.hourly.slice(currentIdx, currentIdx + 24);
    if (slice.length < 2) return '';
    const vals = slice.map((h) => h.pressureMsl);
    const min = Math.min(...vals) - 1;
    const max = Math.max(...vals) + 1;
    const span = Math.max(2, max - min);
    const w = 220;
    const h = 44;
    return slice
      .map((pt, i) => {
        const x = (i / (slice.length - 1)) * w;
        const y = h - ((pt.pressureMsl - min) / span) * (h - 8) - 4;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [weather.hourly, currentIdx]);

  // Solar arc progress between sunrise and sunset
  const solarProgress = useMemo(() => {
    if (!today?.sunrise || !today?.sunset) return 0.5;
    const toMins = (iso: string) => {
      const part = iso.split('T')[1] || '12:00';
      const [hh, mm] = part.split(':').map(Number);
      return hh * 60 + mm;
    };
    const rise = toMins(today.sunrise);
    const set = toMins(today.sunset);
    const now = toMins(weather.current.time);
    if (set <= rise) return 0.5;
    return Math.max(0, Math.min(1, (now - rise) / (set - rise)));
  }, [today, weather.current.time]);

  const daylightDuration = useMemo(() => {
    if (!today?.sunrise || !today?.sunset) return '—';
    const toMins = (iso: string) => {
      const part = iso.split('T')[1] || '12:00';
      const [hh, mm] = part.split(':').map(Number);
      return hh * 60 + mm;
    };
    const diff = Math.max(0, toMins(today.sunset) - toMins(today.sunrise));
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hrs}h ${mins}m`;
  }, [today]);

  const aqiInfo = getAqiCategory(airQuality?.currentUsAqi ?? null);
  const uvVal = currentHour?.uvIndex ?? 0;
  const uvInfo = getUvCategory(uvVal);

  // Sun coordinates on semicircle (cx=90, cy=74, r=60)
  const sunAngle = Math.PI * (1 - solarProgress);
  const sunX = 90 + 60 * Math.cos(sunAngle);
  const sunY = 74 - 60 * Math.sin(sunAngle);

  const dewPoint = currentHour?.dewPoint ?? weather.current.temperature - 4;
  const visibility = currentHour?.visibility ?? 10000;

  return (
    <section id="systems" aria-label="Atmospheric and weather systems">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-slate-100">
            Atmospheric & Weather Systems
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Live barometric pressure tendencies, wind vectors, solar radiation, moisture, and airshed composition
          </p>
        </div>
        <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
          Elevation {Math.round(weather.elevation)} m · {weather.timezoneAbbreviation}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Synoptic & Barometric Pressure System */}
        <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium">Barometric Pressure System</span>
              <span className="font-mono tabular-nums">
                {pressureAnalysis.trend} ({pressureAnalysis.delta3h >= 0 ? '+' : ''}
                {pressureAnalysis.delta3h} hPa/3h)
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {Math.round(weather.current.pressureMsl)}
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                hPa (MSL)
              </span>
            </div>
            <div className="mt-1 text-sm font-semibold text-blue-700 dark:text-blue-400">
              {pressureAnalysis.systemType}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {pressureAnalysis.summary}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>24h Pressure Curve</span>
              <span className="tabular-nums">
                Surface {Math.round(weather.current.surfacePressure)} hPa
              </span>
            </div>
            {pressureSparkline && (
              <svg
                viewBox="0 0 220 44"
                className="w-full h-11"
                role="img"
                aria-label="24-hour barometric pressure trend"
              >
                <path
                  d={pressureSparkline}
                  fill="none"
                  className="stroke-blue-600 dark:stroke-blue-400"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </div>
        </article>

        {/* 2. Wind Vector & Gust Compass */}
        <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Wind Vector & Gusts
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {formatWind(weather.current.windSpeed, units).split(' ')[0]}
                </span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {units === 'metric' ? 'km/h' : 'mph'} ·{' '}
                  {degToCompass(weather.current.windDirection)}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <div className="font-mono tabular-nums">
                  Bearing: {Math.round(weather.current.windDirection)}°{' '}
                  {degToCompass(weather.current.windDirection)}
                </div>
                <div className="font-mono tabular-nums">
                  Peak Gusts: {formatWind(weather.current.windGusts, units)}
                </div>
              </div>
            </div>

            {/* Precision SVG Compass Rose */}
            <svg
              width="88"
              height="88"
              viewBox="0 0 88 88"
              className="shrink-0"
              role="img"
              aria-label={`Wind compass pointing ${Math.round(
                weather.current.windDirection
              )} degrees`}
            >
              <circle
                cx="44"
                cy="44"
                r="36"
                fill="none"
                className="stroke-slate-200 dark:stroke-slate-700"
                strokeWidth="1.5"
              />
              <circle
                cx="44"
                cy="44"
                r="26"
                fill="none"
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeDasharray="2 3"
                strokeWidth="1"
              />
              <text
                x="44"
                y="15"
                textAnchor="middle"
                className="fill-slate-400 font-mono text-[9px] font-semibold"
              >
                N
              </text>
              <text
                x="44"
                y="79"
                textAnchor="middle"
                className="fill-slate-400 font-mono text-[9px]"
              >
                S
              </text>
              <text
                x="75"
                y="47"
                textAnchor="middle"
                className="fill-slate-400 font-mono text-[9px]"
              >
                E
              </text>
              <text
                x="13"
                y="47"
                textAnchor="middle"
                className="fill-slate-400 font-mono text-[9px]"
              >
                W
              </text>
              <g
                transform={`rotate(${weather.current.windDirection} 44 44)`}
              >
                <line
                  x1="44"
                  y1="62"
                  x2="44"
                  y2="20"
                  className="stroke-blue-600 dark:stroke-blue-400"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <polygon
                  points="44,16 39.5,25 48.5,25"
                  className="fill-blue-600 dark:fill-blue-400"
                />
                <circle
                  cx="44"
                  cy="44"
                  r="3"
                  className="fill-slate-900 dark:fill-white"
                />
              </g>
            </svg>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>10m Anemometer Level</span>
            <span className="font-mono tabular-nums">
              {weather.current.windGusts >= 45
                ? 'Elevated Gust Shear'
                : 'Steady Flow'}
            </span>
          </div>
        </article>

        {/* 3. Solar Cycle & UV Index */}
        <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium">Solar Trajectory & UV</span>
              <span className="font-mono tabular-nums">
                Daylight {daylightDuration}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                    {uvVal.toFixed(1)}
                  </span>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    UV {uvInfo.label}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  {uvInfo.guidance}
                </p>
              </div>
            </div>
          </div>

          {/* Solar Arc SVG */}
          <div className="pt-2">
            <svg
              viewBox="0 0 180 88"
              className="w-full h-20"
              role="img"
              aria-label="Solar elevation between sunrise and sunset"
            >
              <line
                x1="16"
                y1="74"
                x2="164"
                y2="74"
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeWidth="1.2"
              />
              <path
                d="M 30 74 A 60 60 0 0 1 150 74"
                fill="none"
                className="stroke-slate-200 dark:stroke-slate-700"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              {weather.current.isDay && (
                <circle
                  cx={sunX}
                  cy={sunY}
                  r="6"
                  fill="#F59E0B"
                  className="stroke-white dark:stroke-slate-900"
                  strokeWidth="2"
                />
              )}
              <text
                x="30"
                y="86"
                textAnchor="middle"
                className="fill-slate-500 dark:fill-slate-400 font-mono text-[9px]"
              >
                {today?.sunrise ? formatClockTime(today.sunrise) : '—'}
              </text>
              <text
                x="150"
                y="86"
                textAnchor="middle"
                className="fill-slate-500 dark:fill-slate-400 font-mono text-[9px]"
              >
                {today?.sunset ? formatClockTime(today.sunset) : '—'}
              </text>
            </svg>
          </div>
        </article>

        {/* 4. Humidity & Dew Point */}
        <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium">Atmospheric Moisture</span>
              <span className="font-mono tabular-nums">
                Dew Point {formatTemp(dewPoint, units, true)}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {Math.round(weather.current.relativeHumidity)}%
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Relative Humidity
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {dewPoint >= 20
                ? 'High latent moisture; air feels oppressive and humid.'
                : dewPoint >= 13
                ? 'Moderate moisture content; comfortable to slightly muggy.'
                : dewPoint >= 4
                ? 'Crisp, comfortable dew point with balanced evaporation.'
                : 'Dry air mass; low moisture saturation and rapid cooling.'}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-sky-500"
                style={{
                  width: `${Math.min(100, Math.max(4, weather.current.relativeHumidity))}%`,
                }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[11px] font-mono text-slate-400 tabular-nums">
              <span>Feels Like {formatTemp(weather.current.apparentTemperature, units, true)}</span>
              <span>Actual {formatTemp(weather.current.temperature, units, true)}</span>
            </div>
          </div>
        </article>

        {/* 5. Air Quality & Particulates */}
        <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium">Air Quality Index (US AQI)</span>
              <span
                className={`font-semibold ${
                  aqiInfo.tone === 'good'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : aqiInfo.tone === 'moderate'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {aqiInfo.label}
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {airQuality?.currentUsAqi !== null &&
                airQuality?.currentUsAqi !== undefined
                  ? Math.round(airQuality.currentUsAqi)
                  : '—'}
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                AQI
              </span>
            </div>

            <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {aqiInfo.guidance}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-xs font-mono tabular-nums">
            <div>
              <div className="text-[11px] text-slate-400">PM2.5</div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {airQuality?.currentPm25 !== null &&
                airQuality?.currentPm25 !== undefined
                  ? `${airQuality.currentPm25.toFixed(1)}`
                  : '—'}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">PM10</div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {airQuality?.currentPm10 !== null &&
                airQuality?.currentPm10 !== undefined
                  ? `${airQuality.currentPm10.toFixed(1)}`
                  : '—'}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">O₃ (µg/m³)</div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {airQuality?.currentOzone !== null &&
                airQuality?.currentOzone !== undefined
                  ? `${Math.round(airQuality.currentOzone)}`
                  : '—'}
              </div>
            </div>
          </div>
        </article>

        {/* 6. Cloud Ceiling, Precipitation & Visibility */}
        <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium">Cloud Cover & Visibility</span>
              <span className="font-mono tabular-nums">
                Precip {formatPrecip(weather.current.precipitation, units)}
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {formatVisibility(visibility, units)}
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Horizontal Visibility
              </span>
            </div>

            <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {visibility >= 10000
                ? 'Clear atmospheric sightlines with minimal haze or mist interference.'
                : visibility >= 4000
                ? 'Moderate visibility; light haze or distant precipitation.'
                : 'Restricted visibility due to dense moisture, fog, or heavy precipitation.'}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs font-mono tabular-nums">
            <div>
              <div className="text-[11px] text-slate-400">Total Cloud Layer</div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {Math.round(weather.current.cloudCover)}%
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Today Rain Total</div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {formatPrecip(today?.precipitationSum ?? 0, units)}
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
};
