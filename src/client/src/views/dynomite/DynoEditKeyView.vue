<template>
  <div class="full-height">
    <dyno-key-details
      v-if="!isError"
      v-model="keyValue"
      v-loading="isLoading"
      element-loading-text="Loading..."
      class="full-height"
      :cluster-name="clusterName"
      :name="keyName"
      @key-updated="onKeyUpdated"
    ></dyno-key-details>
    <div v-else class="padded">
      <el-alert
        type="warning"
        title="This key could not be found. It may have already been deleted."
        show-icon
        :closable="false"
      ></el-alert>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Alert, Form, FormItem, Input } from 'element-ui';
import { IKeyValue } from '@dynomitetypes/dynomite';
import { getKey } from '@/services/dynomite/DynoService';
import DynoKeyDetails from '@/components/dynomite/DynoKeyDetails.vue';

export default Vue.extend({
  name: 'DynoEditKeyView',
  components: {
    [Alert.name]: Alert,
    [Form.name]: Form,
    [FormItem.name]: FormItem,
    [Input.name]: Input,
    DynoKeyDetails,
  },
  props: {
    clusterName: {
      type: String,
      required: true,
    },
    keyName: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      isLoading: false,
      isError: false,
      keyValue: undefined as IKeyValue | undefined,
    };
  },
  watch: {
    keyName() {
      this.loadKey();
    },
  },
  created() {
    this.loadKey();
  },
  methods: {
    async loadKey() {
      this.isLoading = true;
      this.isError = false;
      try {
        this.keyValue = await getKey(this.clusterName, this.keyName);
      } catch (err) {
        this.isError = true;
      } finally {
        this.isLoading = false;
      }
    },
    onKeyUpdated() {
      this.loadKey();
    },
  },
});
</script>
