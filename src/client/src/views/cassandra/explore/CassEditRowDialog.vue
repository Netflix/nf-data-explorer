<template>
  <cass-row-dialog
    v-if="schema && row"
    v-model="row"
    v-loading="isLoading || isDownloading"
    :element-loading-text="loadingText"
    :insert-statement="insertStatement"
    :schema="schema"
    :save-in-progress="saveInProgress"
    :truncated-columns="truncatedColumns"
    @save="onSave"
    @delete="onDelete"
    @close="onClose"
    @download="onDownload"
  >
  </cass-row-dialog>
</template>
<script lang="ts">
import Vue from 'vue';
import { Loading } from 'element-ui';
import {
  ITableSchema,
  IKeyQuery,
  IRowDetails,
} from '@cassandratypes/cassandra';
import {
  fetchTable,
  updateRecord,
  deleteRecord,
  downloadBlob,
  getKeyResults,
  getInsertStatements,
} from '@/services/cassandra/CassService';
import { notify } from '@/utils/message-utils';
import { NotificationType } from '@/typings/notifications';
import CassRowDialog from '@/components/cassandra/CassRowDialog.vue';
import { getEditableColumnNames } from '@/utils/cassandra-utils';
import { Prop } from 'vue/types/options';
import { getRowDetails } from '@/utils/cassandra-primary-key-utils';

export default Vue.extend({
  name: 'CassEditRowDialog',
  components: {
    CassRowDialog,
  },
  props: {
    cluster: {
      type: String,
      required: true,
    },
    keyspace: {
      type: String,
      required: true,
    },
    table: {
      type: String,
      required: true,
    },
    primaryKey: {
      type: Object as Prop<IKeyQuery>,
      required: true,
    },
  },
  data() {
    return {
      isLoading: false,
      isDownloading: false,
      saveInProgress: false,
      schema: undefined as ITableSchema | undefined,
      row: undefined as IRowDetails | undefined,
      truncatedColumns: undefined as string[] | undefined,
      insertStatement: undefined as string | undefined,
      loadingMask: undefined as any,
    };
  },
  computed: {
    loadingText(): string | undefined {
      if (this.isLoading) return 'Loading record...';
      else if (this.isDownloading) return 'Downloading binary content...';
      return undefined;
    },
  },
  watch: {
    isLoading: {
      immediate: true,
      handler: function (loading) {
        if (loading) {
          this.loadingMask = Loading.service({
            text: 'Fetching record...',
            background: 'rgba(255,255,255,.4)',
          });
        } else {
          if (this.loadingMask) {
            this.loadingMask.close();
          }
        }
      },
    },
  },
  created() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      this.isLoading = true;
      this.$emit('loading');
      try {
        await this.loadSchema();
        await this.loadRow();
        // intentionally don't await for this, don't block the display of the dialog
        this.generateInsertStatement();
      } catch (err) {
        await notify(NotificationType.Error, 'Failed to fetch', err.message);
      } finally {
        this.isLoading = false;
        this.$emit('loaded');
      }
    },
    async loadSchema() {
      this.schema = await fetchTable(this.cluster, this.keyspace, this.table);
    },
    async loadRow() {
      try {
        const { cluster, keyspace, table, primaryKey, schema } = this;
        const result = await getKeyResults(
          cluster,
          keyspace,
          table,
          primaryKey,
          undefined,
          {
            truncate: 'binary',
          },
        );
        const { rows, truncatedColumns } = result;
        if (rows.length === 0) {
          await notify(
            NotificationType.Error,
            'Record Not Found',
            'This record may have been deleted.',
          );
          this.$emit('close');
          return;
        } else if (rows.length > 1) {
          await notify(
            NotificationType.Error,
            'Invalid Primary Key',
            'Multiple records returned. You may need to include more columns in your query to ensure a unique record.',
          );
          this.$emit('invalid-primary-key');
          this.$emit('close');
          return;
        }
        if (schema) {
          this.row = getRowDetails(schema, rows[0], primaryKey.options, 'all');
          this.truncatedColumns = truncatedColumns;
        }
      } catch (err) {
        await notify(NotificationType.Error, 'Failed to load row', err.message);
      }
    },
    async generateInsertStatement() {
      try {
        const result = await getInsertStatements(
          this.cluster,
          this.keyspace,
          this.table,
          this.primaryKey,
        );
        const statements = result.records;
        if (statements) {
          if (statements.length !== 1) {
            await notify(
              NotificationType.Error,
              'Failed to generate insert statement',
              'Unable to generate an insert statement for this record.',
            );
          }
          this.insertStatement = statements[0];
        }
      } catch (err) {
        await notify(
          NotificationType.Error,
          'Failed to generate insert statement',
          err.message,
        );
        this.$emit('close');
      }
    },
    async onSave() {
      if (!this.schema) return;
      this.saveInProgress = true;
      try {
        if (this.row) {
          const editableColumns = getEditableColumnNames(this.schema);
          const updatedFields = editableColumns.reduce(
            (memo, curr) => ({
              ...memo,
              [curr.name]: this.row ? this.row[curr.name] : undefined,
            }),
            {},
          );

          await updateRecord(
            this.cluster,
            this.keyspace,
            this.table,
            this.primaryKey,
            updatedFields,
          );
          notify(
            NotificationType.Success,
            'Successfully updated record',
            'Record updated.',
          );
          this.$emit('update-record');
        }
      } catch (err) {
        notify(NotificationType.Error, 'Failed to update', err.message);
      } finally {
        this.saveInProgress = false;
      }
    },
    async onDelete() {
      this.saveInProgress = true;
      try {
        await deleteRecord(
          this.cluster,
          this.keyspace,
          this.table,
          this.primaryKey,
        );
        this.$emit('delete-record');
      } catch (err) {
        notify(NotificationType.Error, 'Failed to delete', err.message);
      } finally {
        this.saveInProgress = false;
      }
    },
    async onDownload(details) {
      const { column, type } = details;
      try {
        this.isDownloading = true;
        const result = await downloadBlob(
          this.cluster,
          this.keyspace,
          this.table,
          this.primaryKey,
          column,
          type === 'hex',
        );

        switch (result.status) {
          case 200: {
            const title =
              type === 'download'
                ? 'Downloaded Successfully'
                : 'Hex Content Retrieved Successfully';
            const message =
              type === 'download'
                ? 'Blob downloaded successfully'
                : result.message || 'Blob retrieved as Hex successfully';
            notify(NotificationType.Success, title, message);
            break;
          }
          case 204:
            notify(
              NotificationType.Warning,
              'No Content Found',
              'No content was found in this column.',
            );
            break;
        }
      } finally {
        this.isDownloading = false;
      }
    },
    onClose() {
      this.$emit('close');
    },
  },
});
</script>
