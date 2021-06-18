<template>
  <el-form-item label="Key Name" prop="name" :rules="keyNameRules">
    <el-input
      ref="keyNameInput"
      v-model="keyName"
      placeholder=""
      :disabled="!create"
      @change="onChange"
      @input="onChange"
    ></el-input>
  </el-form-item>
</template>
<script lang="ts">
import Vue from 'vue';
import { FormItem, Input } from 'element-ui';
import { keyExists } from '@/services/dynomite/DynoService';

export default Vue.extend({
  name: 'DynoKeyNameFormItem',
  components: {
    [FormItem.name]: FormItem,
    [Input.name]: Input,
  },
  props: {
    clusterName: {
      type: String,
    },
    create: {
      type: Boolean,
    },
    value: {
      type: String,
    },
  },
  data() {
    return {
      keyName: this.value,
    };
  },
  computed: {
    /* eslint-disable vue/no-async-in-computed-properties */
    keyNameRules(): any[] {
      const rules: any[] = [{ required: true, message: 'Name is required' }];
      if (this.create) {
        rules.push({
          message: 'A key with this name already exists.',
          trigger: 'change',
          validator: async (
            _rule,
            value: string,
            cb: (error?: Error) => void,
          ) =>
            (await keyExists(this.clusterName, value))
              ? cb(new Error('Key already exists'))
              : cb(),
        });
      }
      return rules;
    },
    /* eslint-enable vue/no-async-in-computed-properties */
  },
  watch: {
    value(newValue) {
      this.keyName = newValue;
    },
  },
  mounted() {
    if (this.create) {
      (this.$refs.keyNameInput as any).focus();
    }
  },
  methods: {
    onChange() {
      this.$emit('input', this.keyName);
    },
  },
});
</script>
