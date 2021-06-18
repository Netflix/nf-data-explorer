<template>
  <div
    :class="$style.tablePropertiesEditor"
    class="cass-table-properties-editor full-height layout horizontal"
  >
    <el-menu default-active="general" @select="onSelectCategory">
      <el-menu-item index="general">
        <font-awesome-icon :icon="faInfoCircle"></font-awesome-icon>
        General
      </el-menu-item>
      <el-menu-item index="read">
        <font-awesome-icon :icon="faBookOpen"></font-awesome-icon>
        Read
      </el-menu-item>
      <el-menu-item index="write">
        <font-awesome-icon :icon="faPencilAlt"></font-awesome-icon>
        Write
      </el-menu-item>
    </el-menu>

    <div class="flex padded scroll spacer__left full-height">
      <el-form
        v-if="value"
        v-show="selectedCategory === 'general'"
        :model="value"
        label-position="top"
        class="scroll"
        :rules="validationRules"
        :disabled="disabled"
      >
        <el-form-item
          v-if="!suppressProperties.includes('comment')"
          label="Description"
          prop="comment"
        >
          <el-input v-model="value.comment" @change="onValueChanged"></el-input>
        </el-form-item>

        <el-form-item
          v-if="!suppressProperties.includes('compaction')"
          label="Compaction"
          prop="compaction.class"
        >
          <el-input
            v-model="value.compaction.class"
            @change="onValueChanged"
          ></el-input>
        </el-form-item>

        <template v-if="!suppressProperties.includes('compaction')">
          <el-form-item
            v-for="(optionValue, optionName) in value.compaction.options"
            :key="optionName"
            :label="getDisplayName(optionName)"
          >
            <el-input :value="optionValue"></el-input>
          </el-form-item>
        </template>

        <el-form-item
          v-if="!suppressProperties.includes('defaultTtl')"
          label="Default TTL"
        >
          <el-input
            v-model.number="value.defaultTtl"
            @change="onValueChanged"
          ></el-input>
        </el-form-item>

        <el-form-item label="GC Grace Seconds">
          <el-input-number
            v-model.number="value.gcGraceSeconds"
            :controls="false"
            :min="0"
            @change="onValueChanged"
          ></el-input-number>
        </el-form-item>
      </el-form>

      <el-form
        v-if="value"
        v-show="selectedCategory === 'read'"
        :model="value"
        label-position="top"
        class="scroll"
        :rules="validationRules"
        :disabled="disabled"
      >
        <el-form-item label="Bloom Filter False Positive Chance">
          <el-input-number
            v-model="value.bloomFilterFalsePositiveChance"
            :controls="false"
            :min="0.01"
            :max="1"
            @change="onValueChanged"
          ></el-input-number>
        </el-form-item>

        <el-form-item label="Key Caching">
          <el-select v-if="value.caching" v-model="value.caching.keys">
            <el-option
              v-for="option in cachingOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="Row Caching">
          <el-select v-if="value.caching" v-model="value.caching.rows">
            <el-option
              v-for="option in cachingOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="Read Repair Chance">
          <el-input-number
            v-model.number="value.readRepairChance"
            :controls="false"
            :min="0"
            :max="1"
            @change="onValueChanged"
          ></el-input-number>
        </el-form-item>

        <helpful-form-item
          v-if="!suppressProperties.includes('speculativeRetry')"
          label="Speculative Retry"
        >
          <el-select v-model="value.speculativeRetry" @change="onValueChanged">
            <el-option
              v-for="option in retryOptions"
              :key="option.value"
              :value="option.value"
              >{{ option.label }}</el-option
            >
          </el-select>
          <div slot="help">
            {{ $t('cassandra.speculativeRetry.description') }}
          </div>
        </helpful-form-item>
      </el-form>

      <el-form
        v-if="value && value.compression"
        v-show="selectedCategory === 'write'"
        :model="value"
        label-position="top"
        class="scroll"
        :rules="rulesWriteForm"
        :disabled="disabled"
      >
        <helpful-form-item
          v-if="!suppressProperties.includes('compression.class')"
          label="Compression: Strategy"
          prop="compression.class"
        >
          <el-input
            v-model="value.compression.class"
            @change="onValueChanged"
          ></el-input>
          <div slot="help">{{ $t('help.cassandra.placeholder') }}</div>
        </helpful-form-item>

        <el-form-item
          label="Compression: Chunk Length in KB"
          prop="compression.chunk_length_kb"
        >
          <el-input-number
            v-model.number="value.compression.chunk_length_kb"
            :controls="false"
            :min="0"
            @change="onValueChanged"
          ></el-input-number>
        </el-form-item>

        <el-form-item label="Compression: CRC Check Chance">
          <el-input-number
            v-model="value.compression.crc_check_chance"
            :controls="false"
            :min="0"
            :max="1"
            @change="onValueChanged"
          ></el-input-number>
        </el-form-item>

        <el-form-item label="Mem Table Flush Period">
          <el-input-number
            v-model.number="value.memtableFlushPeriod"
            :controls="false"
            :min="0"
            :max="1"
            @change="onValueChanged"
          ></el-input-number>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Prop } from 'vue/types/options';
