import { ITableProperties } from '@cassandratypes/cassandra';
import { flatten, unflatten } from 'flat';
import { has, pickBy } from 'lodash';

/**
 * Helper method for merging the applicable advanced/simple settings with a
 * given ITableProperties value.
 * @returns Returns a new object containing only the respective advanced/simple props.
 */
export function mergeTableProperties(
  object: ITableProperties,
  advancedProps: ITableProperties,
  simpleProps: ITableProperties,
  useAdvanced: boolean,
): ITableProperties {
  const defaultData = flatten<ITableProperties, any>(
    useAdvanced ? advancedProps : simpleProps,
  );
  // pick out any path matches (or parent path matches)
  const includedValues = pickBy(flatten(object), (_value, propPath) =>
    propPath
      .split('.')
      .reduce((prev, curr, index) => {
        if (prev.length === 0) {
          prev.push(curr);
        } else {
          prev.push(`${prev[index - 1]}.${curr}`);
        }
        return prev;
      }, new Array<string>())
      .some((segment) => has(defaultData, segment)),
  );
  const result = { ...defaultData, ...includedValues };
  return unflatten(result);
}

const defaultProperties: ITableProperties = {
  comment: '',
  compaction: {} as any,
  compression: {
    class: 'LZ4Compressor',
    chunk_length_kb: 16,
  },
  speculativeRetry: '99percentile',
  defaultTtl: 0,
};

export function getDefaultTableProperties(): ITableProperties {
  return JSON.parse(JSON.stringify(defaultProperties));
}
