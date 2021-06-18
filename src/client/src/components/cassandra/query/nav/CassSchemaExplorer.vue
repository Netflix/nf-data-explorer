<template>
  <div class="cass-schema-explorer layout vertical full-height">
    <el-checkbox
      v-model="linkPath"
      label="Link path to editor"
      class="spacer__bottom"
    ></el-checkbox>

    <!-- breadcrumbs -->
    <div class="layout horizontal center">
      <el-breadcrumb
        separator-class="el-icon-arrow-right"
        :class="$style.breadcrumbs"
        class="spacer__bottom"
      >
        <!-- all keyspaces item -->
        <el-breadcrumb-item
          v-if="!selectedKeyspace"
          :class="$style['breadcrumb-item']"
        >
          <cluster-icon></cluster-icon> {{ clusterName }}
        </el-breadcrumb-item>
        <el-breadcrumb-item
          v-if="selectedKeyspace"
          :class="$style['breadcrumb-item']"
          :to="getRoute(undefined, undefined)"
        >
          <cluster-icon></cluster-icon> {{ clusterName }}
        </el-breadcrumb-item>

        <!-- keyspace item -->
        <el-breadcrumb-item
          v-if="selectedKeyspace && !selectedTable"
          :class="$style['breadcrumb-item']"
        >
          <cass-keyspace-icon></cass-keyspace-icon> {{ selectedKeyspace }}
        </el-breadcrumb-item>
        <el-breadcrumb-item
          v-if="selectedKeyspace && selectedTable"
          :class="$style['breadcrumb-item']"
          :to="getRoute(selectedKeyspace, undefined)"
        >
          <cass-keyspace-icon></cass-keyspace-icon> {{ selectedKeyspace }}
        </el-breadcrumb-item>

        <!-- table item -->
        <el-breadcrumb-item
          v-if="selectedKeyspace && selectedTable"
          :class="$style['breadcrumb-item']"
        >
          <cass-table-thrift-icon
            v-if="isSelectedTableThrift"
          ></cass-table-thrift-icon>
          <cass-table-icon v-else></cass-table-icon> {{ selectedTable }}
        </el-breadcrumb-item>
      </el-breadcrumb>

      <el-tooltip
        content="Open this table in the Explore mode (opens in a new tab)"
        placement="bottom"
      >
        <router-link
          v-if="selectedTable"
          :to="{
            name: Routes.CassandraTableData,
            params: {
              clusterName,
              keyspaceName: selectedKeyspace,
              tableName: selectedTable,
            },
          }"
          target="_blank"
        >
          <font-awesome-icon
            :icon="faExternalLinkAlt"
            class="spacer__bottom spacer__left"
          ></font-awesome-icon>
        </router-link>
      </el-tooltip>
    </div>

    <!-- table showing keyspaces/tables/columns -->
    <el-table
      v-loading="isLoading"
      :data="tableData"
      class="bordered flex scroll"
      :highlight-current-row="!selectedTable"
      :class="{ selectable: !selectedTable }"
      element-loading-text="Loading schema..."
      @current-change="onSelectItem"
    >
      <el-table-column :label="columnLabel" prop="name">
        <template slot-scope="props">
          <component
            :is="getIconComponent(props.row)"
            :class="$style['row-icon']"
          ></component>
          <span> {{ props.row.name }}</span>
        </template>
      </el-table-column>
    </el-table>

    <!-- table details -->
    <el-table
      v-if="selectedTable"
      v-loading="isLoading"
      :data="sampleQueries"
      class="bordered flex scroll spacer__top"
      element-loading-text="Loading schema..."
      @current-change="onSelectItem"
    >
      <el-table-column label="Sample Queries" prop="name">
        <template slot-scope="props">
          <cass-sample-query
            :class="$style['sample-query']"
            :query="props.row"
            @select="onSelectQuery"
          >
          </cass-sample-query>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import {
  Breadcrumb,
  BreadcrumbItem,
  Checkbox,
  Table,
  TableColumn,
  Tooltip,
} from 'element-ui';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { IClusterSchemaColumn, ITableSchema } from '@cassandratypes/cassandra';
import store from '@/store';
import { Routes } from '@/router/routes';
import { Location } from 'vue-router';
import CassSampleQuery from '@/components/cassandra/CassSampleQuery.vue';
import {
  generateSampleQueries,
  sortTableColumns,
} from '@/utils/cassandra-utils';
import ClusterIcon from '@/components/common/icons/ClusterIcon.vue';
import CassKeyspaceIcon from '@/components/cassandra/icons/CassKeyspaceIcon.vue';
import CassPartitionKeyIcon from '@/components/cassandra/icons/CassPartitionKeyIcon.vue';
import CassClusteringKeyIcon from '@/components/cassandra/icons/CassClusteringKeyIcon.vue';
import CassTableIcon from '@/components/cassandra/icons/CassTableIcon.vue';
import CassTableThriftIcon from '@/components/cassandra/icons/CassTableThriftIcon.vue';
import CassColumnIcon from '@/components/cassandra/icons/CassColumnIcon.vue';
import { fetchTable } from '@/services/cassandra/CassService';

