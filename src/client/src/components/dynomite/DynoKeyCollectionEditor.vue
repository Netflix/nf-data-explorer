<template>
  <div
    :class="$style.dynoKeyAggregated"
    class="layout vertical padded__horizontal padded__top"
  >
    <el-form ref="form" :model="value" class="padded">
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

      <el-alert
        v-if="create && value.name.length > 0"
        type="info"
        title="Add a field to this key to save it."
        show-icon
      ></el-alert>
    </el-form>

    <label :class="$style.aggregatedLabel" class="el-form-item__label">
      <span :class="$style.typeLabel">{{ type }}</span> Values</label
    >

    <!-- toolbar -->
    <div class="toolbar border__top border__left border__right">
      <el-button
        type="primary"
        :disabled="
          (!create && (!keyName || keyName.length === 0)) ||
          !(value.name && value.name.length > 0)
        "
        @click="onAdd"
      >
        <font-awesome-icon :icon="faPlusCircle" fixed-width></font-awesome-icon>
        Add
      </el-button>
      <el-button
        type="primary"
        :disabled="
          checkedRows.length === 0 || checkedRows.every((item) => !item)
        "
        @click="onRemove"
      >
        <font-awesome-icon
          :icon="faTimesCircle"
          fixed-width
        ></font-awesome-icon>
        Remove
      </el-button>
    </div>

    <!-- fields -->
    <v-client-table
      ref="imagesTable"
      v-loading="isLoading"
      name="images-list-table"
      :data="tableData"
      :columns="tableColumns"
      :options="tableOptions"
      element-loading-text="Fetching fields for key..."
      class="flex scroll"
    >
      <!-- <el-checkbox slot="selected"
        slot-scope="props"
        v-model="checkedRows[props.index - 1]"></el-checkbox> -->

      <input
        slot="selected"
        v-model="checkedRows[props.index - 1]"
        slot-scope="props"
        type="checkbox"
      />

      <template v-if="type === 'hash'" slot="key" slot-scope="props">
        {{ props.row.data.key }}
      </template>

      <template v-if="type === 'list'" slot="index" slot-scope="props">
        {{ props.index }}
      </template>

      <template v-if="type === 'zset'" slot="score" slot-scope="props">
        {{ props.row.data.score }}
      </template>

      <template slot="value" slot-scope="props">
        {{ props.row.data.value }}
      </template>

      <template slot="actions" slot-scope="props">
        <el-button
          v-if="type !== 'set'"
          type="primary"
          icon="el-icon-edit"
          circle
          @click="onEditRow(props.row.id)"
        ></el-button>
      </template>
    </v-client-table>

    <dyno-key-collection-dialog
      v-if="showDialog"
      v-model="editRecord"
      :cluster-name="clusterName"
      :key-name="value.name"
      :type="type"
      :create="isCreate"
      :visible="true"
      @close="showDialog = false"
      @create-field="onCreateField"
      @update-field="onKeyUpdated"
    ></dyno-key-collection-dialog>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Prop } from 'vue/types/options';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  Form,
  FormItem,
  Input,
} from 'element-ui';
import {
  faPlusCircle,
  faTimesCircle,
  faPencilAlt,
} from '@fortawesome/free-solid-svg-icons';
import DynoKeyCollectionDialog from '@/components/dynomite/DynoKeyCollectionDialog.vue';
import { ClientTable } from 'vue-tables-2';
import {
  IDynoCollectionKey,
  IDynoCollectionKeyValue,
} from '@dynomitetypes/dynomite';
import DynoKeyNameFormItem from '@/components/dynomite/DynoKeyNameFormItem.vue';
import DynoKeyTtlFormItem from '@/components/dynomite/DynoKeyTtlFormItem.vue';
import { deleteKeyFields } from '@/services/dynomite/DynoService';
import { notify } from '@/utils/message-utils';
import { NotificationType } from '@/typings/notifications';

Vue.use(ClientTable);

interface ICollectionRow {
  id: string | number;
  data: IDynoCollectionKeyValue;
}

