<template>
  <el-tooltip content="Column" :disabled="disableTooltip">
    <font-awesome-icon :icon="faColumns" fixed-width></font-awesome-icon>
  </el-tooltip>
</template>
<script lang="ts">
import Vue from 'vue';
import { Tooltip } from 'element-ui';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faColumns } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
  name: 'CassColumnIcon',
  components: {
    FontAwesomeIcon,
    [Tooltip.name]: Tooltip,
  },
  props: {
    disableTooltip: Boolean,
  },
  data() {
    return {
      faColumns,
    };
  },
});
</script>
