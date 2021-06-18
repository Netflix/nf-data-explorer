import { Dictionary, groupBy, keyBy } from 'lodash';

export function groupByProp<T>(items: T[], prop: keyof T): Dictionary<T[]> {
  return groupBy(items, prop);
}

export function keyByProp<T>(items: T[], prop: keyof T): Dictionary<T> {
  return keyBy(items, prop);
}
