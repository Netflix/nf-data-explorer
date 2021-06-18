<template>
  <cass-row-dialog
    v-if="schema && row"
    v-model="row"
    v-loading="isLoading"
    element-loading-text="Loading record..."
    :schema="schema"
    :save-in-progress="saveInProgress"
    create
    @save="onSave"
    @close="onClose"
  >
  </cass-row-dialog>
</template>
<script lang="ts">
import Vue from 'vue';
import { ITableSchema, IRowDetails } from '@cassandratypes/cassandra';
import {
  fetchTable,
  insertRecord,
  updateRecord,
} from '@/services/cassandra/CassService';
import { notify } from '@/utils/message-utils';
import { NotificationType } from '@/typings/notifications';
import CassRowDialog from '@/components/cassandra/CassRowDialog.vue';
import {
  getKeyQueryFromRowDetails,
  getRowWithoutKey,
} from '@/utils/cassandra-primary-key-utils';

export default Vue.extend({
  name: 'CassAddRowDialog',
  components: { CassRowDialog },
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
  },
  data() {
    return {
      isLoading: false,
      saveInProgress: false,
      schema: undefined as ITableSchema | undefined,
      row: undefined as IRowDetails | undefined,
    };
  },
  created() {
    this.fetchSchema();
  },
  methods: {
    async fetchSchema() {
      this.schema = await fetchTable(this.cluster, this.keyspace, this.table);

      // create an empty model based on the available columns
      this.row = this.schema.columns.reduce(
        (memo, curr) => ({
          ...memo,
          [curr.name]: {
            value: undefined,
            options: {
              encoding: undefined,
            },
          },
        }),
        {} as IRowDetails,
      );
    },
    async onSave() {
      this.saveInProgress = true;
      try {
        const { cluster, keyspace, table, row, schema } = this;
        if (
          row &&
          schema &&
          schema.columns.find((col) => col.type === 'counter')
        ) {
          // in order to "insert" into tables that have counter fields, an update must be performed instead
          const primaryKey = getKeyQueryFromRowDetails(schema, row, {
            encoding: undefined,
            decodeValues: false,
          });
          const fields = getRowWithoutKey(schema, row);
          await updateRecord(cluster, keyspace, table, primaryKey, fields);
        } else if (row) {
          await insertRecord(cluster, keyspace, table, row);
        } else {
          throw new Error('Row is undefined');
        }

        this.$emit('add-record');
        notify(
          NotificationType.Success,
          'Successfully inserted record',
          'Record inserted.',
        );
      } catch (err) {
        notify(NotificationType.Error, err.title, err.message);
      } finally {
        this.saveInProgress = false;
      }
    },
    onClose() {
      this.$emit('close');
    },
  },
});
</script>
