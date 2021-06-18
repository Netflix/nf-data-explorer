<template>
  <div :class="$style.cassTableResults" class="layout vertical">
    <div
      :class="$style.toolbar"
      class="toolbar layout horizontal justified center padded"
    >
      <div class="layout horizontal center">
        <template v-if="allowActions">
          <el-tooltip content="Insert a new record" placement="bottom">
            <el-button type="primary" size="mini" @click="onInsert">
              <font-awesome-icon :icon="faPlusCircle"></font-awesome-icon>
              Insert
            </el-button>
          </el-tooltip>

          <span class="spacer__left spacer__right">|</span>

          <el-button type="primary" size="mini" @click="onDownloadCQL">
            <font-awesome-icon :icon="faCloudDownloadAlt"></font-awesome-icon>
            CQL
          </el-button>
        </template>
      </div>

      <el-checkbox
        v-model="freezeColumns"
        label="Freeze Primary Key Columns"
      ></el-checkbox>
    </div>

    <v-client-table
      ref="table"
      :key="schema.name"
      v-loading="loading"
      :data="data"
      :columns="tableColumns"
      :options="tableOptions"
      element-loading-text="Loading..."
      :class="$style.table"
      class="flex scroll"
      allow-export
    >
      <template
        v-for="columnName in tableColumns"
        :slot="columnName"
        slot-scope="props"
      >
        <div
          :key="columnName"
          :class="$style.tableCell"
          @click="onCellClick(props.row, columnName)"
        >
          <el-tooltip
            v-if="isEncodedBlob(columnName)"
            :content="getEncodedBlobTooltip(columnName)"
            placement="bottom"
          >
            <span>{{ getCellData(props.row, columnName) }}</span>
          </el-tooltip>
          <template v-else>
            {{ getCellData(props.row, columnName) }}
          </template>
        </div>
      </template>

      <el-button
        slot="afterTable"
        type="primary"
        class="export-button"
        size="mini"
        @click="exportToCsv"
        >Export to CSV</el-button
      >
    </v-client-table>
    <div v-if="pageState" class="padded border__left">
      <a href="#" @click="onFetchNextPage">
        <font-awesome-icon
          class="spacer__right"
          :icon="faCloudDownloadAlt"
          fixed-width
        ></font-awesome-icon>
        Fetch More Results...
      </a>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Prop } from 'vue/types/options';
import { Button, Checkbox, Pagination, Tooltip } from 'element-ui';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faCloudDownloadAlt,
  faLaptopCode,
  faPlusCircle,
} from '@fortawesome/free-solid-svg-icons';
import {
  ITableColumn,
  ITableSchema,
  IKeyQueryOptions,
} from '@cassandratypes/cassandra';
import { sortTableColumns } from '@/utils/cassandra-utils';
import { getKeyQuery } from '@/utils/cassandra-primary-key-utils';
import {
  isCollectionType,
  getCollectionRowValueAsString,
} from '@/shared/cassandra/collection-utils';
import { ClientTable } from 'vue-tables-2';
import { confirmPrompt, notify } from '@/utils/message-utils';
import { NotificationType } from '@/typings/notifications';
Vue.use(ClientTable);

