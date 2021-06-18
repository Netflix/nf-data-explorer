<template>
  <el-tooltip
    class="keyspace-icon"
    content="Keyspace"
    :disabled="disableTooltip"
  >
    <font-awesome-icon :icon="faLayerGroup" fixed-width></font-awesome-icon>
  </el-tooltip>
</template>
<script lang="ts">
import Vue from 'vue';
import { Tooltip } from 'element-ui';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faLayerGroup } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
  name: 'CassKeyspaceIcon',
  components: {
    [Tooltip.name]: Tooltip,
    FontAwesomeIcon,
  },
  props: {
    disableTooltip: Boolean,
  },
  data() {
    return {
      faLayerGroup,
    };
  },
});
</script>
