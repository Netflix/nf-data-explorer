<template>
  <div class="cass-query-nav layout horizontal">
    <div :class="$style.expanded" class="flex layout vertical">
      <div class="toolbar border__bottom">
        <h3>{{ currentTitle }}</h3>
      </div>

      <div :class="$style.contentContainer" class="padded flex scroll">
        <cass-schema-explorer
          v-if="view === 'schema'"
          :cluster-name="clusterName"
        ></cass-schema-explorer>
        <cass-query-history
          v-if="view === 'history'"
          :cluster-name="clusterName"
        ></cass-query-history>
        <cass-query-help
          v-if="view === 'info'"
          :query="query"
        ></cass-query-help>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import CassSchemaExplorer from '@/components/cassandra/query/nav/CassSchemaExplorer.vue';
import CassQueryHistory from '@/components/cassandra/query/nav/CassQueryHistory.vue';
import CassQueryHelp from '@/components/cassandra/query/nav/CassQueryHelp.vue';
import { menuItems } from './cassandra-nav-menu-items';

export default Vue.extend({
  name: 'CassQueryNavContent',
  components: {
    CassQueryHelp,
    CassQueryHistory,
    CassSchemaExplorer,
  },
  props: {
    clusterName: {
      type: String,
      required: true,
    },
    view: {
      type: String,
      validator(value: string) {
        return (
          value === undefined || menuItems.some((item) => item.name === value)
        );
      },
    },
    query: {
      type: String,
    },
  },
  data() {
    return {
      menuItems,
    };
  },
  computed: {
    currentTitle(): string {
      if (!this.view) return '';
      const menuItem = this.menuItems.find((item) => item.name === this.view);
      return menuItem ? menuItem.title : '';
    },
  },
});
</script>
<style module>
.expanded {
  border-right: 1px solid var(--color-border);
  overflow: auto;
}

.contentContainer {
  background-color: var(--color-background-light);
}
</style>
