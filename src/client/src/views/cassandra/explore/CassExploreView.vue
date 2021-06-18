<template>
  <div class="explore-view layout vertical full-height">
    <template v-if="!error">
      <cass-breadcrumbs></cass-breadcrumbs>
      <keep-alive
        :exclude="['CassCreateTableView', 'CassCreateTableAdvancedView']"
      >
        <router-view class="flex"></router-view>
      </keep-alive>
    </template>
    <div v-else class="padded">
      <http-status-error-alert
        :title="error.title"
        :message="error.message"
        :remediation="error.remediation"
      ></http-status-error-alert>
      <router-link :to="{ name: Routes.CassandraClusters }"
        >Return to the cluster list</router-link
      >
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Alert } from 'element-ui';
import CassBreadcrumbs from '@/components/cassandra/CassBreadcrumbs.vue';
import HttpStatusErrorAlert from '@/components/common/HttpStatusErrorAlert.vue';
import { ActionTypes } from '@/store/actions';
import HttpStatusError from '@/models/errors/HttpStatusError';
import { Routes } from '@/router/routes';

export default Vue.extend({
  name: 'CassExploreView',
  components: {
    [Alert.name]: Alert,
    CassBreadcrumbs,
    HttpStatusErrorAlert,
  },
  props: {
    clusterName: {
      type: String,
    },
    keyspaceName: {
      type: String,
    },
  },
  data() {
    return {
      Routes,
      error: undefined as HttpStatusError | undefined,
    };
  },
  watch: {
    clusterName(cluster) {
      if (cluster) {
        this.fetchClusterInfo();
      }
    },
  },
  mounted() {
    this.fetchClusterInfo();
  },
  methods: {
    async fetchClusterInfo() {
      const cluster = this.clusterName;
      try {
        this.error = undefined;
        await Promise.all([
          this.$store.dispatch(ActionTypes.FetchKeyspaces, { cluster }),
          this.$store.dispatch(ActionTypes.FetchDatacenters, { cluster }),
          this.$store.dispatch(ActionTypes.FetchClusterInfo, { cluster }),
        ]);
      } catch (err) {
        this.error = err;
      }
    },
  },
});
</script>
