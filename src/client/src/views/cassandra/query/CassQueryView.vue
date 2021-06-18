<template>
  <div class="cassandra-query-view layout horizontal full-height">
    <cass-query-nav-menu
      :cluster-name="clusterName"
      :value="selectedNavView"
      class="full-height"
      @selected="onNavSelected"
    ></cass-query-nav-menu>

    <splitpanes class="default-theme" :class="$style.mainContainer">
      <pane v-if="selectedNavView" min-size="20" size="30" max-size="50">
        <cass-query-nav-content
          :cluster-name="clusterName"
          :view="selectedNavView"
          :query="query"
          class="full-height"
        ></cass-query-nav-content>
      </pane>

      <pane min-size="20">
        <splitpanes horizontal class="flex">
          <pane min-size="25" max-size="40">
            <cass-query-editor
              v-model="query"
              :class="$style.editor"
              class="full-height"
              :retrieval-options="retrievalOptions"
              @execute="execute"
              @update="onUpdateQuery"
              @show-help="onEditorShowError"
            ></cass-query-editor>
          </pane>

          <pane min-size="40">
            <div v-if="successWithoutResults" class="padded">
              <el-alert
                class="bordered"
                type="success"
                title="Statement received successfully"
                show-icon
              ></el-alert>
            </div>

            <cass-table-results
              v-else-if="schema && (isLoading || !error)"
              v-loading="isLoading"
              class="full-height scroll"
              :class="$style.results"
              :schema="schema"
              :columns="columns"
              :truncated-columns="truncatedColumns"
              :retrieval-options="retrievalOptions"
              :data="data"
              element-loading-text="Executing statement..."
              @select-primary-key="onSelectPrimaryKey"
              @insert="onClickInsert"
              @download-cql="onDownload('cql')"
              @download-csv="onDownload('csv')"
            ></cass-table-results>

            <div
              v-else-if="isLoading"
              v-loading="isLoading"
              class="flex"
              element-loading-text="Executing statement..."
            >
              <!-- fake empty element to get a loading indicator when we don't have a schema -->
            </div>

            <div v-else-if="error" class="padded">
              <http-status-error-alert
                :title="error.title"
                :message="error.message"
                :remediation="error.remediation"
              ></http-status-error-alert>
            </div>

            <div v-else class="padded">
              Please enter a query
            </div>
          </pane>
        </splitpanes>
      </pane>
    </splitpanes>

    <router-view
      @add-record="returnToResults(true)"
      @update-record="returnToResults(true)"
      @delete-record="returnToResults(true)"
      @close="returnToResults(false)"
    ></router-view>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Splitpanes, Pane } from 'splitpanes';
import { Alert } from 'element-ui';
import CassQueryEditor from '@/components/cassandra/query/editor/CassQueryEditor.vue';
import CassQueryNavMenu from '@/components/cassandra/query/nav/CassQueryNavMenu.vue';
import CassQueryNavContent from '@/components/cassandra/query/nav/CassQueryNavContent.vue';
import CassTableResults from '@/components/cassandra/CassTableResults.vue';
import {
  ITableSchema,
  ITableColumn,
  CassandraExportFormat,
  IKeyQuery,
  IKeyQueryOptions,
} from '@cassandratypes/cassandra';
import { executeQuery, downloadQuery } from '@/services/cassandra/CassService';
import { ActionTypes } from '@/store/actions';
import { ValidationError } from '@/components/cassandra/query/editor/CassQueryValidator';
import HttpStatusError from '@/models/errors/HttpStatusError';
import { Routes } from '@/router/routes';
import { QueryParams } from '@/router/params';
import {
  validateCompletePrimaryKey,
  validateUnencodedBlobPrimaryKey,
} from '@/utils/cassandra-utils';
import { notify } from '@/utils/message-utils';
import { NotificationType } from '@/typings/notifications';
import store from '@/store';
import { triggerDownload } from '@/utils/download-utils';
import HttpStatusErrorAlert from '@/components/common/HttpStatusErrorAlert.vue';

