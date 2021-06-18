<template>
  <el-tooltip content="Table" :disabled="disableTooltip">
    <font-awesome-icon :icon="faTable" fixed-width></font-awesome-icon>
  </el-tooltip>
</template>
<script lang="ts">
import Vue from 'vue';
import { Tooltip } from 'element-ui';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faTable } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
  name: 'CassTableIcon',
  components: {
    [Tooltip.name]: Tooltip,
    FontAwesomeIcon,
  },
  props: {
    disableTooltip: Boolean,
  },
  data() {
    return {
      faTable,
    };
  },
});
</script>
