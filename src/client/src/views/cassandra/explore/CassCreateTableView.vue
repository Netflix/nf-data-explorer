<template>
  <div
    v-loading="createInProgress"
    class="layout vertical"
    element-loading-text="Creating new table..."
  >
    <el-steps
      :active="activeStep"
      class="border__top border__bottom"
      simple
      finish-status="success"
      process-status="finish"
    >
      <el-step
        v-for="step in wizardPages"
        :key="step.title"
        :title="step.title"
      ></el-step>
    </el-steps>

    <!-- pages -->
    <cass-create-table-info-page
      v-if="activeStep === 0"
      ref="page0"
      v-model="createTableOptions"
      class="flex padded"
    ></cass-create-table-info-page>

    <cass-create-table-columns-page
      v-if="activeStep === 1"
      ref="page1"
      v-model="createTableOptions"
      class="flex padded"
      @column-updated="onColumnChanged"
      @column-moved="onColumnChanged"
    ></cass-create-table-columns-page>

    <cass-create-table-compaction-page
      v-if="activeStep === 2"
      ref="page2"
      v-model="createTableOptions"
      class="flex padded"
      @change="fetchPreview"
    ></cass-create-table-compaction-page>

    <cass-create-table-settings-page
      v-if="activeStep === 3"
      ref="page3"
      v-model="createTableOptions"
      class="flex padded"
    ></cass-create-table-settings-page>

    <cass-create-table-summary-page
      v-if="activeStep === 4"
      ref="page4"
      :preview-statement="previewStatement"
      :preview-loading="previewLoading"
      class="flex padded"
    ></cass-create-table-summary-page>

    <!-- errors/warnings -->
    <el-alert
      v-if="showAlert"
      :type="messageType"
      :title="messageContent"
      :class="$style.message"
      class="bordered"
      show-icon
    ></el-alert>

    <!-- tools -->
    <cass-create-table-schema-tools
      v-if="activeStep > 0 && activeStep < 4"
      v-model="createTableOptions"
      :expanded="true"
      :preview-statement="previewStatement"
      :preview-loading="previewLoading"
      :preview-error="previewError"
    ></cass-create-table-schema-tools>

    <!-- toolbar -->
    <div class="toolbar layout horizontal justified border__top">
      <el-button type="text" @click="changeMode()">
        <font-awesome-icon :icon="faCogs" fixed-width /> Switch to Advanced
        Mode</el-button
      >
      <div>
        <el-button @click="onCancel()">Cancel</el-button>
        <span :class="$style['button-separator']">|</span>
        <el-button
          type="primary"
          :disabled="isFirstPage"
          @click="onTransition(-1)"
          >Previous</el-button
        >
        <el-button
          type="primary"
          :disabled="isLastPage"
          @click="onTransition(1)"
          >Next</el-button
        >
        <span :class="$style['button-separator']">|</span>
        <el-button type="primary" @click="onFinish">Finish</el-button>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faCogs, faHdd, faSearch } from '@fortawesome/free-solid-svg-icons';
import { Alert, Button, Dialog, Menu, MenuItem, Steps, Step } from 'element-ui';
import { Routes } from '@/router/routes';
import CassCreateTableInfoPage from '@/components/cassandra/create-table/CassCreateTableInfoPage.vue';
import CassCreateTableColumnsPage from '@/components/cassandra/create-table/CassCreateTableColumnsPage.vue';
import CassCreateTableCompactionPage from '@/components/cassandra/create-table/CassCreateTableCompactionPage.vue';
import CassCreateTableSettingsPage from '@/components/cassandra/create-table/CassCreateTableSettingsPage.vue';
import CassCreateTableSummaryPage from '@/components/cassandra/create-table/CassCreateTableSummaryPage.vue';
import CassCreateTableStatementPreview from '@/components/cassandra/create-table/CassCreateTableStatementPreview.vue';
import CassCreateTableStorageLayout from '@/components/cassandra/create-table/CassCreateTableStorageLayout.vue';
import CassCreateTableSchemaTools from '@/components/cassandra/create-table/CassCreateTableSchemaTools.vue';
import { ICreateTableOptions } from '@cassandratypes/cassandra';
import { previewSchema, createTable } from '@/services/cassandra/CassService';
import debounce from 'lodash.debounce';
import store from '@/store';
import { ActionTypes } from '@/store/actions';
import { IValidationResult } from '@/typings/validation';
import { notify, confirmPrompt } from '@/utils/message-utils';
import { NotificationType } from '@/typings/notifications';
import merge from 'lodash.merge';
import { getDefaultTableProperties } from '@/utils/tableproperties-utils';

