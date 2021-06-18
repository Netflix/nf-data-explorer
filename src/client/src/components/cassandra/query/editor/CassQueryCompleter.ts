import ClusterSchema, { IColumnDef } from '@/models/cassandra/ClusterSchema';
import QueryTokenizer from './CassQueryTokenizer';

const uppercaseRegex = new RegExp(/[A-Z]+/);
const quotedRegex = new RegExp(/^"(.*)"$/);

interface ISuggestion {
  name: string;
  value: string;
  score: number;
  meta: any;
  icon: string;
  className: string;
}

export default class QueryCompleter {
  private schema: ClusterSchema | undefined;

  constructor(
    readonly queryTokenizer: QueryTokenizer,
    clusterSchema: ClusterSchema | undefined,
  ) {
    this.schema = clusterSchema;
  }

  public updateSchema(schema: ClusterSchema | undefined): void {
    this.schema = schema;
  }

  public getCompleter(): {
    getCompletions(editor, _session, pos, _prefix, callback): void;
  } {
    /* eslint-disable @typescript-eslint/no-this-alias */
    const self = this;
    const queryTokenizer = this.queryTokenizer;
    return {
      getCompletions(editor, _session, pos, _prefix, callback) {
        const { row, column } = pos;
        const allPriorTokens = queryTokenizer.getTokensUpToRow(row);
        const keyspaceName = queryTokenizer.getKeyspace();
        const tableName = queryTokenizer.getTable();

        let currentToken = editor.session.getTokenAt(row, column);
        if (
          currentToken &&
          (currentToken.type === 'text' || currentToken.type === 'empty')
        ) {
          currentToken = self.queryTokenizer.getPreviousNonTextToken(
            allPriorTokens,
            currentToken,
          );
        }

        let suggestions = new Array<ISuggestion>();
        if (currentToken) {
          switch (currentToken.type) {
            case 'statement.terminator':
              suggestions = [];
              break;
            case 'paren.lparen': {
              const previousToken = self.queryTokenizer.getPreviousNonTextToken(
                allPriorTokens,
                currentToken,
              );
              if (
                previousToken &&
                previousToken.value.toLowerCase() === 'values'
              ) {
                suggestions = []; // user is expected to enter freeform values
              } else {
                suggestions = self.getColumnSuggestions(
                  keyspaceName,
                  tableName,
                );
              }
              break;
            }
            case 'punctuation.comma':
            case 'punctuation.separator':
              suggestions = self.getColumnSuggestions(keyspaceName, tableName);
              break;
            case 'identifier': {
              const previousToken = self.queryTokenizer.getPreviousNonTextToken(
                allPriorTokens,
                currentToken,
              );
              if (
                previousToken &&
                previousToken.type === 'keyword' &&
                keyspaceName &&
                tableName
              ) {
                suggestions = self.getSuggestionsForKeyword(
                  keyspaceName,
                  tableName,
                  allPriorTokens,
                  previousToken,
                );
              } else {
                suggestions = self.getKeyspaceSuggestions();
              }
              break;
            }
            case 'entity.name.table': {
              if (
                keyspaceName &&
                tableName &&
                self.schema &&
                self.schema.hasTable(keyspaceName, tableName)
              ) {
                // show the next suggestions based on the current action
                suggestions = self.getCurrentActionOptionSuggestions();
              } else {
                // otherwise it's a partial match, in which case, get the list of tables for the
                // keyspace and use the default filtering provided by the autocomplete.
                suggestions = self.getTableSuggestions(keyspaceName);
              }
              break;
            }
            case 'entity.name.keyspace':
              suggestions = self.getKeyspaceSuggestions();
              break;
            case 'statement.operator.equals':
              // no-op
              break;
            case 'punctuation.operator': // '.' character
            case 'where.statement.column_name':
            case 'select.statement.column':
              suggestions = self.getTableSuggestions(keyspaceName);
              break;
            case 'where.statement.column_value':
              suggestions = self.getCurrentActionOptionSuggestions();
              break;
            case 'keyword':
              suggestions = self.getSuggestionsForKeyword(
                keyspaceName,
                tableName,
                allPriorTokens,
                currentToken,
              );
              break;
            default:
          }
        } else {
          const containsActionToken = self.queryTokenizer.containsActionToken();
          // if there's no action token (e.g. SELECT), but there is a keyspace, the user might be changing keywords, so give them the list
          if (!containsActionToken && keyspaceName) {
            suggestions = self.getActionSuggestions([
              'SELECT',
              'INSERT',
              'UPDATE',
            ]);
          }
        }
        callback(null, suggestions);
      },
    };
  }

