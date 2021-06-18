<template>
  <div :class="$style.createTableColumnsPage">
    <div :class="$style.grid" class="full-height">
      <div :class="$style.columns" class="bordered layout vertical">
        <div class="toolbar">
          <el-tooltip content="Add a new column (ctrl +)" placement="right">
            <el-button type="primary" @click="onAddColumn">
              <font-awesome-icon
                :icon="faPlusCircle"
                fixed-width
              ></font-awesome-icon>
              Add Column
            </el-button>
          </el-tooltip>
          <button
            v-shortkey.once="['ctrl', 'shift', '=']"
            hidden
            @shortkey="onAddColumn"
          >
            Add Column
          </button>
        </div>

        <draggable
          ref="columnList"
          :list="staticColumns"
          class="columns-list flex scroll"
          :options="{
            group: 'column',
            dragClass: 'sortable-drag',
            filter: '.invalid, .collectionType, .counterType',
            preventOnFilter: false,
          }"
          @start="onStart"
          @end="onEnd"
        >
          <cass-create-table-column-item
            v-for="column in staticColumns"
            :key="column.uniqueId"
            :name="column.name"
            :type="column.type"
            :duplicate-columns="duplicateColumns"
            primary-key-type="column"
            @input="onUpdateColumn(column, $event)"
            @delete="onDeleteColumn(staticColumns, column)"
          ></cass-create-table-column-item>
        </draggable>
      </div>

      <div
        :class="$style['partition-keys']"
        class="bordered layout vertical relative"
      >
        <div class="toolbar">
          <cass-partition-key-icon></cass-partition-key-icon>
          <div>Partition Keys</div>
        </div>

        <draggable
          ref="partionKeyList"
          :list="partitionColumns"
          class="flex scroll"
          :options="{ group: 'column' }"
          @end="onEnd"
        >
          <cass-create-table-column-item
            v-for="column in partitionColumns"
            :key="column.uniqueId"
            :name="column.name"
            :type="column.type"
            :duplicate-columns="duplicateColumns"
            primary-key-type="partition"
            @input="onUpdateColumn(column, $event)"
            @delete="onDeleteColumn(partitionColumns, column)"
          ></cass-create-table-column-item>
        </draggable>

        <div v-if="partitionColumns.length === 0" :class="$style.placeholder">
          Drag and drop your partition keys
        </div>
      </div>

      <div
        :class="$style['clustering-keys']"
        class="bordered layout vertical relative"
      >
        <div class="toolbar">
          <cass-clustering-key-icon></cass-clustering-key-icon>
          <div>Clustering Keys</div>
        </div>

        <draggable
          ref="clusteringKeyList"
          :list="clusteringColumns"
          class="flex scroll"
          :options="{ group: 'column' }"
          @end="onEnd"
        >
          <cass-create-table-column-item
            v-for="column in clusteringColumns"
            :key="column.uniqueId"
            :name="column.name"
            :type="column.type"
            :sort="column.sort"
            :duplicate-columns="duplicateColumns"
            primary-key-type="cluster"
            @input="onUpdateColumn(column, $event)"
            @delete="onDeleteColumn(clusteringColumns, column)"
          ></cass-create-table-column-item>
        </draggable>

        <div v-if="clusteringColumns.length === 0" :class="$style.placeholder">
          Drag and drop your clustering columns
        </div>
      </div>

      <div :class="$style.messages">Messages</div>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Prop } from 'vue/types/options';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faGripVertical,
  faPlusCircle,
  faHdd,
} from '@fortawesome/free-solid-svg-icons';
import {
  Button,
  Input,
  Option,
  Select,
  Table,
  TableColumn,
  Tooltip,
} from 'element-ui';
import draggable from 'vuedraggable';
import CassPartitionKeyIcon from '@/components/cassandra/icons/CassPartitionKeyIcon.vue';
import CassClusteringKeyIcon from '@/components/cassandra/icons/CassClusteringKeyIcon.vue';
import CassCreateTableColumnItem from '@/components/cassandra/create-table/CassCreateTableColumnItem.vue';
import {
  ICreateTableOptions,
  ICreateTableColumnOptions,
  ICreateTableClusteringColumnOptions,
} from '@cassandratypes/cassandra';
import { IValidationResult } from '@/typings/validation';
import VueShortkey from 'vue-shortkey';
import { omit } from 'lodash';

Vue.use(VueShortkey);

interface IUniqueTableColumn extends ICreateTableColumnOptions {
  uniqueId: number;
}

interface IUniqueSortedTableColumn
  extends IUniqueTableColumn,
    ICreateTableClusteringColumnOptions {}

