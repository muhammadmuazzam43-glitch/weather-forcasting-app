import React, { useEffect, useMemo, useState } from 'react';
import {
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Layers,
} from 'lucide-react';
import { RainViewerData, UnitSystem } from '../types/weather';
import {
  degToCompass,
  formatCoordinates,
  formatWind,
} from '../utils/weatherUtils';

interface RadarMapProps {
  latitude: number;
  longitude: number;
  locationName: string;
  windSpeed: number;
  windDirection: number;
  pressureMsl: number;
  units: UnitSystem;
  isDark: boolean;
  radarData: RainViewerData | null;
}

function lon2tile(lon: number, zoom: number): number {
  return ((lon + 180) / 360) * Math.pow(2, zoom);
}

function lat2tile(lat: number, zoom: number): number {
  const rad = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
    Math.pow(2, zoom)
  );
}

export const RadarMap: React.FC<RadarMapProps> = ({
  latitude,
  longitude,
  locationName,
  windSpeed,
  windDirection,
  pressureMsl,
  units,
  isDark,
  radarData,
}) => {
  const [zoom, setZoom] = useState(6);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showRadar, setShowRadar] = useState(true);
  const [tileErrors, setTileErrors] = useState(0);

  const frames = useMemo(() => {
    if (!radarData) return [];
    return [...radarData.past, ...radarData.nowcast];
  }, [radarData]);

  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (frames.length > 0) {
      // Start at the latest observed frame (last element of past)
      const latestPastIdx = Math.max(0, (radarData?.past.length ?? frames.length) - 1);
      setFrameIndex(latestPastIdx);
    }
  }, [frames.length, radarData?.past.length]);

  useEffect(() => {
    if (!isPlaying || frames.length <= 1) return;
    const id = window.setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, 650);
    return () => window.clearInterval(id);
  }, [isPlaying, frames.length]);

  useEffect(() => {
    setTileErrors(0);
  }, [latitude, longitude, zoom, isDark]);

  const activeFrame = frames[frameIndex];
  const isNowcastFrame =
    radarData && frameIndex >= (radarData.past.length ?? 0);

  // Compute fractional tile coordinate and 5x3 grid centered around the location
  const exactX = lon2tile(longitude, zoom);
  const exactY = lat2tile(latitude, zoom);
  const centerTileX = Math.floor(exactX);
  const centerTileY = Math.floor(exactY);
  const offsetX = (exactX - centerTileX) * 256;
  const offsetY = (exactY - centerTileY) * 256;
  const maxTile = Math.pow(2, zoom);

  const gridOffsetsX = [-2, -1, 0, 1, 2];
  const gridOffsetsY = [-1, 0, 1];

  const baseStyle = isDark ? 'dark_all' : 'light_all';

  return (
    <section
      id="radar"
      aria-label="Live precipitation radar and weather system map"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
            Live Precipitation Radar & Weather System Map
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Regional precipitation echoes, wind flow vector, and surface pressure around {locationName}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRadar((s) => !s)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              showRadar
                ? 'border-blue-600/30 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{showRadar ? 'Radar On' : 'Radar Off'}</span>
          </button>

          <div className="inline-flex items-center border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-950">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(4, z - 1))}
              aria-label="Zoom out radar map"
              className="px-2.5 py-1.5 min-h-[36px] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" aria-hidden="true" />
            </button>
            <span className="px-2 text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300 border-x border-slate-200 dark:border-slate-800">
              Z{zoom}
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(9, z + 1))}
              aria-label="Zoom in radar map"
              className="px-2.5 py-1.5 min-h-[36px] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Radar Viewport */}
      <div className="relative w-full h-[340px] sm:h-[400px] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 select-none">
        {/* Slippy Tile Grid centered accurately on target coordinates */}
        <div
          className="absolute left-1/2 top-1/2 pointer-events-none"
          style={{
            transform: `translate(${-offsetX}px, ${-offsetY}px)`,
          }}
        >
          {gridOffsetsY.map((dy) =>
            gridOffsetsX.map((dx) => {
              const rawX = centerTileX + dx;
              const wrappedX = ((rawX % maxTile) + maxTile) % maxTile;
              const tileY = centerTileY + dy;
              if (tileY < 0 || tileY >= maxTile) return null;

              const left = dx * 256;
              const top = dy * 256;

              return (
                <React.Fragment key={`${zoom}-${wrappedX}-${tileY}`}>
                  <img
                    src={`https://basemaps.cartocdn.com/${baseStyle}/${zoom}/${wrappedX}/${tileY}.png`}
                    alt=""
                    referrerPolicy="no-referrer"
                    onError={() => setTileErrors((c) => c + 1)}
                    className="absolute w-[256px] h-[256px] max-w-none"
                    style={{ left, top }}
                  />
                  {showRadar && activeFrame && radarData && (
                    <img
                      src={`${radarData.host}${activeFrame.path}/256/${zoom}/${wrappedX}/${tileY}/2/1_1.png`}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="absolute w-[256px] h-[256px] max-w-none opacity-75"
                      style={{ left, top }}
                    />
                  )}
                </React.Fragment>
              );
            })
          )}
        </div>

        {/* Clean Graticule Fallback if external map tiles fail */}
        {tileErrors > 6 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/95 dark:bg-slate-950/95 text-center p-6">
            <Crosshair
              className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2"
              aria-hidden="true"
            />
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {locationName} Atmospheric Sector
            </div>
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
              {formatCoordinates(latitude, longitude)} · {Math.round(pressureMsl)} hPa
            </div>
          </div>
        )}

        {/* Center Target Crosshair & Wind Flow Vector */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center">
          <div className="relative flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border-2 border-blue-600 dark:border-blue-400 bg-blue-600/10 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 ring-2 ring-white dark:ring-slate-950" />
            </div>
          </div>
          <div className="mt-1.5 px-2.5 py-0.5 rounded bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-900 dark:text-slate-100 shadow-sm whitespace-nowrap">
            {locationName}
          </div>
        </div>

        {/* Corner Telemetry Overlay */}
        <div className="absolute top-3 left-3 px-3 py-2 rounded-lg bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 text-xs font-mono tabular-nums text-slate-700 dark:text-slate-200 shadow-sm">
          <div>{formatCoordinates(latitude, longitude)}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Wind {formatWind(windSpeed, units)} {degToCompass(windDirection)} ·{' '}
            {Math.round(pressureMsl)} hPa
          </div>
        </div>

        {/* Precipitation Intensity Legend */}
        <div className="absolute bottom-3 right-3 px-3 py-2 rounded-lg bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 shadow-sm hidden sm:flex items-center gap-2">
          <span className="font-medium">Precip:</span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-400 inline-block" />
            Light
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block" />
            Mod
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
            Heavy
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-600 inline-block" />
            Storm
          </span>
        </div>
      </div>

      {/* Radar Playback Controls */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          type="button"
          onClick={() => setIsPlaying((p) => !p)}
          disabled={frames.length <= 1}
          className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[38px] text-xs font-semibold rounded-lg bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <Play className="w-3.5 h-3.5" aria-hidden="true" />
          )}
          <span>{isPlaying ? 'Pause Radar' : 'Play Radar'}</span>
        </button>

        <div className="flex-1 flex items-center gap-3">
          <input
            type="range"
            aria-label="Radar timeline frame"
            min={0}
            max={Math.max(0, frames.length - 1)}
            value={frameIndex}
            onChange={(e) => {
              setIsPlaying(false);
              setFrameIndex(Number(e.target.value));
            }}
            disabled={frames.length <= 1}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300 whitespace-nowrap shrink-0">
            {activeFrame
              ? `${new Date(activeFrame.time * 1000).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })} ${isNowcastFrame ? 'Forecast' : 'Observed'}`
              : 'Live Layer'}
          </span>
        </div>
      </div>
    </section>
  );
};
