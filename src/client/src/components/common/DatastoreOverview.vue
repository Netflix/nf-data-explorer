<template>
  <div class="full-height layout horizontal">
    <cluster-list
      :data="clusters"
      :loading="loading"
      :type="type"
      :show-shared-icon="type === 'cassandra'"
      class="full-height"
    >
      <div slot="cluster" slot-scope="props">
        <router-link
          :to="{
            name: clusterRouteName,
            params: { clusterName: props.cluster.name },
          }"
          >{{ props.cluster.name }}</router-link
        >
      </div>
    </cluster-list>
    <div class="layout horizontal center" :class="$style.clusterOverview">
      <div class="layout vertical center">
        <img v-if="datastoreDef.imagePath" :src="datastoreDef.imagePath" />
        <font-awesome-icon
          v-else
          :icon="datastoreDef.faIcon"
          :class="$style.faDatastoreIcon"
        ></font-awesome-icon>
        <h1>{{ datastoreDef.name }}</h1>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Prop } from 'vue/types/options';
import ClusterList from '@/components/common/ClusterList.vue';
import { Routes } from '@/router/routes';
import store from '@/store';
import { IClusterRegionSummary } from '@sharedtypes/typings';
import { DatastoreDef, getDatastores } from '@/datastore-definitions';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default Vue.extend({
  name: 'DatastoreOverview',
  components: {
    ClusterList,
    FontAwesomeIcon,
  },
  props: {
    type: {
      type: String as Prop<'dynomite' | 'cassandra'>,
      required: true,
      validator: (value: string) => {
        return ['dynomite', 'cassandra'].includes(value);
      },
    },
    clusterRouteName: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      Routes,
      loading: false,
    };
  },
  computed: {
    datastoreDef(): DatastoreDef {
      return getDatastores()[this.type];
    },
    clusters(): IClusterRegionSummary[] {
      return store.state.config.clusters.filter(
        (cluster) => cluster.type === this.type,
      );
    },
    imagePath(): string | undefined {
      switch (this.type) {
        case 'dynomite':
          return '/images/icon_dynomite.png';
        case 'cassandra':
          return '/images/icon_cassandra.svg';
        default:
          return undefined;
      }
    },
  },
});
</script>
<style module>
.clusterOverview {
  justify-content: center;
  flex: 1;
  background-color: var(--color-background);
  border-left: 1px solid var(--color-border);
}

.faDatastoreIcon {
  color: var(--neutral-500);
  font-size: 60px;
}
</style>
