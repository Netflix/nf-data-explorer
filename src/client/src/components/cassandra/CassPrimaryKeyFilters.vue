<template>
  <div :class="$style.filters" class="layout vertical padded">
    <el-form
      ref="keyForm"
      :model="value.primaryKey"
      :rules="validationRules"
      class="scroll"
      label-position="top"
      label-width="120px"
      @keyup.enter.native="search"
      @submit.native.prevent
    >
      <section v-for="fieldGroup in fieldGroups" :key="fieldGroup.type">
        <h4 :class="$style.sectionHeader">
          <cass-partition-key-icon
            v-if="fieldGroup.type === 'partition'"
          ></cass-partition-key-icon>
          <cass-clustering-key-icon
            v-if="fieldGroup.type === 'clustering'"
          ></cass-clustering-key-icon>
          {{ fieldGroup.type }}
        </h4>

        <el-form-item
          v-for="column in fieldGroup.columns"
          :key="column.name"
          :label="column.name + ' (' + column.type + ')'"
          :prop="column.name + '.value'"
          :class="fieldGroup.type + '-key'"
        >
          <template v-if="column.type === 'blob'">
            <!-- blob encoding -->
            <cass-encoding-dropdown
              v-model="value.primaryKey[column.name].options.encoding"
              :required="true"
              class="mr-2"
              style="max-width: 140px;"
              @change="onChangeFilter"
            ></cass-encoding-dropdown>

            <!-- blob values -->
            <el-input
              v-model="value.primaryKey[column.name].value"
              :class="$style.blobInput"
              style="width: 175px;"
              :disabled="fieldGroup.type === 'clustering' && !hasPartitionKeys"
              @input="onChangeFilter"
            >
              <span
                v-if="value.primaryKey[column.name].options.encoding === 'hex'"
                slot="prepend"
                style="padding: 0 10px;"
                >0x</span
              >
            </el-input>

            <el-button
              type="text"
              class="ml-2"
              @click="clearBlobField(column.name)"
            >
              <font-awesome-icon :icon="faTimesCircle"></font-awesome-icon>
            </el-button>
          </template>

          <!-- numerical values -->
          <el-input
            v-else-if="column.dataType === 'number' && column.type !== 'bigint'"
            v-model.number="value.primaryKey[column.name].value"
            :disabled="fieldGroup.type === 'clustering' && !hasPartitionKeys"
            @input="onChangeFilter"
          >
          </el-input>

          <!-- all other values -->
          <el-input
            v-else
            v-model="value.primaryKey[column.name].value"
            :disabled="fieldGroup.type === 'clustering' && !hasPartitionKeys"
            @input="onChangeFilter"
          ></el-input>
        </el-form-item>
      </section>

      <!-- Retrieval options -->
      <section v-if="hasBlobColumns">
        <h4><font-awesome-icon :icon="faCog"></font-awesome-icon> Options</h4>
        <el-form-item label="Blob Encoding">
          <cass-encoding-dropdown
            v-model="value.options.encoding"
            empty-text="Do not decode (best performance)"
            style="width: 100%;"
            required
            @change="onChangeEncoding"
          ></cass-encoding-dropdown>
        </el-form-item>
        <el-checkbox
          v-model="value.options.decodeValues"
          label="Also decode value columns"
          :disabled="!value.options.encoding"
          class="ml-4 mb-4"
        ></el-checkbox>
        <el-tooltip placement="right">
          <div slot="content" style="max-width: 300px;">
            By default, only blobs used in the primary key will be deserialized
            and decoded. Use caution when decoding large blob values as this may
            put additional pressure on your cluster.
          </div>
          <font-awesome-icon
            :icon="faInfoCircle"
            :class="$style.infoIcon"
            class="ml-2"
          ></font-awesome-icon>
        </el-tooltip>
      </section>
    </el-form>

    <div class="filter-toolbar">
      <el-button type="primary" @click="search">Search</el-button>
      <el-button @click="clearFilters">Clear</el-button>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faCog,
  faInfoCircle,
  faTimesCircle,
} from '@fortawesome/free-solid-svg-icons';
import { Prop } from 'vue/types/options';
import {
  Button,
  Checkbox,
  Form,
  FormItem,
  Input,
  Option,
  Select,
  Tooltip,
} from 'element-ui';
import {
  IKeyQuery,
  ITableSchema,
  ITableColumn,
} from '@cassandratypes/cassandra';
import CassEncodingDropdown from './CassEncodingDropdown.vue';
import CassPartitionKeyIcon from './icons/CassPartitionKeyIcon.vue';
import CassClusteringKeyIcon from './icons/CassClusteringKeyIcon.vue';

