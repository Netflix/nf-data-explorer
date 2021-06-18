<template>
  <div>
    <div v-if="!currentQuery">
      <p>
        The editor on the right supports some code-assist functions. Try
        starting to type a query like "SELECT" and see how it can help. You can
        also use (Ctrl + Space) to bring up snippets and completions.
      </p>

      <p>
        You can also check out the "Schema" tab to see what keyspaces, tables,
        and columns this cluster has to offer.
      </p>
    </div>

    <cass-syntax-help
      v-else
      :keyword="currentQuery.keyword"
      :description="currentQuery.description"
      :syntax="currentQuery.syntax"
    >
    </cass-syntax-help>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import {
  supportedQueries,
  IQueryHelp,
} from '@/components/cassandra/query/nav/cassandra-syntax';
import CassSyntaxHelp from '@/components/cassandra/query/nav/CassSyntaxHelp.vue';

export default Vue.extend({
  name: 'CassQueryHelp',
  components: { CassSyntaxHelp },
  props: {
    query: {
      type: String,
    },
  },
  data() {
    return {
      supportedQueries,
    };
  },
  computed: {
    currentQuery(): IQueryHelp | undefined {
      return this.supportedQueries.find((item) =>
        this.query.trim().toLowerCase().startsWith(item.keyword.toLowerCase()),
      );
    },
  },
});
</script>
