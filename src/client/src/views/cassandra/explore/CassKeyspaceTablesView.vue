<template>
  <div class="layout vertical">
    <div class="toolbar layout horizontal justified">
      <el-button type="primary" @click="onCreateTable">
        <font-awesome-icon :icon="faPlusCircle"></font-awesome-icon>
        Create Table
      </el-button>

      <el-checkbox
        v-model="showAdvancedColumns"
        label="Show Advanced Columns"
      ></el-checkbox>
    </div>

    <v-client-table
      v-loading="tablesLoading"
      :data="tableData"
      :class="$style.table"
      :columns="tableColumns"
      :options="tableOptions"
      element-loading-text="Fetching tables from cluster..."
      class="flex scroll"
    >
      <template slot="name" slot-scope="props">
        <div style="display: inline-block; min-width: 24px;">
          <cass-table-thrift-icon
            v-if="props.row.isThrift"
          ></cass-table-thrift-icon>
          <cass-table-icon v-else></cass-table-icon>
        </div>
        <router-link
          :to="{
            name: Routes.CassandraTableData,
            params: { clusterName, keyspaceName, tableName: props.row.name },
          }"
          >{{ props.row.name }}</router-link
        >
      </template>

      <template slot="readSparkline" slot-scope="props">
        <div v-if="loadingMetrics">Loading...</div>
        <spark-line
          v-else-if="props.row.coordinatorHistoricalReads"
          style="height: 25px; width: 140px;"
          :chart-data="props.row.coordinatorHistoricalReads"
        ></spark-line>
      </template>

      <template slot="estimatedRowCount" slot-scope="props">
        <div v-if="loadingMetrics">Loading...</div>
        <div v-else>{{ props.row.estimatedRowCount | formatHuman }}</div>
      </template>

      <template slot="sizeInBytes" slot-scope="props">
        <div v-if="loadingMetrics">Loading...</div>
        <div v-else>{{ props.row.sizeInBytes | formatBytes }}</div>
      </template>

      <template v-if="showAdvancedColumns" slot="strategy" slot-scope="props">
        <div>{{ props.row.compaction.strategy }}</div>
      </template>

      <template
        v-if="showAdvancedColumns"
        slot="gcGraceSeconds"
        slot-scope="props"
      >
        <div>{{ props.row.properties.gcGraceSeconds }}</div>
      </template>

      <template v-if="showAdvancedColumns" slot="defaultTtl" slot-scope="props">
        <div>{{ props.row.properties.defaultTtl }}</div>
      </template>
    </v-client-table>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faPlusCircle, faTable } from '@fortawesome/free-solid-svg-icons';
import { Button, Checkbox } from 'element-ui';
import { Routes } from '@/router/routes';
import CassTableIcon from '@/components/cassandra/icons/CassTableIcon.vue';
import CassTableThriftIcon from '@/components/cassandra/icons/CassTableThriftIcon.vue';
import store from '@/store';
import { ClientTable } from 'vue-tables-2';
import { getKeyspaceTableMetrics } from '@/services/cassandra/CassService';
import { ICassMetricsTableUsage } from '@cassandratypes/cassandra';
import { ITable } from '@/typings/store';
import { formatBytes, formatHuman } from '@/filters';
import SparkLine from '@/components/common/charts/SparkLine.vue';
import { hasFeature } from '@/utils/feature-utils';

Vue.use(ClientTable);