export default Vue.extend({
  name: 'DynoKeyCollectionEditor',
  components: {
    [Alert.name]: Alert,
    [Button.name]: Button,
    [Checkbox.name]: Checkbox,
    [Dialog.name]: Dialog,
    [Form.name]: Form,
    [FormItem.name]: FormItem,
    [Input.name]: Input,
    DynoKeyCollectionDialog,
    DynoKeyNameFormItem,
    DynoKeyTtlFormItem,
    FontAwesomeIcon,
  },
  props: {
    clusterName: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      validator: (value: string) => {
        return ['hash', 'list', 'set', 'zset'].includes(value);
      },
    },
    keyName: {
      type: String,
    },
    value: {
      type: Object as Prop<IDynoCollectionKey>,
    },
    create: {
      type: Boolean,
    },
  },
  data() {
    return {
      faPencilAlt,
      faPlusCircle,
      faTimesCircle,
      isLoading: false,
      showDialog: false,
      isCreate: false,
      editRecord: undefined as IDynoCollectionKeyValue | undefined,
      checkedRows: [],
    };
  },
  computed: {
    tableData(): ICollectionRow[] {
      const ids = new Array<string | number>();
      const data = new Array<IDynoCollectionKeyValue>();
      switch (this.value.type) {
        case 'hash':
          Object.entries(this.value.value).forEach(([key, value], index) => {
            ids.push(index);
            data.push({ type: 'hash', key, value });
          });
          break;
        case 'list':
        case 'set':
          this.value.value.forEach((value, index) => {
            ids.push(index);
            data.push({
              type: this.value.type as any,
              index: this.value.type === 'list' ? index : undefined,
              value,
            });
          });
          break;
        case 'zset':
          for (let i = 0; i < this.value.value.length - 1; i += 2) {
            const zsetValue = this.value.value[i];
            const score = this.value.value[i + 1];
            ids.push(i);
            data.push({
              type: 'zset',
              score,
              value: zsetValue,
            });
          }
          break;
        default:
          throw new Error('Unknown collection type');
      }

      return data.map((value, index) => ({
        id: ids[index],
        data: value,
      }));
    },
    tableColumns(): any[] {
      const columns = ['selected'];
      switch (this.type) {
        case 'hash':
          columns.push('key');
          break;
        case 'list':
          columns.push('index');
          break;
        case 'set':
          break;
        case 'zset':
          columns.push('score');
          break;
      }
      columns.push('value');
      columns.push('actions');
      return columns;
    },
    tableOptions(): any {
      return {
        filterable: false,
        sortable: ['key', 'value'],
        columnsClasses: {
          selected: 'selectedColumn',
          index: 'indexColumn',
          score: 'scoreColumn',
          value: 'valueColumn',
          actions: 'actionsColumn',
        },
        uniqueKey: 'id',
        perPage: 100,
        headings: {
          selected: '',
          actions: '',
        },
      };
    },
  },
  watch: {
    value() {
      this.checkedRows.splice(0);
      this.editRecord = undefined;
    },
  },
  methods: {
    onAdd() {
      switch (this.value.type) {
        case 'zset':
          this.editRecord = { type: 'zset', score: '', value: '' };
          break;
        case 'list':
          this.editRecord = {
            type: 'list',
            index: this.value.value.length,
            value: '',
          };
          break;
        case 'set':
          this.editRecord = { type: 'set', value: '' };
          break;
        case 'hash':
          this.editRecord = { type: 'hash', key: '', value: '' };
          break;
      }

      this.isCreate = true;
      this.showDialog = true;
    },
    async onRemove() {
      const valuesToDelete = new Array<IDynoCollectionKeyValue>();
      this.checkedRows.forEach((value, index) => {
        if (value === true) {
          valuesToDelete.push(this.tableData[index].data);
        }
      });
      const fieldLabel = valuesToDelete.length > 1 ? 'fields' : 'field';
      try {
        await deleteKeyFields(
          this.clusterName,
          this.keyName,
          this.type,
          valuesToDelete,
        );
        this.checkedRows.splice(0);
        notify(
          NotificationType.Success,
          `Deleted ${fieldLabel} from key`,
          `Deleted ${fieldLabel} from ${this.keyName}`,
        );
        this.$emit('key-updated');
      } catch (err) {
        notify(
          NotificationType.Error,
          `Failed to Delete ${fieldLabel} Key`,
          err.message,
        );
      }
    },
    onEditRow(rowId) {
      const item = this.tableData.find((row) => row.id === rowId);
      if (item) {
        this.editRecord = item.data;
        this.isCreate = false;
        this.showDialog = true;
      }
    },
    getRowById(rowId) {
      return this.tableData.find((row) => row.id === rowId);
    },
    onCreateField() {
      if (this.create) {
        this.$emit('key-created'); // adding a field will create the parent key
      } else {
        this.$emit('key-updated');
      }
      this.showDialog = false;
    },
    onKeyUpdated() {
      this.showDialog = false;
      this.$emit('key-updated');
    },
  },
});
</script>
<style module>
.dynoKeyAggregated :global .selectedColumn {
  width: 50px;
}

.dynoKeyAggregated :global .scoreColumn {
  width: 75px;
}

.dynoKeyAggregated :global .indexColumn {
  width: 75px;
}

.dynoKeyAggregated :global .actionsColumn {
  width: 75px;
}

.aggregatedLabel {
  line-height: normal;
  text-align: left;
  padding-left: var(--padding-standard);
}

.aggregatedLabel .typeLabel {
  text-transform: capitalize;
}
</style>
