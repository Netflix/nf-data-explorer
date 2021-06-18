<template>
  <el-dialog
    :title="create ? 'Insert New Record' : 'Edit Record'"
    class="dialog"
    :close-on-click-modal="false"
    visible
    @close="onClose"
  >
    <!-- Tabs (only shown in edit mode) -->
    <el-tabs v-if="!create" v-model="selectedTab" type="border-card">
      <el-tab-pane :name="TabNames.Details">
        <span slot="label">
          <font-awesome-icon :icon="faInfoCircle"></font-awesome-icon>
          Details
        </span>
      </el-tab-pane>
      <el-tab-pane :name="TabNames.JSON">
        <span slot="label"> { } <span class="spacer__left">JSON</span> </span>
      </el-tab-pane>
      <el-tab-pane :name="TabNames.Insert">
        <span slot="label">
          <font-awesome-icon :icon="faLaptopCode"></font-awesome-icon>
          Insert Statement
        </span>
      </el-tab-pane>
    </el-tabs>

    <!-- main form component -->
    <el-form
      v-show="schema && value && selectedTab === TabNames.Details"
      ref="form"
      v-loading="saveInProgress"
      element-loading-text="Saving..."
      class="padded"
      :model="value"
    >
      <cass-table-row-form-item
        v-for="column in tableColumns"
        :key="column.name"
        v-model="value[column.name]"
        :prop="column.name"
        :name="column.name"
        :column-type="getColumnType(column.name)"
        :type="column.type"
        :data-type="column.dataType"
        :ttl="
          value[`ttl(${column.name})`]
            ? value[`ttl(${column.name})`].value
            : undefined
        "
        :writetime="
          value[`writetime(${column.name})`]
            ? value[`writetime(${column.name})`].value
            : undefined
        "
        :create="create"
        :truncated="truncatedColumnSet.has(column.name)"
        @download="onDownload"
      >
      </cass-table-row-form-item>
    </el-form>

    <!-- JSON view -->
    <div
      v-if="!create"
      v-show="jsonData && selectedTab === TabNames.JSON"
      class="layout horizontal"
    >
      <ace-editor
        :value="jsonData"
        width="100%"
        height="300px"
        class="flex padded bordered spacer__right"
        theme="textmate"
        lang="json"
        :options="{ wrap: true }"
        disabled
        @init="initEditor"
      ></ace-editor>
      <copy-text-button :value="jsonData"></copy-text-button>
    </div>

    <!-- Insert Statement -->
    <div
      v-if="!create"
      v-show="selectedTab === TabNames.Insert"
      class="layout vertical padded"
    >
      <p>
        If you need to replicate this data in a test environment, you can use
        the INSERT statement below.
      </p>
      <div v-if="insertStatement" class="layout horizontal">
        <cass-sample-query
          :class="$style.insertStatement"
          class="spacer__left"
          :query="insertStatement"
        ></cass-sample-query>
        <copy-text-button
          :value="insertStatement"
          class="spacer__left"
        ></copy-text-button>
      </div>
    </div>

    <span
      v-show="selectedTab === TabNames.Details"
      slot="footer"
      class="layout horizontal justified"
    >
      <div>
        <el-button
          v-if="!create"
          type="danger"
          :disabled="saveInProgress"
          @click="onDelete"
        >
          <font-awesome-icon :icon="faTrashAlt"></font-awesome-icon> Delete
        </el-button>
      </div>
      <div>
        <el-button :disabled="saveInProgress" @click="onClose()"
          >Cancel</el-button
        >
        <el-button :disabled="saveDisabled" type="primary" @click="onSave()">
          <font-awesome-icon :icon="faSave"></font-awesome-icon> Save
        </el-button>
      </div>
    </span>
  </el-dialog>
</template>
<script lang="ts">
import Vue from 'vue';
import { Prop } from 'vue/types/options';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faSave } from '@fortawesome/free-regular-svg-icons';
import {
  faCalendarTimes,
  faCopy,
  faInfoCircle,
  faLaptopCode,
  faTrashAlt,
} from '@fortawesome/free-solid-svg-icons';
import {
  Button,
  Checkbox,
  Dialog,
  Form,
  FormItem,
  Input,
  Tabs,
  TabPane,
} from 'element-ui';
import {
  ITableSchema,
  ITableColumn,
  IKeyQuery,
} from '@cassandratypes/cassandra';
import { getSchemaSummary, sortTableColumns } from '@/utils/cassandra-utils';
import store from '@/store';
import CassPartitionKeyIcon from '@/components/cassandra/icons/CassPartitionKeyIcon.vue';
import CassSampleQuery from '@/components/cassandra/CassSampleQuery.vue';
import CassQueryEditor from '@/components/cassandra/query/editor/CassQueryEditor.vue';
import CassClusteringKeyIcon from '@/components/cassandra/icons/CassClusteringKeyIcon.vue';
import CassTableRowFormItem from '@/components/cassandra/CassTableRowFormItem.vue';
import CopyTextButton from '@/components/common/CopyTextButton.vue';
import { confirmPrompt } from '@/utils/message-utils';
import { NotificationType } from '@/typings/notifications';
import AceEditor from '@/components/common/AceEditor.vue';

