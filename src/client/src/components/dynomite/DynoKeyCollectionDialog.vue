<template>
  <el-dialog
    ref="dialog"
    :class="$style.dialog"
    :title="create ? 'Add New Field' : 'Edit Field'"
    :modal="false"
    visible
    @close="onClose"
  >
    <el-form :model="value" :rules="rules">
      <el-form-item v-if="type === 'hash'" label="Key" prop="key">
        <el-input v-model="value.key" :disabled="!create" autofocus></el-input>
      </el-form-item>

      <el-form-item v-if="type === 'zset'" label="Score" prop="score">
        <el-input v-model.number="value.score" autofocus></el-input>
      </el-form-item>

      <el-form-item label="Value" prop="value">
        <el-input
          v-model="value.value"
          :autosize="{ minRows: 1, maxRows: 20 }"
          type="textarea"
          :disabled="!create && type === 'zset'"
          autofocus
        ></el-input>
      </el-form-item>
    </el-form>

    <span slot="footer">
      <el-button :disabled="loading" @click="onClose()">Cancel</el-button>
      <el-button :disabled="loading" type="primary" @click="onSubmit()">{{
        create ? 'Create' : 'Update'
      }}</el-button>
    </span>
  </el-dialog>
</template>
<script lang="ts">
import Vue from 'vue';
import { Button, Dialog, Form, FormItem, Input } from 'element-ui';
import { addKeyFields, updateKeyFields } from '@/services/dynomite/DynoService';
import { notify } from '@/utils/message-utils';
import { NotificationType } from '@/typings/notifications';

export default Vue.extend({
  name: 'DynoKeyCollectionDialog',
  components: {
    [Button.name]: Button,
    [Dialog.name]: Dialog,
    [Form.name]: Form,
    [FormItem.name]: FormItem,
    [Input.name]: Input,
  },
  props: {
    clusterName: {
      type: String,
      required: true,
    },
    create: {
      type: Boolean,
    },
    keyName: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      validator: (value: string) => {
        return ['hash', 'list', 'set', 'zset'].includes(value);
      },
    },
    value: {
      type: Object,
    },
    visible: {
      type: Boolean,
    },
  },
  data() {
    return {
      showDialog: true,
      loading: false,
      rules: {
        key: [{ required: true, message: 'Key is required' }],
        score: [
          { required: true, message: 'Score is required' },
          { type: 'number', message: 'Score must be a valid number' },
        ],
        value: [{ required: true, message: 'Value is required' }],
      },
    };
  },
  methods: {
    onClose() {
      this.$emit('close');
    },
    async onSubmit() {
      this.loading = true;
      try {
        if (this.create) {
          await addKeyFields(this.clusterName, this.keyName, this.type, [
            this.value,
          ]);
          notify(
            NotificationType.Success,
            'Added Field',
            `Added new field to ${this.keyName}`,
          );
          this.$emit('create-field');
        } else {
          updateKeyFields(this.clusterName, this.keyName, this.type, [
            this.value,
          ]);
          notify(
            NotificationType.Success,
            "Updated Key's Fields",
            `Updated field on ${this.keyName}`,
          );
          this.$emit('update-field');
        }
      } catch (err) {
        notify(NotificationType.Error, 'Failed to Update Key', err.message);
      } finally {
        this.loading = false;
      }
    },
  },
});
</script>
<style module>
.dialog :global .el-dialog__body {
  padding-top: 0;
  padding-bottom: 0;
}
</style>
