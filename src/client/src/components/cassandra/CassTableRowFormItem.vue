<template>
  <el-form-item
    :class="$style['form-item']"
    :prop="prop"
    :rules="validationRules"
  >
    <template slot="label">
      <cass-partition-key-icon
        v-if="columnType === 'partition'"
      ></cass-partition-key-icon>
      <cass-clustering-key-icon
        v-if="columnType === 'clustering'"
      ></cass-clustering-key-icon>
      <div>
        <span class="column-name">{{ name }}</span>
        <span :class="$style['column-type']">({{ type }})</span>
      </div>

      <!-- set z-index to ensure tooltip is displayed -->
      <div class="flex" style="z-index: 1;">
        <!-- ttl -->
        <el-tooltip
          v-if="ttl"
          content="Expiration time (TTL) of this value"
          placement="bottom"
          class="mr-4"
        >
          <span>
            <font-awesome-icon :icon="faCalendarTimes"></font-awesome-icon>
            {{ formatTtl(ttl) }}
          </span>
        </el-tooltip>

        <!-- write time -->
        <el-tooltip
          v-if="writetime"
          content="Write time of this value"
          placement="bottom"
        >
          <span>
            <font-awesome-icon :icon="faSave"></font-awesome-icon>
            {{ formatWriteTime(writetime) }}
          </span>
        </el-tooltip>
      </div>
    </template>

    <!-- blob data -->
    <cass-table-row-form-item-blob
      v-if="type === 'blob'"
      v-model="details"
      :name="name"
      :create="create"
      :column-type="columnType"
      @download="$emit('download', $event)"
    ></cass-table-row-form-item-blob>

    <template v-else>
      <el-checkbox
        v-if="dataType === 'boolean'"
        v-model="details.value"
        :label="value ? 'true' : 'false'"
        :disabled="isDisabled"
        @change="onChangeValue"
      ></el-checkbox>

      <template v-else-if="type === 'counter'">
        <label class="spacer__right">Current Value:</label>
        <el-input
          :value="details.value"
          style="width: fit-content;"
          disabled
        ></el-input>

        <label class="spacer__right spacer__left">Increment By:</label>
        <el-input-number
          v-model="counterDelta"
          :step="1"
          placeholder=""
          controls-position="right"
          class="spacer__left"
          @change="onChangeCounter"
        ></el-input-number>
      </template>

      <el-input
        v-else-if="
          dataType === 'number' &&
          (type === 'decimal' || type === 'float' || type === 'double')
        "
        v-model="details.value"
        :disabled="isDisabled"
        controls-position="right"
        @change="onChangeValue"
      ></el-input>

      <el-input-number
        v-else-if="
          dataType === 'number' && type !== 'bigint' && details !== null
        "
        v-model.number="details.value"
        :disabled="isDisabled"
        controls-position="right"
        @change="onChangeValue"
      ></el-input-number>

      <el-input
        v-else-if="type.indexOf('<') >= 0"
        :value="getCollectionRowValueAsString(type, details.value)"
        disabled
      ></el-input>

      <el-input
        v-else-if="isUdtValue"
        :value="JSON.stringify(details.value)"
        disabled
      ></el-input>

      <el-input
        v-else
        v-model="details.value"
        :disabled="isDisabled"
        placeholder=""
        @change="onChangeValue"
      ></el-input>
    </template>

    <el-alert
      v-if="truncated"
      type="warning"
      class="spacer__top"
      :closable="false"
      show-icon
    >
      <div slot="title">
        The value in column <strong>{{ name }}</strong> has been truncated.
        Records with truncated values cannot be updated.
        <div v-if="type.includes('blob')">
          Please choose the Download action to retrieve the full binary content.
        </div>
      </div>
    </el-alert>

    <el-alert
      v-if="type === 'counter' && counterDelta !== 0"
      type="info"
      :title="
        'Saving will ' +
        (counterDelta > 0 ? 'increment' : 'decrement') +
        ' the counter field by ' +
        Math.abs(counterDelta)
      "
      class="spacer__top"
      :closable="false"
      show-icon
    ></el-alert>
  </el-form-item>
</template>
<script lang="ts">
import Vue from 'vue';
import { Prop } from 'vue/types/options';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faCalendarTimes,
  faDownload,
  faEdit,
  faSave,
} from '@fortawesome/free-solid-svg-icons';
import {
  Alert,
  Button,
  Checkbox,
  Form,
  FormItem,
  Input,
  InputNumber,
  Tooltip,
  Upload,
} from 'element-ui';
import { format } from 'date-fns';
import { formatTtl } from '@/utils/cassandra-utils';
import CassPartitionKeyIcon from '@/components/cassandra/icons/CassPartitionKeyIcon.vue';
import CassClusteringKeyIcon from '@/components/cassandra/icons/CassClusteringKeyIcon.vue';
import { getCollectionRowValueAsString } from '@/shared/cassandra/collection-utils';
import { IKeyQueryColumnDetails } from '@cassandratypes/cassandra';
import CassTableRowFormItemBlob from './CassTableRowFormItemBlob.vue';

