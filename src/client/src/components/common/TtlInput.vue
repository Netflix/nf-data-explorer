<template>
  <el-form inline :class="$style.form">
    <el-form-item label="">
      <el-checkbox
        v-model="expires"
        label="Expires"
        @change="onChangeExpires"
      ></el-checkbox>
    </el-form-item>

    <template v-if="expires">
      <el-form-item label="">
        <el-input-number
          v-model="ttlDisplayValue"
          controls-position="right"
          placeholder=""
          :min="1"
          :disabled="!expires"
        ></el-input-number>
      </el-form-item>

      <el-form-item>
        <el-select v-model="ttlDisplayUnits" :disabled="!expires">
          <el-option
            v-for="unit in availableUnits"
            :key="unit"
            :label="unit | capitalize"
            :value="unit"
          ></el-option>
        </el-select>
      </el-form-item>
    </template>

    <div v-if="showSecondsSuffix" :class="$style.ttlInSeconds" class="mt-2">
      {{ ttlDisplaySeconds | formatNumber }} seconds
    </div>
  </el-form>
</template>
<script lang="ts">
import Vue from 'vue';
import {
  Checkbox,
  Form,
  FormItem,
  Input,
  InputNumber,
  Select,
  Option,
} from 'element-ui';
import { capitalize, formatNumber } from '@/filters';

type TimeUnit = 'seconds' | 'minutes' | 'hours' | 'days';

export default Vue.extend({
  name: 'TtlInput',
  components: {
    [Checkbox.name]: Checkbox,
    [Form.name]: Form,
    [FormItem.name]: FormItem,
    [Input.name]: Input,
    [InputNumber.name]: InputNumber,
    [Option.name]: Option,
    [Select.name]: Select,
  },
  filters: {
    capitalize,
    formatNumber,
  },
  props: {
    value: {
      type: Number,
    },
  },
  data() {
    return {
      expires: true,
      ttlDisplayValue: 0,
      ttlDisplayUnits: 'seconds' as TimeUnit,
      availableUnits: ['seconds', 'minutes', 'hours', 'days'] as TimeUnit[],
    };
  },
  computed: {
    ttlDisplaySeconds(): number {
      let value = 0;
      switch (this.ttlDisplayUnits) {
        case 'days':
          value = this.ttlDisplayValue * 60 * 60 * 24;
          break;
        case 'hours':
          value = this.ttlDisplayValue * 60 * 60;
          break;
        case 'minutes':
          value = this.ttlDisplayValue * 60;
          break;
        case 'seconds':
        default:
          value = this.ttlDisplayValue;
          break;
      }
      this.$emit('input', value);
      return value;
    },
    showSecondsSuffix(): boolean {
      return (
        this.expires &&
        this.ttlDisplaySeconds > 0 &&
        this.ttlDisplayUnits !== 'seconds'
      );
    },
  },
  watch: {
    value: {
      immediate: true,
      handler(seconds) {
        let value = 0;
        if (seconds % (60 * 60 * 24) === 0) {
          value = seconds / (60 * 60 * 24);
          this.ttlDisplayUnits = 'days';
        } else if (seconds % (60 * 60) === 0) {
          value = seconds / (60 * 60);
          this.ttlDisplayUnits = 'hours';
        } else if (seconds % 60 === 0) {
          value = seconds / 60;
          this.ttlDisplayUnits = 'minutes';
        } else {
          value = seconds;
          this.ttlDisplayUnits = 'seconds';
        }
        this.ttlDisplayValue = value;
      },
    },
  },
  methods: {
    onChangeExpires(expires) {
      this.$emit('input', expires ? 86400 : 0);
    },
  },
});
</script>
<style module>
.form :global .el-form-item {
  margin-bottom: 0;
}

.ttlInSeconds {
  color: var(--neutral-300);
  display: inline-block;
}
</style>