export default Vue.extend({
  name: 'CassKeyspaceTablesView',
  components: {
    [Button.name]: Button,
    [Checkbox.name]: Checkbox,
    CassTableIcon,
    CassTableThriftIcon,
    FontAwesomeIcon,
    SparkLine,
  },
  filters: {
    formatBytes,
    formatHuman,
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
  },
  data() {
    return {
      Routes,
      faPlusCircle,
      faTable,
      showAdvancedColumns: false,
      selectedTab: 'Tables',
      tableMetrics: undefined as ICassMetricsTableUsage[] | undefined,
      loadingMetrics: false,
    };
  },
  computed: {
    tables(): ITable[] {
      return store.state.cassandra.explore.keyspaceTables;
    },
    tablesLoading(): boolean {
      return store.state.cassandra.explore.keyspaceTablesLoading;
    },
    tableColumns(): string[] {
      const columns = ['name', 'description'];
      if (this.hasMetricsFeature) {
        columns.push('readSparkline', 'sizeInBytes', 'estimatedRowCount');
      }
      if (this.showAdvancedColumns) {
        columns.push('strategy', 'defaultTtl', 'gcGraceSeconds');
      }
      return columns;
    },
    tableOptions(): any {
      return {
        filterable: ['name', 'description'],
        filterByColumn: true,
        perPage: 100,
        headings: {
          name: 'Table Name',
          configuration: 'Table Description',
          sizeInBytes: 'Primary Size',
          estimatedRowCount: 'Approx Row Count',
          readSparkline: 'Reads/Sec Past 24Hrs',
        },
        columnsClasses: {
          name: 'nameColumn',
          description: 'descriptionColumn',
          readSparkline: 'readSparklineColumn',
          sizeInBytes: 'sizeColumn',
          strategy: 'strategyColumn',
          estimatedRowCount: 'estimatedRowCountColumn',
        },
        sortable: this.tableColumns.filter((name) => name !== 'readSparkline'),
      };
    },
    isNetworkTopologyStrategy(): boolean {
      const { keyspace } = store.state.cassandra.explore;
      if (keyspace) {
        return keyspace.strategy === 'NetworkTopologyStrategy';
      }
      return false;
    },
    tableData(): any[] {
      let metricsMap = new Map<string, ICassMetricsTableUsage>();
      if (this.hasMetricsFeature && this.tableMetrics) {
        metricsMap = this.tableMetrics.reduce(
          (map, metrics) => map.set(metrics.tableName, metrics),
          new Map<string, ICassMetricsTableUsage>(),
        );
      }
      return this.tables.map((table) => {
        let tableStats: ICassMetricsTableUsage | undefined = undefined;
        if (this.isNetworkTopologyStrategy) {
          // only networktopologystrategy have stats
          tableStats = metricsMap.get(table.name);
        }
        return {
          ...table,
          estimatedRowCount: tableStats ? tableStats.estimatedRowCount : '',
          sizeInBytes: tableStats ? tableStats.sizeInBytes : '',
          coordinatorHistoricalReads: tableStats
            ? tableStats.coordinatorHistoricalReads
            : undefined,
        };
      });
    },
    hasMetricsFeature(): boolean {
      return hasFeature(store, 'metrics');
    },
  },
  watch: {
    keyspaceName() {
      this.fetchMetrics();
    },
    hasMetricsFeature() {
      this.fetchMetrics();
    },
  },
  created() {
    this.fetchMetrics();
  },
  methods: {
    onCreateTable() {
      this.$router.push({
        name: Routes.CassandraTableCreate,
        params: {
          clusterName: this.clusterName,
          keyspaceName: this.keyspaceName,
        },
      });
    },
    async fetchMetrics() {
      if (!this.keyspaceName || !this.hasMetricsFeature) return;
      try {
        this.loadingMetrics = true;
        this.tableMetrics = undefined;
        this.tableMetrics = await getKeyspaceTableMetrics(
          this.clusterName,
          this.keyspaceName,
          'day',
          'hour',
        );
      } finally {
        this.loadingMetrics = false;
      }
    },
  },
});
</script>
<style module>
.table :global td.readSparklineColumn {
  padding: 5px;
}

.table :global td.descriptionColumn {
  max-width: 500px;
}

.table :global td.readSparklineColumn {
  width: 150px;
}

.table :global td.sizeColumn,
.table :global td.estimatedRowCountColumn {
  width: 100px;
}

.table :global td.nameColumn,
.table :global td.sizeColumn,
.table :global td.strategyColumn {
  white-space: nowrap;
}
</style>
