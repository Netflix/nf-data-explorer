<template>
  <div :class="$style.cassTableView" class="full-height layout vertical">
    <cass-shared-cluster-message
      v-if="!tableSchema && !tableSchemaLoading"
      type="table"
      :cluster-name="clusterName"
      :keyspace-name="keyspaceName"
      :table-name="tableName"
    ></cass-shared-cluster-message>

    <template v-else>
      <el-tabs
        type="border-card"
        :class="$style.tabs"
        :value="selectedTab"
        @tab-click="onTabClick"
      >
        <el-tab-pane :name="Routes.CassandraTableData">
          <span slot="label">
            <font-awesome-icon :icon="faList"></font-awesome-icon> Data
          </span>
        </el-tab-pane>
        <el-tab-pane :name="Routes.CassandraTableColumns">
          <span slot="label">
            <font-awesome-icon :icon="faColumns"></font-awesome-icon> Columns
          </span>
        </el-tab-pane>
        <el-tab-pane :name="Routes.CassandraTableProperties">
          <span slot="label">
            <font-awesome-icon :icon="faCog"></font-awesome-icon> Properties
          </span>
        </el-tab-pane>
        <el-tab-pane :name="Routes.CassandraTableSamples">
          <span slot="label">
            <font-awesome-icon :icon="faSearch"></font-awesome-icon> Sample
            Queries
          </span>
        </el-tab-pane>
        <el-tab-pane
          v-if="hasMetricsFeature"
          :name="Routes.CassandraTableActivity"
        >
          <span slot="label">
            <font-awesome-icon :icon="faChartLine"></font-awesome-icon> Activity
          </span>
        </el-tab-pane>
      </el-tabs>
      <keep-alive>
        <router-view class="flex"></router-view>
      </keep-alive>
    </template>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Alert, Button, Tabs, TabPane } from 'element-ui';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faCog,
  faColumns,
  faList,
  faSearch,
  faChartLine,
} from '@fortawesome/free-solid-svg-icons';
import { Routes } from '@/router/routes';
import CassTableColumnsView from '@/views/cassandra/explore/CassTableColumnsView.vue';
import CassTableDataView from '@/views/cassandra/explore/CassTableDataView.vue';
import CassTablePropertiesView from '@/views/cassandra/explore/CassTablePropertiesView.vue';
import CassTableSampleQueriesView from '@/views/cassandra/explore/CassTableSampleQueriesView.vue';
import store from '@/store';
import { ActionTypes } from '@/store/actions';
import { ITableSchema } from '@cassandratypes/cassandra';
import CassSharedClusterMessage from '@/components/cassandra/CassSharedClusterMessage.vue';
import { hasFeature } from '@/utils/feature-utils';

export default Vue.extend({
  name: 'CassTableView',
  components: {
    [Alert.name]: Alert,
    [Button.name]: Button,
    [Tabs.name]: Tabs,
    [TabPane.name]: TabPane,
    CassSharedClusterMessage,
    CassTableColumnsView,
    CassTableDataView,
    CassTablePropertiesView,
    CassTableSampleQueriesView,
    FontAwesomeIcon,
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
  },
  data() {
    return {
      faChartLine,
      faCog,
      faColumns,
      faList,
      faSearch,
      Routes,
      loading: false,
    };
  },
  computed: {
    selectedTab(): string | null | undefined {
      return this.$route.name;
    },
    tableSchema(): ITableSchema | undefined {
      return store.state.cassandra.explore.tableSchema;
    },
    tableSchemaLoading(): boolean {
      return store.state.cassandra.explore.tableSchemaLoading;
    },
    isSharedCluster(): boolean {
      return store.getters.isSharedCluster;
    },
    hasMetricsFeature(): boolean {
      return hasFeature(store, 'metrics');
    },
  },
  watch: {
    tableName: {
      immediate: true,
      handler(tableName) {
        store.dispatch(ActionTypes.FetchTable, {
          cluster: this.clusterName,
          keyspace: this.keyspaceName,
          table: tableName,
        });
      },
    },
  },
  methods: {
    onTabClick(tab) {
      this.$router.push({
        name: tab.name,
        params: {
          clusterName: this.clusterName,
          keyspaceName: this.keyspaceName,
          tableName: this.tableName,
        },
      });
    },
  },
});
</script>
<style module>
.tabs {
  min-height: 39px;
}

.cassTableView :global .el-tabs__item span {
  user-select: none;
}
</style>
