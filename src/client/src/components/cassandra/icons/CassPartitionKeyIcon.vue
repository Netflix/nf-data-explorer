<template>
  <el-tooltip content="Partition Key">
    <font-awesome-icon
      :icon="faChartPie"
      :disabled="disableTooltip"
      fixed-width
    ></font-awesome-icon>
  </el-tooltip>
</template>
<script lang="ts">
import Vue from 'vue';
import { Tooltip } from 'element-ui';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faChartPie } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
  name: 'CassPartitionKeyIcon',
  components: {
    [Tooltip.name]: Tooltip,
    FontAwesomeIcon,
  },
  props: {
    disableTooltip: Boolean,
  },
  data() {
    return {
      faChartPie,
    };
  },
});
</script>