enum SchemaType {
  KEYSPACE,
  TABLE,
  COLUMN,
}

interface ISchemaItem {
  name: string;
  type: SchemaType;
  options: {
    isThrift?: boolean;
    isPartitionKey?: boolean;
    isClusteringKey?: boolean;
  };
}

interface ITableMetaData {
  [tableName: string]: {
    isThrift: boolean;
  };
}

export default Vue.extend({
  name: 'CassSchemaExplorer',
  components: {
    [Breadcrumb.name]: Breadcrumb,
    [BreadcrumbItem.name]: BreadcrumbItem,
    [Checkbox.name]: Checkbox,
    [Table.name]: Table,
    [TableColumn.name]: TableColumn,
    [Tooltip.name]: Tooltip,
    CassClusteringKeyIcon,
    CassColumnIcon,
    CassKeyspaceIcon,
    CassPartitionKeyIcon,
    CassSampleQuery,
    CassTableIcon,
    CassTableThriftIcon,
    ClusterIcon,
    FontAwesomeIcon,
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
      faExternalLinkAlt,
      selectedKeyspace: undefined as string | undefined,
      selectedTable: undefined as string | undefined,
      selectedTableSchema: undefined as ITableSchema | undefined,
    };
  },
  computed: {
    schema(): IClusterSchemaColumn[] {
      return store.state.cassandra.cluster.schema;
    },
    isLoading(): boolean {
      return store.state.cassandra.cluster.schemaLoading;
    },
    tableData(): ISchemaItem[] {
      if (!this.selectedKeyspace) return this.keyspaces;
      if (!this.selectedTable) return this.tables;
      return this.columns;
    },
    isSelectedTableThrift(): boolean {
      if (!this.selectedTable) return false;
      const metadata = this.tableMetaData[this.selectedTable];
      return metadata ? metadata.isThrift : false;
    },
    keyspaces(): ISchemaItem[] {
      return Array.from(new Set(this.schema.map((item) => item.keyspace)))
        .sort()
        .map((keyspaceName) => ({
          name: keyspaceName,
          type: SchemaType.KEYSPACE,
          options: {},
        }));
    },
    tableMetaData(): ITableMetaData {
      if (!this.selectedKeyspace) return {};
      return this.schema.reduce((prev, curr) => {
        prev[curr.table] = {
          isThrift: curr.isThrift,
        };
        return prev;
      }, {} as ITableMetaData);
    },
    tables(): ISchemaItem[] {
      if (!this.selectedKeyspace) return [];
      const tableNames = new Set(
        this.schema
          .filter((item) => item.keyspace === this.selectedKeyspace)
          .map((item) => item.table),
      );
      return Array.from(tableNames)
        .map((name) => ({
          name,
          type: SchemaType.TABLE,
          options: this.tableMetaData[name],
        }))
        .sort();
    },
    columns(): ISchemaItem[] {
      if (!this.selectedKeyspace || !this.selectedTableSchema) return [];

      const columns = sortTableColumns(this.selectedTableSchema);
      const { partitionKeys, clusteringKeys } = this.selectedTableSchema;

      const partitionKeyNames = new Set(partitionKeys.map((col) => col.name));
      const clusteringKeyNames = new Set(clusteringKeys.map((col) => col.name));

      return columns.map((col) => ({
        name: `${col.name} (${col.type})`,
        type: SchemaType.COLUMN,
        options: {
          isPartitionKey: partitionKeyNames.has(col.name),
          isClusteringKey: clusteringKeyNames.has(col.name),
        },
      }));
    },
    columnLabel(): string {
      if (!this.selectedKeyspace) return 'Keyspace Name';
      else if (!this.selectedTable) return 'Table Name';
      return 'Column Name';
    },
    sampleQueries(): string[] {
      if (!this.selectedKeyspace || !this.selectedTable) return [];

      const partitionKeys = new Array<string>();
      const clusteringColumns = new Array<string>();

      this.schema
        .filter(
          (item) =>
            item.keyspace === this.selectedKeyspace &&
            item.table === this.selectedTable,
        )
        .forEach((item) => {
          const { column, type } = item;
          if (type === 'partition') {
            partitionKeys.push(column);
          } else if (type === 'clustering') {
            clusteringColumns.push(column);
          }
        });

      const sampleQueries = generateSampleQueries(
        this.selectedKeyspace,
        this.selectedTable,
        partitionKeys,
        clusteringColumns,
      );
      return Array.from(new Set(sampleQueries));
    },
    linkPath: {
      get(): boolean {
        return this.$route.query.linkPath !== 'false';
      },
      set(value: boolean) {
        this.$router.replace({
          name: this.$route.name as string,
          params: this.$route.params,
          query: {
            ...this.$route.query,
            linkPath: value + '',
          },
        });
      },
    },
  },
  watch: {
    $route: {
      immediate: true,
      handler() {
        const { keyspace, table } = this.$route.query;
        this.selectedKeyspace = keyspace as string;
        this.selectedTable = table as string;
      },
    },
    selectedTable: {
      immediate: true,
      async handler(newTable: string) {
        if (newTable && this.selectedKeyspace) {
          this.selectedTableSchema = await fetchTable(
            this.clusterName,
            this.selectedKeyspace,
            newTable,
          );
        } else {
          this.selectedTableSchema = undefined;
        }
      },
    },
  },
  methods: {
    getRoute(keyspace?: string, table?: string): Location {
      const query = JSON.parse(JSON.stringify(this.$route.query));
      query['keyspace'] = keyspace;
      query['table'] = table;
      return {
        name: Routes.CassandraQuery,
        params: this.$route.params,
        query,
      };
    },
    onSelectItem(item: ISchemaItem) {
      if (!item) return;
      switch (item.type) {
        case SchemaType.KEYSPACE:
          this.$router.push(this.getRoute(item.name, undefined));
          break;
        case SchemaType.TABLE:
          this.$router.push(this.getRoute(this.selectedKeyspace, item.name));
          break;
        default:
        // no-op
      }
    },
    onSelectQuery(selectedQuery: string) {
      const query = JSON.parse(JSON.stringify(this.$route.query));
      query['query'] = selectedQuery;
      this.$router.push({
        name: Routes.CassandraQuery,
        params: this.$route.params,
        query,
      });
    },
    getIconComponent(item: ISchemaItem) {
      const { type, options } = item;
      switch (type) {
        case SchemaType.KEYSPACE:
          return 'cass-keyspace-icon';
        case SchemaType.TABLE:
          return options.isThrift
            ? 'cass-table-thrift-icon'
            : 'cass-table-icon';
        case SchemaType.COLUMN:
          if (item.options.isPartitionKey) {
            return 'cass-partition-key-icon';
          } else if (item.options.isClusteringKey) {
            return 'cass-clustering-key-icon';
          } else {
            return 'cass-column-icon';
          }
        default:
          return 'cluster-icon';
      }
    },
  },
});
</script>
<style module>
.sample-query {
  cursor: pointer;
}

.row-icon {
  margin-right: var(--spacer-small);
}

.breadcrumbs {
  line-height: 35px;
}
</style>
<style scoped>
.cass-schema-explorer >>> .el-breadcrumb__item .is-link {
  color: var(--color-action);
}

.selectable {
  cursor: pointer;
}
</style>
