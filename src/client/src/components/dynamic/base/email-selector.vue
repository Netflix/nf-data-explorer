<template>
  <el-input
    v-model="inputValue"
    placeholder="Enter an email"
    @input="onInput"
  ></el-input>
</template>
<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
  name: 'EmailSelector',
  props: {
    value: {
      type: String,
    },
  },
  data() {
    return {
      inputValue: this.value,
    };
  },
  watch: {
    value(newValue) {
      this.inputValue = newValue;
    },
  },
  methods: {
    onInput(value) {
      this.$emit('input', value);
    },
  },
});
</script>
