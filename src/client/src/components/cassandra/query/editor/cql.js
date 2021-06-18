/* global ace */
// window.define = window.define || ace.define;
/* eslint-disable @typescript-eslint/no-var-requires  */

/* global  */
ace.define('ace/mode/cql_highlight_rules', (require, exports) => {
  // eslint-disable-line no-unused-vars
  const oop = require('../lib/oop');
  const TextHighlightRules = require('./text_highlight_rules')
    .TextHighlightRules;

  const CqlHighlightRules = function () {
    const keywords =
      'ADD|ALL|ALLOW|ALTER|AND|ANY|APPLY|AS|ASC|ASCII|AUTHORIZE|BATCH|BEGIN|BIGINT|BLOB|BOOLEAN|BY|' +
      'CLUSTERING|COLUMNFAMILY|COMPACT|CONSISTENCY|COUNT|COUNTER|CREATE|CUSTOM|DECIMAL|DELETE|DESC|' +
      'DISTINCT|DOUBLE|DROP|EACH_QUORUM|EXISTS|FILTERING|FLOAT|FROM|FROZEN|FULL|GRANT|IF|IN|INDEX|INET|' +
      'INFINITY|INSERT|INT|INTO|KEY|KEYSPACE|KEYSPACES|LEVEL|LIMIT|LIST|LOCAL_ONE|LOCAL_QUORUM|MAP|MODIFY|' +
      'NAN|NORECURSIVE|NOSUPERUSER|NOT|OF|ON|ONE|ORDER|PASSWORD|PERMISSION|PERMISSIONS|PRIMARY|QUORUM|RENAME|' +
      'REVOKE|SCHEMA|SELECT|SET|STATIC|STORAGE|SUPERUSER|TABLE|TEXT|TIMESTAMP|TIMEUUID|THREE|TO|TOKEN|TRUNCATE|' +
      'TTL|TUPLE|TWO|TYPE|UNLOGGED|UPDATE|USE|USER|USERS|USING|UUID|VALUES|VARCHAR|VARINT|WHERE|WITH|WRITETIME|' +
      'ALLOW FILTERING';

    const builtinConstants = 'true|false';

    const builtinFunctions =
      ('avg|count|first|last|max|min|sum|ucase|lcase|mid|len|round|rank|now|format|' +
        'coalesce|ifnull|isnull|nvl|',
      'TTL');

    const dataTypes =
      'int|numeric|decimal|date|varchar|char|bigint|float|double|bit|binary|text|set|timestamp|' +
      'money|real|number|integer';

    const keywordMapper = this.createKeywordMapper(
      {
        'support.function': builtinFunctions,
        keyword: keywords,
        'constant.language': builtinConstants,
        'storage.type': dataTypes,
      },
      'identifier',
      true,
    );

    const kwBeforeRe = 'SELECT';

    /**
     * Creates a group for matching column name groupings in a set of parenthesis.
     * Expects to match the contents of the parenthesis: e.g. "columnA, columnB)".
     * @param {Object}          options
     * @param {String}          options.group
     * @param {String | Array}    options.token
     * @param {String}          options.next
     */
    const createParenGroupMapper = ({ group, token, next = 'start' }) => [
      {
        token: 'text',
        regex: /(\s+)/,
      },
      {
        token: token,
        regex: /([a-zA-Z0-9_]+)/,
      },
      {
        token: ['text', 'punctuation.comma', 'text'],
        regex: /(\s*?)(,)(\s*?)/,
        next: group,
        caseInsensitive: true,
      },
      {
        token: 'paren.rparen',
        regex: /[)]/,
        next: next,
      },
      {
        token: 'empty',
        regex: /;|\s+|$/,
        next: next,
      },
    ];

    const commonRules = {
      KEYSPACE_TABLE: {
        regex: /(?:([a-zA-Z0-9_]+)|(?:(")([a-zA-Z0-9_]+)(")))(\.)(?:(?:(")([a-zA-Z0-9_]*)("))|([a-zA-Z0-9_]*))/,
        token: [
          'entity.name.keyspace',
          'text',
          'entity.name.keyspace',
          'text',
          'punctuation.operator',
          'text',
          'entity.name.table',
          'text',
          'entity.name.table',
        ],
      },
    };

    this.$rules = {
      start: [
        {
          token: 'comment',
          regex: '--.*$',
        },
        {
          token: 'comment',
          start: '/\\*',
          end: '\\*/',
        },
        {
          token: 'constant.numeric',
          regex: '[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?\\b',
        },
        {
          token: 'keyword',
          regex: /(order\s+by)\s+/,
          next: 'order_by',
        },
        {
          token: 'keyword',
          regex: /(select)/,
          caseInsensitive: true,
          next: 'select_statement',
        },
        {
          token: 'keyword',
          regex: /(update)/,
          caseInsensitive: true,
          next: 'update_statement',
        },
        {
          token: ['keyword', 'text', 'keyword'],
          regex: /(insert)(\s+)(into)/,
          caseInsensitive: true,
          next: 'insert_statement',
        },
        {
          token: commonRules.KEYSPACE_TABLE.token,
          regex: commonRules.KEYSPACE_TABLE.regex,
        },
        {
          token: 'keyword',
          regex: /(where)/,
          next: 'where_clause',
        },
        {
          token: 'select.option.allowFiltering',
          regex: /\s+(?=allow\s+filtering)/, // use positive lookahead so we can still get keyword highlighting
          caseInsensitive: true,
        },
        {
          token: ['keyword', 'text', 'select.option.limitValue'],
          regex: /(LIMIT)(\s+)(\d+)/,
        },
        {
          token: keywordMapper,
          regex: '[a-zA-Z_$][a-zA-Z0-9_$]*\\b',
        },
        {
          token: 'keyword.operator',
          regex: '\\+|\\-|\\/|\\/\\/|%|<@>|@>|<@|&|\\^|~|<|>|<=|=>|==|!=|<>|=',
        },
        {
          token: 'paren.lparen',
          regex: '[\\(]',
        },
        {
          token: 'paren.rparen',
          regex: '[\\)]',
        },
        {
          token: 'text',
          regex: '\\s+',
        },
        {
          token: 'keyword',
          regex: `(?:${kwBeforeRe})\\b`,
          next: 'start',
        },
        {
          token: 'punctuation.operator',
          regex: /[.](?![.])/,
        },
        {
          token: 'statement.terminator',
          regex: /;/,
        },
      ],

      // SELECT STATEMENT HANDLING
      select_statement: [
        {
          token: 'select.statement.wildcard',
          regex: /\s*\*\s*/,
          next: 'start',
        },
        {
          token: 'keyword',
          regex: /(distinct)/,
          caseInsensitive: true,
        },
        {
          token: 'select.statement.column',
          regex: /([a-zA-Z0-9_]+)(?!from)/,
          caseInsensitive: true,
        },
        {
          token: 'punctuation.separator',
          regex: /,[ ]+(?!from)/,
          next: 'select_statement',
        },
        {
          token: ['text', 'keyword'],
          regex: /(\s+)(from)/,
          next: 'start',
          caseInsensitive: true,
        },
      ],

      // INSERT STATEMENT HANDLING
      insert_statement: [
        {
          token: 'text',
          regex: /(\s+)/,
        },
        {
          token: commonRules.KEYSPACE_TABLE.token,
          regex: commonRules.KEYSPACE_TABLE.regex,
        },
        {
          token: 'paren.lparen',
          regex: /(\()/,
          next: 'paren_column_group',
        },
      ],

      // matches the column names in an insert statement
      // applies the 'insert.column_name' token to each column.
      // e.g. INSERT INTO ... (columnA, columnB) VALUES ...
      paren_column_group: createParenGroupMapper({
        group: 'paren_column_group',
        token: 'insert.column_name',
        next: 'values_statement',
      }),

      // identifies the values block to be inserted
      // ... VALUES (...
      values_statement: [
        {
          token: ['text', 'keyword', 'text'],
          regex: /(\s+)(VALUES)(\s+)/,
          caseInsensitive: true,
        },
        {
          token: 'paren.lparen',
          regex: /(\()((?!.*values.*)|\s+$)/,
          // regex: /(\()(?!.*values.*)/,
          caseInsensitive: true,
          next: 'insert_value_group',
        },
        {
          token: 'text',
          regex: /(\s+)/,
          next: 'start',
        },
      ],

      // matches the values in an insert statement.
      // applies the 'insert.column_value' token to each column.
      // e.g. ... (valueA, valueB) ...
      insert_value_group: createParenGroupMapper({
        group: 'insert_value_group',
        token: 'insert.column_value',
      }),

      // UPDATE STATEMENT HANDLING
      update_statement: [
        {
          token: 'text',
          regex: /\s+/,
        },
        {
          token: commonRules.KEYSPACE_TABLE.token,
          regex: commonRules.KEYSPACE_TABLE.regex,
        },
        {
          token: ['text', 'keyword', 'text', 'update.ttl'],
          regex: /(\s*)(with\s+ttl)(\s+)(\d+)/,
          caseInsensitive: true,
        },
        {
          token: ['text', 'keyword'],
          regex: /(\s*)(SET)/,
          caseInsensitive: true,
        },
        {
          token: [
            'update.statement.column_name',
            'statement.operator.equals',
            'update.statement.column_value',
          ],
          regex: /([a-zA-Z0-9_]*)(\s*=\s*)('[a-zA-Z0-9_]*'|[a-zA-Z0-9_]*)/,
          caseInsensitive: true,
        },
        {
          token: 'punctuation.separator',
          regex: /,/,
          next: 'update_statement',
        },
        {
          token: 'keyword', // TODO come back and revisit this, seems like we should be able to break out without explicitly calling 'where_clause'
          regex: /(where)/,
          next: 'where_clause',
          caseInsensitive: true,
        },
        {
          token: 'empty',
          regex: /;|\s+|$/,
          next: 'start',
        },
      ],

      // WHERE CLAUSE HANDLING
      where_clause: [
        {
          token: [
            'text',
            'where.statement.column_name',
            'statement.operator.equals',
            'where.statement.column_value',
          ],
          regex: /(\s*)([a-zA-Z0-9_]*)(\s*=\s*)('[a-zA-Z0-9_]*'|[a-zA-Z0-9_]*)/,
        },
        {
          token: ['text', 'keyword', 'text'],
          regex: /(\s+)(AND)(\s+)/,
          next: 'where_clause',
          caseInsensitive: true,
        },
        {
          token: 'empty',
          regex: /;|\s+|$/,
          next: 'start',
        },
      ],

      // ORDER BY CLAUSE
      order_by: [
        {
          token: ['text', 'order.column.name', 'text', 'order.direction'],
          regex: /(\s*)([a-zA-Z0-9_]+)(\s+)(ASC|DESC)?/,
          next: 'start',
          caseInsensitive: true,
        },
        {
          token: 'text',
          regex: /(\s+|$)/,
          next: 'start',
        },
      ],
    };
    this.normalizeRules();
  };

  oop.inherits(CqlHighlightRules, TextHighlightRules);

  exports.CqlHighlightRules = CqlHighlightRules;
});

ace.define('ace/mode/cql', (require, exports) => {
  // eslint-disable-line no-unused-vars
  const oop = require('../lib/oop');
  const TextMode = require('./text').Mode;
  const CqlHighlightRules = require('./cql_highlight_rules').CqlHighlightRules;

  const Mode = function () {
    this.HighlightRules = CqlHighlightRules;
    this.$behaviour = this.$defaultBehaviour;
  };
  oop.inherits(Mode, TextMode);

  (function () {
    this.lineCommentStart = '--';
    this.$id = 'ace/mode/cql';
  }.call(Mode.prototype));

  exports.Mode = Mode;
});

// fetch the snippets via AJAX request.
// the snippets file has a very specific format that is more easily edited as a separate file.
// fetch('/src/cassandra/elements/cassandra-query/mode-cql.snippets')
//   .then(resp => resp.text())
//   .then(resp => {
//     define('ace/snippets/cql', (require, exports) => {
//       exports.snippetText = resp;
//       exports.scope = 'cql';
//     });
//   })
//   .catch(err => {
//     console.error(err.message);
//   });
