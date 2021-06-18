<template>
  <div class="attributes-form layout vertical">
    <el-table
      :data="attributes"
      style="width: 100%;"
      class="flex"
      :height="height"
      :max-height="height"
      empty-text="No attributes specified"
      :show-header="showHeader"
    >
      <el-table-column label="Name">
        <template slot-scope="scope">
          <el-input
            :ref="'key-' + scope.$index"
            v-model="scope.row.name"
            required
            @change="onChange(scope.$index, scope.row)"
          ></el-input>
        </template>
      </el-table-column>
      <el-table-column label="Value">
        <template slot-scope="scope">
          <el-input
            v-model="scope.row.value"
            @change="onChange(scope.$index, scope.row)"
          ></el-input>
        </template>
      </el-table-column>
      <el-table-column v-if="!disableRemove" label="Operations" width="150">
        <template slot-scope="scope">
          <el-button
            v-if="attributes.length > 1"
            icon="el-icon-delete"
            size="mini"
            type="danger"
            circle
            @click="onDeleteAttribute(scope.$index, scope.row)"
          ></el-button>
          <el-button
            v-if="scope.$index === attributes.length - 1"
            icon="el-icon-plus"
            size="mini"
            type="info"
            circle
            @click="onAddAttribute"
          ></el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Prop } from 'vue/types/options';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { Button, Input, Table, TableColumn } from 'element-ui';
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons';

interface IAttribute {
  name: string;
  value: string;
}

export default Vue.extend({
  name: 'AttributesForm',
  components: {
    FontAwesomeIcon,
    [Button.name]: Button,
    [Input.name]: Input,
    [Table.name]: Table,
    [TableColumn.name]: TableColumn,
  },
  props: {
    value: {
      type: Object as Prop<{
        [key: string]: string;
      }>,
    },
    disableAdd: {
      type: Boolean,
    },
    disableRemove: {
      type: Boolean,
    },
    height: {
      type: Number,
      default: 300,
    },
    showHeader: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      faPlusCircle,
    };
  },
  computed: {
    attributes: {
      get(): IAttribute[] {
        if (!this.value) {
          return [];
        }
        return Object.entries(this.value).map(([name, value]) => ({
          name,
          value,
        }));
      },
      set(value: IAttribute[]) {
        if (!this.value) {
          return;
        }
        const attributes = value.reduce(
          (prev, curr) => ({ ...prev, [curr.name]: curr.value }),
          {},
        );
        this.$emit('input', attributes);
      },
    },
  },
  methods: {
    onAddAttribute() {
      this.attributes.push({ name: '', value: '' });
      // eslint-disable-next-line no-self-assign
      this.attributes = this.attributes;

      Vue.nextTick(() => {
        const cmp = this.$refs[`key-${this.attributes.length - 1}`] as any;
        if (cmp) {
          cmp.$el.scrollIntoView();
          cmp.focus();
        }
      });
    },
    onDeleteAttribute(index) {
      this.attributes.splice(index, 1);
      // eslint-disable-next-line no-self-assign
      this.attributes = this.attributes;
    },
    onChange(index, row) {
      this.attributes[index] = row;
      // eslint-disable-next-line no-self-assign
      this.attributes = this.attributes;
    },
  },
});
</script>