export default Vue.extend({
  name: 'CassTableResults',
  components: {
    [Button.name]: Button,
    [Checkbox.name]: Checkbox,
    [Pagination.name]: Pagination,
    [Tooltip.name]: Tooltip,
    FontAwesomeIcon,
  },
  props: {
    schema: {
      type: Object as Prop<ITableSchema>,
      required: true,
    },
    columns: {
      type: Array as Prop<ITableColumn[]>,
      required: true,
    },
    /**
     * If any column values have been truncated due to excessive length,
     * include the names here so the column headings can be updated appropriately.
     */
    truncatedColumns: {
      type: Array as Prop<string[]>,
    },
    data: {
      type: Array as Prop<any[]>,
      required: true,
    },
    pageState: {
      type: String,
    },
    showAllColumns: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    allowActions: {
      type: Boolean,
      default: false,
    },
    retrievalOptions: {
      type: Object as Prop<IKeyQueryOptions>,
      default() {
        return {
          encoding: undefined,
        } as IKeyQueryOptions;
      },
    },
  },
  data() {
    return {
      faCloudDownloadAlt,
      faLaptopCode,
      faPlusCircle,
      freezeColumns: true,
    };
  },
  computed: {
    sortedColumns(): ITableColumn[] {
      return this.schema ? sortTableColumns(this.schema) : [];
    },
    tableColumns(): string[] {
      const columnsToRender = this.showAllColumns
        ? this.sortedColumns
        : this.columns;
      return columnsToRender.map((column) => column.name);
    },
    tableOptions(): any {
      const truncatedColumnSet = new Set(this.truncatedColumns);
      const headings = this.tableColumns.reduce((prev, columnName) => {
        if (truncatedColumnSet.has(columnName)) {
          prev[columnName] = `${columnName} (contains truncated content)`;
        } else {
          prev[columnName] = columnName;
        }
        return prev;
      }, {});

      const frozenClass = this.freezeColumns ? 'frozen' : '';
      const columnsClasses = [];

      const { partitionKeys, clusteringKeys } = this.schema;
      partitionKeys.forEach(
        (key) =>
          (columnsClasses[
            key.name
          ] = `primary-key partition-key ${frozenClass}`),
      );
      clusteringKeys.forEach(
        (key) =>
          (columnsClasses[
            key.name
          ] = `primary-key clustering-key ${frozenClass}`),
      );

      // find last table column and add a marker class
      const partitionKeySet = new Set(partitionKeys.map((item) => item.name));
      const clusteringKeySet = new Set(clusteringKeys.map((item) => item.name));
      for (let i = this.sortedColumns.length - 1; i >= 0; i--) {
        const { name } = this.sortedColumns[i];
        if (partitionKeySet.has(name) || clusteringKeySet.has(name)) {
          columnsClasses[name] = `${columnsClasses[name]} last-frozen-column`;
          break;
        }
      }

      return {
        headings,
        columnsClasses,
        filterByColumn: true,
        perPage: 100,
        texts: {
          count: '{from} to {to} of {count} items|{count} items|1 item',
          noResults: 'No matching items',
          filterBy: 'Filter...',
        },
      };
    },
    columnMap(): Map<string, ITableColumn> {
      return this.sortedColumns.reduce(
        (map, curr) => map.set(curr.name, curr),
        new Map<string, ITableColumn>(),
      );
    },
    partitionKeySet(): Set<string> {
      return new Set(this.schema.partitionKeys.map((col) => col.name));
    },
    clusteringKeySet(): Set<string> {
      return new Set(this.schema.clusteringKeys.map((col) => col.name));
    },
    hasEncodedBlobPrimaryKey(): boolean {
      const { primaryKey } = this.schema;
      return primaryKey.some((col) => this.isEncodedBlob(col.name));
    },
  },
  methods: {
    isEncodedBlob(columnName: string) {
      const column = this.columnMap.get(columnName);
      const isValueColumn = this.isValueColumn(columnName);
      const { encoding, decodeValues } = this.retrievalOptions;
      return (
        column &&
        column.type.includes('blob') &&
        (encoding === undefined || (isValueColumn && !decodeValues))
      );
    },
    getEncodedBlobTooltip(columnName: string) {
      const { encoding, decodeValues } = this.retrievalOptions;
      const isValueColumn = this.isValueColumn(columnName);
      if (!encoding) {
        return 'Please choose an encoding format in order to decode this blob value';
      } else if (isValueColumn && !decodeValues) {
        return 'This value column is encoded. Use the "decode value columns" option to view.';
      }
    },
    isValueColumn(columnName) {
      return (
        !this.partitionKeySet.has(columnName) &&
        !this.clusteringKeySet.has(columnName)
      );
    },
    getCellData(row: any, columnName: string) {
      const column = this.columnMap.get(columnName);
      if (column) {
        const rowValue = row[columnName];
        if (column.type.includes('blob')) {
          const blobWriteTimeColumn = `writetime(${columnName})`;
          if (rowValue !== undefined) {
            // if the blob column has been decoded, then the value will be available
            return rowValue;
          } else if (
            Object.prototype.hasOwnProperty.call(row, blobWriteTimeColumn) &&
            row[blobWriteTimeColumn] === null
          ) {
            // only show a blob placeholder if we know the writetime is null
            return undefined;
          } else {
            // otherwise return the placeholder
            return '<blob>';
          }
        }
        if (rowValue === null) return null;
        if (isCollectionType(column.type)) {
          return getCollectionRowValueAsString(column.type, rowValue);
        }
      }
      return row[columnName];
    },
    onCellClick(row) {
      this.$emit('select-row', { row });
      const key = getKeyQuery(this.schema, row, this.retrievalOptions);
      this.$emit('select-primary-key', { key, row });
    },
    onInsert() {
      this.$emit('insert');
    },
    async onDownloadCQL() {
      if (await this.validateDownload('cql')) {
        this.$emit('download-cql');
      }
    },
    onFetchNextPage() {
      this.$emit('fetch-next-page');
    },
    async exportToCsv() {
      if (await this.validateDownload('csv')) {
        this.$emit('download-csv');
      }
    },
    async validateDownload(type: 'cql' | 'csv') {
      if (this.truncatedColumns.length > 0) {
        const truncatedString = this.truncatedColumns.join(', ');
        if (
          !(await confirmPrompt(
            'Truncated Columns Detected',
            `The following columns have truncated values: [${truncatedString}]. Exporting the results may not be an accurate representation of what is stored in this table.`,
            'Download Anyway',
            'Cancel',
            NotificationType.Warning,
          ))
        ) {
          return false;
        }
      } else if (type === 'cql' && this.hasEncodedBlobPrimaryKey) {
        notify(
          NotificationType.Warning,
          'Encoded Blob Primary Key Detected',
          'Cannot generate insert statements unless the primary key has been decoded. ' +
            'Please go back and choose an encoding format to use so these values can be decoded.',
        );
        return false;
      } else if (this.tableColumns.some(this.isEncodedBlob)) {
        if (
          !(await confirmPrompt(
            'Encoded Blob Column Detected',
            'This table has one or more blob columns that must be decoded before download.<br/><br/>' +
              'Please go back and choose an encoding format to use so these values can be decoded or you can choose to export without these blob columns.',
            'Download Without Blob Columns',
            'Cancel',
            NotificationType.Warning,
            {
              dangerouslyUseHTMLString: true,
            },
          ))
        ) {
          return false;
        }
      }
      return true;
    },
  },
});
</script>
<style module>
:root {
  --column-width: 140px;
}

