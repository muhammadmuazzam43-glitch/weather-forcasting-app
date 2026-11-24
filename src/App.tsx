import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowDownRight } from 'lucide-react';
import {
  AirQualityData,
  AlertPreferences,
  GeoLocation,
  RainViewerData,
  UnitSystem,
  WeatherAlert,
  WeatherData,
} from './types/weather';
import {
  fetchAirQuality,
  fetchForecast,
  fetchNwsAlerts,
  fetchRainViewerFrames,
  reverseGeocode,
} from './services/weatherApi';
import {
  analyzePressureSystem,
  degToCompass,
  evaluateMeteorologicalAlerts,
  findCurrentHourIndex,
  formatClockTime,
  formatClockTime12h,
  formatCoordinates,
  formatDayDate,
  formatDayName,
  formatTemp,
  formatWind,
  getWmoInfo,
} from './utils/weatherUtils';
import { Header } from './components/Header';
import { LocationToolbar } from './components/LocationToolbar';
import { WeatherIcon } from './components/WeatherIcon';
import { ForecastChart } from './components/ForecastChart';
import { DailyForecast } from './components/DailyForecast';
import { AtmosphericSystems } from './components/AtmosphericSystems';
import { RadarMap } from './components/RadarMap';
import { AlertCenter } from './components/AlertCenter';

const DEFAULT_SAVED_LOCATIONS: GeoLocation[] = [
  {
    id: '28.614,77.209',
    name: 'New Delhi',
    latitude: 28.6139,
    longitude: 77.209,
    country: 'India',
    admin1: 'Delhi',
  },
  {
    id: '31.520,74.359',
    name: 'Lahore',
    latitude: 31.5204,
    longitude: 74.3587,
    country: 'Pakistan',
    admin1: 'Punjab',
  },
  {
    id: '51.507,-0.128',
    name: 'London',
    latitude: 51.5074,
    longitude: -0.1278,
    country: 'United Kingdom',
    admin1: 'England',
  },
  {
    id: '40.713,-74.006',
    name: 'New York',
    latitude: 40.7128,
    longitude: -74.006,
    country: 'United States',
    admin1: 'New York',
  },
  {
    id: '35.676,139.650',
    name: 'Tokyo',
    latitude: 35.6762,
    longitude: 139.6503,
    country: 'Japan',
    admin1: 'Tokyo',
  },
];

const DEFAULT_ALERT_PREFS: AlertPreferences = {
  enabled: true,
  highTempC: 36,
  lowTempC: 4,
  windGustKmh: 45,
  precipProbPct: 70,
  aqiThreshold: 120,
};

function loadJsonStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [savedLocations, setSavedLocations] = useState<GeoLocation[]>(() =>
    loadJsonStorage('atmos_saved_locations', DEFAULT_SAVED_LOCATIONS)
  );
  const [activeLocation, setActiveLocation] = useState<GeoLocation>(() =>
    loadJsonStorage('atmos_active_location', DEFAULT_SAVED_LOCATIONS[0])
  );
  const [units, setUnits] = useState<UnitSystem>(() =>
    loadJsonStorage<UnitSystem>('atmos_units', 'metric')
  );
  const [isDark, setIsDark] = useState<boolean>(() =>
    loadJsonStorage<boolean>('atmos_dark_mode', false)
  );
  const [alertPrefs, setAlertPrefs] = useState<AlertPreferences>(() =>
    loadJsonStorage('atmos_alert_prefs', DEFAULT_ALERT_PREFS)
  );

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [nwsAlerts, setNwsAlerts] = useState<WeatherAlert[]>([]);
  const [radarData, setRadarData] = useState<RainViewerData | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  // Sync theme class on document root
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('atmos_dark_mode', JSON.stringify(isDark));
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem('atmos_saved_locations', JSON.stringify(savedLocations));
  }, [savedLocations]);

  useEffect(() => {
    localStorage.setItem('atmos_active_location', JSON.stringify(activeLocation));
  }, [activeLocation]);

  useEffect(() => {
    localStorage.setItem('atmos_units', JSON.stringify(units));
  }, [units]);

  useEffect(() => {
    localStorage.setItem('atmos_alert_prefs', JSON.stringify(alertPrefs));
  }, [alertPrefs]);

  // Dynamic SEO title, description & canonical URL resolution
  useEffect(() => {
    const cityLabel = [activeLocation.name, activeLocation.country]
      .filter(Boolean)
      .join(', ');
    document.title = `${activeLocation.name} Weather – Live Forecast & Alerts | AtmosScope`;
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) {
      descMeta.setAttribute(
        'content',
        `Live weather forecast, sunrise & sunset times, atmospheric systems, radar, and real-time weather alerts for ${cityLabel} on AtmosScope.`
      );
    }
    const canonicalHref = window.location.origin + window.location.pathname;
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalHref);
  }, [activeLocation]);

  const loadWeatherForLocation = useCallback(
    async (loc: GeoLocation, silent = false) => {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const [forecastRes, aqiRes, nwsRes, rvRes] = await Promise.all([
          fetchForecast(loc.latitude, loc.longitude),
          fetchAirQuality(loc.latitude, loc.longitude),
          fetchNwsAlerts(loc.latitude, loc.longitude),
          fetchRainViewerFrames(),
        ]);

        setWeather(forecastRes);
        setAirQuality(aqiRes);
        setNwsAlerts(nwsRes);
        if (rvRes) setRadarData(rvRes);
        setSelectedDayIndex(0);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to fetch live meteorological data.'
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadWeatherForLocation(activeLocation, false);
  }, [activeLocation, loadWeatherForLocation]);

  // Auto-refresh every 5 minutes for real-time weather & alert updates
  useEffect(() => {
    const timer = window.setInterval(() => {
      loadWeatherForLocation(activeLocation, true);
    }, 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [activeLocation, loadWeatherForLocation]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoMessage('Geolocation is not supported by this browser.');
      return;
    }
    setIsLocating(true);
    setGeoMessage(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const loc = await reverseGeocode(
            pos.coords.latitude,
            pos.coords.longitude
          );
          setActiveLocation(loc);
        } catch {
          setGeoMessage('Could not resolve your coordinates to a city name.');
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setGeoMessage(
          'Location permission denied or unavailable. Search any city manually above.'
        );
        setIsLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  const handleToggleSaveLocation = (loc: GeoLocation) => {
    setSavedLocations((prev) => {
      const exists = prev.some((item) => item.id === loc.id);
      if (exists) {
        if (prev.length <= 1) return prev;
        return prev.filter((item) => item.id !== loc.id);
      }
      return [loc, ...prev];
    });
  };

  const alerts = useMemo(() => {
    if (!weather) return [];
    return evaluateMeteorologicalAlerts(
      weather,
      airQuality,
      nwsAlerts,
      alertPrefs,
      units
    );
  }, [weather, airQuality, nwsAlerts, alertPrefs, units]);

  // Extract 24 hours corresponding to selectedDayIndex
  const selectedDayHourly = useMemo(() => {
    if (!weather) return [];
    if (selectedDayIndex === 0) {
      const idx = findCurrentHourIndex(weather);
      return weather.hourly.slice(idx, idx + 24);
    }
    const targetDate = weather.daily[selectedDayIndex]?.date;
    if (!targetDate) return weather.hourly.slice(0, 24);
    return weather.hourly.filter((h) => h.time.startsWith(targetDate));
  }, [weather, selectedDayIndex]);

  const selectedDateLabel = useMemo(() => {
    if (!weather || !weather.daily[selectedDayIndex]) return 'Next 24 Hours';
    if (selectedDayIndex === 0) return 'Next 24 Hours';
    return `${formatDayName(
      weather.daily[selectedDayIndex].date,
      selectedDayIndex
    )}, ${formatDayDate(weather.daily[selectedDayIndex].date)}`;
  }, [weather, selectedDayIndex]);

  const currentInfo = weather
    ? getWmoInfo(weather.current.weatherCode, weather.current.isDay)
    : null;

  const currentHourIdx = weather ? findCurrentHourIndex(weather) : 0;
  const pressureAnalysis = weather
    ? analyzePressureSystem(
        weather.current.pressureMsl,
        weather.hourly,
        currentHourIdx
      )
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Header
        onUseMyLocation={handleUseMyLocation}
        isLocating={isLocating}
      />

      <LocationToolbar
        activeLocation={activeLocation}
        savedLocations={savedLocations}
        onSelectLocation={(loc) => {
          setGeoMessage(null);
          setActiveLocation(loc);
        }}
        onToggleSaveLocation={handleToggleSaveLocation}
        units={units}
        onChangeUnits={setUnits}
        isDark={isDark}
        onToggleDark={() => setIsDark((d) => !d)}
        onRefresh={() => loadWeatherForLocation(activeLocation, true)}
        isRefreshing={isRefreshing}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {geoMessage && (
          <div
            role="status"
            className="px-4 py-3 rounded-lg border border-amber-200 dark:border-amber-900/70 bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between gap-4"
          >
            <span>{geoMessage}</span>
            <button
              type="button"
              onClick={() => setGeoMessage(null)}
              className="font-semibold underline cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Top Real-Time Alert Strip (shown only when active warnings/advisories exist) */}
        {!isLoading && weather && alerts.length > 0 && (
          <a
            href="#alerts"
            className="px-4 py-3 rounded-xl border border-amber-300 dark:border-amber-900/80 bg-amber-50/80 dark:bg-amber-950/30 hover:bg-amber-100/70 dark:hover:bg-amber-950/50 transition-colors flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <AlertTriangle
                className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {alerts[0].title}
                  {alerts.length > 1
                    ? ` (+${alerts.length - 1} more active alert${
                        alerts.length - 1 > 1 ? 's' : ''
                      })`
                    : ''}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 truncate">
                  {alerts[0].source} · {alerts[0].metricLabel} ·{' '}
                  {alerts[0].timeframe}
                </div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 dark:text-amber-300 whitespace-nowrap shrink-0">
              <span>View Alerts</span>
              <ArrowDownRight className="w-3.5 h-3.5" aria-hidden="true" />
            </span>
          </a>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col gap-6" aria-busy="true">
            <div className="h-52 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse p-6" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 h-96 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse" />
              <div className="lg:col-span-4 h-96 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse" />
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="p-8 rounded-xl border border-red-200 dark:border-red-900/70 bg-white dark:bg-slate-900 text-center">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
              Weather Feed Unavailable
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {error}
            </p>
            <button
              type="button"
              onClick={() => loadWeatherForLocation(activeLocation, false)}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              Retry Live Fetch
            </button>
          </div>
        )}

        {/* Populated Weather Observatory */}
        {!isLoading && !error && weather && currentInfo && pressureAnalysis && (
          <>
            {/* Section 1: Overview Hero Current Conditions */}
            <section
              id="overview"
              aria-label="Current weather overview"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                  <div className="text-xs font-mono text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>
                      {[activeLocation.admin1, activeLocation.country]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {formatCoordinates(
                        weather.latitude,
                        weather.longitude
                      )}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      Updated {formatClockTime(weather.current.time)}{' '}
                      {weather.timezoneAbbreviation}
                    </span>
                  </div>

                  <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 text-balance">
                    {activeLocation.name}
                  </h1>

                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                    {currentInfo.label} · {pressureAnalysis.systemType}
                  </p>
                </div>

                {/* Primary Google Weather Style Thermal Display */}
                <div className="flex items-center gap-5">
                  <WeatherIcon type={currentInfo.iconType} size={72} />
                  <div>
                    <div className="flex items-start">
                      <span className="font-display text-5xl sm:text-6xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-slate-100">
                        {formatTemp(weather.current.temperature, units).replace(
                          '°',
                          ''
                        )}
                      </span>
                      <span className="text-2xl font-display font-semibold text-slate-500 dark:text-slate-400 mt-1 ml-0.5">
                        °{units === 'metric' ? 'C' : 'F'}
                      </span>
                    </div>
                    <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 mt-1">
                      Feels like{' '}
                      {formatTemp(
                        weather.current.apparentTemperature,
                        units,
                        true
                      )}{' '}
                      · H{' '}
                      {formatTemp(weather.daily[0]?.tempMax ?? 0, units, false)}{' '}
                      / L{' '}
                      {formatTemp(weather.daily[0]?.tempMin ?? 0, units, false)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 6-Column Quick Metrics Strip including Sunrise & Sunset */}
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Precipitation Chance
                  </div>
                  <div className="mt-1 text-lg font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {weather.daily[0]?.precipitationProbabilityMax ?? 0}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Humidity
                  </div>
                  <div className="mt-1 text-lg font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {Math.round(weather.current.relativeHumidity)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Wind
                  </div>
                  <div className="mt-1 text-lg font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {formatWind(weather.current.windSpeed, units)}{' '}
                    {degToCompass(weather.current.windDirection)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Pressure
                  </div>
                  <div className="mt-1 text-lg font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {Math.round(weather.current.pressureMsl)} hPa (
                    {pressureAnalysis.trend})
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Sunrise
                  </div>
                  <div className="mt-1 text-lg font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {weather.daily[0]?.sunrise
                      ? formatClockTime12h(weather.daily[0].sunrise)
                      : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Sunset
                  </div>
                  <div className="mt-1 text-lg font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {weather.daily[0]?.sunset
                      ? formatClockTime12h(weather.daily[0].sunset)
                      : '—'}
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Forecast (Hourly Curve + 10-Day Split) */}
            <section
              id="forecast"
              aria-label="Hourly and 10-day temperature forecast"
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
            >
              <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6">
                <ForecastChart
                  hourlyPoints={selectedDayHourly}
                  selectedDateLabel={selectedDateLabel}
                  units={units}
                />
              </div>

              <div className="lg:col-span-4">
                <DailyForecast
                  daily={weather.daily}
                  selectedDayIndex={selectedDayIndex}
                  onSelectDay={setSelectedDayIndex}
                  units={units}
                />
              </div>
            </section>

            {/* Section 3: Atmospheric & Weather Systems */}
            <AtmosphericSystems
              weather={weather}
              airQuality={airQuality}
              units={units}
            />

            {/* Section 4: Live Precipitation Radar */}
            <RadarMap
              latitude={weather.latitude}
              longitude={weather.longitude}
              locationName={activeLocation.name}
              windSpeed={weather.current.windSpeed}
              windDirection={weather.current.windDirection}
              pressureMsl={weather.current.pressureMsl}
              units={units}
              isDark={isDark}
              radarData={radarData}
            />

            {/* Section 5: Real-Time Weather Alerts & Custom Thresholds */}
            <AlertCenter
              locationName={activeLocation.name}
              alerts={alerts}
              prefs={alertPrefs}
              onUpdatePrefs={setAlertPrefs}
              units={units}
            />
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>
            AtmosScope · Live meteorological telemetry via Open-Meteo, RainViewer, and NWS
          </span>
          <span className="font-mono tabular-nums">
            Auto-updates every 5 minutes
          </span>
        </div>
      </footer>
    </div>
  );
}
