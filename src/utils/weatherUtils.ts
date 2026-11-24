import {
  AirQualityData,
  AlertPreferences,
  UnitSystem,
  WeatherAlert,
  WeatherData,
} from '../types/weather';

export type WeatherIconType =
  | 'clear-day'
  | 'clear-night'
  | 'partly-cloudy-day'
  | 'partly-cloudy-night'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'heavy-rain'
  | 'snow'
  | 'thunderstorm';

export interface WmoInfo {
  label: string;
  shortLabel: string;
  iconType: WeatherIconType;
}

export function getWmoInfo(code: number, isDay = true): WmoInfo {
  switch (code) {
    case 0:
      return {
        label: isDay ? 'Clear Sky' : 'Clear Night',
        shortLabel: 'Clear',
        iconType: isDay ? 'clear-day' : 'clear-night',
      };
    case 1:
      return {
        label: 'Mainly Clear',
        shortLabel: 'Mostly Clear',
        iconType: isDay ? 'partly-cloudy-day' : 'partly-cloudy-night',
      };
    case 2:
      return {
        label: 'Partly Cloudy',
        shortLabel: 'Partly Cloudy',
        iconType: isDay ? 'partly-cloudy-day' : 'partly-cloudy-night',
      };
    case 3:
      return {
        label: 'Overcast',
        shortLabel: 'Cloudy',
        iconType: 'cloudy',
      };
    case 45:
    case 48:
      return {
        label: code === 48 ? 'Depositing Rime Fog' : 'Foggy',
        shortLabel: 'Fog',
        iconType: 'fog',
      };
    case 51:
    case 53:
    case 55:
      return {
        label: code === 55 ? 'Dense Drizzle' : 'Light Drizzle',
        shortLabel: 'Drizzle',
        iconType: 'drizzle',
      };
    case 56:
    case 57:
      return {
        label: 'Freezing Drizzle',
        shortLabel: 'Freezing Drizzle',
        iconType: 'drizzle',
      };
    case 61:
    case 63:
      return {
        label: code === 63 ? 'Moderate Rain' : 'Light Rain',
        shortLabel: 'Rain',
        iconType: 'rain',
      };
    case 65:
      return {
        label: 'Heavy Rain',
        shortLabel: 'Heavy Rain',
        iconType: 'heavy-rain',
      };
    case 66:
    case 67:
      return {
        label: 'Freezing Rain',
        shortLabel: 'Freezing Rain',
        iconType: 'heavy-rain',
      };
    case 71:
    case 73:
    case 75:
    case 77:
      return {
        label: code === 75 ? 'Heavy Snowfall' : 'Snowfall',
        shortLabel: 'Snow',
        iconType: 'snow',
      };
    case 80:
    case 81:
      return {
        label: 'Rain Showers',
        shortLabel: 'Showers',
        iconType: 'rain',
      };
    case 82:
      return {
        label: 'Violent Rain Showers',
        shortLabel: 'Heavy Showers',
        iconType: 'heavy-rain',
      };
    case 85:
    case 86:
      return {
        label: 'Snow Showers',
        shortLabel: 'Snow Showers',
        iconType: 'snow',
      };
    case 95:
      return {
        label: 'Thunderstorm',
        shortLabel: 'Thunderstorm',
        iconType: 'thunderstorm',
      };
    case 96:
    case 99:
      return {
        label: 'Thunderstorm with Hail',
        shortLabel: 'Severe Storm',
        iconType: 'thunderstorm',
      };
    default:
      return {
        label: 'Variable Clouds',
        shortLabel: 'Cloudy',
        iconType: 'cloudy',
      };
  }
}

export function convertTemp(tempC: number, units: UnitSystem): number {
  if (units === 'imperial') {
    return (tempC * 9) / 5 + 32;
  }
  return tempC;
}

export function formatTemp(tempC: number, units: UnitSystem, withUnit = false): string {
  const val = Math.round(convertTemp(tempC, units));
  return withUnit ? `${val}°${units === 'metric' ? 'C' : 'F'}` : `${val}°`;
}

export function convertWind(kmh: number, units: UnitSystem): number {
  if (units === 'imperial') {
    return kmh * 0.621371;
  }
  return kmh;
}

