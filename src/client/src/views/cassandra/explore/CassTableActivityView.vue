<template>
  <div class="cass-table-sample-queries padded layout vertical">
    <el-alert
      v-if="error"
      title="Unable to load metrics"
      :description="error"
      show-icon
    >
    </el-alert>
    <template v-else>
      <el-form inline>
        <el-form-item label="Range">
          <el-select v-model="range" @change="fetchData">
            <el-option
              v-for="option in rangeOptions"
              :key="option.label"
              :value="option.value"
              :label="option.label"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Include:">
          <el-checkbox
            v-model="showMovingAverage"
            label="Moving Average"
          ></el-checkbox>
        </el-form-item>
      </el-form>
      <div
        v-loading="loading"
        class="flex layout vertical"
        element-loading-text="Loading activity..."
      >
        <cass-table-activity
          v-if="tableMetrics"
          class="flex"
          style="max-height: 600px;"
          :table-metrics="tableMetrics"
          :range="range"
          :step="step"
          :show-moving-average="showMovingAverage"
          :tooltips="true"
        ></cass-table-activity>
      </div>
    </template>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Alert, Checkbox, Form, FormItem, Select, Option } from 'element-ui';
import CassSampleQuery from '@/components/cassandra/CassSampleQuery.vue';
import CassTableActivity from '@/components/cassandra/CassTableActivity.vue';
import { getTableMetrics } from '@/services/cassandra/CassService';
import { ICassMetricsTableUsage } from '@cassandratypes/cassandra';

interface IRangeOptions {
  label: string;
  value: 'week' | 'day';
  step: 'day' | 'hour';
}

export default Vue.extend({
  name: 'CassTableActivityView',
  components: {
    [Alert.name]: Alert,
    [Checkbox.name]: Checkbox,
    [Form.name]: Form,
    [FormItem.name]: FormItem,
    [Select.name]: Select,
    [Option.name]: Option,
    CassSampleQuery,
    CassTableActivity,
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
    tableName: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      tableMetrics: undefined as ICassMetricsTableUsage | undefined,
      loading: false,
      error: false as string | false,
      range: 'day' as 'week' | 'day',
      rangeOptions: [
        {
          label: 'Past 24 Hours',
          value: 'day',
          step: 'hour',
        },
        {
          label: 'Past Week',
          value: 'week',
          step: 'hour',
        },
      ] as IRangeOptions[],
      showMovingAverage: true,
    };
  },
  computed: {
    step(): 'day' | 'hour' | undefined {
      const selection = this.rangeOptions.find(
        (item) => item.value === this.range,
      );
      return selection ? selection.step : undefined;
    },
  },
  watch: {
    tableName(newTableName) {
      if (newTableName) {
        this.fetchData();
      }
    },
  },
  created() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      try {
        this.tableMetrics = undefined;
        this.error = false;
        this.loading = true;
        this.tableMetrics = await getTableMetrics(
          this.clusterName,
          this.keyspaceName,
          this.tableName,
          this.range,
          this.step || 'day',
        );
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
  },
});
</script>
<style module>
.query {
  white-space: pre-wrap;
  margin-top: 20px;
  margin-bottom: 20px;
}
</style>
