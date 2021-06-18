<template>
  <div class="layout vertical">
    <div>
      You are ready to create your new table. Please review the schema
      definition below before submitting.
    </div>
    <cass-create-table-statement-preview
      v-model="previewStatement"
      v-loading="previewLoading"
      class="flex"
      element-loading-text="Loading CQL statement..."
      readonly
    ></cass-create-table-statement-preview>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import CassCreateTableStatementPreview from '@/components/cassandra/create-table/CassCreateTableStatementPreview.vue';

export default Vue.extend({
  name: 'CassCreateTableSummaryPage',
  components: {
    CassCreateTableStatementPreview,
  },
  props: {
    previewStatement: {
      type: String,
    },
    previewLoading: {
      type: Boolean,
    },
  },
});
</script>
