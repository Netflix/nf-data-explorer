<template>
  <div class="cass-table-sample-queries padded">
    <div
      v-for="(query, index) in sampleQueries"
      :key="index"
      class="layout horizontal start"
    >
      <cass-sample-query
        :class="$style.query"
        :query="query"
      ></cass-sample-query>
      <div class="ml-4" style="margin-top: 10px;">
        <el-tooltip
          content="Use statement in Query mode"
          placement="bottom-start"
        >
          <router-link
            :to="{
              name: CassandraQuery,
              query: {
                view: 'schema',
                query,
              },
            }"
          >
            <font-awesome-icon :icon="faSearch"></font-awesome-icon>
          </router-link>
        </el-tooltip>
        <copy-text-button
          :value="query"
          style="margin-left: 15px;"
        ></copy-text-button>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Tooltip } from 'element-ui';
import { generateSampleQueries } from '@/utils/cassandra-utils';
import store from '@/store';
import { ITableSchema } from '@cassandratypes/cassandra';
import CassSampleQuery from '@/components/cassandra/CassSampleQuery.vue';
import CopyTextButton from '@/components/common/CopyTextButton.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { Routes } from '@/router/routes';

const { CassandraQuery } = Routes;

export default Vue.extend({
  name: 'CassTableSampleQueriesView',
  components: {
    [Tooltip.name]: Tooltip,
    CassSampleQuery,
    CopyTextButton,
    FontAwesomeIcon,
  },
  data() {
    return {
      faSearch,
      CassandraQuery,
    };
  },
  computed: {
    tableSchema(): ITableSchema | undefined {
      return store.state.cassandra.explore.tableSchema;
    },
    sampleQueries(): string[] {
      if (!this.tableSchema) return [];
      const {
        keyspace,
        name,
        partitionKeys,
        clusteringKeys,
      } = this.tableSchema;
      return generateSampleQueries(
        keyspace,
        name,
        partitionKeys.map((column) => column.name),
        clusteringKeys.map((column) => column.name),
      );
    },
  },
});
</script>
<style module>
.query {
  white-space: pre-wrap;
  margin-top: 20px;
  margin-bottom: 20px;
}
</style>
