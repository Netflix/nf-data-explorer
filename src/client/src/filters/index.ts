export { capitalize } from 'lodash';
import numeral from 'numeral';
import { formatDistance } from 'date-fns';

export function formatNumber(
  value: number | undefined,
  format?: string,
): string {
  if (value === undefined || value === null) {
    return 'N/A';
  }
  return numeral(value).format(format);
}

export function formatBytes(value: number | undefined): string {
  return formatNumber(value, '0,0.0b');
}

export function formatHuman(value: number | undefined): string {
  return formatNumber(value, '0,0a');
}

export function dateTimeFilter(dateValue: Date): string {
  if (!dateValue) {
    return '';
  }
  return dateValue.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  });
}

export function dateTimeDistanceFilter(dateValue: Date): string {
  return formatDistance(dateValue, Date.now(), { addSuffix: true });
}

export function dateTimeAndDistanceFilter(dateValue: Date): string {
  return `${dateTimeFilter(dateValue)} (${dateTimeDistanceFilter(dateValue)})`;
}
