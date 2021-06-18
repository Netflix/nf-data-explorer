<template>
  <div>
    <el-form ref="infoForm" :model="value" :rules="rules">
      <el-form-item label="Table Name" prop="table">
        <el-input v-model="value.table"></el-input>
      </el-form-item>

      <el-form-item label="Table Description" prop="options.comment">
        <el-input v-model="value.options.comment"></el-input>
      </el-form-item>
    </el-form>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Prop } from 'vue/types/options';
import { Form, FormItem, Input } from 'element-ui';
import { ICreateTableOptions } from '@cassandratypes/cassandra';
import { IValidationResult } from '@/typings/validation';
import store from '@/store';

export default Vue.extend({
  name: 'CassCreateTableInfoPage',
  components: {
    [Form.name]: Form,
    [FormItem.name]: FormItem,
    [Input.name]: Input,
  },
  props: {
    value: {
      type: Object as Prop<ICreateTableOptions>,
    },
  },
  computed: {
    keyspaceTables(): Set<string> {
      return new Set(
        store.state.cassandra.explore.keyspaceTables.map((table) => table.name),
      );
    },
    rules(): any {
      const duplicateNameValidator = (
        _rule,
        value: string,
        cb: (error?: Error) => void,
      ) => {
        if (this.keyspaceTables.has(value)) {
          return cb(new Error('Table already exists'));
        }
        cb();
      };
      return {
        table: [
          { required: true, message: 'Table name is required' },
          {
            validator: duplicateNameValidator,
            message: 'A table already exists with the specified name.',
          },
        ],
        'options.comment': [
          {
            required: true,
            message: 'Table description is required',
          },
        ],
      };
    },
  },
  mounted() {
    if (
      this.value.table.length > 0 ||
      (this.value.options.comment && this.value.options.comment.length > 0)
    ) {
      Vue.nextTick(() => {
        this.validate();
      });
    }
  },
  methods: {
    async validate(): Promise<IValidationResult> {
      try {
        (await (this.$refs.infoForm as any).validate()) as boolean;
        return {
          isValid: true,
          message: undefined,
        };
      } catch (err) {
        return {
          isValid: false,
          message: 'Please correct any validation errors to continue',
        };
      }
    },
  },
});
</script>
