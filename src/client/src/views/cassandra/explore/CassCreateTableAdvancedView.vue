<template>
  <div class="cass-create-table-advanced-view layout vertical">
    <div class="flex layout vertical padded">
      <strong class="spacer__bottom">Advanced Mode</strong>
      <div class="spacer__bottom">
        This advanced mode is intended use by power users that already have a
        CREATE TABLE CQL statement to execute. Limited assistance is provided in
        this mode.
      </div>

      <cass-create-table-statement-preview
        v-model="createStatement"
        v-loading="keyspacesLoading || creationInProgress"
        class="flex"
        :element-loading-text="
          keyspacesLoading ? 'Loading...' : 'Creating new table...'
        "
      ></cass-create-table-statement-preview>

      <div v-if="validationErrors.length > 0" class="padded__vertical">
        <el-alert class="bordered" type="warning" title="Warning" show-icon>
          <div>{{ validationErrors[0] }}</div>
        </el-alert>
      </div>

      <div v-if="serverError" class="padded__vertical">
        <el-alert
          class="bordered"
          type="error"
          :title="serverError.title"
          show-icon
        >
          <div>{{ serverError.remediation || serverError.message }}</div>
        </el-alert>
      </div>
    </div>

    <!-- toolbar -->
    <div class="toolbar layout horizontal justified border__top">
      <el-button type="text" @click="changeMode()">
        <font-awesome-icon :icon="faUndo" fixed-width /> Return to Simple
        Mode</el-button
      >
      <div>
        <el-button @click="onCancel()">Cancel</el-button>
        <span :class="$style['button-separator']">|</span>
        <el-button
          type="primary"
          :disabled="creationInProgress"
          @click="onFinish"
          >Finish</el-button
        >
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faUndo } from '@fortawesome/free-solid-svg-icons';
import { Alert, Button, Form, FormItem } from 'element-ui';
import { Routes } from '@/router/routes';
import CassCreateTableStatementPreview from '@/components/cassandra/create-table/CassCreateTableStatementPreview.vue';
import { confirmPrompt } from '@/utils/message-utils';
import { NotificationType } from '@/typings/notifications';
import { IKeyspace, IClusterSchemaColumn } from '@cassandratypes/cassandra';
import store from '@/store';
import schema, { Rules } from 'async-validator';
import debounce from 'lodash.debounce';
import { parseCreateStatement } from '@/utils/cassandra-utils';
import { createTableAdvanced } from '@/services/cassandra/CassService';
import { ActionTypes } from '@/store/actions';

function defaultCreateStatement(keyspaceName: string) {
  return `CREATE TABLE ${keyspaceName || 'keyspace'}.new_table (
  column_1 bigint,
  column_2 varchar,
  column_3 varchar,
  PRIMARY KEY (column_1, column_2)
)
WITH comment = 'This is a new table with a primary key consisting of a partition key and a single clustering column.'`;
}

export default Vue.extend({
  name: 'CassCreateTableAdvancedView',
  components: {
    [Alert.name]: Alert,
    [Button.name]: Button,
    [Form.name]: Form,
    [FormItem.name]: FormItem,
    CassCreateTableStatementPreview,
    FontAwesomeIcon,
  },
  props: {
    clusterName: {
      type: String,
      required: true,
    },
    keyspaceName: {
      type: String,
      required: true,
    },
    statement: {
      type: String,
    },
  },
  data() {
    const { keyspaceName } = this.$route.params;
    return {
      faUndo,
      creationInProgress: false,
      serverError: undefined as string | undefined,
      validationErrors: new Array<string>(),
      createStatement: this.statement || defaultCreateStatement(keyspaceName),
    };
  },
  computed: {
    keyspacesLoading(): boolean {
      return store.state.cassandra.cluster.keyspacesLoading;
    },
    keyspaces(): IKeyspace[] {
      return store.state.cassandra.cluster.keyspaces;
    },
    schema(): IClusterSchemaColumn[] {
      return store.state.cassandra.cluster.schema;
    },
    rules(): Rules {
      const keyspaceTableValidator = (_rule, value: string) => {
        const { keyspaceName, tableName } = parseCreateStatement(value);
        if (!keyspaceName || !tableName) {
          return new Error(
            'Statement must include a fully qualified keyspace and table (e.g. my_keyspace.my_table)',
          );
        }

        // ensure keyspace exists
        if (keyspaceName) {
          const keyspace = this.keyspaces.find(
            ({ name }) => name.toLowerCase() === keyspaceName.toLowerCase(),
          );
          if (!keyspace) {
            return new Error('Keyspace does not exist');
          }
        }

        // ensure table doesn't already exist
        if (keyspaceName && tableName) {
          if (
            this.schema.find(
              ({ keyspace, table }) =>
                keyspace.toLowerCase() === keyspaceName.toLowerCase() &&
                table.toLowerCase() === tableName.toLowerCase(),
            )
          ) {
            return new Error(`A table already exists named ${tableName}`);
          }
        }
        return true;
      };

      return {
        statement: [
          { required: true, message: 'Create table statement is required' },
          { validator: keyspaceTableValidator },
        ],
      };
    },
  },
  watch: {
    createStatement(value: string) {
      this.$router.replace({
        name: this.$route.name as string,
        params: this.$route.params,
        query: {
          statement: value,
        },
      });
      this.validateStatement(value);
    },
  },
  created() {
    this.validateStatement = debounce(this.validateStatement, 300);
    this.$store.dispatch(ActionTypes.FetchSchema, {
      cluster: this.clusterName,
    });
  },
  methods: {
    async validateStatement(statement: string): Promise<boolean> {
      const validator = new schema(this.rules);
      try {
        await validator.validate({ statement });
        this.validationErrors = [];
        return true;
      } catch (err) {
        const { errors } = err;
        if (errors || errors.length > 0) {
          this.validationErrors = errors ? errors.map((e) => e.message) : [];
        }
        return false;
      }
    },
    async changeMode() {
      if (
        await confirmPrompt(
          'Discard changes?',
          'Returning to Simple Mode will discard your current create statement and you will have to start over.',
          'Discard and go Simple',
          'No',
          NotificationType.Warning,
          {
            closeOnHashChange: false,
            closeOnClickModal: false,
          },
        )
      ) {
        this.$router.push({
          name: Routes.CassandraTableCreate,
        });
      }
    },
    async onFinish() {
      if (await this.validateStatement(this.createStatement)) {
        const { keyspaceName, tableName } = parseCreateStatement(
          this.createStatement,
        );
        if (keyspaceName && tableName) {
          try {
            this.creationInProgress = true;
            await createTableAdvanced(
              this.clusterName,
              keyspaceName,
              tableName,
              this.createStatement,
            );
            this.$router.push({
              name: Routes.CassandraTableData,
              params: { keyspaceName, tableName },
            });
          } catch (err) {
            this.serverError = err;
          } finally {
            this.creationInProgress = false;
          }
        }
      }
    },
    onCancel() {
      this.$router.push({
        name: Routes.CassandraKeyspaceTables,
        params: {
          keyspaceName: this.keyspaceName,
        },
      });
    },
  },
});
</script>
<style module>
.button-separator {
  color: var(--color-text-subdued);
  margin: 0 var(--spacer-standard);
}
</style>