.toolbar {
  display: flex;
  justify-content: flex-end;
}

.table td {
  cursor: pointer;
  white-space: nowrap;
  min-width: var(--column-width);
  max-width: 400px;
}

.table td div {
  overflow: hidden;
  text-overflow: ellipsis;
}

.cassTableResults :global table.VueTables__table {
  overflow: unset !important;
}

.cassTableResults :global .VueTables__table td {
  padding: 0;
}

.tableCell {
  padding: var(--space-2) var(--space-2);
}

.table :global .frozen {
  min-width: var(--column-width);
  max-width: var(--column-width);
  opacity: 1;
}

.table :global th.frozen {
  z-index: 1000;
}

.table :global td.frozen {
  z-index: 999;
}

.table :global .frozen:nth-of-type(1) {
  position: sticky !important;
  left: 0;
}
.table :global .frozen:nth-of-type(2) {
  position: sticky !important;
  left: calc(var(--column-width) * 1);
}
.table :global .frozen:nth-of-type(3) {
  position: sticky !important;
  left: calc(var(--column-width) * 2);
}
.table :global .frozen:nth-of-type(4) {
  position: sticky !important;
  left: calc(var(--column-width) * 3);
}
.table :global .frozen:nth-of-type(5) {
  position: sticky !important;
  left: calc(var(--column-width) * 4);
}

.table :global .frozen.last-frozen-column {
  border-right: 1px solid var(--color-border) !important;
}
</style>