export function formatWind(kmh: number, units: UnitSystem): string {
  const val = Math.round(convertWind(kmh, units));
  return `${val} ${units === 'metric' ? 'km/h' : 'mph'}`;
}

export function formatVisibility(meters: number, units: UnitSystem): string {
  if (units === 'imperial') {
    const miles = meters / 1609.34;
    return `${miles >= 10 ? Math.round(miles) : miles.toFixed(1)} mi`;
  }
  const km = meters / 1000;
  return `${km >= 10 ? Math.round(km) : km.toFixed(1)} km`;
}

export function formatPrecip(mm: number, units: UnitSystem): string {
  if (units === 'imperial') {
    const inches = mm / 25.4;
    return `${inches.toFixed(2)} in`;
  }
  return `${mm >= 10 ? mm.toFixed(1) : mm.toFixed(1)} mm`;
}

export function degToCompass(deg: number): string {
  const dirs = [
    'N',
    'NNE',
    'NE',
    'ENE',
    'E',
    'ESE',
    'SE',
    'SSE',
    'S',
    'SSW',
    'SW',
    'WSW',
    'W',
    'WNW',
    'NW',
    'NNW',
  ];
  const index = Math.round((((deg % 360) + 360) % 360) / 22.5) % 16;
  return dirs[index];
}

export function formatCoordinates(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}° ${latDir}, ${Math.abs(lon).toFixed(2)}° ${lonDir}`;
}

export function formatHourLabel(isoTime: string): string {
  const timePart = isoTime.split('T')[1] || '00:00';
  const [hourStr] = timePart.split(':');
  const hour = parseInt(hourStr, 10);
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

export function formatClockTime(isoTime: string): string {
  const timePart = isoTime.split('T')[1] || '00:00';
  return timePart.slice(0, 5);
}

export function formatClockTime12h(isoTime: string): string {
  if (!isoTime || !isoTime.includes('T')) return '—';
  const timePart = isoTime.split('T')[1] || '00:00';
  const [hhStr, mmStr] = timePart.split(':');
  const hour24 = parseInt(hhStr, 10);
  const minute = (mmStr || '00').slice(0, 2);
  if (Number.isNaN(hour24)) return '—';
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minute} ${period}`;
}

export function formatDayName(dateStr: string, index: number): string {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
}

export function formatDayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export interface PressureSystemAnalysis {
  trend: 'Rising' | 'Falling' | 'Steady';
  delta3h: number;
  systemType: string;
  summary: string;
}

export function analyzePressureSystem(
  currentPressure: number,
  hourly: WeatherData['hourly'],
  currentHourIdx: number
): PressureSystemAnalysis {
  const prevIdx = Math.max(0, currentHourIdx - 3);
  const nextIdx = Math.min(hourly.length - 1, currentHourIdx + 3);
  const referencePrev =
    currentHourIdx >= 3
      ? hourly[prevIdx]?.pressureMsl ?? currentPressure
      : currentPressure;
  const referenceNext = hourly[nextIdx]?.pressureMsl ?? currentPressure;

  const delta =
    currentHourIdx >= 3
      ? currentPressure - referencePrev
      : referenceNext - currentPressure;

  let trend: 'Rising' | 'Falling' | 'Steady' = 'Steady';
  if (delta >= 1.2) trend = 'Rising';
  else if (delta <= -1.2) trend = 'Falling';

  let systemType = 'Neutral Barometric Saddle';
  let summary = 'Stable surface pressure gradient with gradual air mass transition.';

  if (currentPressure >= 1020) {
    systemType = 'High-Pressure Ridge (Anticyclone)';
    summary =
      trend === 'Falling'
        ? 'Subsiding high pressure beginning to weaken ahead of approaching trough.'
        : 'Subsiding dry air mass suppressing vertical cloud formation and storms.';
  } else if (currentPressure <= 1006) {
    systemType = 'Low-Pressure Trough (Cyclonic)';
    summary =
      trend === 'Falling'
        ? 'Deepening cyclonic trough drawing moisture and increasing cloud/wind shear.'
        : 'Surface low gradually filling; unsettled winds and scattered cloud bands persist.';
  } else if (trend === 'Falling') {
    systemType = 'Approaching Frontal Boundary';
    summary = 'Falling barometer signals incoming moisture convergence or wind shift.';
  } else if (trend === 'Rising') {
    systemType = 'Post-Frontal Ridge Building';
    summary = 'Rising pressure indicates clearing skies and stabilizing atmospheric column.';
  }

  return {
    trend,
    delta3h: Number(delta.toFixed(1)),
    systemType,
    summary,
  };
}

