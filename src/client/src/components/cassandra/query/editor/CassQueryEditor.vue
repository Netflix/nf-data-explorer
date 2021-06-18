<template>
  <div class="cass-query-editor layout vertical">
    <div class="toolbar layout horizontal justified center padded">
      <h3>Query</h3>

      <el-button type="primary" :disabled="isSchemaLoading" @click="refresh">
        <font-awesome-icon :icon="faSyncAlt"></font-awesome-icon> Refresh Schema
      </el-button>
    </div>

    <div
      ref="editor"
      class="border__top border__bottom"
      style="height: 400px;"
    ></div>

    <div v-if="queryErrors.length > 0" class="padded">
      <cass-query-validation-message
        :error="queryErrors[0]"
        class="bordered"
        @show-help="$emit('show-help', $event.error)"
      ></cass-query-validation-message>
    </div>
    <div
      v-else-if="isSchemaLoading"
      class="layout horizontal center padded spacer"
      :class="$style.messages"
    >
      <font-awesome-icon :icon="faLightbulb"></font-awesome-icon>
      <div :class="$style['message-text']">
        Schema information is loading. Stand by for code assist...
      </div>
    </div>
    <div
      v-else
      class="layout horizontal center padded spacer"
      :class="$style.messages"
    >
      <font-awesome-icon :icon="faLightbulb"></font-awesome-icon>
      <div :class="$style['message-text']">
        Try using Ctrl + Space for code assist
      </div>
    </div>

    <div class="toolbar layout horizontal padded">
      <el-tooltip
        :content="'Execute command (' + metaKey + ' + Enter)'"
        placement="right"
      >
        <el-button
          type="primary"
          :disabled="query.length === 0"
          @click="execute"
        >
          <font-awesome-icon :icon="faBolt"></font-awesome-icon> Execute
        </el-button>
      </el-tooltip>

      <el-form class="ml-4 mt-4" inline>
        <el-form-item label="Blob Encoding">
          <cass-encoding-dropdown
            v-model="retrievalOptions.encoding"
            style="width: 100px;"
            required
          ></cass-encoding-dropdown>
        </el-form-item>

        <el-checkbox
          v-model="retrievalOptions.decodeValues"
          label="Also decode value columns"
          :disabled="!retrievalOptions.encoding"
          class="mt-2"
        ></el-checkbox>

        <el-tooltip placement="right">
          <div slot="content" style="max-width: 300px;">
            By default, only blobs used in the primary key will be deserialized
            and decoded. Use caution when decoding large blob values as this may
            put additional pressure on your cluster.
          </div>
          <font-awesome-icon
            :icon="faInfoCircle"
            :class="$style.infoIcon"
            class="ml-2"
          ></font-awesome-icon>
        </el-tooltip>
      </el-form>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Button, Checkbox, Form, FormItem, Tooltip } from 'element-ui';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faBolt,
  faInfoCircle,
  faSyncAlt,
} from '@fortawesome/free-solid-svg-icons';
import { faLightbulb } from '@fortawesome/free-regular-svg-icons';
import ClusterSchema from '@/models/cassandra/ClusterSchema';
import QueryCompleter from './CassQueryCompleter';
import QueryTokenizer from './CassQueryTokenizer';
import QueryValidator, { ValidationError } from './CassQueryValidator';
import store from '@/store';
import { ActionTypes } from '@/store/actions';
import ace from 'ace-builds';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/ext-language_tools';
import cqlMode from './cql.js';
import cqlSnippets from './cql-snippets';
ace.config.loadModule('ace/snippets', () => {
  /* no-op */
});
ace.config.loadModule('ace/ext/language_tools', () => {
  /* no-op */
});
ace.config.setModuleUrl('ace/mode/cql', cqlMode as any);
ace.config.setModuleUrl('ace/snippets/cql', cqlSnippets as any);
import debounce from 'lodash.debounce';
import CassQueryValidationMessage from './CassQueryValidationMessage.vue';
import CassEncodingDropdown from '@/components/cassandra/CassEncodingDropdown.vue';

