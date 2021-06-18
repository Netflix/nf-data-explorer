<template>
  <el-alert type="error" :title="title" show-icon>
    <div class="mb-2">{{ message }}</div>
    <!-- eslint-disable vue/no-v-html -->
    <div v-if="remediation" v-html="remediation"></div>
    <!-- eslint-enable vue/no-v-html -->
  </el-alert>
</template>
<script lang="ts">
import Vue from 'vue';
import { Alert } from 'element-ui';

export default Vue.extend({
  name: 'HttpStatusErrorAlert',
  components: {
    [Alert.name]: Alert,
  },
  props: {
    title: {
      type: String,
    },
    message: {
      type: String,
    },
    remediation: {
      type: String,
    },
  },
});
</script>
