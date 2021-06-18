<template>
  <splitpanes class="default-theme flex full-height" layout="vertical">
    <pane min-size="20" size="30" max-size="50">
      <dyno-key-browser
        :cluster-name="clusterName"
        class="full-width full-height"
      ></dyno-key-browser>
    </pane>
    <pane>
      <router-view class="full-height"></router-view>
    </pane>
  </splitpanes>
</template>
<script lang="ts">
import Vue from 'vue';
import ClusterList from '@/components/common/ClusterList.vue';
import DynoKeyBrowser from '@/components/dynomite/DynoKeyBrowser.vue';
import { Splitpanes, Pane } from 'splitpanes';

export default Vue.extend({
  name: 'DynoClusterView',
  components: {
    ClusterList,
    DynoKeyBrowser,
    Splitpanes,
    Pane,
  },
  props: {
    clusterName: {
      type: String,
    },
  },
  data() {
    return {
      loading: false,
    };
  },
});
</script>