export default Vue.extend({
  name: 'CassQueryEditor',
  components: {
    [Button.name]: Button,
    [Checkbox.name]: Checkbox,
    [Form.name]: Form,
    [FormItem.name]: FormItem,
    [Tooltip.name]: Tooltip,
    CassEncodingDropdown,
    CassQueryValidationMessage,
    FontAwesomeIcon,
  },
  props: {
    value: {
      type: String,
      required: true,
    },
    retrievalOptions: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      editor: undefined as any,
      queryTokenizer: undefined as QueryTokenizer | undefined,
      queryCompleter: undefined as QueryCompleter | undefined,
      queryValidator: undefined as QueryValidator | undefined,
      faBolt,
      faInfoCircle,
      faLightbulb,
      faSyncAlt,
      query: this.value,
      queryErrors: new Array<ValidationError>(),
    };
  },
  computed: {
    currentCluster(): string {
      return store.state.config.currentCluster as string;
    },
    schema(): ClusterSchema | undefined {
      const schema = store.state.cassandra.cluster.schema;
      return schema.length > 0 ? new ClusterSchema(schema) : undefined;
    },
    metaKey(): string {
      return navigator.appVersion.indexOf('Mac') !== -1 ? 'Cmd' : 'Ctrl';
    },
    isSchemaLoading(): boolean {
      return store.state.cassandra.cluster.schemaLoading;
    },
  },
  watch: {
    value(newValue: string) {
      this.query = newValue;
      if (newValue !== this.editor.getSession().getValue()) {
        this.editor.getSession().setValue(this.query);
      }
    },
    schema: {
      immediate: true,
      handler(
        newSchema: ClusterSchema | undefined,
        oldSchema: ClusterSchema | undefined,
      ) {
        if (!newSchema) return;
        if (this.queryCompleter) {
          if (this.queryCompleter) {
            this.queryCompleter.updateSchema(newSchema);
          }
          if (this.queryValidator) {
            this.queryValidator.updateSchema(newSchema);
          }
        }
        // on first initialization, we need to parse the query to validate it
        // and fire the appropriate update events
        if (oldSchema === undefined && newSchema !== undefined) {
          this.processQuery(this.query);
        }
      },
    },
  },
  created() {
    this.validateQuery = debounce(this.validateQuery, 300);
  },
  mounted() {
    this.editor = ace.edit((this.$refs as any).editor, {
      maxLines: 50,
      minLines: 10,
      value: this.query,
      mode: 'ace/mode/cql',
      showPrintMargin: false,
    });

    this.editor.setOptions({
      enableBasicAutocompletion: true,
      wrap: true,
    });
    this.editor.commands.addCommand({
      name: 'submitQuery',
      bindKey: {
        win: 'Ctrl-s',
        mac: 'Command-enter',
      },
      exec: this.execute,
    });

    const snippets = ace.require('ace/snippets');
    if (!snippets) {
      /* eslint-disable-next-line no-console */
      console.warn('unable to load snippets');
    }
    const snippetManager = snippets.snippetManager;

    ace.config.loadModule('ace/snippets/cql', (cqlModule) => {
      if (cqlModule) {
        const snippets = snippetManager.parseSnippetFile(cqlModule.snippetText);
        snippetManager.register(snippets || [], cqlModule.scope);
      }
    });

    // configure the list of completers (note: order is important here).
    // we also exclude the local text completer which is normally included by default
    const langTools = ace.require('ace/ext/language_tools');
    const lang = ace.require('ace/lib/lang');

    this.queryTokenizer = new QueryTokenizer(this.editor);
    this.queryCompleter = new QueryCompleter(this.queryTokenizer, undefined);
    this.queryValidator = new QueryValidator(this.queryTokenizer, undefined);

    // TODO unfortunately the default snippet completer doesn't provide a hook to pass a `className` property
    // so we have to patch the WHOLE snippetCompleter to add one property. SAD.
    const snippetCompleter = {
      getCompletions(editor, _session, _pos, _prefix, callback) {
        const snippetMap = snippetManager.snippetMap;
        const completions = [] as any[];
        snippetManager.getActiveScopes(editor).forEach((scope) => {
          const snippets = snippetMap[scope] || [];
          for (let i = snippets.length; i--; ) {
            const s = snippets[i];
            const caption = s.name || s.tabTrigger;
            if (!caption) continue;
            completions.push({
              caption: caption,
              snippet: s.content,
              meta:
                s.tabTrigger && !s.name ? `${s.tabTrigger}\u21E5 ` : 'snippet',
              type: 'snippet',
              className: 'snippetIcon',
            });
          }
        }, this);
        callback(null, completions.reverse());
      },
      getDocTooltip(item) {
        if (item.type === 'snippet' && !item.docHTML) {
          item.docHTML = [
            '<b>',
            lang.escapeHTML(item.caption),
            '</b>',
            '<hr></hr>',
            lang.escapeHTML(item.snippet),
          ].join('');
        }
      },
    };
    langTools.setCompleters([
      snippetCompleter,
      this.queryCompleter.getCompleter(),
    ]);

    this.editor.on('change', this.onEditorChanged.bind(this));
    this.editor.commands.on('afterExec', this.onAfterExec.bind(this));

    const selection = this.editor.session.getSelection();
    selection.on('changeCursor', this.onChangeCursor.bind(this));
    selection.on('changeSelection', this.onChangeSelection.bind(this));
  },
  methods: {
    onAfterExec(e) {
      if (e.command.name !== 'insertstring') return;
      const char = e.args;
      if (char === '.' || char === '(') {
        this.editor.execCommand('startAutocomplete');
      }
    },
    onEditorChanged() {
      const value = this.editor.getSession().getValue();
      this.$emit('input', value);
      this.processQuery(value);
    },
    processQuery(value: string) {
      let keyspace;
      let table;
      if (this.queryTokenizer && this.schema) {
        const userKeyspace = this.queryTokenizer.getKeyspace();
        const userTable = this.queryTokenizer.getTable();

        if (userKeyspace && userTable) {
          keyspace = this.schema.hasKeyspace(userKeyspace)
            ? userKeyspace
            : undefined;
          table = this.schema.hasTable(userKeyspace, userTable)
            ? userTable
            : undefined;

          if (keyspace && table) {
            this.$emit('change-schema', { keyspace, table });
          } else {
            this.$emit('schema-not-found', {
              keyspace: userKeyspace,
              table: userTable,
            });
          }
        }
      }

      this.$emit('update', {
        query: value,
        keyspace,
        table,
      });

      this.validateQuery();
    },
    validateQuery() {
      if (this.queryValidator) {
        this.queryErrors = this.queryValidator.validate();
      } else {
        this.queryErrors = [];
      }
    },
    refresh() {
      this.$store.dispatch(ActionTypes.FetchSchema, {
        cluster: this.currentCluster,
      });
    },
    execute() {
      if (this.query.length === 0) return;
      this.$emit('execute', {
        query: this.query,
        options: this.retrievalOptions,
      });
    },
    onChangeCursor() {
      const { row, column } = this.editor.getCursorPosition();
      const token = this.editor.session.getTokenAt(row, column);
      const currentToken = JSON.stringify(token, null, '\t');
      if (process.env.NODE_ENV !== 'production') {
        /* eslint-disable-next-line no-console */
        console.log(currentToken);
      }
    },
    onChangeSelection() {
      const { row, column } = this.editor.getCursorPosition();
      const currentToken = this.editor.session.getTokenAt(row, column + 1);
      if (currentToken) {
        if (currentToken.type === 'where.statement.column_name') {
          this.editor.execCommand('startAutocomplete');
        }
      }
    },
  },
});
</script>
<style module>
.title {
  font-size: 16px;
}

.editor {
  border-bottom: 1px solid var(--color-border);
  border-top: 1px solid var(--color-border);
}

.messages {
  border: 1px solid var(--color-border);
}

.message-text {
  margin-left: var(--spacer-standard);
}

.infoIcon {
  color: var(--neutral-700);
  font-size: 16px;
}
</style>