interface IFieldGroup {
  type: 'partition' | 'clustering';
  columns: ITableColumn[];
}

interface IFieldRule {
  column: ITableColumn;
  columnType: 'partition' | 'clustering';
  pattern?: string | RegExp;
  trigger?: string | string[];
  message?: string;
  validator?: (rule: IFieldRule, value: any, cb: () => void) => void;
}

export default Vue.extend({
  name: 'CassPrimaryKeyFilters',
  components: {
    [Button.name]: Button,
    [Checkbox.name]: Checkbox,
    [Form.name]: Form,
    [FormItem.name]: FormItem,
    [Input.name]: Input,
    [Option.name]: Option,
    [Select.name]: Select,
    [Tooltip.name]: Tooltip,
    CassEncodingDropdown,
    FontAwesomeIcon,
    CassPartitionKeyIcon,
    CassClusteringKeyIcon,
  },
  props: {
    schema: {
      type: Object as Prop<ITableSchema>,
      required: true,
    },
    value: {
      type: Object as Prop<IKeyQuery>,
      required: true,
    },
  },
  data() {
    return {
      faCog,
      faInfoCircle,
      faTimesCircle,
      encodings: [
        { label: 'ascii', value: 'ascii' },
        { label: 'base64', value: 'base64' },
        { label: 'hex', value: 'hex' },
        { label: 'utf-8', value: 'utf-8' },
      ],
    };
  },
  computed: {
    partitionKeyNames(): string[] {
      if (!this.schema) return new Array<string>();
      return this.schema.partitionKeys.map((column) => column.name);
    },
    clusteringKeyNames(): string[] {
      if (!this.schema) return new Array<string>();
      return this.schema.clusteringKeys.map((column) => column.name);
    },
    hasPartitionKeys(): boolean {
      return this.partitionKeyNames.every(
        (columnName) => !!this.value.primaryKey[columnName].value,
      );
    },
    validationRules(): any {
      if (!this.schema) return {};
      const partitionRules = this.schema.partitionKeys.reduce(
        (prev, col) => ({
          ...prev,
          ...this.buildRules('partition', col),
        }),
        {},
      );
      const clusteringRules = this.schema.clusteringKeys.reduce(
        (prev, col) => ({
          ...prev,
          ...this.buildRules('clustering', col),
        }),
        {},
      );
      return {
        ...partitionRules,
        ...clusteringRules,
      };
    },
    fieldGroups(): IFieldGroup[] {
      const columns = this.schema.columns.reduce(
        (map, col) => map.set(col.name, col),
        new Map<string, ITableColumn>(),
      );

      // populate the partition and clustering key sections
      const groups = new Array<IFieldGroup>();
      const getColumn = (column: string) => columns.get(column) as ITableColumn;
      if (this.partitionKeyNames.length > 0) {
        groups.push({
          type: 'partition',
          columns: this.partitionKeyNames.map(getColumn),
        });
      }
      if (this.clusteringKeyNames.length > 0) {
        groups.push({
          type: 'clustering',
          columns: this.clusteringKeyNames.map(getColumn),
        });
      }
      return groups;
    },
    hasBlobColumns(): boolean {
      return this.schema.columns.some((column) => column.type === 'blob');
    },
  },
  watch: {
    hasPartitionKeys(hasPartitionKeys) {
      if (!hasPartitionKeys) {
        this.clusteringKeyNames.forEach(
          (key) => (this.value.primaryKey[key].value = undefined),
        );
      }
    },
  },
  methods: {
    buildRules(columnType: 'partition' | 'clustering', column: ITableColumn) {
      const rules = {};
      const keyRules = new Array<IFieldRule>();
      if (column.dataType === 'number') {
        keyRules.push({
          column,
          columnType,
          pattern: /^[0-9]*$/,
          trigger: 'change',
          message: `${column.name} must be a number`,
        });
      }
      if (columnType === 'partition') {
        keyRules.push({
          column,
          columnType,
          trigger: 'change',
          validator: this.validateAllPartitionKeys,
        });
      }
      if (column.type === 'blob') {
        keyRules.push({
          column,
          columnType,
          trigger: 'change',
          validator: this.validateBlobInput,
        });
      }
      if (keyRules.length > 0) {
        rules[`${column.name}.value`] = keyRules;
      }
      return rules;
    },
    validateAllPartitionKeys(
      rule: IFieldRule,
      value: any,
      cb: (error?: Error) => void,
    ) {
      if (rule.columnType === 'partition') {
        const partitionKeyNames = this.schema.partitionKeys.map(
          (partitionKey) => partitionKey.name,
        );
        const hasAtLeastOnePartitionKey = partitionKeyNames.some(
          (partitionKeyName) => {
            const { primaryKey } = this.value;
            const details = primaryKey[partitionKeyName];
            const { value: filterValue } = details;
            return filterValue !== undefined && filterValue !== '';
          },
        );
        if (hasAtLeastOnePartitionKey && (!value || value.length === 0)) {
          return cb(new Error('All partition keys must be specified'));
        }
      }
      cb();
    },
    validateBlobInput(
      rule: IFieldRule,
      value: any,
      cb: (error?: Error) => void,
    ) {
      const fieldName = rule.column.name;
      const encoding = this.value.primaryKey[fieldName].options.encoding;
      if (!encoding && value) {
        return cb(new Error('Choose an encoding for this string value'));
      }
      if (encoding && !value) {
        return cb(
          new Error(`Specify a string value to be encoded with ${encoding}`),
        );
      }
      cb();
    },
    search() {
      (this.$refs.keyForm as any).validate((valid) => {
        if (valid) {
          this.$emit('search');
        }
      });
    },
    clearFilters() {
      const { primaryKey, options } = this.value;
      Object.keys(primaryKey).forEach(
        (key) =>
          (primaryKey[key] = {
            value: undefined,
            options: {
              encoding: undefined,
            },
          }),
      );
      if (Object.prototype.hasOwnProperty.call(options, 'encoding')) {
        options.encoding = 'hex';
      }
      if (Object.prototype.hasOwnProperty.call(options, 'decodeValues')) {
        options.decodeValues = false;
      }

      this.$emit('input', this.value);
      this.$emit('clear');
      (this.$refs.keyForm as any).validate();
    },
    onChangeFilter() {
      this.$emit('input', this.value);
      this.$emit('change', this.value);
      (this.$refs.keyForm as any).validate();
    },
    onChangeEncoding(value) {
      if (!value) {
        this.value.options.decodeValues = false;
      }
    },
    clearBlobField(columnName) {
      const details = this.value.primaryKey[columnName];
      if (details) {
        details.options.encoding = undefined;
        details.value = undefined;
      }
      (this.$refs.keyForm as any).validate();
    },
  },
});
</script>
<style module>
.filters {
  background-color: var(--color-background);
  border-top: 1px solid var(--color-border);
}

.sectionHeader {
  text-transform: capitalize;
}

.blobInput :global .el-input-group__prepend {
  padding: 0 5px;
}

.infoIcon {
  color: var(--neutral-700);
  font-size: 16px;
}
</style>
