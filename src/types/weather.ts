export type UnitSystem = 'metric' | 'imperial';

export type ForecastChartMetric = 'temperature' | 'precipitation' | 'wind';

export interface GeoLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
  timezone?: string;
}

export interface CurrentWeather {
  time: string;
  temperature: number;
  relativeHumidity: number;
  apparentTemperature: number;
  isDay: boolean;
  precipitation: number;
  rain: number;
  showers: number;
  snowfall: number;
  weatherCode: number;
  cloudCover: number;
  pressureMsl: number;
  surfacePressure: number;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
}

export interface HourlyForecastPoint {
  time: string;
  temperature: number;
  relativeHumidity: number;
  dewPoint: number;
  apparentTemperature: number;
  precipitationProbability: number;
  precipitation: number;
  weatherCode: number;
  pressureMsl: number;
  cloudCover: number;
  visibility: number;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
  uvIndex: number;
  isDay: boolean;
}

export interface DailyForecastPoint {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  apparentTempMax: number;
  apparentTempMin: number;
  sunrise: string;
  sunset: string;
  uvIndexMax: number;
  precipitationSum: number;
  precipitationProbabilityMax: number;
  windSpeedMax: number;
  windGustsMax: number;
  windDirectionDominant: number;
}

export interface WeatherData {
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  timezoneAbbreviation: string;
  utcOffsetSeconds: number;
  current: CurrentWeather;
  hourly: HourlyForecastPoint[];
  daily: DailyForecastPoint[];
}

export interface AirQualityData {
  currentUsAqi: number | null;
  currentPm25: number | null;
  currentPm10: number | null;
  currentOzone: number | null;
  currentNo2: number | null;
  currentCo: number | null;
}

export type AlertSeverity = 'warning' | 'watch' | 'advisory' | 'custom';

export interface WeatherAlert {
  id: string;
  title: string;
  severity: AlertSeverity;
  source: 'NWS Official' | 'Meteorological Engine' | 'Custom Rule';
  metricLabel: string;
  description: string;
  timeframe: string;
  instruction: string;
}

export interface AlertPreferences {
  enabled: boolean;
  highTempC: number;
  lowTempC: number;
  windGustKmh: number;
  precipProbPct: number;
  aqiThreshold: number;
}

export interface RainViewerFrame {
  time: number;
  path: string;
}

export interface RainViewerData {
  host: string;
  past: RainViewerFrame[];
  nowcast: RainViewerFrame[];
}
