<template>
  <el-tooltip :content="getClusteringKeyLabel(sort)" :disabled="disableTooltip">
    <div style="display: inline-block;">
      <font-awesome-icon :icon="faList" fixed-width></font-awesome-icon>
      <font-awesome-icon
        v-if="sort"
        :icon="sort.toUpperCase() === 'ASC' ? faSortAmountUp : faSortAmountDown"
        class="spacer__left"
        fixed-width
      ></font-awesome-icon>
    </div>
  </el-tooltip>
</template>
<script lang="ts">
import Vue from 'vue';
import { Tooltip } from 'element-ui';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faList,
  faSortAmountDown,
  faSortAmountUp,
} from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
  name: 'CassClusteringKeyIcon',
  components: {
    [Tooltip.name]: Tooltip,
    FontAwesomeIcon,
  },
  props: {
    disableTooltip: Boolean,
    sort: {
      type: String,
      validator(value: string) {
        return !!value && ['ASC', 'DESC'].indexOf(value.toUpperCase()) !== -1;
      },
    },
  },
  data() {
    return {
      faList,
      faSortAmountDown,
      faSortAmountUp,
    };
  },
  methods: {
    getClusteringKeyLabel(sort: string): string {
      const suffix = sort
        ? sort.toUpperCase() === 'ASC'
          ? '(ascending)'
          : '(descending)'
        : '';
      return `Clustering Key ${suffix}`;
    },
  },
});
</script>
