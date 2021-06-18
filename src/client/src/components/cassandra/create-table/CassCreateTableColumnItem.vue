<template>
  <div
    :class="[
      $style.cassCreateTableColumnItem,
      { invalid: !isValid },
      { collectionType: isCollectionType },
      { counterType: isCounterType },
    ]"
    class="layout horizontal center flex padded__horizontal"
  >
    <div class="flex layout horizontal center">
      <font-awesome-icon :icon="faGripVertical" fixed-width></font-awesome-icon>

      <el-form
        ref="form"
        :class="$style.form"
        :rules="rules"
        :model="this"
        inline
        @validate="onValidate"
      >
        <el-form-item prop="columnName">
          <el-input
            ref="input"
            v-model="columnName"
            :class="$style['column-name-input']"
            class="spacer__left"
            @change="validate"
          ></el-input>
        </el-form-item>

        <el-form-item prop="primaryDataType">
          <!-- standard columns can have the type changed -->
          <el-select
            v-if="columnPrimaryKeyType === 'column'"
            v-model="primaryDataType"
            :class="$style.columnTypeSelector"
            filterable
          >
            <el-option-group
              v-for="dataTypeGroup in primaryDataTypes"
              :key="dataTypeGroup.label"
              :label="dataTypeGroup.label"
            >
              <el-option
                v-for="primaryType in dataTypeGroup.value"
                :key="primaryType.name"
                :label="primaryType.name"
                :value="primaryType.name"
              ></el-option>
            </el-option-group>
          </el-select>
        </el-form-item>

        <template v-if="isCollectionType">
          <font-awesome-icon
            :icon="faAngleLeft"
            :class="$style.typeDef"
            style="margin-left: -10px;"
            fixed-width
          ></font-awesome-icon>
          <el-form-item
            v-for="n in getFieldCountForType(primaryDataType)"
            :key="n"
            :prop="'elementTypes.' + (n - 1)"
            :rules="{ required: true, message: 'Column type is required' }"
            :class="$style.collectionElementType"
          >
            <el-select
              v-model="elementTypes[n - 1]"
              :class="$style.columnTypeSelector"
              filterable
            >
              <el-option-group
                v-for="dataTypeGroup in secondaryDataTypes"
                :key="dataTypeGroup.label"
                :label="dataTypeGroup.label"
              >
                <el-option
                  v-for="valueType in dataTypeGroup.value"
                  :key="valueType.name"
                  :label="valueType.name"
                  :value="valueType.name"
                ></el-option>
              </el-option-group>
            </el-select>
            <el-tooltip
              v-if="isUdtType(elementTypes[n - 1])"
              placement="bottom"
            >
              <div slot="content" style="max-width: 300px;">
                Using UDTs in collections require the value to be frozen. Frozen
                values are treated like blobs and must be overwritten in order
                to be updated.
              </div>
              <font-awesome-icon
                :icon="faSnowflake"
                :class="$style.frozen"
              ></font-awesome-icon>
            </el-tooltip>
          </el-form-item>

          <font-awesome-icon
            :icon="faAngleRight"
            :class="$style.typeDef"
            fixed-width
          ></font-awesome-icon>
        </template>

        <el-form-item v-if="columnPrimaryKeyType !== 'column'">
          <span style="color: gray;">
            {{ columnType }}
          </span>
        </el-form-item>

        <el-form-item>
          <!-- clustering key sort direction -->
          <el-select
            v-if="columnPrimaryKeyType === 'cluster'"
            v-model="columnSort"
            :class="$style.columnSortSelector"
            placeholder="Sort direction..."
            filterable
          >
            <el-option label="Ascending" value="ASC"></el-option>
            <el-option label="Descending" value="DESC"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <el-button
      type="danger"
      icon="el-icon-delete"
      size="mini"
      circle
      @click="onDelete"
    ></el-button>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Prop } from 'vue/types/options';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faAngleLeft,
  faAngleRight,
  faGripVertical,
  faSnowflake,
} from '@fortawesome/free-solid-svg-icons';
import {
  Button,
  Form,
  FormItem,
  Input,
  Option,
  OptionGroup,
  Select,
  Tooltip,
} from 'element-ui';
import store from '@/store';

const collectionTypes = [
  { name: 'list', fields: 1 },
  { name: 'map', fields: 2 },
  { name: 'set', fields: 1 },
  { name: 'tuple', fields: 2 },
];

function parseType(
  typeValue: string,
): {
  primary: string | undefined;
  elements: string[];
} {
  const matches = /(\w*)(?:<(.*)>)?/.exec(typeValue);
  let primary: string | undefined;
  let elements = new Array<string>();
  if (matches) {
    const [, primaryType, secondary] = matches;
    primary = primaryType;
    if (secondary) {
      elements = secondary.split(',').map((value) => {
        const name = value.trim();
        const frozenMatch = /^frozen\s*<(\w*)>$/.exec(name);
        if (frozenMatch) {
          const [, frozenType] = frozenMatch;
          return frozenType;
        } else {
          return name;
        }
      });
    } else {
      elements = [];
    }
  } else {
    primary = undefined;
    elements = [];
  }
  return { primary, elements };
}