export default Vue.extend({
  name: 'CassCreateTableView',
  components: {
    [Alert.name]: Alert,
    [Button.name]: Button,
    [Dialog.name]: Dialog,
    [Menu.name]: Menu,
    [MenuItem.name]: MenuItem,
    [Steps.name]: Steps,
    [Step.name]: Step,
    CassCreateTableInfoPage,
    CassCreateTableColumnsPage,
    CassCreateTableCompactionPage,
    CassCreateTableSettingsPage,
    CassCreateTableSummaryPage,
    CassCreateTableStatementPreview,
    CassCreateTableStorageLayout,
    CassCreateTableSchemaTools,
    FontAwesomeIcon,
  },
  props: {
    clusterName: {
      type: String,
      required: true,
    },
    keyspaceName: {
      type: String,
      required: true,
    },
  },
  data() {
    const defaultTableOptions = {
      keyspace: this.keyspaceName,
      table: '',
      partitionColumns: [],
      clusteringColumns: [],
      staticColumns: [],
      options: getDefaultTableProperties(),
    } as ICreateTableOptions;

    let createTableOptions = defaultTableOptions;
    if (this.$route.query.table) {
      const queryStringTableOptions = JSON.parse(
        (this.$route.query.table || '') as string,
      );
      createTableOptions = merge(createTableOptions, queryStringTableOptions);
    }

    return {
      faCogs,
      faHdd,
      faSearch,
      selectedView: undefined,
      previewLoading: false,
      isLoading: false,
      createInProgress: false,
      previewStatement: undefined as string | undefined,
      previewError: undefined as string | undefined,
      createTableOptions,
      wizardPages: [
        { title: 'Information' },
        { title: 'Columns' },
        { title: 'Compaction' },
        { title: 'Settings' },
        { title: 'Summary' },
      ],
      messageType: 'error',
      messageContent: undefined as string | undefined,
      showAlert: false,
    };
  },
  computed: {
    isFirstPage(): boolean {
      return this.activeStep === 0;
    },
    isLastPage(): boolean {
      return this.activeStep >= this.wizardPages.length - 1;
    },
    activeStep: {
      get(): number {
        const qsStep = this.$route.query.step as string;
        return qsStep ? parseInt(qsStep, 10) : 0;
      },
      set(step: number) {
        this.$router.push({
          name: this.$route.name as string,
          params: this.$route.params,
          query: {
            ...this.$route.query,
            step: step + '',
          },
        });
      },
    },
  },
  watch: {
    createTableOptions: {
      deep: true,
      handler() {
        this.fetchPreview();
      },
    },
  },
  created() {
    this.fetchPreview = debounce(this.fetchPreview, 1000);
    store.dispatch(ActionTypes.FetchDataTypes, {
      cluster: this.clusterName,
      keyspace: this.keyspaceName,
    });
    this.fetchPreview();
  },
  methods: {
    async changeMode() {
      const query = {};
      if (this.previewStatement) {
        if (
          !(await confirmPrompt(
            'Go Advanced?',
            `You already have a generated CREATE TABLE statement.
              This will be used in the advanced mode. Note: once you
              switch to Advanced mode, your settings will not be preserved
              if you switch back to Simple mode.`,
            'Go Advanced',
            'No',
            NotificationType.Warning,
            {
              closeOnHashChange: false,
              closeOnClickModal: false,
            },
          ))
        ) {
          return;
        }
        query['statement'] = this.previewStatement;
      }
      this.$router.push({
        name: Routes.CassandraTableCreateAdvanced,
        query,
      });
    },
    onCancel() {
      this.$router.push({
        name: Routes.CassandraKeyspace,
        params: {
          clusterName: this.clusterName,
          keyspaceName: this.keyspaceName,
        },
      });
    },
    async onFinish() {
      this.createInProgress = true;
      try {
        const { clusterName, keyspaceName } = this;
        await createTable(clusterName, keyspaceName, this.createTableOptions);

        store.dispatch(ActionTypes.FetchKeyspaceTables, {
          clusterName,
          keyspaceName,
        });

        // redirect to the new table
        this.$router.replace({
          name: Routes.CassandraTableData,
          params: {
            keyspaceName,
            tableName: this.createTableOptions.table,
          },
        });
        notify(
          NotificationType.Success,
          'Created New Table',
          `${this.keyspaceName}.${this.createTableOptions.table} created successfully.`,
        );
      } catch (err) {
        notify(
          NotificationType.Error,
          'Failed to create Table',
          err.remediation || err.message,
        );
      } finally {
        this.createInProgress = false;
      }
    },
    async fetchPreview() {
      this.$router.replace({
        name: this.$route.name as string,
        params: this.$route.params,
        query: {
          ...this.$route.query,
          table: JSON.stringify(this.createTableOptions),
        },
      });

      if (this.createTableOptions.partitionColumns.length > 0) {
        this.previewLoading = true;
        this.previewError = undefined;
        try {
          const result = await previewSchema(
            this.clusterName,
            this.keyspaceName,
            this.createTableOptions,
          );
          this.previewStatement = result.statement;
        } catch (err) {
          this.previewError = err.message;
        } finally {
          this.previewLoading = false;
        }
      } else {
        this.previewStatement = '';
      }
    },
    async onTransition(increment) {
      this.clearMessage();
      if (increment > 0) {
        const validation = await this.validateCurrentPage();
        if (!validation.isValid) {
          this.showMessage(
            'error',
            validation.message ||
              'Please correct any validatiion errors to proceed',
          );
          return;
        }
        this.fetchPreview();
      }
      this.transition(increment);
    },
    async validateCurrentPage(): Promise<IValidationResult> {
      const page = this.$refs[`page${this.activeStep}`];
      if (Object.prototype.hasOwnProperty.call(page, 'validate')) {
        const validationResult = (await (page as any).validate()) as IValidationResult;
        return validationResult;
      }
      return {
        isValid: true,
        message: undefined,
      };
    },
    transition(increment) {
      if (this.isFirstPage && increment < 0) return;
      if (this.isLastPage && increment > 0) return;
      this.activeStep += increment;
    },
    onColumnChanged() {
      const {
        partitionColumns,
        clusteringColumns,
        staticColumns,
      } = this.createTableOptions;
      const checkForBlob = (col) => col.type === 'blob';
      if (
        partitionColumns.find(checkForBlob) ||
        clusteringColumns.find(checkForBlob)
      ) {
        this.showMessage(
          'warning',
          this.$t('cassandra.createTable.errors.blobPrimaryKey') as string,
        );
      } else if (staticColumns.find((col) => col.type === 'counter')) {
        this.showMessage(
          'warning',
          this.$t('cassandra.createTable.warnings.counters') as string,
        );
      } else if (staticColumns.length === 0) {
        this.showMessage(
          'warning',
          'Reminder: Cassandra does not allow primary keys to be updated via UPDATE statements. Rows will be immutable.',
        );
      } else {
        this.clearMessage();
      }
    },
    showMessage(type: 'error' | 'warning', message: string) {
      this.showAlert = true;
      this.messageType = type;
      this.messageContent = message;
    },
    clearMessage() {
      this.showAlert = false;
    },
  },
});
</script>
<style module>
.button-separator {
  color: var(--color-text-subdued);
  margin: 0 var(--spacer-standard);
}

.message {
  margin: var(--spacer-standard);
}
</style>