import {
  Form,
  FormItem,
  Input,
  InputNumber,
  Menu,
  MenuItem,
  Option,
  Select,
} from 'element-ui';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faInfoCircle,
  faBookOpen,
  faPencilAlt,
} from '@fortawesome/free-solid-svg-icons';
import { ITableProperties, TablePropertyKeys } from '@cassandratypes/cassandra';
import HelpfulFormItem from '@/components/common/HelpfulFormItem.vue';
import startCase from 'lodash.startcase';

export default Vue.extend({
  name: 'CassTablePropertiesEditor',
  components: {
    [Form.name]: Form,
    [FormItem.name]: FormItem,
    [Input.name]: Input,
    [InputNumber.name]: InputNumber,
    [Menu.name]: Menu,
    [MenuItem.name]: MenuItem,
    [Option.name]: Option,
    [Select.name]: Select,
    FontAwesomeIcon,
    HelpfulFormItem,
  },
  props: {
    value: {
      type: Object as Prop<ITableProperties>,
    },
    disabled: {
      type: Boolean,
    },
    suppressProperties: {
      type: Array as Prop<TablePropertyKeys[]>,
      default: () => [],
    },
  },
  data() {
    return {
      faBookOpen,
      faInfoCircle,
      faPencilAlt,
      validationRules: {},
      selectedCategory: 'general',
      rowCaching: undefined as string | undefined,
      retryOptions: [
        {
          label: 'Always',
          value: 'ALWAYS',
        },
        {
          label: '95th Percentile',
          value: '95percentile',
        },
        {
          label: '99th Percentile',
          value: '99percentile',
        },
        {
          label: 'None',
          value: 'NONE',
        },
      ],
      cachingOptions: [
        {
          label: 'All',
          value: 'ALL',
        },
        {
          label: 'None',
          value: 'NONE',
        },
      ],
      rulesWriteForm: {
        'compression.chunk_length_kb': [
          {
            required: true,
            message: 'Chunk length is required',
          },
          {
            validator: (_rule, value: string, cb) => {
              const num = Number.parseInt(value);
              if ((num & (num - 1)) !== 0) {
                return cb(
                  new Error(
                    'Compression chunk length must be a valid power of 2',
                  ),
                );
              }
              cb();
            },
          },
        ],
      },
    };
  },
  methods: {
    getDisplayName(str: string) {
      const nameMapping = {
        sstable_size_in_mb: 'SS Table Size (MB)',
      };
      return nameMapping[str] || startCase(str);
    },
    onSelectCategory(category) {
      this.selectedCategory = category;
    },
    onValueChanged() {
      this.$emit('input', this.value);
      this.$emit('change', this.value);
    },
  },
});
</script>
<style scoped>
.cass-table-properties-editor >>> .el-form {
  max-width: 600px;
  min-height: 420px;
}
</style>
<style module>
.tablePropertiesEditor :global .el-input-number .el-input__inner {
  text-align: right;
}
</style>
