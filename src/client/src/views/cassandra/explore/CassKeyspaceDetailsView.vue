<template>
  <div class="layout vertical">
    <cass-shared-cluster-message
      v-if="!keyspace && !keyspaceLoading"
      type="keyspace"
      :cluster-name="clusterName"
      :keyspace-name="keyspaceName"
    ></cass-shared-cluster-message>

    <template v-else-if="keyspace">
      <cass-network-topology-strategy
        v-if="strategy === 'NetworkTopologyStrategy'"
        :strategy-options="keyspace.strategyOptions"
        :datacenters="datacenters"
        disabled
      ></cass-network-topology-strategy>

      <cass-other-strategy
        v-else
        :strategy="strategy"
        :strategy-options="keyspace.strategyOptions"
      ></cass-other-strategy>

      <div
        v-if="keyspaceValidation && !keyspaceValidation.valid"
        class="padded"
      >
        <el-alert type="warning" :title="keyspaceValidation.message" show-icon>
          <div>{{ keyspaceValidation.detail }}</div>
        </el-alert>
      </div>

      <el-tabs
        type="border-card"
        :class="$style.tabs"
        :value="selectedTab"
        @tab-click="onTabClick"
      >
        <el-tab-pane :name="Routes.CassandraKeyspaceTables">
          <span slot="label">
            <font-awesome-icon :icon="faTable"></font-awesome-icon> Tables
          </span>
        </el-tab-pane>
        <el-tab-pane :name="Routes.CassandraKeyspaceUDTs">
          <span slot="label">
            <font-awesome-icon :icon="faUser"></font-awesome-icon> UDTs
          </span>
        </el-tab-pane>
      </el-tabs>

      <router-view class="flex"></router-view>
    </template>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faTable, faUser } from '@fortawesome/free-solid-svg-icons';
import { Alert, Tabs, TabPane } from 'element-ui';
import { Routes } from '@/router/routes';
import store from '@/store';
import CassNetworkTopologyStrategy from '@/components/cassandra/CassNetworkTopologyStrategy.vue';
import CassOtherStrategy from '@/components/cassandra/CassOtherStrategy.vue';
import { IKeyspace, IDatacenter } from '@cassandratypes/cassandra';
import CassTableThriftIcon from '@/components/cassandra/icons/CassTableThriftIcon.vue';
import {
  IKeyspaceValidationResult,
  validateKeyspace,
} from '@/validators/cassandra/keyspace-strategy-validator';
import CassSharedClusterMessage from '@/components/cassandra/CassSharedClusterMessage.vue';

export default Vue.extend({
  name: 'CassKeyspaceDetailsView',
  components: {
    [Alert.name]: Alert,
    [Tabs.name]: Tabs,
    [TabPane.name]: TabPane,
    CassNetworkTopologyStrategy,
    CassOtherStrategy,
    CassSharedClusterMessage,
    CassTableThriftIcon,
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
  },
  data() {
    return {
      faTable,
      faUser,
      Routes,
      showAdvancedColumns: false,
      tableOptions: {
        headings: {
          name: 'Table Name',
          configuration: 'Table Description',
        },
      },
    };
  },
  computed: {
    selectedTab(): string | null | undefined {
      return this.$route.name;
    },
    tables(): any[] {
      return store.state.cassandra.explore.keyspaceTables;
    },
    tablesLoading(): boolean {
      return store.state.cassandra.explore.keyspaceTablesLoading;
    },
    keyspace(): IKeyspace | undefined {
      return store.state.cassandra.explore.keyspace;
    },
    strategy(): string | undefined {
      return this.keyspace?.strategy;
    },
    keyspaceLoading(): boolean {
      return store.state.cassandra.explore.keyspaceLoading;
    },
    datacenters(): IDatacenter[] {
      return store.state.cassandra.cluster.datacenters;
    },
    tableColumns(): string[] {
      const columns = ['name', 'description'];
      if (this.showAdvancedColumns) {
        columns.push('strategy', 'defaultTtl', 'gcGraceSeconds');
      }
      return columns;
    },
    isLocal(): boolean {
      return store.getters.isLocal;
    },
    keyspaceValidation(): IKeyspaceValidationResult | undefined {
      if (!this.keyspace) return undefined;
      return validateKeyspace(this.keyspace, this.datacenters, this.isLocal);
    },
  },
  methods: {
    onTabClick(tab) {
      this.$router.push({
        name: tab.name,
        params: {
          clusterName: this.clusterName,
          keyspaceName: this.keyspaceName,
        },
      });
    },
  },
});
</script>
<style module>
.tabs {
  min-height: 40px;
}
</style>
<style scoped>
v-client-table >>> td:first-of-type {
  position: sticky;
  left: 0;
}
</style>
