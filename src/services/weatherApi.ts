import {
  AirQualityData,
  GeoLocation,
  RainViewerData,
  WeatherAlert,
  WeatherData,
} from '../types/weather';

interface OpenMeteoGeoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  timezone?: string;
}

export async function searchLocations(query: string): Promise<GeoLocation[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    trimmed
  )}&count=8&language=en&format=json`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Unable to reach location search service.');
  }
  const data = (await res.json()) as { results?: OpenMeteoGeoResult[] };
  if (!data.results) return [];

  return data.results.map((item) => ({
    id: `${item.latitude.toFixed(3)},${item.longitude.toFixed(3)}`,
    name: item.name,
    latitude: item.latitude,
    longitude: item.longitude,
    country: item.country || 'Unknown',
    admin1: item.admin1,
    timezone: item.timezone,
  }));
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeoLocation> {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
    const res = await fetch(url);
    if (res.ok) {
      const data = (await res.json()) as {
        city?: string;
        locality?: string;
        principalSubdivision?: string;
        countryName?: string;
      };
      const name = data.city || data.locality || data.principalSubdivision || 'Current Location';
      return {
        id: `${latitude.toFixed(3)},${longitude.toFixed(3)}`,
        name,
        latitude,
        longitude,
        country: data.countryName || '',
        admin1: data.principalSubdivision,
      };
    }
  } catch {
    // Fallback cleanly to coordinates
  }

  return {
    id: `${latitude.toFixed(3)},${longitude.toFixed(3)}`,
    name: 'My Location',
    latitude,
    longitude,
    country: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
  };
}

export async function fetchForecast(
  latitude: number,
  longitude: number
): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'precipitation',
      'rain',
      'showers',
      'snowfall',
      'weather_code',
      'cloud_cover',
      'pressure_msl',
      'surface_pressure',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
    ].join(','),
    hourly: [
      'temperature_2m',
      'relative_humidity_2m',
      'dew_point_2m',
      'apparent_temperature',
      'precipitation_probability',
      'precipitation',
      'weather_code',
      'pressure_msl',
      'cloud_cover',
      'visibility',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
      'uv_index',
      'is_day',
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'apparent_temperature_max',
      'apparent_temperature_min',
      'sunrise',
      'sunset',
      'uv_index_max',
      'precipitation_sum',
      'precipitation_probability_max',
      'wind_speed_10m_max',
      'wind_gusts_10m_max',
      'wind_direction_10m_dominant',
    ].join(','),
    forecast_days: '10',
    timezone: 'auto',
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!res.ok) {
    throw new Error('Failed to retrieve meteorological forecast data.');
  }
  const raw = await res.json();

  const hourly = (raw.hourly.time as string[]).map((time, i) => ({
    time,
    temperature: raw.hourly.temperature_2m[i] ?? 0,
    relativeHumidity: raw.hourly.relative_humidity_2m[i] ?? 0,
    dewPoint: raw.hourly.dew_point_2m[i] ?? 0,
    apparentTemperature: raw.hourly.apparent_temperature[i] ?? 0,
    precipitationProbability: raw.hourly.precipitation_probability[i] ?? 0,
    precipitation: raw.hourly.precipitation[i] ?? 0,
    weatherCode: raw.hourly.weather_code[i] ?? 0,
    pressureMsl: raw.hourly.pressure_msl[i] ?? 1013,
    cloudCover: raw.hourly.cloud_cover[i] ?? 0,
    visibility: raw.hourly.visibility[i] ?? 10000,
    windSpeed: raw.hourly.wind_speed_10m[i] ?? 0,
    windDirection: raw.hourly.wind_direction_10m[i] ?? 0,
    windGusts: raw.hourly.wind_gusts_10m[i] ?? 0,
    uvIndex: raw.hourly.uv_index[i] ?? 0,
    isDay: raw.hourly.is_day[i] === 1,
  }));

  const daily = (raw.daily.time as string[]).map((date, i) => ({
    date,
    weatherCode: raw.daily.weather_code[i] ?? 0,
    tempMax: raw.daily.temperature_2m_max[i] ?? 0,
    tempMin: raw.daily.temperature_2m_min[i] ?? 0,
    apparentTempMax: raw.daily.apparent_temperature_max[i] ?? 0,
    apparentTempMin: raw.daily.apparent_temperature_min[i] ?? 0,
    sunrise: raw.daily.sunrise[i] ?? '',
    sunset: raw.daily.sunset[i] ?? '',
    uvIndexMax: raw.daily.uv_index_max[i] ?? 0,
    precipitationSum: raw.daily.precipitation_sum[i] ?? 0,
    precipitationProbabilityMax: raw.daily.precipitation_probability_max[i] ?? 0,
    windSpeedMax: raw.daily.wind_speed_10m_max[i] ?? 0,
    windGustsMax: raw.daily.wind_gusts_10m_max[i] ?? 0,
    windDirectionDominant: raw.daily.wind_direction_10m_dominant[i] ?? 0,
  }));

  return {
    latitude: raw.latitude,
    longitude: raw.longitude,
    elevation: raw.elevation ?? 0,
    timezone: raw.timezone ?? 'UTC',
    timezoneAbbreviation: raw.timezone_abbreviation ?? 'UTC',
    utcOffsetSeconds: raw.utc_offset_seconds ?? 0,
    current: {
      time: raw.current.time,
      temperature: raw.current.temperature_2m,
      relativeHumidity: raw.current.relative_humidity_2m,
      apparentTemperature: raw.current.apparent_temperature,
      isDay: raw.current.is_day === 1,
      precipitation: raw.current.precipitation,
      rain: raw.current.rain,
      showers: raw.current.showers,
      snowfall: raw.current.snowfall,
      weatherCode: raw.current.weather_code,
      cloudCover: raw.current.cloud_cover,
      pressureMsl: raw.current.pressure_msl,
      surfacePressure: raw.current.surface_pressure,
      windSpeed: raw.current.wind_speed_10m,
      windDirection: raw.current.wind_direction_10m,
      windGusts: raw.current.wind_gusts_10m,
    },
    hourly,
    daily,
  };
}

export async function fetchAirQuality(
  latitude: number,
  longitude: number
): Promise<AirQualityData | null> {
  try {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      current: 'us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone',
      timezone: 'auto',
    });
    const res = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`
    );
    if (!res.ok) return null;
    const raw = await res.json();
    if (!raw.current) return null;
    return {
      currentUsAqi: raw.current.us_aqi ?? null,
      currentPm25: raw.current.pm2_5 ?? null,
      currentPm10: raw.current.pm10 ?? null,
      currentOzone: raw.current.ozone ?? null,
      currentNo2: raw.current.nitrogen_dioxide ?? null,
      currentCo: raw.current.carbon_monoxide ?? null,
    };
  } catch {
    return null;
  }
}

