<template>
  <el-tooltip content="Datastore" :disabled="disableTooltip">
    <font-awesome-icon :icon="faDatabase" fixed-width></font-awesome-icon>
  </el-tooltip>
</template>
<script lang="ts">
import Vue from 'vue';
import { Tooltip } from 'element-ui';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faDatabase } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
  name: 'CassDatastoreIcon',
  components: {
    [Tooltip.name]: Tooltip,
    FontAwesomeIcon,
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
