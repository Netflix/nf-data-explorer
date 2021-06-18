<template>
  <el-dialog
    :class="$style.dialog"
    visible
    :close-on-click-modal="false"
    :modal="false"
    @close="onClose"
  >
    <span slot="title" class="el-dialog__title layout horizontal center">
      <font-awesome-icon
        :icon="faClock"
        class="spacer__right"
        fixed-width
      ></font-awesome-icon>
      Expiration
    </span>

    <div>
      Keys can be configured to expire automatically after a specified duration.
    </div>
    <el-checkbox
      v-model="ttlForm.expires"
      label="Expires"
      class="spacer__top"
      autofocus
    ></el-checkbox>
    <el-form
      ref="form"
      v-loading="isLoading"
      :model="ttlForm"
      class="padded"
      :disabled="!ttlForm.expires"
      :rules="rules"
      element-loading-text="Loading..."
      inline
    >
      <el-form-item label="Time" prop="time">
        <el-input
          v-model.number="ttlForm.time"
          :class="$style.timeInput"
        ></el-input>
      </el-form-item>
      <el-select v-model="ttlForm.units" filterable>
        <el-option
          v-for="unit in units"
          :key="unit"
          :label="unit"
          :value="unit"
        ></el-option>
      </el-select>
    </el-form>

    <el-alert
      v-if="ttlValue > 0 && ttlValue < 10 * 60"
      type="warning"
      title="This key will expire very soon"
      show-icon
      :closable="false"
    ></el-alert>

    <span slot="footer">
      <el-button :disabled="isLoading" @click="onClose()">Cancel</el-button>
      <el-button :disabled="isLoading" type="primary" @click="onSubmit()"
        >Update</el-button
      >
    </span>
  </el-dialog>
</template>
<script lang="ts">
import Vue from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faClock } from '@fortawesome/free-regular-svg-icons';

import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  Form,
  FormItem,
  Input,
  InputNumber,
  Option,
  Select,
} from 'element-ui';
import { getKey, updateTtl } from '@/services/dynomite/DynoService';
import { notify } from '@/utils/message-utils';
import { NotificationType } from '@/typings/notifications';

export default Vue.extend({
  name: 'DynoKeyTtlEditor',
  components: {
    [Alert.name]: Alert,
    [Button.name]: Button,
    [Checkbox.name]: Checkbox,
    [Dialog.name]: Dialog,
    [Form.name]: Form,
    [FormItem.name]: FormItem,
    [Input.name]: Input,
    [InputNumber.name]: InputNumber,
    [Option.name]: Option,
    [Select.name]: Select,
    FontAwesomeIcon,
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
      faClock,
      isLoading: false,
      ttlForm: {
        expires: false,
        time: 0,
        units: 'seconds' as 'seconds' | 'minutes' | 'hours',
      },
      units: ['seconds', 'minutes', 'hours'],
      showExpirationWarning: false,
    };
  },
  computed: {
    rules(): any {
      return {
        time: [
          {
            required: true,
            message: 'An expiration duration must be specified',
          },
          { type: 'number', message: 'Expiration must be a valid number' },
        ],
      };
    },
    ttlValue: {
      get(): number {
        const { expires, time, units } = this.ttlForm;
        if (!expires) return -1;
        let value = 0;
        switch (units) {
          case 'hours':
            value = time * 60 * 60;
            break;
          case 'minutes':
            value = time * 60;
            break;
          default:
            value = time;
        }
        return value;
      },
      set(value: number) {
        let expires = false;
        let time = 0;
        let units = 'seconds' as 'seconds' | 'minutes' | 'hours';
        if (value && value >= 0) {
          expires = true;
          if (value % (60 * 60) === 0) {
            time = value / (60 * 60);
            units = 'hours';
          } else if (value % 60 === 0) {
            time = value / 60;
            units = 'minutes';
          } else {
            time = value;
            units = 'seconds';
          }
        }
        this.ttlForm = {
          expires,
          time,
          units,
        };
      },
    },
  },
  async created() {
    this.isLoading = true;
    try {
      const key = await getKey(this.clusterName, this.keyName);
      this.ttlValue = key.ttl;
    } catch (err) {
      notify(
        NotificationType.Error,
        'Failed to Fetch Key Expiration',
        err.message,
      );
    } finally {
      this.isLoading = false;
    }
  },
  methods: {
    onClose() {
      this.$emit('close');
    },
    async onSubmit() {
      if (!(await (this.$refs.form as any).validate())) {
        return;
      }
      this.isLoading = true;
      try {
        await updateTtl(this.clusterName, this.keyName, this.ttlValue);
        notify(
          NotificationType.Success,
          'Updated Expiration',
          `Updated expiration of ${this.keyName}`,
        );
        this.$emit('updated-ttl');
      } catch (err) {
        notify(
          NotificationType.Error,
          'Failed to Update Expiration',
          err.message,
        );
      } finally {
        this.isLoading = false;
      }
    },
  },
});
</script>
<style module>
.dialog :global .el-dialog {
  width: 500px;
}

.dialog :global .el-dialog__body {
  padding-top: 0;
  padding-bottom: 0;
}

.timeInput input {
  text-align: end;
  width: 175px;
}
</style>