enum Commands {
  Download = 'Download',
  ViewAsHex = 'ViewAsHex',
}

export default Vue.extend({
  name: 'CassTableRowFormItem',
  components: {
    [Alert.name]: Alert,
    [Button.name]: Button,
    [Checkbox.name]: Checkbox,
    [Input.name]: Input,
    [InputNumber.name]: InputNumber,
    [Form.name]: Form,
    [FormItem.name]: FormItem,
    [Tooltip.name]: Tooltip,
    [Upload.name]: Upload,
    FontAwesomeIcon,
    CassPartitionKeyIcon,
    CassClusteringKeyIcon,
    CassTableRowFormItemBlob,
  },
  props: {
    // the type of column partition/clustering/column
    columnType: {
      type: String,
      validator: (value: string) => {
        return ['partition', 'clustering', 'column'].includes(value);
      },
    },
    // the name of the column
    name: {
      type: String as Prop<string>,
      required: true,
    },
    prop: {
      type: String,
      required: true,
    },
    // the C* data type
    type: {
      type: String as Prop<string>,
      required: true,
    },
    // the JS data type (e.g. for `type` int, `dataType` should be number)
    dataType: {
      type: String,
      required: true,
    },
    // the value object to bind to for use with `v-model`.
    value: {
      type: Object as Prop<IKeyQueryColumnDetails>,
    },
    // any TTL value associated with this field
    /* eslint-disable-next-line vue/require-prop-types */
    ttl: {},
    // any writetime value associated with this field
    /* eslint-disable-next-line vue/require-prop-types */
    writetime: {},
    create: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    truncated: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    const details: IKeyQueryColumnDetails = this.value;
    if (this.type === 'boolean' && details.value === undefined) {
      details.value = false;
      this.$emit('input', details);
    }
    return {
      faCalendarTimes,
      faDownload,
      faEdit,
      faSave,
      Commands,
      validPattern: undefined as string | undefined,
      details,
      counterDelta: 0,
    };
  },
  computed: {
    isDisabled(): boolean {
      return !!this.disabled || (!this.create && this.columnType !== 'column');
    },
    isUdtValue(): boolean {
      return this.type === 'udt' && typeof this.value === 'object';
    },
    allowBlobEdit(): boolean {
      return (
        this.type === 'blob' &&
        (this.create || (!this.create && this.columnType === 'column'))
      );
    },
    validationRules(): any[] {
      const rules = [] as any[];
      if (this.columnType !== 'column') {
        rules.push({
          required: true,
          message: 'This field is required',
        });
      }
      switch (this.type) {
        case 'boolean':
          break;
        case 'decimal':
        case 'double':
        case 'float':
          rules.push({
            trigger: 'change',
            message: 'Expects a valid floating point number',
            validator: (_rule, details: IKeyQueryColumnDetails, cb) => {
              const { value } = details;
              if (
                value !== undefined &&
                value !== null &&
                Number.isNaN(parseInt(value))
              ) {
                return cb(new Error('Expects a valid floating point number'));
              }
              cb();
            },
          });
          break;
        case 'int':
        case 'smallint':
        case 'tinyint':
          rules.push({
            trigger: 'change',
            message: 'Expects a valid integer',
            validator: (_rule, details: IKeyQueryColumnDetails, cb) => {
              const { value } = details;
              if (
                value !== undefined &&
                value !== null &&
                Number.isNaN(parseInt(value))
              ) {
                return cb(new Error('Expects a valid integer'));
              }
              cb();
            },
          });
          break;
        case 'blob':
          rules.push({
            trigger: 'change',
            message: 'Expects a value and encoding',
            validator: (_rule, details: IKeyQueryColumnDetails, cb) => {
              const { options, value } = details;
              const { encoding } = options;
              if (value && !encoding) {
                return cb(new Error('Expects a value and encoding'));
              }
              cb();
            },
          });
          break;
        default:
          break;
      }
      return rules;
    },
  },
  methods: {
    getCollectionRowValueAsString,
    formatTtl,
    formatWriteTime(writeTime: string) {
      return format(parseInt(writeTime, 10) / 1000, 'MM/dd/yyyy HH:mm:ss');
    },
    onChangeCounter(value) {
      this.$emit('input', {
        value: `${this.name}+${value}`,
        options: this.value.options,
      });
    },
    onChangeValue() {
      this.$emit('input', this.value);
    },
  },
});
</script>
<style module>
.column-type {
  color: var(--color-text-subdued);
  margin-left: 8px;
}

.form-item > label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.form-item > label svg {
  vertical-align: middle;
  margin-right: 5px;
}
</style>
