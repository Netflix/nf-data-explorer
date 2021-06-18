<template>
  <dyno-key-details
    v-model="keyValue"
    :cluster-name="clusterName"
    :create="true"
  ></dyno-key-details>
</template>
<script lang="ts">
import Vue from 'vue';
import { Form, FormItem, Input } from 'element-ui';
import { IKeyValue } from '@dynomitetypes/dynomite';
import DynoKeyDetails from '@/components/dynomite/DynoKeyDetails.vue';

export default Vue.extend({
  name: 'DynoCreateKeyView',
  components: {
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
    type: {
      type: String,
      required: true,
      default: 'string',
    },
  },
  data() {
    const defaultValue = this.type === 'string' ? '' : [];
    return {
      keyValue: {
        name: '',
        type: this.type,
        value: defaultValue,
        ttl: -1,
      } as IKeyValue,
    };
  },
  watch: {
    type(newType) {
      this.keyValue.type = newType;
    },
  },
});
</script>