export default Vue.extend({
  name: 'CassCreateTableColumnItem',
  components: {
    [Button.name]: Button,
    [Form.name]: Form,
    [FormItem.name]: FormItem,
    [Input.name]: Input,
    [Option.name]: Option,
    [OptionGroup.name]: OptionGroup,
    [Select.name]: Select,
    [Tooltip.name]: Tooltip,
    FontAwesomeIcon,
  },
  props: {
    name: {
      type: String,
    },
    type: {
      type: String,
    },
    primaryKeyType: {
      type: String,
    },
    sort: {
      type: String,
    },
    duplicateColumns: {
      type: Array as Prop<string[]>,
    },
  },
  data() {
    const duplicateValidator = (_rule, value: string, cb) => {
      if (this.duplicateColumns.includes(value.toLowerCase())) {
        return cb(new Error('Column names must be unique'));
      }
      cb();
    };

    const { primary, elements } = parseType(this.type);

    return {
      faAngleLeft,
      faAngleRight,
      faGripVertical,
      faSnowflake,
      collectionTypeSet: new Set(collectionTypes.map((type) => type.name)),
      validateResults: {
        columnName: false,
        primaryDataType: false,
      } as { [fieldName: string]: boolean },
      columnName: this.name,
      columnPrimaryKeyType: this.primaryKeyType,
      columnSort: this.sort,
      rules: {
        columnName: [
          { required: true, message: 'Column name is required' },
          {
            validator: duplicateValidator,
            message: 'Column name must be unique',
          },
        ],
        primaryDataType: [
          { required: true, message: 'Column type is required' },
        ],
        secondaryDataType: [
          { required: true, message: 'Column type is required' },
        ],
      },
      collectionTypes,
      primaryDataType: primary,
      elementTypes: elements,
    };
  },
  computed: {
    isValid(): boolean {
      return Object.values(this.validateResults).every((result) => result);
    },
    columnType: {
      get(): string | undefined {
        let type: string | undefined;
        if (this.primaryDataType && this.elementTypes.length > 0) {
          type = `${this.primaryDataType}<${this.elementTypes
            .map((item) => {
              if (this.isUdtType(item)) {
                return `frozen <${item}>`;
              }
              return item;
            })
            .join(',')}>`;
        } else {
          type = this.primaryDataType;
        }
        return type;
      },
      set(value: string): void {
        const { primary, elements } = parseType(value);
        this.primaryDataType = primary;
        this.elementTypes = elements;
      },
    },
    standardDataTypes(): { label: string; value: { name: string }[] } {
      return {
        label: 'Standard Data Types',
        value: store.state.cassandra.cluster.dataTypes.standard
          .filter((name) => !this.collectionTypeSet.has(name.toLowerCase()))
          .map((name) => ({
            name,
          })),
      };
    },
    customDataTypes(): { label: string; value: { name: string }[] } {
      return {
        label: 'Custom Data Types',
        value: store.state.cassandra.cluster.dataTypes.user.map((type) => ({
          name: type.name,
        })),
      };
    },
    primaryDataTypes(): any {
      return [
        this.standardDataTypes,
        {
          label: 'Collection Types',
          value: this.collectionTypes,
        },
        this.customDataTypes,
      ];
    },
    secondaryDataTypes(): any {
      return [this.standardDataTypes, this.customDataTypes];
    },
    isCollectionType(): boolean {
      return !!this.collectionTypes.find(
        (item) => item.name === this.primaryDataType,
      );
    },
    isCounterType(): boolean {
      return this.primaryDataType === 'counter';
    },
    userInput(): any {
      return [
        this.columnName,
        this.columnType,
        this.columnPrimaryKeyType,
        this.elementTypes,
        this.columnSort,
      ].join();
    },
  },
  watch: {
    name(newValue) {
      this.columnName = newValue;
    },
    primaryKeyType(newValue) {
      this.columnPrimaryKeyType = newValue;
    },
    duplicateColumns() {
      this.validate();
    },
    userInput() {
      this.emitInput();
    },
    primaryDataType() {
      this.elementTypes = [];
    },
  },
  mounted() {
    this.validate();
  },
  methods: {
    focus() {
      (this.$refs.input as any).focus();
    },
    emitInput() {
      this.$emit('input', {
        name: this.columnName,
        type: this.columnType,
        sort: this.columnSort,
      });
    },
    onDelete() {
      this.$emit('delete');
    },
    validate(): boolean {
      return (this.$refs.form as any).validate();
    },
    onValidate(field, isValid) {
      this.validateResults[field] = isValid;
    },
    getFieldCountForType(dataType: string) {
      const collectionType = this.collectionTypes.find(
        (item) => item.name === dataType,
      );
      if (!collectionType) return 0;
      return collectionType.fields;
    },
    isUdtType(type: string) {
      return !!this.customDataTypes.value.find((item) => item.name === type);
    },
  },
});
</script>
<style module>
.cassCreateTableColumnItem {
  max-height: 50px;
}

.form {
  display: inline-block;
  margin-top: 12px;
  max-height: 60px;
}

.form :global .el-form-item__error {
  margin-left: 8px;
}

.column-name-input {
  max-width: 300px;
  min-width: 200px;
}

.columnTypeSelector,
.columnSortSelector {
  min-width: 150px;
  margin-left: var(--spacer-standard);
  margin-right: var(--spacer-standard);
}

.typeDef {
  color: var(--neutral-200);
  font-size: 20px;
  margin-top: 5px;
}

.collectionElementType {
  margin-right: 0 !important;
}

.collectionElementType + .collectionElementType {
  margin-left: 0;
  margin-right: 0;
}

.collectionElementType + .collectionElementType:before {
  content: ',';
  color: var(--neutral-200);
  display: inline-block;
  margin-top: 15px;
  margin-left: -3px;
}

.frozen {
  color: #64aef3;
  cursor: help;
}
</style>
