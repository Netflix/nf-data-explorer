<template>
  <div
    :class="$style.tableDataView"
    class="layout horizontal"
    style="position: relative;"
  >
    <div :class="$style.left">
      <cass-primary-key-filters
        v-if="tableSchema"
        v-model="filter"
        :schema="tableSchema"
        class="full-height"
        @search="onSearch"
        @clear="onSearch"
      >
      </cass-primary-key-filters>
    </div>

    <cass-table-results
      v-if="tableSchema"
      class="flex scroll border__top"
      :class="$style.content"
      :schema="tableSchema"
      :columns="columns"
      :truncated-columns="truncatedColumns"
      :data="results"
      :page-state="pageState"
      :loading="isLoading"
      show-all-columns
      allow-actions
      :retrieval-options="filter.options"
      @select-primary-key="onSelectPrimaryKey"
      @insert="onClickInsert"
      @download-cql="onDownload('cql')"
      @download-csv="onDownload('csv')"
      @fetch-next-page="onFetchNextPage"
    >
    </cass-table-results>

    <router-view
      @add-record="returnToResults(true)"
      @update-record="returnToResults(true)"
      @delete-record="returnToResults(true)"
      @close="returnToResults(false)"
      @truncate-table="returnToResults(true)"
      @drop-table="returnToKeyspaces()"
      @loaded="isLoading = false"
    >
    </router-view>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import CassPrimaryKeyFilters from '@/components/cassandra/CassPrimaryKeyFilters.vue';
import CassTableResults from '@/components/cassandra/CassTableResults.vue';
import {
  getKeyResults,
  downloadResultSet,
} from '@/services/cassandra/CassService';
import {
  IKeyQuery,
  ITableSchema,
  ITableColumn,
  CassandraExportFormat,
} from '@cassandratypes/cassandra';
import store from '@/store';
import { Routes } from '@/router/routes';
import { validateUnencodedBlobPrimaryKey } from '@/utils/cassandra-utils';
import { triggerDownload } from '@/utils/download-utils';
import { notify } from '@/utils/message-utils';
import { NotificationType } from '@/typings/notifications';
import { ActionTypes } from '@/store/actions';
import RequestCanceledError from '@/models/errors/RequestCanceledError';
import { debounce } from 'lodash';
import {
  buildKeyFromRoute,
  buildQueryFromKey,
} from '@/utils/cassandra-route-utils';
import { QueryParams } from '@/router/params';

