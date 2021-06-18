<template>
  <el-tooltip content="Cluster" :disabled="disableTooltip">
    <font-awesome-icon :icon="faDatabase" fixed-width></font-awesome-icon>
  </el-tooltip>
</template>
<script lang="ts">
import Vue from 'vue';
import { Tooltip } from 'element-ui';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faDatabase } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
  name: 'ClusterIcon',
  components: {
    FontAwesomeIcon,
    [Tooltip.name]: Tooltip,
  },
  props: {
    disableTooltip: Boolean,
  },
  data() {
    return {
      faDatabase,
    };
  },
});
</script>
