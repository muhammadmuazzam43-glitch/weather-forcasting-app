import React from 'react';
import { WeatherIconType } from '../utils/weatherUtils';

interface WeatherIconProps {
  type: WeatherIconType;
  size?: number;
  className?: string;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({
  type,
  size = 40,
  className = '',
}) => {
  switch (type) {
    case 'clear-day':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <circle cx="24" cy="24" r="10" fill="#F59E0B" />
          <g stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round">
            <line x1="24" y1="5" x2="24" y2="9.5" />
            <line x1="24" y1="38.5" x2="24" y2="43" />
            <line x1="5" y1="24" x2="9.5" y2="24" />
            <line x1="38.5" y1="24" x2="43" y2="24" />
            <line x1="10.6" y1="10.6" x2="13.8" y2="13.8" />
            <line x1="34.2" y1="34.2" x2="37.4" y2="37.4" />
            <line x1="37.4" y1="10.6" x2="34.2" y2="13.8" />
            <line x1="13.8" y1="34.2" x2="10.6" y2="37.4" />
          </g>
        </svg>
      );

    case 'clear-night':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <path
            d="M31.5 29.8A12.5 12.5 0 0 1 18.2 16.5a12.4 12.4 0 0 1 1.4-5.7A13 13 0 1 0 37.2 28.4a12.4 12.4 0 0 1-5.7 1.4Z"
            fill="#60A5FA"
          />
          <circle cx="34" cy="13" r="1.5" fill="#93C5FD" />
          <circle cx="38" cy="19" r="1" fill="#93C5FD" />
        </svg>
      );

    case 'partly-cloudy-day':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <circle cx="19" cy="18" r="7.5" fill="#F59E0B" />
          <g stroke="#F59E0B" strokeWidth="2" strokeLinecap="round">
            <line x1="19" y1="6" x2="19" y2="8.5" />
            <line x1="7" y1="18" x2="9.5" y2="18" />
            <line x1="10.5" y1="9.5" x2="12.3" y2="11.3" />
            <line x1="27.5" y1="9.5" x2="25.7" y2="11.3" />
          </g>
          <path
            d="M17 35h18.5a6.5 6.5 0 0 0 .8-12.95A8.5 8.5 0 0 0 19.6 20.5a6.5 6.5 0 0 0-2.6 14.5Z"
            fill="#CBD5E1"
            stroke="#94A3B8"
            strokeWidth="1.2"
          />
        </svg>
      );

    case 'partly-cloudy-night':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <path
            d="M23.5 20.5A7.5 7.5 0 0 1 16.5 11a7.4 7.4 0 0 1 .7-3.1A8 8 0 1 0 26.6 19.8a7.4 7.4 0 0 1-3.1.7Z"
            fill="#60A5FA"
          />
          <path
            d="M17 36h18.5a6.5 6.5 0 0 0 .8-12.95A8.5 8.5 0 0 0 19.6 21.5a6.5 6.5 0 0 0-2.6 14.5Z"
            fill="#CBD5E1"
            stroke="#94A3B8"
            strokeWidth="1.2"
          />
        </svg>
      );

    case 'cloudy':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <path
            d="M14 35h21a7 7 0 0 0 .9-13.94A9.5 9.5 0 0 0 17 19a7.5 7.5 0 0 0-3 16Z"
            fill="#94A3B8"
          />
          <path
            d="M11.5 36.5h20a6 6 0 0 0 .7-11.96A8 8 0 0 0 16.4 23.2a6.2 6.2 0 0 0-4.9 13.3Z"
            fill="#CBD5E1"
          />
        </svg>
      );

    case 'fog':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <path
            d="M14 27h20a6 6 0 0 0 .8-11.95A8.2 8.2 0 0 0 18.6 13.6 6 6 0 0 0 14 27Z"
            fill="#CBD5E1"
          />
          <g stroke="#94A3B8" strokeWidth="2.4" strokeLinecap="round">
            <line x1="10" y1="32" x2="38" y2="32" />
            <line x1="13" y1="37" x2="35" y2="37" />
          </g>
        </svg>
      );

    case 'drizzle':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <path
            d="M14 29h20a6 6 0 0 0 .8-11.95A8.2 8.2 0 0 0 18.6 15.6 6 6 0 0 0 14 29Z"
            fill="#94A3B8"
          />
          <g stroke="#38BDF8" strokeWidth="2.2" strokeLinecap="round">
            <line x1="17" y1="33" x2="15.5" y2="37" />
            <line x1="24" y1="33" x2="22.5" y2="37" />
            <line x1="31" y1="33" x2="29.5" y2="37" />
          </g>
        </svg>
      );

    case 'rain':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <path
            d="M14 28h20a6 6 0 0 0 .8-11.95A8.2 8.2 0 0 0 18.6 14.6 6 6 0 0 0 14 28Z"
            fill="#94A3B8"
          />
          <g stroke="#2563EB" strokeWidth="2.4" strokeLinecap="round">
            <line x1="17" y1="32" x2="14.5" y2="39" />
            <line x1="24" y1="32" x2="21.5" y2="39" />
            <line x1="31" y1="32" x2="28.5" y2="39" />
          </g>
        </svg>
      );

    case 'heavy-rain':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <path
            d="M14 27h20a6 6 0 0 0 .8-11.95A8.2 8.2 0 0 0 18.6 13.6 6 6 0 0 0 14 27Z"
            fill="#64748B"
          />
          <g stroke="#1D4ED8" strokeWidth="2.4" strokeLinecap="round">
            <line x1="15" y1="31" x2="12" y2="39" />
            <line x1="21.5" y1="31" x2="18.5" y2="39" />
            <line x1="28" y1="31" x2="25" y2="39" />
            <line x1="34.5" y1="31" x2="31.5" y2="39" />
          </g>
        </svg>
      );

    case 'snow':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <path
            d="M14 27h20a6 6 0 0 0 .8-11.95A8.2 8.2 0 0 0 18.6 13.6 6 6 0 0 0 14 27Z"
            fill="#94A3B8"
          />
          <g fill="#38BDF8">
            <circle cx="17" cy="34" r="2" />
            <circle cx="24" cy="36" r="2" />
            <circle cx="31" cy="34" r="2" />
            <circle cx="20.5" cy="40" r="1.6" />
            <circle cx="27.5" cy="40" r="1.6" />
          </g>
        </svg>
      );

    case 'thunderstorm':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <path
            d="M14 27h20a6 6 0 0 0 .8-11.95A8.2 8.2 0 0 0 18.6 13.6 6 6 0 0 0 14 27Z"
            fill="#64748B"
          />
          <path
            d="M25 27l-5 8h4.5l-2 7 7-9h-4.5l2-6H25Z"
            fill="#F59E0B"
          />
          <g stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round">
            <line x1="15" y1="31" x2="13" y2="37" />
            <line x1="33" y1="31" x2="31" y2="37" />
          </g>
        </svg>
      );
  }
};
