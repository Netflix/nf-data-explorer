<template>
  <div ref="container" class="copy-text-button">
    <el-button type="text" @click="onCopy">
      <font-awesome-icon :icon="faCopy" />
    </el-button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { Button } from 'element-ui';
import { copyToClipboard } from '@/utils/clipboard-utils';
import { faCopy } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
  name: 'CopyTextButton',
  components: {
    FontAwesomeIcon,
    [Button.name]: Button,
  },
  props: {
    value: {
      type: String,
      required: true,
    },
    notify: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  data() {
    return {
      faCopy,
    };
  },
  methods: {
    onCopy(): void {
      copyToClipboard(this.value, this.$refs.container as HTMLElement, true);
    },
  },
});
</script>

<style scoped>
.copy-text-button {
  display: inline-block;
  margin-left: 5px;
}

.el-button {
  font-size: 16px;
}
</style>
