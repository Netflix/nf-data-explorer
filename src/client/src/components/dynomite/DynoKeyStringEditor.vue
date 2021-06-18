<template>
  <div class="layout vertical">
    <el-form ref="form" :model="value" class="flex padded">
      <dyno-key-name-form-item
        v-model="value.name"
        :cluster-name="clusterName"
        :create="create"
      ></dyno-key-name-form-item>

      <dyno-key-ttl-form-item
        v-if="!create"
        v-model="value"
        :cluster-name="clusterName"
        @ttl-updated="$emit('key-updated')"
        @key-expired="$emit('key-updated')"
      ></dyno-key-ttl-form-item>

      <el-form-item label="Value" prop="value" :rules="stringValueRules">
        <el-input
          v-model="value.value"
          placeholder=""
          @change="onChange"
          @keyup.enter.native="onSave"
        ></el-input>
      </el-form-item>
    </el-form>

    <div class="toolbar layout horizontal border__top justified">
      <div>
        <div
          v-if="isSaving"
          :class="$style.spinnerContainer"
          class="layout horizontal center"
        >
          <font-awesome-icon
            :icon="faSpinner"
            class="spacer__right"
            fixed-width
            spin
          ></font-awesome-icon>
          Saving...
        </div>
      </div>
      <div>
        <el-button :disabled="isSaving" @click="onCancel">
          <font-awesome-icon :icon="faBan" fixed-width></font-awesome-icon>
          Cancel
        </el-button>

        <el-button type="primary" :disabled="isSaving" @click="onSave">
          <font-awesome-icon :icon="faSave" fixed-width></font-awesome-icon>
          Save
        </el-button>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Prop } from 'vue/types/options';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faBan,
  faKey,
  faSave,
  faSpinner,
  faTrashAlt,
} from '@fortawesome/free-solid-svg-icons';
import { Button, Form, FormItem, Input } from 'element-ui';
import { IKeyValue } from '@dynomitetypes/dynomite';
import { createKey, updateKey } from '@/services/dynomite/DynoService';
import { notify } from '@/utils/message-utils';
import { NotificationType } from '@/typings/notifications';
import DynoKeyNameFormItem from '@/components/dynomite/DynoKeyNameFormItem.vue';
import DynoKeyTtlFormItem from '@/components/dynomite/DynoKeyTtlFormItem.vue';

export default Vue.extend({
  name: 'DynoKeyStringEditor',
  components: {
    [Button.name]: Button,
    [Form.name]: Form,
    [FormItem.name]: FormItem,
    [Input.name]: Input,
    DynoKeyNameFormItem,
    DynoKeyTtlFormItem,
    FontAwesomeIcon,
  },
  props: {
    clusterName: {
      type: String,
    },
    create: {
      type: Boolean,
    },
    name: {
      type: String,
    },
    value: {
      type: Object as Prop<IKeyValue>,
    },
  },
  data() {
    return {
      faBan,
      faKey,
      faSave,
      faSpinner,
      faTrashAlt,
      isSaving: false,
    };
  },
  computed: {
    stringValueRules(): any[] {
      return [{ required: true, message: 'Value is required' }];
    },
  },
  methods: {
    onChange() {
      this.$emit('input', this.value);
    },
    onCancel() {
      this.$emit('cancel');
    },
    async onSave() {
      if (await (this.$refs.form as any).validate()) {
        try {
          const { name, value } = this.value;
          this.isSaving = true;
          if (this.create) {
            await createKey(this.clusterName, name, value);
            notify(
              NotificationType.Success,
              'Created Successfully',
              `Created key ${name} successfully.`,
            );
            this.$emit('key-created');
          } else {
            await updateKey(this.clusterName, name, value);
            notify(
              NotificationType.Success,
              'Updated Successfully',
              `Updated key ${name} successfully.`,
            );
            this.$emit('key-updated');
          }
        } finally {
          this.isSaving = false;
        }
      }
    },
  },
});
</script>
<style module>
.spinnerContainer {
  color: var(--color-text);
}
</style>
