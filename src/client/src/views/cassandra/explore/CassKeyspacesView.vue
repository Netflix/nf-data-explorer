<template>
  <div class="cass-keyspaces-view layout vertical scroll">
    <cass-shared-cluster-message
      type="cluster"
      :cluster-name="clusterName"
    ></cass-shared-cluster-message>

    <div class="toolbar">
      <el-button type="primary" @click="onCreateKeyspace">
        <font-awesome-icon :icon="faPlusCircle"></font-awesome-icon> Create
        Keyspace
      </el-button>
    </div>
    <v-client-table
      v-loading="keyspacesLoading"
      :data="keyspaceTableData"
      :class="$style.table"
      :columns="tableColumns"
      :options="tableOptions"
      element-loading-text="Fetching keyspaces from cluster..."
      class="flex full-height scroll"
    >
      <template slot="name" slot-scope="props">
        <router-link
          :to="{
            name: Routes.CassandraKeyspace,
            params: { clusterName, keyspaceName: props.row.name },
          }"
          >{{ props.row.name }}</router-link
        >
      </template>

      <template slot="strategy" slot-scope="props">
        <div>{{ props.row.strategy }}</div>
      </template>

      <template slot="strategyOptions" slot-scope="props">
        <div class="layout horizontal">
          <div :class="$style.placeholder">
            <el-tooltip
              v-if="!props.row.validationResult.valid"
              :content="
                props.row.validationResult.message +
                '-' +
                props.row.validationResult.detail
              "
            >
              <font-awesome-icon
                :class="$style.keyspaceWarning"
                :icon="faExclamationTriangle"
                fixed-width
              ></font-awesome-icon>
            </el-tooltip>
          </div>
          <div class="flex">
            {{ JSON.stringify(props.row.strategyOptions) }}
          </div>
        </div>
      </template>

      <template slot="sizeInBytes" slot-scope="props">
        <div v-if="loadingMetrics">Loading...</div>
        <div v-else>{{ props.row.sizeInBytes | formatBytes }}</div>
      </template>
    </v-client-table>
    <router-view></router-view>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faPlusCircle,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import { Alert, Button, Tooltip } from 'element-ui';
import { Routes } from '@/router/routes';
import store from '@/store';
import {
  IKeyspace,
  IDatacenter,
  ICassMetricsKeyspaceUsage,
} from '@cassandratypes/cassandra';
import {
  validateKeyspace,
  IKeyspaceValidationResult,
} from '@/validators/cassandra/keyspace-strategy-validator';
import { ClientTable } from 'vue-tables-2';
import { IAppEnvironments } from '@/typings/store';
import CassSharedClusterMessage from '@/components/cassandra/CassSharedClusterMessage.vue';
import { getClusterKeyspacesMetrics } from '@/services/cassandra/CassService';
import { formatBytes } from '@/filters';
import { hasFeature } from '@/utils/feature-utils';

Vue.use(ClientTable);

interface IKeyspaceTableData extends IKeyspace {
  validationResult: IKeyspaceValidationResult;
  sizeInBytes: number | undefined;
}

export default Vue.extend({
  name: 'CassKeyspacesView',
  components: {
    [Alert.name]: Alert,
    [Button.name]: Button,
    [Tooltip.name]: Tooltip,
    CassSharedClusterMessage,
    FontAwesomeIcon,
  },
  filters: {
    formatBytes,
  },
  props: {
    clusterName: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      Routes,
      faExclamationTriangle,
      faPlusCircle,
      loadingMetrics: false,
      keyspaceMetrics: new Array<ICassMetricsKeyspaceUsage>(),
      tableOptions: {
        filterByColumn: true,
        perPage: 100,
        headings: {
          name: 'Keyspace Name',
          strategyOptions: 'Strategy Options',
          sizeInBytes: 'Primary Size',
        },
        columnsClasses: {
          sizeInBytes: 'sizeColumn',
          strategy: 'strategyColumn',
        },
        texts: {
          count: '{from} to {to} of {count} items|{count} items|1 item',
          noResults: 'No matching keyspaces',
          filterBy: 'Filter...',
        },
      },
    };
  },
  computed: {
    keyspaces(): IKeyspace[] {
      return store.state.cassandra.cluster.keyspaces;
    },
    datacenters(): IDatacenter[] {
      return store.state.cassandra.cluster.datacenters;
    },
    keyspacesLoading(): boolean {
      return store.state.cassandra.cluster.keyspacesLoading;
    },
    availableEnvironments(): IAppEnvironments | undefined {
      return store.state.config.environments;
    },
    currentEnvironment(): string | undefined {
      return this.availableEnvironments
        ? this.availableEnvironments.current.env
        : undefined;
    },
    currentRegion(): string | undefined {
      return this.availableEnvironments
        ? this.availableEnvironments.current.region
        : undefined;
    },
    isLocal(): boolean {
      return store.getters.isLocal;
    },
    tableColumns(): string[] {
      const columns = ['name', 'strategy', 'strategyOptions'];
      if (this.hasMetricsFeature) {
        columns.push('sizeInBytes');
      }
      return columns;
    },
    keyspaceTableData(): IKeyspaceTableData[] {
      if (this.datacenters.length === 0) return [];

      const metricsMap = this.keyspaceMetrics.reduce(
        (map, metrics) => map.set(metrics.keyspaceName, metrics),
        new Map<string, ICassMetricsKeyspaceUsage>(),
      );
      return this.keyspaces.map((keyspace) => {
        const metrics = metricsMap.get(keyspace.name);
        return {
          ...keyspace,
          validationResult: validateKeyspace(
            keyspace,
            this.datacenters,
            this.isLocal,
          ),
          sizeInBytes: metrics?.sizeInBytes,
        };
      });
    },
    isSharedCluster(): boolean {
      return store.getters.isSharedCluster;
    },
    hasMetricsFeature(): boolean {
      return hasFeature(store, 'metrics');
    },
  },
  watch: {
    hasMetricsFeature() {
      this.fetchMetrics();
    },
    clusterName() {
      this.fetchMetrics();
    },
  },
  created() {
    this.fetchMetrics();
  },
  methods: {
    async fetchMetrics() {
      if (this.hasMetricsFeature) {
        try {
          this.loadingMetrics = true;
          this.keyspaceMetrics = await getClusterKeyspacesMetrics(
            this.clusterName,
          );
        } finally {
          this.loadingMetrics = false;
        }
      }
    },
    onCreateKeyspace() {
      this.$router.push({
        name: Routes.CassandraKeyspaceCreate,
        params: {
          clusterName: this.clusterName,
        },
      });
    },
  },
});
</script>
<style module>
.keyspaceWarning {
  color: var(--color-warning);
}

.placeholder {
  min-width: 22px;
}

.table :global .strategyColumn {
  width: 250px;
}

.table :global .sizeColumn {
  width: 150px;
}
</style>
