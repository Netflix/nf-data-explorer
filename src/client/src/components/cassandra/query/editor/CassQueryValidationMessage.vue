<template>
  <div>
    <el-alert type="warning" title="" show-icon>
      {{ error.message }}
      <a v-if="helpLink" href="#" @click="onClickLink">{{ helpLink }}</a>
    </el-alert>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Alert } from 'element-ui';
import { Prop } from 'vue/types/options';
import { ValidationError } from '@/components/cassandra/query/editor/CassQueryValidator';
export default Vue.extend({
  name: 'CassQueryValidationMessage',
  components: {
    [Alert.name]: Alert,
  },
  props: {
    error: {
      type: Object as Prop<ValidationError>,
      required: true,
    },
  },
  computed: {
    helpLink(): string | undefined {
      switch (this.error.type) {
        case 'schema':
          return 'View Schema Reference';
        case 'syntax':
          return 'View Syntax Reference';
      }
      return undefined;
    },
  },
  methods: {
    onClickLink() {
      this.$emit('show-help', { error: this.error });
    },
  },
});
</script>
