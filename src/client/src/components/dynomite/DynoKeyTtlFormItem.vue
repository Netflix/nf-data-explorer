<template>
  <el-form-item label="TTL">
    <div class="clear__left layout horizontal center">
      <dyno-key-ttl-field
        v-model="value.ttl"
        @key-expired="$emit('key-expired')"
      ></dyno-key-ttl-field>
      <a href="#" class="spacer__left" @click="showTtlEditor = true"
        >Edit expiration...</a
      >
    </div>
    <dyno-key-ttl-editor
      v-if="showTtlEditor"
      :cluster-name="clusterName"
      :key-name="value.name"
      @close="showTtlEditor = false"
      @updated-ttl="onUpdateTtl"
    ></dyno-key-ttl-editor>
  </el-form-item>
</template>
<script lang="ts">
import Vue from 'vue';
import { Prop } from 'vue/types/options';
import { Button, Form, FormItem, Input } from 'element-ui';
import DynoKeyTtlEditor from '@/components/dynomite/DynoKeyTtlEditor.vue';
import DynoKeyTtlField from '@/components/dynomite/DynoKeyTtlField.vue';
import { IKeyValue } from '@dynomitetypes/dynomite';

export default Vue.extend({
  name: 'DynoKeyTtlFormItem',
  components: {
    [Button.name]: Button,
    [Form.name]: Form,
    [FormItem.name]: FormItem,
    [Input.name]: Input,
    DynoKeyTtlEditor,
    DynoKeyTtlField,
  },
  props: {
    clusterName: {
      type: String,
      required: true,
    },
    value: {
      type: Object as Prop<IKeyValue>,
    },
  },
  data() {
    return {
      showTtlEditor: false,
    };
  },
  methods: {
    onUpdateTtl() {
      this.showTtlEditor = false;
      this.$emit('ttl-updated');
    },
  },
});
</script>
