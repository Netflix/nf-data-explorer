<template>
  <div :class="$style.navContainer">
    <el-menu-item :index="`/cassandra/clusters/${clusterName}/explore`">
      <font-awesome-icon :icon="faCompass" fixed-width></font-awesome-icon>
      Explore
    </el-menu-item>
    <el-menu-item
      :index="`/cassandra/clusters/${clusterName}/query?view=schema`"
    >
      <font-awesome-icon :icon="faSearch" fixed-width></font-awesome-icon> Query
    </el-menu-item>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { MenuItem } from 'element-ui';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faCompass,
  faExternalLinkAlt,
  faSearch,
} from '@fortawesome/free-solid-svg-icons';
import store from '@/store';

export default Vue.extend({
  name: 'CassandraNav',
  components: {
    [MenuItem.name]: MenuItem,
    FontAwesomeIcon,
  },
  data() {
    return {
      faCompass,
      faExternalLinkAlt,
      faSearch,
    };
  },
  computed: {
    currentCluster(): string | undefined {
      return store.state.config.currentCluster;
    },
    clusterName(): string | undefined {
      return this.currentCluster;
    },
  },
});
</script>
<style module>
.navContainer {
  float: left;
}

.navContainer :global .el-menu-item {
  float: left;
}
</style>
