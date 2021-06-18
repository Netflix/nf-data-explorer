<template>
  <div class="layout vertical scroll">
    <el-form :model="value" label-position="top">
      <el-form-item label="Automatically Expiring Data (TTL in seconds)">
        <el-input-number
          v-model="value.options.defaultTtl"
          controls-position="right"
        >
        </el-input-number>
        <el-popover
          placement="top-start"
          title="Automatic Expiring Data (TTL)"
          width="400"
          trigger="hover"
          content="TTLs are a very efficient way to delete data in Cassandra, so if you're only interested in having your data for a fixed period of time a TTL can help you avoid costly tombstones and the performance impact they cause."
        >
          <font-awesome-icon
            slot="reference"
            class="spacer__left"
            :icon="faQuestionCircle"
            >help</font-awesome-icon
          >
        </el-popover>
      </el-form-item>

      <el-form-item label="Compression">
        <div class="layout horizontal">
          <label class="spacer__right">Space Savings</label>
          <el-slider
            v-model="compressionValue"
            class="spacer__left spacer__right"
            style="display: inline-block; width: 200px;"
            :step="1"
            :min="0"
            :max="2"
            :show-tooltip="false"
            show-stops
          >
          </el-slider>
          <label class="spacer__left spacer__right">Read CPU Usage</label>
          <strong>{{ compressionNames[compressionValue].label }}</strong>
          <el-popover
            placement="top-start"
            title="Compression"
            width="400"
            trigger="hover"
            content="Compression helps your performance by fitting more data into the same amount of OS disk cache. The default of LZ4 is likely the right general choice. However, if your data does not compress well (maybe it's already compressed) you can get better performance by disabling compression. Alternatively if you just want to store massive amounts of data and are not particularly read latency sensitive you can choose Deflate which gets a better compression ratio at the cost of more CPU."
          >
            <font-awesome-icon
              slot="reference"
              class="spacer__left"
              :icon="faQuestionCircle"
              >help</font-awesome-icon
            >
          </el-popover>
        </div>
      </el-form-item>

      <helpful-form-item label="Speculative Retry">
        <el-select v-model="value.options.speculativeRetry" :disabled="isTWCS">
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

    <el-checkbox
      v-model="showAdvanced"
      label="Enable Advanced Settings"
    ></el-checkbox>

    <cass-table-properties-editor
      v-if="showAdvanced"
      v-model="advancedData"
      :suppress-properties="suppressProperties"
      class="flex border__top spacer__top"
      @change="onUpdateSettings"
    ></cass-table-properties-editor>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Prop } from 'vue/types/options';
import {
  Checkbox,
  Form,
  FormItem,
  Input,
  InputNumber,
  Option,
  Popover,
  RadioGroup,
  RadioButton,
  Select,
  Slider,
} from 'element-ui';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import {
  ICreateTableOptions,
  ITableProperties,
  TablePropertyKeys,
} from '@cassandratypes/cassandra';
import CassTablePropertiesEditor from '@/components/cassandra/CassTablePropertiesEditor.vue';
import {
  mergeTableProperties,
  getDefaultTableProperties,
} from '@/utils/tableproperties-utils';
import HelpfulFormItem from '@/components/common/HelpfulFormItem.vue';

const defaultSimpleData = getDefaultTableProperties();

const defaultAdvancedData = {
  bloomFilterFalsePositiveChance: 0.01,
  caching: {
    keys: 'ALL',
    rows: 'NONE',
  },
  comment: '',
  compaction: {},
  compression: {
    class: 'LZ4Compressor',
    chunk_length_kb: 16,
    crc_check_chance: 1.0,
  },
  defaultTtl: 0,
  gcGraceSeconds: 864000,
  memtableFlushPeriod: 0,
  readRepairChance: 0,
  speculativeRetry: '99percentile',
} as ITableProperties;

export default Vue.extend({
  name: 'CassCreateTableSettingsPage',
  components: {
    [Checkbox.name]: Checkbox,
    [Form.name]: Form,
    [FormItem.name]: FormItem,
    [Input.name]: Input,
    [InputNumber.name]: InputNumber,
    [Popover.name]: Popover,
    [RadioGroup.name]: RadioGroup,
    [RadioButton.name]: RadioButton,
    [Slider.name]: Slider,
    [Select.name]: Select,
    [Option.name]: Option,
    CassTablePropertiesEditor,
    FontAwesomeIcon,
    HelpfulFormItem,
  },
  props: {
    value: {
      type: Object as Prop<ICreateTableOptions>,
    },
  },
  data() {
    const advancedData = mergeTableProperties(
      this.value.options,
      defaultAdvancedData,
      defaultSimpleData,
      this.$route.query.showAdvanced === 'true',
    );

    return {
      faQuestionCircle,
      compressionNames: [
        {
          label: 'Deflate',
          class: 'DeflateCompressor',
        },
        {
          label: 'LZ4',
          class: 'LZ4Compressor',
        },
        {
          label: 'None',
          class: '',
        },
      ],
      advancedData,
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
      suppressProperties: [
        'comment',
        'defaultTtl',
        'compaction',
        'compression.class',
        'speculativeRetry',
      ] as TablePropertyKeys[],
    };
  },
  computed: {
    isTWCS(): boolean {
      return (
        !!this.value.options.compaction &&
        this.value.options.compaction.class === 'TimeWindowCompactionStrategy'
      );
    },
    compressionValue: {
      get(): number {
        const compression = this.value.options.compression;
        if (compression && compression.class) {
          return this.compressionNames.findIndex(
            (item) => item.class === compression.class,
          );
        }
        return this.compressionNames.findIndex((item) => item.class === '');
      },
      set(value: number) {
        if (value >= 0 && value < this.compressionNames.length) {
          const className = this.compressionNames[value].class;
          if (!this.value.options.compression) {
            this.value.options.compression = {
              class: className,
            };
          } else {
            this.value.options.compression.class = className;
          }
        }
      },
    },
    showAdvanced: {
      get(): boolean {
        return this.$route.query.showAdvanced === 'true';
      },
      set(value: boolean) {
        this.$router.push({
          name: this.$route.name as string,
          params: this.$route.params,
          query: {
            ...this.$route.query,
            showAdvanced: value + '',
          },
        });
      },
    },
  },
  watch: {
    showAdvanced: {
      immediate: true,
      handler() {
        this.advancedData = mergeTableProperties(
          this.advancedData,
          defaultAdvancedData,
          defaultSimpleData,
          this.showAdvanced,
        );
        this.onUpdateSettings();
      },
    },
  },
  methods: {
    onUpdateSettings() {
      this.value.options = this.advancedData;
      this.$emit('input', this.value);
    },
  },
});
</script>