export async function fetchNwsAlerts(
  latitude: number,
  longitude: number
): Promise<WeatherAlert[]> {
  // NWS API covers US territories (approx lat 17..72, lon -179..-64)
  if (latitude < 17 || latitude > 72 || longitude < -179 || longitude > -64) {
    return [];
  }
  try {
    const res = await fetch(
      `https://api.weather.gov/alerts/active?point=${latitude.toFixed(4)},${longitude.toFixed(4)}`,
      {
        headers: {
          Accept: 'application/geo+json',
        },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data.features)) return [];

    return data.features.slice(0, 5).map((feat: {
      id: string;
      properties: {
        event?: string;
        severity?: string;
        headline?: string;
        description?: string;
        instruction?: string;
        ends?: string;
        expires?: string;
      };
    }) => {
      const p = feat.properties || {};
      const sevRaw = (p.severity || '').toLowerCase();
      const severity =
        sevRaw === 'extreme' || sevRaw === 'severe'
          ? 'warning'
          : sevRaw === 'moderate'
          ? 'watch'
          : 'advisory';
      return {
        id: feat.id,
        title: p.event || 'Active Weather Alert',
        severity,
        source: 'NWS Official',
        metricLabel: p.severity || 'Active',
        description: (p.headline || p.description || '').slice(0, 260),
        timeframe: p.ends || p.expires ? `Until ${new Date(p.ends || p.expires || '').toLocaleString()}` : 'Active now',
        instruction: p.instruction || 'Follow local emergency and meteorological authority guidance.',
      } satisfies WeatherAlert;
    });
  } catch {
    return [];
  }
}

export async function fetchRainViewerFrames(): Promise<RainViewerData | null> {
  try {
    const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
    if (!res.ok) return null;
    const raw = await res.json();
    if (!raw?.radar) return null;
    return {
      host: raw.host || 'https://tilecache.rainviewer.com',
      past: Array.isArray(raw.radar.past) ? raw.radar.past : [],
      nowcast: Array.isArray(raw.radar.nowcast) ? raw.radar.nowcast : [],
    };
  } catch {
    return null;
  }
}
