/* global ace */
ace.define('ace/snippets/cql', ['require', 'exports', 'module'], function (
  _require,
  exports,
) {
  'use strict';

  // prettier-ignore
  exports.snippetText = '# INSERT\n\
snippet INSERT\n\
\tINSERT INTO ${1:keyspace}.${2:table} (${3:columns}) VALUES(${4:values});\n\
\n\
# INSERT with TTL\n\
snippet INSERT(with TTL) \n\
\tINSERT INTO ${1:keyspace}.${2:table} (${3:columns}) VALUES(${4:values}) USING TTL ${5:seconds}; \n\
\n\
# SELECT(simple) \n\
snippet SELECT *\n\
select ${ 0:*} from ${1:keyspace}.${2:table} \n\
\n\
# SELECT(all options) \n\
snippet SELECT(with options) \n\
\tSELECT ${1:expression} \n\
\tFROM ${2:keyspace_name}.${3:table_name} \n\
\tWHERE ${4:relation} AND ${5:relation} ...\n\
\tORDER BY(clustering_column  ASC | DESC ...) \n\
\tLIMIT n\n\
\tALLOW FILTERING\n\
\n\
# UPDATE\n\
snippet UPDATE\n\
\tUPDATE ${1:keyspace_name}.${2:table_name} SET ${3:column1}=${4:value1}, ${5:column2}=${6:value2} \n\
\tWHERE ${7:partition_key}=${8:partition_value} \n\
\n\
# UPDATE with TTL\n\
snippet UPDATE(with TTL) \n\
\tUPDATE ${1:keyspace_name}.${2:table_name} WITH TTL ${3:expiration_in_seconds} SET ${4:column1}=${5:value1}, ${6:column2}=${7:value2} \n\
\tWHERE ${8:partition_key}=${9:partition_value} \n\
\n\
# WHERE clause\n\
snippet WHERE clause\n\
\tWHERE ${1:column_name}=${2:column_value}\n\
\n\
';
  exports.scope = 'cql';
});
(function () {
  ace.require(['ace/snippets/cql'], function (m) {
    if (typeof module == 'object' && typeof exports == 'object' && module) {
      module.exports = m;
    }
  });
})();
