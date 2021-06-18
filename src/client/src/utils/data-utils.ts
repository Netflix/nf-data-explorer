import { groupBy, mapValues } from 'lodash';

export function nest(
  items: any[],
  keys: Array<string | ((obj: any) => string)>,
) {
  if (!keys.length) {
    return items;
  }
  const [first, ...rest] = keys;
  return mapValues(groupBy(items, first as string), (value) =>
    nest(value, rest),
  );
}
