<template>
  <el-select
    :value="currentValue"
    :required="required"
    placeholder="Choose encoding"
    filterable
    :disabled="disabled"
    @input="onInput"
    @change="onChange"
  >
    <el-option
      v-for="encoding in encodings"
      :key="encoding.value"
      :label="encoding.label"
      :value="encoding.value"
    ></el-option>
  </el-select>
</template>
<script lang="ts">
import Vue from 'vue';
import { Option, Select } from 'element-ui';

export default Vue.extend({
  name: 'CassEncodingDropdown',
  components: {
    [Option.name]: Option,
    [Select.name]: Select,
  },
  props: {
    value: {
      type: String,
    },
    emptyText: {
      type: String,
      default: 'Unencoded',
    },
    required: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    const encodings = new Array<{
      label: string;
      value: string | undefined;
    }>();
    if (!this.required) {
      encodings.push({ label: this.emptyText, value: undefined });
    }
    encodings.push(
      { label: 'ascii', value: 'ascii' },
      { label: 'base64', value: 'base64' },
      { label: 'hex', value: 'hex' },
      { label: 'utf-8', value: 'utf-8' },
    );

    return {
      currentValue: this.value,
      encodings,
    };
  },
  watch: {
    value(newValue) {
      this.currentValue = newValue;
    },
  },
  methods: {
    onInput(value) {
      this.$emit('input', value);
    },
    onChange(value) {
      this.$emit('change', value);
    },
  },
});
</script>
