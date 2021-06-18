<template>
  <div>
    <div
      v-for="(partitionKey, index) in partitionKeys"
      :key="index"
      :class="$style.row"
      class="layout horizontal center"
    >
      <div :class="$style['partition-key']">
        {{ partitionKeyLabel }}
      </div>

      <div :class="$style['clustering-columns']">
        <div
          v-for="(column, columnIndex) in staticColumns"
          :key="columnIndex"
          :class="$style['clustering-column']"
          class="layout vertical"
        >
          <div :class="$style['clustering-column-header']">
            {{ createClusteringKey(clusteringKeys, column.name) }}
          </div>
          <div :class="$style['clustering-column-content']">
            {{ column.name }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Prop } from 'vue/types/options';
import { ICreateTableColumnOptions } from '@cassandratypes/cassandra';

export default Vue.extend({
  name: 'CassCreateTableStorageLayout',
  props: {
    partitionKeys: {
      type: Array as Prop<ICreateTableColumnOptions[]>,
    },
    clusteringKeys: {
      type: Array as Prop<ICreateTableColumnOptions[]>,
    },
    staticColumns: {
      type: Array as Prop<ICreateTableColumnOptions[]>,
    },
  },
  computed: {
    partitionKeyLabel(): string {
      return this.partitionKeys.map((key) => `[${key.name}]`).join(':');
    },
  },
  methods: {
    createClusteringKey(
      clusteringKeys: ICreateTableColumnOptions[],
      staticColumnName: string,
    ) {
      const prefix = clusteringKeys.map((key) => `[${key.name}]`).join(':');
      if (prefix.length > 0) {
        return `${prefix}:${staticColumnName}`;
      }
      return `${staticColumnName}`;
    },
  },
});
</script>
<style module>
.row {
  padding: 16px 16px;
}

.row + .row {
  padding-top: 0;
}

.partition-key {
  display: flex;
  justify-content: center;
  width: 200px;
  height: 100%;
  min-height: 60px;
  align-items: center;
}

.partition-key,
.clustering-column {
  border: 1px solid var(--color-border);
  border-radius: 5px;
}

.clustering-columns {
  display: flex;
  flex: 1;
  overflow-x: scroll;
}

.clustering-column {
  margin: 0 16px;
  min-width: 200px;
}

.clustering-column-header,
.clustering-column-content {
  text-align: center;
  padding: 4px 16px;
}

.clustering-column-header {
  background-color: var(--color-border);
}
</style>