export default Vue.extend({
  name: 'CassTableDataView',

  components: {
    CassPrimaryKeyFilters,
    CassTableResults,
  },

  beforeRouteUpdate(to, _from, next) {
    // avoid performing additional searches if a subroute changes query params
    if (to.name === Routes.CassandraTableData && this.tableSchema) {
      this.filter = buildKeyFromRoute(this.tableSchema, to.query);
      this.search(undefined, false);
    }
    next();
  },

  props: {
    clusterName: {
      type: String,
    },
    keyspaceName: {
      type: String,
    },
    tableName: {
      type: String,
    },
    query: {
      type: String,
    },
  },

  data() {
    const filter: IKeyQuery = {
      primaryKey: {},
      options: {
        encoding: 'hex',
        decodeValues: false,
      },
    };
    return {
      filter,
      worker: undefined as any,
      isCanceled: false,
      isLoading: false,
      columns: new Array<ITableColumn>(),
      truncatedColumns: new Array<string>(),
      results: new Array<{
        [column: string]: any;
      }>(),
      pageState: undefined as string | undefined,
    };
  },

  computed: {
    tableSchema(): ITableSchema | undefined {
      return store.state.cassandra.explore.tableSchema;
    },
    primaryKeyHasEncodedBlobs(): boolean {
      if (!this.tableSchema) return false;
      return !validateUnencodedBlobPrimaryKey(this.tableSchema, this.filter);
    },
  },

  watch: {
    tableSchema: {
      immediate: true,
      handler() {
        if (this.tableSchema) {
          this.filter = buildKeyFromRoute(this.tableSchema, this.$route.query);
          this.search(undefined);
        }
      },
    },
  },

  created() {
    this.search = debounce(this.search, 300);
  },

  methods: {
    onSearch() {
      this.search(undefined);
    },
    async search(pageState: string | undefined, updateRoute = true) {
      this.isCanceled = false;
      this.isLoading = true;
      this.pageState = pageState;

      if (updateRoute) {
        this.$router
          .push({
            name: this.$route.name as string,
            query: buildQueryFromKey(this.filter, this.$route.query),
          })
          .catch(() => {
            // prevent nav duplicated errors
          });
      }

      try {
        const resp = await getKeyResults(
          this.clusterName,
          this.keyspaceName,
          this.tableName,
          this.filter,
          pageState,
          {
            truncate: 'all',
          },
        );
        if (this.isCanceled) {
          return;
        }
        const { columns, rows, truncatedColumns } = resp;
        this.columns = columns;
        this.truncatedColumns = truncatedColumns;

        if (pageState) {
          this.results = Object.freeze(this.results.concat(rows)) as any;
        } else {
          this.results = Object.freeze(rows) as any;
        }
        this.pageState = resp.pageState;
      } catch (err) {
        if (!(err instanceof RequestCanceledError)) {
          notify(
            NotificationType.Error,
            err.title,
            `${err.message}. ${err.remediation}`,
          );
        }
      } finally {
        this.isLoading = false;
        this.isCanceled = false;
      }
    },
    async onDownload(format: CassandraExportFormat) {
      try {
        const { filename, results } = await downloadResultSet(
          format,
          this.clusterName,
          this.keyspaceName,
          this.tableName,
          this.filter,
          this.pageState,
        );
        const blob = new Blob([results], { type: 'text/plain' });
        triggerDownload(URL.createObjectURL(blob), filename);
      } catch (err) {
        notify(
          NotificationType.Error,
          err.title,
          `${err.message}. ${err.remediation}`,
        );
      }
    },
    onSelectPrimaryKey(e) {
      const { key } = e as { key: IKeyQuery };
      if (this.tableSchema) {
        if (this.primaryKeyHasEncodedBlobs) {
          return notify(
            NotificationType.Warning,
            'Blob value encoded',
            'Please use the "Blob Encoding" option to decode this value in order to edit.',
          );
        }

        this.isLoading = true;
        const { clusterName, keyspaceName, tableName } = this;
        this.$router.push({
          name: Routes.CassandraTableDataEdit,
          params: {
            clusterName,
            keyspaceName,
            tableName,
          },
          query: {
            ...this.$route.query,
            [QueryParams.PrimaryKey]: JSON.stringify(key),
          },
        });
      }
    },
    onSelectEncodedBlob() {
      notify(
        NotificationType.Warning,
        'Blob value encoded',
        'Please use the "Blob Encoding" option to decode this value in order to edit.',
      );
    },
    onClickInsert() {
      const { clusterName, keyspaceName, tableName } = this;
      this.$router.push({
        name: Routes.CassandraTableDataCreate,
        params: {
          clusterName,
          keyspaceName,
          tableName,
        },
        query: this.$route.query,
      });
    },
    onFetchNextPage() {
      this.search(this.pageState);
    },
    returnToResults(refresh: boolean) {
      this.isLoading = false;
      const queryParams = JSON.parse(JSON.stringify(this.$route.query));
      delete queryParams[QueryParams.PrimaryKey];

      this.$router.push({
        name: Routes.CassandraTableData,
        params: this.$route.params,
        query: queryParams,
      });

      if (refresh) {
        this.onSearch();
      }
    },
    returnToKeyspaces() {
      const { clusterName, keyspaceName } = this;
      store.dispatch(ActionTypes.FetchKeyspaceTables, {
        clusterName,
        keyspaceName,
      });
      this.$router.replace({
        name: Routes.CassandraKeyspaceTables,
        params: {
          clusterName,
          keyspaceName,
        },
      });
    },
  },
});
</script>
<style module>
.tableDataView {
  overflow: hidden;
}

.left {
  min-width: 250px;
}
</style>
