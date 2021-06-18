<template>
  <el-tooltip content="Thrift-based table" :disabled="disableTooltip">
    <font-awesome-icon :icon="faLandmark" fixed-width></font-awesome-icon>
  </el-tooltip>
</template>
<script lang="ts">
import Vue from 'vue';
import { Tooltip } from 'element-ui';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faLandmark } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
  name: 'CassTableThriftIcon',
  components: {
    [Tooltip.name]: Tooltip,
    FontAwesomeIcon,
  },
  props: {
    disableTooltip: Boolean,
  },
  data() {
    return {
      faLandmark,
    };
  },
});
</script>