export function getAqiCategory(aqi: number | null): {
  label: string;
  tone: 'good' | 'moderate' | 'sensitive' | 'unhealthy';
  guidance: string;
} {
  if (aqi === null) {
    return {
      label: 'Unavailable',
      tone: 'moderate',
      guidance: 'Air quality station readings are currently unavailable for this location.',
    };
  }
  if (aqi <= 50) {
    return {
      label: 'Good',
      tone: 'good',
      guidance: 'Clean air quality with minimal atmospheric particulate load.',
    };
  }
  if (aqi <= 100) {
    return {
      label: 'Moderate',
      tone: 'moderate',
      guidance: 'Acceptable air quality; sensitive individuals should limit prolonged exertion.',
    };
  }
  if (aqi <= 150) {
    return {
      label: 'Unhealthy for Sensitive',
      tone: 'sensitive',
      guidance: 'Elevated fine particulates; reduce heavy outdoor activity if sensitive.',
    };
  }
  return {
    label: 'Unhealthy',
    tone: 'unhealthy',
    guidance: 'High particulate density; minimize outdoor exertion and keep windows closed.',
  };
}

export function getUvCategory(uv: number): {
  label: string;
  guidance: string;
} {
  if (uv < 3) return { label: 'Low', guidance: 'Minimal sun protection required.' };
  if (uv < 6) return { label: 'Moderate', guidance: 'Wear sunglasses and SPF 30+ midday.' };
  if (uv < 8) return { label: 'High', guidance: 'Seek shade between 10 AM and 4 PM.' };
  if (uv < 11) return { label: 'Very High', guidance: 'Extra protection essential; burns occur rapidly.' };
  return { label: 'Extreme', guidance: 'Avoid direct midday sun exposure.' };
}

export function findCurrentHourIndex(weather: WeatherData): number {
  const currentPrefix = weather.current.time.slice(0, 13);
  const idx = weather.hourly.findIndex((h) => h.time.slice(0, 13) === currentPrefix);
  return idx >= 0 ? idx : 0;
}