export default Vue.extend({
  name: 'CassQueryView',
  components: {
    [Alert.name]: Alert,
    CassQueryEditor,
    CassQueryNavMenu,
    CassQueryNavContent,
    CassTableResults,
    HttpStatusErrorAlert,
    Splitpanes,
    Pane,
  },
  props: {
    clusterName: {
      type: String,
    },
  },
  data() {
    return {
      selectedNavView: undefined as string | undefined,
      isLoading: false,
      query: '',
      schema: undefined as ITableSchema | undefined,
      columns: new Array<ITableColumn>(),
      truncatedColumns: new Array<string>(),
      data: [] as any[],
      error: undefined as HttpStatusError | undefined,
      successWithoutResults: false,
      retrievalOptions: {
        encoding: 'hex',
        decodeValues: false,
      } as IKeyQueryOptions,
    };
  },
  watch: {
    clusterName: {
      immediate: true,
      handler(newCluster) {
        this.$store.dispatch(ActionTypes.FetchSchema, {
          cluster: newCluster,
        });
      },
    },
    $route: {
      immediate: true,
      handler() {
        this.loadFromRoute();
      },
    },
  },
  created() {
    this.loadFromRoute();
  },
  methods: {
    loadFromRoute() {
      this.query = (this.$route.query.query || '') as string;
      this.selectedNavView = (this.$route.query.view || '') as string;
    },
    onUpdateQuery({
      query,
      keyspace,
      table,
    }: {
      query: string;
      keyspace: string | undefined;
      table: string | undefined;
    }) {
      this.$router
        .replace({
          name: this.$route.name as string,
          params: {
            cluster: this.clusterName,
          },
          query: {
            ...this.$route.query,
            query,
            keyspace: keyspace || '',
            table: table || '',
          },
        })
        .catch(() => {
          // prevent nav duplicated errors
        });
    },
    async execute({ query, options }) {
      this.isLoading = true;

      const cluster = this.clusterName;

      this.$router
        .push({
          name: this.$route.name as string,
          params: { cluster },
          query: {
            ...this.$route.query,
            query,
          },
        })
        .catch(() => {
          // prevent nav duplicated errors
        });

      store.dispatch(ActionTypes.AddQueryToHistory, { cluster, query });

      this.successWithoutResults = false;
      try {
        this.error = undefined;
        const result = await executeQuery(cluster, query, options);
        this.schema = result.schema;
        this.columns = result.columns;
        this.truncatedColumns = result.truncatedColumns;
        this.data = result.rows;
        this.error = undefined;
        const isSelect = query.match(/^\s*select/i);
        if (!isSelect && result.rows.length === 0) {
          // non-select queries will return empty rows (e.g. insert)
          this.successWithoutResults = true;
        }
      } catch (err) {
        this.error = err;
      } finally {
        this.isLoading = false;
      }
    },
    onNavSelected(selectedView) {
      this.$router.push({
        name: this.$route.name as string,
        params: {
          cluster: this.clusterName,
        },
        query: {
          query: this.query,
          view: selectedView,
        },
      });
    },
    onEditorShowError(error: ValidationError) {
      if (error.type === 'schema') {
        this.selectedNavView = 'schema';
      } else if (error.type === 'syntax') {
        this.selectedNavView = 'info';
      }
    },
    onClickInsert() {
      const { keyspace, table } = this.$route.query;
      if (!keyspace || !table) {
        throw new Error('keyspace or table not detected');
      }

      this.$router.push({
        name: Routes.CassandraQueryDataCreate,
        params: {
          clusterName: this.clusterName,
        },
        query: this.$route.query,
      });
    },
    onSelectPrimaryKey(e) {
      const { key } = e as { key: IKeyQuery };
      const { keyspace, table } = this.$route.query;
      if (!keyspace || !table) {
        throw new Error('keyspace or table not detected');
      }
      if (!this.schema) {
        throw new Error('table schema not available');
      }

      if (!validateUnencodedBlobPrimaryKey(this.schema, key)) {
        return notify(
          NotificationType.Warning,
          'Blob value encoded',
          'Please use the "Blob Encoding" option to decode this value in order to edit.',
        );
      }

      const missingFields = validateCompletePrimaryKey(this.schema, key);
      if (missingFields.size > 0) {
        const missingColumns = Array.from(missingFields);
        return notify(
          NotificationType.Error,
          'Incomplete Primary Key',
          `This record is ambiguous. Please include the following additional columns in your query: ${missingColumns}`,
        );
      }

      this.$router.push({
        name: Routes.CassandraQueryDataEdit,
        params: {
          clusterName: this.clusterName,
        },
        query: {
          ...this.$route.query,
          [QueryParams.PrimaryKey]: JSON.stringify(key),
        },
      });
    },
    returnToResults() {
      const queryParams = JSON.parse(JSON.stringify(this.$route.query));
      delete queryParams[QueryParams.PrimaryKey];
      this.$router.push({
        name: Routes.CassandraQuery,
        params: this.$route.params,
        query: queryParams,
      });
    },
    async onDownload(format: CassandraExportFormat) {
      const { filename, results } = await downloadQuery(
        format,
        this.clusterName,
        this.query,
        this.retrievalOptions,
      );
      const blob = new Blob([results], { type: 'text/plain' });
      triggerDownload(URL.createObjectURL(blob), filename);
    },
  },
});
</script>
<style module>
.editor {
  min-height: 150px;
}

.results {
  min-height: 200px;
}

.mainContainer {
  overflow-x: hidden;
}
</style>
