interface ICollectionFormatter {
  [type: string]: {
    re: RegExp;
    startWith: string;
    endWith: string;
    format: (
      quoteKey: boolean,
      key: any,
      quoteValue?: boolean,
      value?: any,
    ) => string;
  };
}

const collectionMap: ICollectionFormatter = {
  list: {
    re: /^list<(.*)>$/,
    startWith: '[',
    endWith: ']',
    format: (quoteKey, key) => (quoteKey ? `'${key}'` : key),
  },
  map: {
    re: /^map<(.*),\s*(.*)>$/,
    startWith: '{',
    endWith: '}',
    format: (quoteKey, key, quoteValue, value) =>
      `${quoteKey ? `'${key}'` : key}: ${quoteValue ? `'${value}'` : value}`,
  },
  set: {
    re: /^set<(.*)>$/,
    startWith: '{',
    endWith: '}',
    format: (quoteKey: boolean, key: any) => (quoteKey ? `'${key}'` : key),
  },
};

export const collectionTypes = new Set(Object.keys(collectionMap));

/**
 * Tests a column type to see if it is a collection type.
 * @param columnType The type of this column (e.g. 'bigint', 'map<int, varchar>').
 */
export function isCollectionType(columnType: string): boolean {
  return Object.values(collectionMap).some(({ re }) => re.test(columnType));
}

/**
 * Helper method for returning a string representation of a collection.
 * @param columnType The C* data type (e.g. 'list<varchar>', 'map<int, varchar>', etc.).
 * @param rowValue The value returned by the driver for the column.
 */
export function getCollectionRowValueAsString(
  columnType: string,
  rowValue: any,
): string {
  if (!rowValue) {
    return '';
  }
  const needsQuotes = ['ascii', 'text', 'varchar'];
  for (const [collectionType, config] of Object.entries(collectionMap)) {
    if (columnType.includes(collectionType)) {
      const { re, format, startWith, endWith } = config;
      const matches = re.exec(columnType);
      if (matches) {
        const [, keyType, valueType] = matches;
        needsQuotes.includes(keyType);

        const quoteKey = needsQuotes.includes(keyType);
        let content: string;
        if (valueType) {
          const quoteValue = !!valueType && needsQuotes.includes(valueType);
          content = Object.entries(rowValue)
            .map(([key, value]) => format(quoteKey, key, quoteValue, value))
            .join(', ');
        } else {
          content = rowValue
            .map((value: any) => format(quoteKey, value))
            .join(', ');
        }
        return `${startWith} ${content} ${endWith}`;
      }
    }
  }
  return rowValue;
}
