<template>
  <div class="cass-table-properties-view full-height layout horizontal">
    <cass-table-properties-editor
      v-model="properties"
      disabled
      class="full-height flex"
    ></cass-table-properties-editor>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import CassTablePropertiesEditor from '@/components/cassandra/CassTablePropertiesEditor.vue';
import store from '@/store';
import { ITableProperties, ITableSchema } from '@cassandratypes/cassandra';

export default Vue.extend({
  name: 'CassTablePropertiesView',
  components: {
    CassTablePropertiesEditor,
  },
  props: {
    disabled: {
      type: Boolean,
    },
  },
  computed: {
    tableSchema(): ITableSchema | undefined {
      return store.state.cassandra.explore.tableSchema;
    },
    properties(): ITableProperties | undefined {
      if (!this.tableSchema) return undefined;
      // clone the table properties to avoid directly mutating vuex state
      return JSON.parse(JSON.stringify(this.tableSchema.properties));
    },
  },
});
</script>
