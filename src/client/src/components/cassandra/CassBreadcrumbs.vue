<template>
  <div class="cass-breadcrumbs layout horizontal center padded">
    <el-breadcrumb separator-class="el-icon-arrow-right">
      <el-breadcrumb-item :to="{ path: clusterPath }">
        <cass-datastore-icon></cass-datastore-icon> {{ currentCluster }}
      </el-breadcrumb-item>

      <el-breadcrumb-item
        v-if="currentKeyspace && currentTable"
        :to="{ path: keyspacePath }"
      >
        <cass-keyspace-icon></cass-keyspace-icon> {{ currentKeyspace }}
      </el-breadcrumb-item>

      <el-breadcrumb-item v-if="currentKeyspace && !currentTable">
        <cass-keyspace-icon></cass-keyspace-icon>
        <el-select
          v-model="selectedKeyspace"
          class="spacer__left"
          style="width: 300px;"
          filterable
        >
          <el-option
            v-for="keyspace in availableKeyspaces"
            :key="keyspace.name"
            :label="keyspace.name"
            :value="keyspace.name"
          >
          </el-option>
        </el-select>
      </el-breadcrumb-item>

      <template v-if="currentKeyspace && !currentTable && isCreate">
        <el-breadcrumb-item>
          <cass-table-icon></cass-table-icon>
          <span> Create New Table...</span>
        </el-breadcrumb-item>
      </template>

      <el-breadcrumb-item v-if="currentTable">
        <cass-table-thrift-icon v-if="isThriftTable"></cass-table-thrift-icon>
        <cass-table-icon v-else></cass-table-icon>

        <el-select
          v-model="selectedTable"
          class="spacer__left"
          style="width: 300px;"
          filterable
        >
          <el-option
            v-for="table in availableTables"
            :key="table.name"
            :label="table.name"
            :value="table.name"
          >
          </el-option>
        </el-select>

        <cass-table-actions v-if="!isCreate" class="ml-2"></cass-table-actions>
      </el-breadcrumb-item>
    </el-breadcrumb>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Breadcrumb, BreadcrumbItem, Button, Option, Select } from 'element-ui';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { Routes } from '@/router/routes';
import { ActionTypes } from '@/store/actions';
import store from '@/store/index';
import { IKeyspace, ITableSchema } from '@cassandratypes/cassandra';
import CassDatastoreIcon from '@/components/cassandra/icons/CassDatastoreIcon.vue';
import CassKeyspaceIcon from '@/components/cassandra/icons/CassKeyspaceIcon.vue';
import CassTableIcon from '@/components/cassandra/icons/CassTableIcon.vue';
import CassTableThriftIcon from '@/components/cassandra/icons/CassTableThriftIcon.vue';
import CassTableActions from '@/components/cassandra/CassTableActions.vue';

export default Vue.extend({
  name: 'CassBreadcrumbs',
  components: {
    [Breadcrumb.name]: Breadcrumb,
    [BreadcrumbItem.name]: BreadcrumbItem,
    [Button.name]: Button,
    [Option.name]: Option,
    [Select.name]: Select,
    CassDatastoreIcon,
    CassKeyspaceIcon,
    CassTableIcon,
    CassTableThriftIcon,
    FontAwesomeIcon,
    CassTableActions,
  },
  data() {
    return {
      faTrashAlt,
    };
  },
  computed: {
    availableKeyspaces(): IKeyspace[] {
      return store.state.cassandra.cluster.keyspaces;
    },
    availableTables(): any[] {
      return store.state.cassandra.explore.keyspaceTables;
    },
    currentCluster(): string {
      return this.$route.params.clusterName;
    },
    currentKeyspace(): string {
      return this.$route.params.keyspaceName;
    },
    currentTable(): string {
      return this.$route.params.tableName;
    },
    tableSchema(): ITableSchema | undefined {
      return store.state.cassandra.explore.tableSchema;
    },
    isThriftTable(): boolean {
      return this.tableSchema ? this.tableSchema.isThrift : false;
    },
    clusterPath(): string {
      return `/cassandra/clusters/${this.currentCluster}/explore/`;
    },
    keyspacePath(): string {
      return `/cassandra/clusters/${this.currentCluster}/explore/${this.currentKeyspace}`;
    },
    clusterKeyspaceProp(): string {
      return [this.currentCluster, this.currentKeyspace].join();
    },
    selectedKeyspace: {
      get(): string {
        return this.currentKeyspace;
      },
      set(value: string) {
        if (value) {
          this.$router.push({
            name: Routes.CassandraKeyspace,
            params: {
              clusterName: this.currentCluster,
              keyspaceName: value,
            },
          });
        }
      },
    },
    selectedTable: {
      get(): string {
        return this.currentTable;
      },
      set(value: string) {
        if (value) {
          this.$router.push({
            name: Routes.CassandraTableData,
            params: {
              clusterName: this.currentCluster,
              keyspaceName: this.currentKeyspace,
              tableName: value,
            },
            query: {},
          });
        }
      },
    },
    isCreate(): boolean {
      return (
        this.$route.path.endsWith('_create') ||
        this.$route.path.endsWith('_createAdvanced')
      );
    },
  },
  watch: {
    clusterKeyspaceProp: {
      immediate: true,
      handler() {
        if (this.currentCluster && this.currentKeyspace) {
          this.$store.dispatch(ActionTypes.SetCurrentKeyspace, {
            clusterName: this.currentCluster,
            keyspaceName: this.currentKeyspace,
          });
        }
      },
    },
  },
  methods: {
    queryKeyspaces(_query, cb) {
      return cb(
        this.availableKeyspaces.map((keyspace) => ({ value: keyspace })),
      );
    },
    queryTables(_query, cb) {
      return cb(this.availableTables.map((table) => ({ value: table })));
    },
  },
});
</script>
<style scoped>
.cass-breadcrumbs {
  line-height: 45px;
  height: 45px;
  min-height: 45px;
}

.cass-breadcrumbs >>> .el-breadcrumb__item {
  line-height: 45px;
  height: 45px;
  min-height: 45px;
}
</style>