export function evaluateMeteorologicalAlerts(
  weather: WeatherData,
  airQuality: AirQualityData | null,
  nwsAlerts: WeatherAlert[],
  prefs: AlertPreferences,
  units: UnitSystem
): WeatherAlert[] {
  const alerts: WeatherAlert[] = [...nwsAlerts];
  const startIdx = findCurrentHourIndex(weather);
  const next48h = weather.hourly.slice(startIdx, startIdx + 48);

  // 1. Thunderstorm / Severe Storm detection
  const stormHours = next48h.filter((h) => h.weatherCode >= 95);
  if (stormHours.length > 0) {
    const firstStorm = stormHours[0];
    const hasHail = stormHours.some((h) => h.weatherCode >= 96);
    alerts.push({
      id: 'meteo-storm',
      title: hasHail ? 'Severe Thunderstorm & Hail Watch' : 'Thunderstorm Activity Alert',
      severity: hasHail ? 'warning' : 'watch',
      source: 'Meteorological Engine',
      metricLabel: `${stormHours.length} hr window`,
      description: `Convective thunderstorm activity detected starting around ${formatDayDate(
        firstStorm.time.split('T')[0]
      )} ${formatHourLabel(firstStorm.time)} with lightning and sudden wind gusts.`,
      timeframe: `Next 48 hours (${formatHourLabel(firstStorm.time)})`,
      instruction: 'Avoid open terrain, unplug sensitive electronics, and secure loose outdoor objects.',
    });
  }

  // 2. Heavy Rain / Flood potential
  const maxHourlyPrecip = Math.max(0, ...next48h.map((h) => h.precipitation));
  const next24hPrecipSum = next48h.slice(0, 24).reduce((sum, h) => sum + h.precipitation, 0);
  if (maxHourlyPrecip >= 10 || next24hPrecipSum >= 40) {
    alerts.push({
      id: 'meteo-heavy-rain',
      title: 'Heavy Rainfall & Runoff Advisory',
      severity: next24hPrecipSum >= 65 || maxHourlyPrecip >= 20 ? 'warning' : 'advisory',
      source: 'Meteorological Engine',
      metricLabel: `${formatPrecip(next24hPrecipSum, units)} / 24h`,
      description: `Significant rainfall accumulation projected over the next 24 hours (peak rate ${formatPrecip(
        maxHourlyPrecip,
        units
      )}/hr).`,
      timeframe: 'Next 24–48 hours',
      instruction: 'Watch for localized waterlogging, reduced road traction, and low-lying drainage overflow.',
    });
  }

  // 3. Extreme Heat or Freeze
  const maxApparent = Math.max(...next48h.map((h) => h.apparentTemperature));
  const minTemp = Math.min(...next48h.map((h) => h.temperature));
  if (maxApparent >= 39) {
    alerts.push({
      id: 'meteo-heat',
      title: maxApparent >= 43 ? 'Extreme Heat Warning' : 'Heat Stress Advisory',
      severity: maxApparent >= 43 ? 'warning' : 'advisory',
      source: 'Meteorological Engine',
      metricLabel: `Feels like ${formatTemp(maxApparent, units, true)}`,
      description: `Peak heat index reaches ${formatTemp(
        maxApparent,
        units,
        true
      )} within the next 48 hours, elevating heat exhaustion risk.`,
      timeframe: 'Afternoon peak hours',
      instruction: 'Stay hydrated, limit strenuous midday outdoor work, and check on vulnerable individuals.',
    });
  }
  if (minTemp <= 1) {
    alerts.push({
      id: 'meteo-freeze',
      title: minTemp <= -5 ? 'Hard Freeze Warning' : 'Frost & Freeze Advisory',
      severity: minTemp <= -5 ? 'warning' : 'advisory',
      source: 'Meteorological Engine',
      metricLabel: `Low ${formatTemp(minTemp, units, true)}`,
      description: `Temperatures projected to drop to ${formatTemp(
        minTemp,
        units,
        true
      )}, risking surface ice and frost damage.`,
      timeframe: 'Overnight & early morning',
      instruction: 'Protect sensitive crops/plants, insulate exposed pipes, and watch for black ice on roads.',
    });
  }

  // 4. High Wind / Gale gusts
  const maxGusts = Math.max(...next48h.map((h) => h.windGusts));
  if (maxGusts >= 55) {
    alerts.push({
      id: 'meteo-wind',
      title: maxGusts >= 75 ? 'High Wind Warning' : 'Strong Wind Gust Advisory',
      severity: maxGusts >= 75 ? 'warning' : 'advisory',
      source: 'Meteorological Engine',
      metricLabel: `Gusts ${formatWind(maxGusts, units)}`,
      description: `Peak surface wind gusts expected up to ${formatWind(
        maxGusts,
        units
      )}, creating crosswinds and tree-limb hazards.`,
      timeframe: 'Next 48 hours',
      instruction: 'Exercise caution driving high-profile vehicles and secure lightweight patio items.',
    });
  }

  // 5. Dense Fog / Low Visibility
  const minVis = Math.min(...next48h.slice(0, 24).map((h) => h.visibility));
  if (minVis <= 1000) {
    alerts.push({
      id: 'meteo-fog',
      title: 'Dense Fog & Low Visibility Advisory',
      severity: 'advisory',
      source: 'Meteorological Engine',
      metricLabel: `Vis ${formatVisibility(minVis, units)}`,
      description: `Visibility drops near ${formatVisibility(
        minVis,
        units
      )} over the next 24 hours due to boundary-layer saturation.`,
      timeframe: 'Next 24 hours',
      instruction: 'Use low-beam headlights, increase following distance, and allow extra commute time.',
    });
  }

  // 6. Poor Air Quality
  if (airQuality?.currentUsAqi !== null && airQuality?.currentUsAqi !== undefined && airQuality.currentUsAqi >= 101) {
    alerts.push({
      id: 'meteo-aqi',
      title: 'Unhealthy Air Quality Alert',
      severity: airQuality.currentUsAqi >= 151 ? 'warning' : 'advisory',
      source: 'Meteorological Engine',
      metricLabel: `US AQI ${Math.round(airQuality.currentUsAqi)}`,
      description: `Elevated particulate pollution (${
        airQuality.currentPm25?.toFixed(1) ?? '—'
      } µg/m³ PM2.5) detected in the local airshed.`,
      timeframe: 'Current reading',
      instruction: 'Limit prolonged outdoor exertion and use indoor air filtration if available.',
    });
  }

  // 7. Custom User Threshold Rules
  if (prefs.enabled) {
    const peakTemp = Math.max(...next48h.map((h) => h.temperature));
    if (peakTemp >= prefs.highTempC && maxApparent < 39) {
      alerts.push({
        id: 'custom-high-temp',
        title: `Custom Trigger: Temp ≥ ${formatTemp(prefs.highTempC, units, true)}`,
        severity: 'custom',
        source: 'Custom Rule',
        metricLabel: `Peak ${formatTemp(peakTemp, units, true)}`,
        description: `Forecast temperature reaches ${formatTemp(
          peakTemp,
          units,
          true
        )}, exceeding your personal upper threshold.`,
        timeframe: 'Next 48 hours',
        instruction: 'Triggered by your saved alert threshold settings.',
      });
    }
    if (minTemp <= prefs.lowTempC && minTemp > 1) {
      alerts.push({
        id: 'custom-low-temp',
        title: `Custom Trigger: Temp ≤ ${formatTemp(prefs.lowTempC, units, true)}`,
        severity: 'custom',
        source: 'Custom Rule',
        metricLabel: `Low ${formatTemp(minTemp, units, true)}`,
        description: `Forecast temperature drops to ${formatTemp(
          minTemp,
          units,
          true
        )}, crossing your personal lower threshold.`,
        timeframe: 'Next 48 hours',
        instruction: 'Triggered by your saved alert threshold settings.',
      });
    }
    if (maxGusts >= prefs.windGustKmh && maxGusts < 55) {
      alerts.push({
        id: 'custom-wind',
        title: `Custom Trigger: Gusts ≥ ${formatWind(prefs.windGustKmh, units)}`,
        severity: 'custom',
        source: 'Custom Rule',
        metricLabel: `Peak ${formatWind(maxGusts, units)}`,
        description: `Wind gusts projected at ${formatWind(
          maxGusts,
          units
        )}, crossing your custom wind threshold.`,
        timeframe: 'Next 48 hours',
        instruction: 'Triggered by your saved alert threshold settings.',
      });
    }
    const maxRainProb = Math.max(...next48h.slice(0, 24).map((h) => h.precipitationProbability));
    if (maxRainProb >= prefs.precipProbPct) {
      alerts.push({
        id: 'custom-rain-prob',
        title: `Custom Trigger: Rain Chance ≥ ${prefs.precipProbPct}%`,
        severity: 'custom',
        source: 'Custom Rule',
        metricLabel: `${maxRainProb}% peak prob`,
        description: `Precipitation probability reaches ${maxRainProb}% within the next 24 hours.`,
        timeframe: 'Next 24 hours',
        instruction: 'Carry rain gear or adjust outdoor plans based on your alert preference.',
      });
    }
    if (
      airQuality?.currentUsAqi !== null &&
      airQuality?.currentUsAqi !== undefined &&
      airQuality.currentUsAqi >= prefs.aqiThreshold &&
      airQuality.currentUsAqi < 101
    ) {
      alerts.push({
        id: 'custom-aqi',
        title: `Custom Trigger: AQI ≥ ${prefs.aqiThreshold}`,
        severity: 'custom',
        source: 'Custom Rule',
        metricLabel: `US AQI ${Math.round(airQuality.currentUsAqi)}`,
        description: `Current air quality index (${Math.round(
          airQuality.currentUsAqi
        )}) exceeds your personal sensitivity threshold.`,
        timeframe: 'Current reading',
        instruction: 'Triggered by your saved alert threshold settings.',
      });
    }
  }

  const order: Record<string, number> = {
    warning: 0,
    watch: 1,
    advisory: 2,
    custom: 3,
  };
  return alerts.sort((a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9));
}
