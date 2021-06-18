<template>
  <div class="cassandra-table-columns-view">
    <el-table
      :data="columns"
      stripe
      style="width: 100%;"
      class="flex"
      empty-text="No columns found"
    >
      <el-table-column label="" width="70px">
        <template slot-scope="props">
          <cass-partition-key-icon
            v-if="partitionKeySet.has(props.row.name)"
          ></cass-partition-key-icon>
          <cass-clustering-key-icon
            v-else-if="clusteringKeyMap.has(props.row.name)"
            :sort="clusteringKeyMap.get(props.row.name)"
          ></cass-clustering-key-icon>
          <cass-column-icon v-else></cass-column-icon>
        </template>
      </el-table-column>
      <el-table-column label="Name" width="400px">
        <template slot-scope="props">
          <div>{{ props.row.name }}</div>
        </template>
      </el-table-column>
      <el-table-column label="Type">
        <template slot-scope="props">
          <div class="layout horizontal center">
            <div class="spacer__right">{{ props.row.type }}</div>
            <el-tooltip
              v-if="props.row.options.frozen"
              content="Column is Frozen. Values are treated like BLOBs cannot be modified directly. To change the value, you must replace the value."
              placement="right"
            >
              <font-awesome-icon
                :icon="faSnowflake"
                :class="$style.frozen"
              ></font-awesome-icon>
            </el-tooltip>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Button, Table, TableColumn, Tooltip } from 'element-ui';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faChartPie,
  faList,
  faSnowflake,
  faSortAmountDown,
  faSortAmountUp,
} from '@fortawesome/free-solid-svg-icons';
import store from '@/store';
import { ITableSchema, ITableColumn } from '@cassandratypes/cassandra';
import { sortTableColumns } from '@/utils/cassandra-utils';
import CassPartitionKeyIcon from '@/components/cassandra/icons/CassPartitionKeyIcon.vue';
import CassClusteringKeyIcon from '@/components/cassandra/icons/CassClusteringKeyIcon.vue';
import CassColumnIcon from '@/components/cassandra/icons/CassColumnIcon.vue';

export default Vue.extend({
  name: 'CassTableColumnsView',
  components: {
    [Button.name]: Button,
    [Table.name]: Table,
    [TableColumn.name]: TableColumn,
    [Tooltip.name]: Tooltip,
    FontAwesomeIcon,
    CassPartitionKeyIcon,
    CassClusteringKeyIcon,
    CassColumnIcon,
  },
  data() {
    return {
      faChartPie,
      faList,
      faSnowflake,
      faSortAmountDown,
      faSortAmountUp,
      partitionKeySet: new Set(),
      clusteringKeyMap: new Map<string, 'ASC' | 'DESC'>(),
    };
  },
  computed: {
    tableSchema(): ITableSchema | undefined {
      return store.state.cassandra.explore.tableSchema;
    },
    columns(): ITableColumn[] {
      if (!this.tableSchema) return [];
      return sortTableColumns(this.tableSchema);
    },
  },
  watch: {
    tableSchema: {
      immediate: true,
      handler(newSchema: ITableSchema | undefined) {
        let partitionKeys = new Array<string>();
        const clusteringKeys = new Map<string, 'ASC' | 'DESC'>();
        if (newSchema) {
          partitionKeys = newSchema.partitionKeys.map((item) => item.name);
          newSchema.clusteringKeys.map((item, index) => {
            clusteringKeys.set(item.name, newSchema.clusteringOrder[index]);
          });
        }
        this.partitionKeySet = new Set(partitionKeys);
        this.clusteringKeyMap = clusteringKeys;
      },
    },
  },
  methods: {
    getSortIcon(columnName: string) {
      return this.clusteringKeyMap.get(columnName) === 'ASC'
        ? this.faSortAmountUp
        : this.faSortAmountDown;
    },
    getClusteringKeyLabel(columnName) {
      const suffix =
        this.clusteringKeyMap.get(columnName) === 'ASC'
          ? '(ascending)'
          : '(descending)';
      return `Clustering Key ${suffix}`;
    },
  },
});
</script>
<style module>
.frozen {
  color: #64aef3;
  cursor: help;
}
</style>