export default Vue.extend({
  name: 'CassCreateTableColumnsPage',
  components: {
    [Button.name]: Button,
    [Input.name]: Input,
    [Option.name]: Option,
    [Select.name]: Select,
    [Table.name]: Table,
    [TableColumn.name]: TableColumn,
    [Tooltip.name]: Tooltip,
    FontAwesomeIcon,
    draggable,
    CassCreateTableColumnItem,
    CassPartitionKeyIcon,
    CassClusteringKeyIcon,
  },
  props: {
    value: {
      type: Object as Prop<ICreateTableOptions>,
    },
  },
  data() {
    // we need to maintain a unique ID for each column as they are renamed or moved
    // between the lists to ensure the `key` prop doesn't get recycled.
    let uniqueIdCounter = 0;
    const mapColumnWithId = (
      column: ICreateTableColumnOptions,
    ): IUniqueTableColumn => ({
      ...column,
      uniqueId: uniqueIdCounter++,
    });
    const staticColumns = this.value.staticColumns.map(mapColumnWithId);
    const partitionColumns = this.value.partitionColumns.map(mapColumnWithId);
    const clusteringColumns = this.value.clusteringColumns.map(
      mapColumnWithId,
    ) as IUniqueSortedTableColumn[];

    return {
      faHdd,
      faGripVertical,
      faPlusCircle,
      uniqueIdCounter,
      // duplicateColumns: new Array<string>(),
      staticColumns,
      partitionColumns,
      clusteringColumns,
    };
  },
  computed: {
    duplicateColumns(): string[] {
      const getColumnName = (col) => col.name.toLowerCase();
      const columnNames = [
        ...this.staticColumns.map(getColumnName),
        ...this.partitionColumns.map(getColumnName),
        ...this.clusteringColumns.map(getColumnName),
      ].sort();
      const duplicates = new Set<string>();
      for (let i = 0; i < columnNames.length - 1; i++) {
        if (columnNames[i] === columnNames[i + 1]) {
          duplicates.add(columnNames[i]);
        }
      }
      return Array.from(duplicates);
    },
  },
  methods: {
    //
    // button handlers
    //
    onAddColumn() {
      this.staticColumns.push({
        name: '',
        type: '',
        uniqueId: this.uniqueIdCounter++,
      });
      Vue.nextTick(() => {
        const columnList = this.$refs.columnList as any;
        const lastChild = columnList.$children[columnList.$children.length - 1];
        lastChild.focus();
      });
    },
    onDeleteColumn(list, column) {
      const index = list.indexOf(column);
      if (index >= 0) {
        list.splice(index, 1);
      }
      this.updateValueWithChanges();
    },

    //
    // DnD handlers
    //
    onStart() {
      this.validate();
    },
    onEnd() {
      this.updateValueWithChanges();
      this.$emit('column-moved');
    },

    //
    // event handlers
    //
    onUpdateColumn(column, { name, type, sort }) {
      column.name = name;
      column.type = type;
      if (sort) {
        this.$set(column, 'sort', sort);
      } else {
        this.$delete(column, 'sort');
      }
      this.updateValueWithChanges();
      this.$emit('column-updated', { name });
    },
    updateValueWithChanges() {
      const omitIdColumn = (col: IUniqueTableColumn) => omit(col, 'uniqueId');
      this.$emit('input', {
        ...this.value,
        partitionColumns: this.partitionColumns.map(omitIdColumn),
        clusteringColumns: this.clusteringColumns.map(omitIdColumn),
        staticColumns: this.staticColumns.map(omitIdColumn),
      });
    },

    //
    // public validation method
    //
    async validate(): Promise<IValidationResult> {
      if (this.partitionColumns.length === 0) {
        return {
          isValid: false,
          message: 'Please specify at least one partition key',
        };
      }

      // validate the individual fields
      const draggableContainers = this.$children.filter(
        (child) => child.$options.name === 'draggable',
      );
      const columnItems = draggableContainers
        .map((container) => container.$children)
        .flat()
        .filter(
          (child) => child.$options.name === 'cass-create-table-column-item',
        );

      // check for duplicate columns
      if (this.duplicateColumns.length > 0) {
        return {
          isValid: false,
          message: 'Please ensure the highlighted columns are unique.',
        };
      }

      const allValidationResults = await Promise.all(
        columnItems.map((columnItem) =>
          (columnItem as any).validate().catch(() => undefined),
        ),
      );
      const isValid = allValidationResults.every((validation) => !!validation);
      return {
        isValid,
        message: 'Please correct the highlighted columns.',
      };
    },
  },
});
</script>
<style module>
.create-table-columns-page {
  overflow: hidden;
}

.grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: repeat(2, 1fr) auto;
  grid-gap: 10px 10px;
}

.grid > * {
  overflow: hidden;
}

.columns {
  grid-column: 1 / 4;
  grid-row: 1 / 3;
}

.partition-keys {
  grid-column: 4 / 6;
  grid-row: 1 / 1;
}

.clustering-keys {
  grid-column: 4 / 6;
  grid-row: 2 / 2;
}

.messages {
  height: 75px;
  grid-row: 3 / 3;
  display: none;
}

.column-item {
  /* display: flex;
  align-items: center; */
  height: 30px;
  line-height: 30px;
}

.createTableColumnsPage :global .toolbar svg {
  margin-right: var(--spacer-standard);
}

.placeholder {
  position: absolute;
  top: 50%;
  width: 100%;
  text-align: center;
  opacity: 0.8;
}
</style>
<style>
.sortable-drag .el-select,
.sortable-drag .el-button {
  display: none;
}
</style>