export default Vue.extend({
  name: 'CassRowDialog',
  components: {
    [Button.name]: Button,
    [Checkbox.name]: Checkbox,
    [Dialog.name]: Dialog,
    [Form.name]: Form,
    [FormItem.name]: FormItem,
    [Input.name]: Input,
    [Tabs.name]: Tabs,
    [TabPane.name]: TabPane,
    AceEditor,
    CassPartitionKeyIcon,
    CassQueryEditor,
    CassClusteringKeyIcon,
    CassSampleQuery,
    CassTableRowFormItem,
    CopyTextButton,
    FontAwesomeIcon,
  },
  props: {
    create: {
      type: Boolean,
      default: false,
    },
    schema: {
      type: Object as Prop<ITableSchema>,
      required: true,
    },
    value: {
      type: Object as Prop<IKeyQuery>,
      required: true,
    },
    saveInProgress: {
      type: Boolean,
      default: false,
    },
    insertStatement: {
      type: String,
    },
    truncatedColumns: {
      type: Array as Prop<string[]>,
    },
  },
  data() {
    const TabNames = {
      Details: 'Details',
      JSON: 'JSON',
      Insert: 'Insert Statement',
    };
    return {
      faCalendarTimes,
      faCopy,
      faInfoCircle,
      faLaptopCode,
      faSave,
      faTrashAlt,
      TabNames,
      isLoading: false,
      selectedTab: TabNames.Details,
      columnTypeMap: new Map<string, string>(),
      partitionKeys: new Set<string>(),
      clusteringKeys: new Set<string>(),
      editBlobColumnNames: new Array<string>(),
      isDirty: false,
    };
  },
  computed: {
    currentCluster(): string | undefined {
      return store.state.config.currentCluster;
    },
    tableColumns(): ITableColumn[] {
      if (!this.schema) return [];
      return sortTableColumns(this.schema);
    },
    nonBlobTableColumns(): ITableColumn[] {
      return this.tableColumns.filter((column) => column.type !== 'blob');
    },
    blobCreateTableColumns(): ITableColumn[] {
      return this.create
        ? this.tableColumns.filter((column) => column.type === 'blob')
        : [];
    },
    blobEditTableColumns(): ITableColumn[] {
      return !this.create
        ? this.tableColumns.filter((column) => column.type === 'blob')
        : [];
    },
    importantData(): any {
      return [this.schema, this.currentCluster].join('');
    },
    jsonData(): string {
      return JSON.stringify(this.value, null, '\t');
    },
    truncatedColumnSet(): Set<string> {
      return new Set(this.truncatedColumns || []);
    },
    saveDisabled(): boolean {
      return (
        this.truncatedColumnSet.size > 0 || !this.isDirty || this.saveInProgress
      );
    },
  },
  watch: {
    importantData: {
      immediate: true,
      async handler() {
        if (this.currentCluster && this.schema) {
          const {
            partitionKeySet,
            clusteringKeySet,
            columnTypeMap,
          } = getSchemaSummary(this.schema);
          this.partitionKeys = partitionKeySet;
          this.clusteringKeys = clusteringKeySet;
          this.columnTypeMap = columnTypeMap;
        }
      },
    },
    value: {
      deep: true,
      handler() {
        this.isDirty = true;
      },
    },
  },
  methods: {
    initEditor(editor) {
      editor.setShowPrintMargin(false);
      editor.setReadOnly(true);
    },
    async onDelete() {
      if (
        await confirmPrompt(
          'Delete this record?',
          'Are you sure you want to permanently delete this record?',
          'Yes, Delete',
          'No, Cancel',
          NotificationType.Warning,
        )
      ) {
        this.$emit('delete');
      }
    },
    onClose() {
      this.$emit('close');
    },
    async onSave() {
      if (await (this.$refs.form as any).validate()) {
        this.$emit('save');
      }
    },
    getColumnType(columnName: string) {
      if (this.partitionKeys.has(columnName)) return 'partition';
      if (this.clusteringKeys.has(columnName)) return 'clustering';
      return 'column';
    },
    onDownload(args) {
      this.$emit('download', args);
    },
    onChangeFile(columnName: string, files: File[]) {
      this.value[columnName].value = files.length > 0 ? files[0] : undefined;
    },
  },
});
</script>
<style scoped>
.dialog >>> .el-dialog__body {
  padding: 0;
  max-height: 70vh;
  overflow: scroll;
}

.dialog >>> .el-tabs {
  border-width: 1px 0 0 0;
}

.dialog >>> .el-tabs__content {
  padding: 0px;
}
</style>
<style module>
.insertStatement {
  padding: 5px 5px;
}
</style>
