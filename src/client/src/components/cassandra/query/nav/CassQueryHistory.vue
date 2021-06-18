<template>
  <div class="layout vertical" style="overflow: hidden;">
    <div v-for="group in groupedQueries" :key="group.name">
      <h3 :class="$style.groupHeader">{{ group.name }}</h3>
      <el-table
        :data="group.entries"
        class="bordered flex scroll spacer__top"
        style="max-height: 250px;"
        :show-header="false"
      >
        <el-table-column label="Recent Queries" prop="query">
          <template slot-scope="props">
            <div class="layout horizontal justified">
              <cass-sample-query
                :class="$style.sampleQuery"
                :query="props.row.query"
                @select="onSelectQuery"
              >
              </cass-sample-query>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Table, TableColumn } from 'element-ui';
import { IRecentQuery } from '@/utils/recent-queries-utils';
import CassSampleQuery from '@/components/cassandra/CassSampleQuery.vue';
import { Routes } from '@/router/routes';
import { enUS } from 'date-fns/esm/locale';
import { formatRelative, getTime, startOfDay } from 'date-fns';
import store from '@/store';
import { ActionTypes } from '@/store/actions';

const formatRelativeLocale = {
  lastWeek: "'last' eeee",
  yesterday: "'yesterday'",
  today: "'today'",
  tomorrow: "'tomorrow at' p",
  nextWeek: "eeee 'at' p",
  other: 'MMM d',
};

interface IGroupedHistory {
  name: string;
  timestamp: number;
  entries: IRecentQuery[];
}

export default Vue.extend({
  name: 'CassQueryHistory',
  components: {
    [Table.name]: Table,
    [TableColumn.name]: TableColumn,
    CassSampleQuery,
  },
  props: {
    clusterName: {
      type: String,
      required: true,
    },
  },
  computed: {
    queryHistory(): IRecentQuery[] {
      return store.state.cassandra.query.queryHistory;
    },
    groupedQueries() {
      const dayToQueriesMap = new Map<
        string,
        {
          timestamp: number;
          entries: IRecentQuery[];
        }
      >();

      this.queryHistory.forEach((item) => {
        const dayTimestamp = getTime(startOfDay(item.timestamp));
        const relative = formatRelative(dayTimestamp, Date.now(), {
          locale: {
            ...enUS,
            formatRelative: (token) => formatRelativeLocale[token],
          },
        });

        let dayGroup = dayToQueriesMap.get(relative);
        if (!dayGroup) {
          const timestamp = dayTimestamp;
          dayGroup = { timestamp, entries: [] };
          dayToQueriesMap.set(relative, dayGroup);
        }
        dayGroup.entries.push(item);
      });

      const groups = new Array<IGroupedHistory>();
      for (const [name, groupValue] of dayToQueriesMap) {
        const { timestamp, entries } = groupValue;
        groups.push({
          name,
          timestamp,
          entries: entries.sort((a, b) => b.timestamp - a.timestamp),
        });
      }
      return groups.sort((a, b) => b.timestamp - a.timestamp);
    },
  },
  watch: {
    clusterName: {
      immediate: true,
      handler(cluster: string) {
        store.dispatch(ActionTypes.LoadQueryHistory, { cluster });
      },
    },
  },
  methods: {
    onSelectQuery(selectedQuery: string) {
      const query = JSON.parse(JSON.stringify(this.$route.query));
      query['query'] = selectedQuery;
      this.$router.push({
        name: Routes.CassandraQuery,
        params: this.$route.params,
        query,
      });
    },
  },
});
</script>
<style module>
.sampleQuery {
  cursor: pointer;
  width: 100%;
}

.groupHeader {
  text-transform: capitalize;
}
</style>
