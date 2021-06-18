<template>
  <div :class="$style.navContainer" class="layout horizontal center">
    <div v-if="clusterName" :class="$style.dynoKeyCount">
      ({{ dynoKeyCount }} Keys)
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import store from '@/store';
import { getKeyCount } from '@/services/dynomite/DynoService';
import numeral from 'numeral';

export default Vue.extend({
  name: 'DynomiteNav',
  data() {
    return {
      dynoKeyCount: undefined as string | undefined,
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
  watch: {
    clusterName: {
      immediate: true,
      async handler() {
        if (this.clusterName) {
          const count = await getKeyCount(this.clusterName);
          this.dynoKeyCount = numeral(count).format();
        }
      },
    },
  },
});
</script>
<style module>
.navContainer {
  float: left;
  height: 100%;
  line-height: 100%;
}

.dynoKeyCount {
  font-size: 18px;
  color: white;
  text-transform: uppercase;
  font-weight: bold;
}
</style>
