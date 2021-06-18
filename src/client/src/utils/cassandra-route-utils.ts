import {
  IKeyQuery,
  ITableSchema,
  IKeyQueryOptions,
} from '@cassandratypes/cassandra';
import { Dictionary } from 'vue-router/types/router';
import { getPrimaryKeyColumns } from './cassandra-utils';

const UI_OPTION_QUERY_PARAM_PREFIX = 'ui.option.';
const ENCODING_SUFFIX = 'ui.encoding';

export function buildKeyFromRoute(
  schema: ITableSchema,
  routeQuery: Dictionary<string | boolean | (string | null)[]>,
): IKeyQuery {
  // primary key filter
  const keyNames = Array.from(getPrimaryKeyColumns(schema));
  const primaryKey = keyNames.reduce((keyQuery, name) => {
    const value = routeQuery[name];
    const encoding =
      value === undefined
        ? undefined
        : (routeQuery[`${name}.${ENCODING_SUFFIX}`] as string | undefined);
    keyQuery[name] = {
      value,
      options: {
        encoding,
      },
    };
    return keyQuery;
  }, {});

  // optional params
  type Foo = keyof IKeyQueryOptions;
  /* eslint-disable @typescript-eslint/ban-types */
  const optionParamNamesMap: {
    [key in Foo]: object;
  } = {
    encoding: String,
    decodeValues: Boolean,
  };
  const optionParamNameSet = new Set<string>(Object.keys(optionParamNamesMap));

  const options = Object.entries(routeQuery).reduce(
    (keyOptions, [queryParam, value]) => {
      const optionName = queryParam.replace(UI_OPTION_QUERY_PARAM_PREFIX, '');
      if (optionParamNameSet.has(optionName)) {
        const optionType = optionParamNamesMap[optionName];
        if (optionType === Boolean) {
          keyOptions[optionName] = value === true || value === 'true';
        } else {
          keyOptions[optionName] = value;
        }
      }
      return keyOptions;
    },
    {
      encoding: 'hex',
      decodeValues: false,
    } as IKeyQueryOptions,
  );

  return { primaryKey, options };
}

export function buildQueryFromKey(
  filter: IKeyQuery,
  routeQuery: Dictionary<string | (string | null)[]>,
): Dictionary<string | (string | null)[]> {
  const query = { ...routeQuery };

  // primary key
  for (const [key, details] of Object.entries(filter.primaryKey)) {
    const { options, value } = details;
    const { encoding } = options;
    if (value === undefined || value === '') {
      delete query[key];
      if (query[`${key}.${ENCODING_SUFFIX}`]) {
        delete query[`${key}.${ENCODING_SUFFIX}`];
      }
    } else {
      (query[key] as any) = value;
      if (encoding) {
        query[`${key}.${ENCODING_SUFFIX}`] = encoding;
      }
    }
  }

  // optional params
  for (const [optionName, optionValue] of Object.entries(filter.options)) {
    if (optionValue === undefined) {
      delete query[`${UI_OPTION_QUERY_PARAM_PREFIX}${optionName}`];
    } else {
      query[`${UI_OPTION_QUERY_PARAM_PREFIX}${optionName}`] = optionValue;
    }
  }
  return query;
}