  /**
   * Helper that returns a quoted representation of an entity name if necessary.
   * Keyspace, table, and column names are all case sensitive. If they contain mixed case,
   * C* requires that they be wrapped in double-quotes.
   * @param   name   The name of the entity.
   * @returns Returns the name wrapped in double-quotes if necessary.
   * @private
   */
  private quoteName(name: string): string {
    if (quotedRegex.test(name)) {
      return name;
    }
    if (uppercaseRegex.test(name)) {
      return `"${name}"`;
    }
    return name;
  }

  private getKeyspaceSuggestions() {
    if (!this.schema) {
      return [];
    }
    const keyspaceNames = this.schema.getKeyspaceNames().map(this.quoteName);
    return this.getSuggestions(keyspaceNames, 'keyspace');
  }

  private getColumnSuggestions(keyspaceName, tableName): ISuggestion[] {
    if (!this.schema) {
      return [];
    }
    const columns = this.schema.getColumns(keyspaceName, tableName);
    const columnMap = columns.reduce(
      (prev, curr) => prev.set(this.quoteName(curr.name), curr),
      new Map<string, IColumnDef>(),
    );

    const columnNames = Array.from(columnMap.keys());
    return this.getSuggestions(columnNames, (columnName) => {
      const column = columnMap.get(columnName) as any;
      if (column.isPartitionKey) {
        return 'partition key';
      } else if (column.isClusteringColumn) {
        return 'clustering column';
      }
      return 'column';
    });
  }

  private getTableSuggestions(keyspaceName) {
    if (!this.schema) {
      return [];
    }
    const tableNames = this.schema
      .getTableNames(keyspaceName)
      .map(this.quoteName);
    return this.getSuggestions(tableNames, 'table');
  }

  private getActionSuggestions(actions) {
    return this.getSuggestions(actions, 'action');
  }

  /**
   * Attempts to get the list of suggested options for the current action (e.g. SELECT/INSERT).
   * @returns {Array.<Object>} Returns the suggestion objects.
   */
  private getCurrentActionOptionSuggestions() {
    const actionToken = this.queryTokenizer.getActionToken();
    if (!actionToken) {
      return [];
    }
    const actionOptions = this.queryTokenizer.getOptionsForKeyword(
      actionToken.value,
    );
    return this.getSuggestions(actionOptions, 'option');
  }

  /**
   * Helper method for building a list of suggestions to be displayed by the completer.
   * @param   items       The items to display to the user.
   * @param   {String|Function}       meta        The meta tag for each item. If the meta tag is dynamic,
   *                                              a function can be passed which will be passed a single parameter `name`.
   * @param   [options]   Map of additional options.
   */
  private getSuggestions(
    items: string[],
    meta: string | ((name: string) => string),
    options = {} as any,
  ): ISuggestion[] {
    return items.map((item, index) => {
      const metaValue = typeof meta === 'string' ? meta : meta(item);
      const className = `${metaValue.replace(/\s+/, '_')}Icon`;
      return {
        name: `${item}`,
        value: `${item}`,
        score: options.score || items.length - index,
        meta: metaValue,
        icon: 'property',
        className,
      };
      // docText: 'some wicked doc text',
    });
  }

  private getSuggestionsForKeyword(
    keyspaceName: string | null,
    tableName: string | null,
    previousTokens,
    token,
  ): ISuggestion[] {
    if (!token) {
      return [];
    }
    let suggestions = new Array<ISuggestion>();
    switch (token.value.toLowerCase()) {
      case 'update':
      case 'from':
      case 'into':
        suggestions = this.getKeyspaceSuggestions();
        break;
      case 'set':
      case 'where':
      case 'and':
        suggestions = this.getColumnSuggestions(keyspaceName, tableName);
        break;
      case 'select': {
        // create suggestions for the columns and an additional wildcard option
        suggestions = new Array<ISuggestion>().concat(
          this.getColumnSuggestions(keyspaceName, tableName),
          this.getSuggestions(['*'], 'column'),
        );

        // fix up the score order
        suggestions.forEach(
          (item: any, index) => (item.score = suggestions.length - index),
        );
        break;
      }
      default: {
        // if we have an unknown keyword, try a previous keyword
        const previousToken = this.queryTokenizer.getPreviousToken(
          previousTokens,
          token,
        );
        if (previousToken && previousToken.type === 'keyword') {
          suggestions = this.getSuggestionsForKeyword(
            keyspaceName,
            tableName,
            previousTokens,
            previousToken,
          );
        }
        break;
      }
    }
    return suggestions;
  }
}
