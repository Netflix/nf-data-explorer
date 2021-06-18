<template>
  <el-dialog
    v-loading="loading"
    :class="$style.dialog"
    :close-on-click-modal="false"
    :element-loading-text="loadingText"
    width="1300px"
    visible
    @close="returnToTable"
  >
    <div slot="title" :class="$style.dialogTitle">
      <span :class="$style.dialogTitleMode">{{ mode }} Table </span>
      <strong>{{ keyspaceName }}.{{ tableName }}</strong
      >?
    </div>

    <div v-if="metricsRequired && !tableMetrics && !tableMetricsLoading">
      <el-alert type="error" title="No Metrics Available" show-icon>{{
        $t('cassandra.dropTable.errors.noMetricsAvailable')
      }}</el-alert>
    </div>
    <div v-else class="mt-4">
      <div>
        <span v-if="mode === 'drop'"
          >Dropping a table will permanently
          <strong>delete the table definition and all data</strong>.</span
        >
        <span v-else-if="mode === 'truncate'"
          >Truncating a table will permanently
          <strong>delete all data</strong> in this table.</span
        >
        <span v-if="hasMetricsFeature">
          Here are some metrics to help inform your decision. Note metrics may
          be delayed and might not show activity from the last hour.</span
        >
      </div>

      <div :class="$style.grid">
        <el-card
          v-for="badge in badges"
          :key="badge.title"
          :class="$style.card"
        >
          <div slot="header" class="clearfix">
            <span>{{ badge.title }}</span>
          </div>
          <div class="layout vertical center-center">
            <div class="layout horizontal center">
              <font-awesome-icon
                v-if="badge.value !== 0 && badge.value !== null"
                :icon="faExclamationTriangle"
                :class="$style.warningIcon"
              ></font-awesome-icon>
              <div :class="$style.badgeValue" class="ml-2">
                {{ badge.formattedValue }}
              </div>
            </div>
            <div :class="$style.badgeDescription">
              {{ badge.description ? ' ' + badge.description : '' }}
            </div>
          </div>
        </el-card>
      </div>

      <cass-table-activity
        v-if="tableMetrics"
        class="mt-4"
        :table-metrics="tableMetrics"
        :range="chartRange"
        :step="chartStep"
        :tooltips="false"
      ></cass-table-activity>

      <el-form
        v-show="hasMetricsFeature"
        ref="metricsForm"
        :model="this"
        :rules="metricsFormRules"
        label-position="top"
      >
        <el-form-item
          label="Confirm Data Size to Delete"
          prop="confirmDataSize"
          required
        >
          <el-input
            v-model="confirmDataSize"
            placeholder="Enter the data size above to confirm deletion (e.g. 1.2TB)"
            style="width: 400px;"
          ></el-input>
        </el-form-item>
      </el-form>
      <el-form
        v-show="!hasMetricsFeature"
        ref="nonMetricsForm"
        :model="this"
        :rules="nonMetricsFormRules"
        label-position="top"
        @submit.native.prevent
      >
        <el-form-item
          label="Confirm Operation"
          prop="confirmOperation"
          required
        >
          <el-input
            v-model="confirmOperation"
            :placeholder="
              'Enter the name of the operation to perform (e.g. ' + mode + ' )'
            "
            style="width: 400px;"
          ></el-input>
        </el-form-item>
      </el-form>
    </div>

    <span slot="footer" class="layout horizontal end-justified">
      <div>
        <el-button :disabled="dropInProgress" @click="returnToTable"
          >Cancel</el-button
        >
        <el-button
          :disabled="dropInProgress"
          type="primary"
          @click="onAction()"
        >
          <font-awesome-icon :icon="faTrashAlt"></font-awesome-icon>
          {{ actionButtonText }}
        </el-button>
      </div>
    </span>
  </el-dialog>
</template>
<script lang="ts">
import Vue from 'vue';
import {
  Alert,
  Button,
  Card,
  Dialog,
  Form,
  FormItem,
  Input,
  Steps,
  Step,
} from 'element-ui';
import {
  getTableMetrics,
  dropTable,
  truncateTable,
} from '@/services/cassandra/CassService';
import { Routes } from '@/router/routes';
import store from '@/store';
import { IRegionInfo } from '@sharedtypes/typings';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faExclamationTriangle,
  faTrashAlt,
} from '@fortawesome/free-solid-svg-icons';
import { formatNumber, formatBytes } from '@/filters';
import { ICassMetricsTableUsage } from '@cassandratypes/cassandra';
import { Prop } from 'vue/types/options';
import CassTableActivity from '@/components/cassandra/CassTableActivity.vue';
import { hasFeature } from '@/utils/feature-utils';
import { notify } from '@/utils/message-utils';
import { NotificationType } from '@/typings/notifications';

export default Vue.extend({
  name: 'CassDropTableDialog',
  components: {
    [Alert.name]: Alert,
    [Button.name]: Button,
    [Card.name]: Card,
    [Dialog.name]: Dialog,
    [Form.name]: Form,
    [FormItem.name]: FormItem,
    [Input.name]: Input,
    [Steps.name]: Steps,
    [Step.name]: Step,
    FontAwesomeIcon,
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
    mode: {
      type: String as Prop<'drop' | 'truncate'>,
      validator: (value: string) => ['drop', 'truncate'].includes(value),
      required: true,
    },
  },
  data() {
    return {
      faExclamationTriangle,
      faTrashAlt,
      confirmDataSize: undefined as string | undefined,
      confirmOperation: undefined as string | undefined,
      dropInProgress: false,
      tableMetricsLoading: false,
      tableMetrics: undefined as ICassMetricsTableUsage | undefined,
      chartRange: 'week' as 'week' | 'day',
      chartStep: 'hour' as 'day' | 'hour',
    };
  },
  computed: {
    loading(): boolean {
      return this.tableMetricsLoading || this.dropInProgress;
    },
    loadingText(): string | undefined {
      if (this.tableMetricsLoading) {
        return 'Loading table usage metrics...';
      } else if (this.dropInProgress) {
        return `${this.mode === 'drop' ? 'Dropping' : 'Truncating'} table...`;
      }
      return undefined;
    },
    actionButtonText(): string | undefined {
      if (this.mode === 'drop') {
        return 'Drop Table and All Data';
      } else if (this.mode === 'truncate') {
        return 'Truncate Table';
      }
      return undefined;
    },
    currentEnv(): IRegionInfo | undefined {
      const { environments } = store.state.config;
      if (environments) {
        return environments.current;
      }
      return undefined;
    },
    formattedSizeInBytes(): string {
      if (!this.tableMetrics) return 'N/A';
      return formatBytes(this.tableMetrics.sizeInBytes);
    },
    badges(): any[] {
      if (!this.tableMetrics) return [];
      const {
        estimatedRowCount,
        coordinatorTotalReads,
        replicaTotalReads,
        replicaTotalWrites,
        sizeInBytes,
      } = this.tableMetrics;
      return [
        {
          title: 'Data Size',
          value: sizeInBytes,
          formattedValue: this.formattedSizeInBytes,
        },
        {
          title: 'Approximate Row Count',
          value: estimatedRowCount,
          formattedValue: formatNumber(estimatedRowCount),
        },
        {
          title: 'Coordinator Total Reads',
          value: coordinatorTotalReads,
          formattedValue: formatNumber(coordinatorTotalReads),
          description: 'past 24 hours',
        },
        {
          title: 'Replica Total Reads',
          value: replicaTotalReads,
          formattedValue: formatNumber(replicaTotalReads),
          description: 'past 24 hours',
        },
        {
          title: 'Replica Total Writes',
          value: replicaTotalWrites,
          formattedValue: formatNumber(replicaTotalWrites),
          description: 'past 24 hours',
        },
      ];
    },
    metricsFormRules() {
      return {
        confirmDataSize: [
          {
            required: true,
            validator: (_rule, value: string, cb) => {
              if (
                value &&
                value.toLowerCase() === this.formattedSizeInBytes.toLowerCase()
              ) {
                return cb();
              }
              cb(new Error('Value does not match the data size above'));
            },
          },
        ],
      };
    },
    nonMetricsFormRules() {
      return {
        confirmOperation: [
          {
            required: true,
            validator: (_rule, value: string, cb) => {
              if (value && value.toLowerCase() === this.mode.toLowerCase()) {
                return cb();
              }
              cb(
                new Error(
                  `Please type the name operation to be performed (e.g. ${this.mode})`,
                ),
              );
            },
          },
        ],
      };
    },
    hasMetricsFeature(): boolean {
      return hasFeature(store, 'metrics');
    },
    metricsRequired(): boolean {
      return hasFeature(store, 'metricsRequiredForDestructiveOperations');
    },
  },
  watch: {
    hasMetricsFeature() {
      this.fetchData();
    },
  },
  created() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      if (!this.hasMetricsFeature) return;
      try {
        this.tableMetricsLoading = true;
        this.tableMetrics = await getTableMetrics(
          this.clusterName,
          this.keyspaceName,
          this.tableName,
          this.chartRange,
          this.chartStep,
        );
      } finally {
        this.tableMetricsLoading = false;
      }
    },
    async onAction() {
      const form = this.hasMetricsFeature
        ? this.$refs.metricsForm
        : (this.$refs.nonMetricsForm as any);
      if (!(await form.validate())) {
        return;
      }

      try {
        this.dropInProgress = true;
        if (this.mode === 'drop') {
          await dropTable(this.clusterName, this.keyspaceName, this.tableName);
        } else if (this.mode === 'truncate') {
          await truncateTable(
            this.clusterName,
            this.keyspaceName,
            this.tableName,
          );
        }

        notify(
          NotificationType.Success,
          `Successfully ${
            this.mode === 'drop' ? 'Dropped' : 'Truncated'
          } table`,
          'Operation succeeded.',
        );

        if (this.mode === 'drop') {
          this.$emit('drop-table');
        } else {
          this.$emit('truncate-table');
        }
      } catch (err) {
        notify(NotificationType.Error, err.message, err.remediation);
      } finally {
        this.dropInProgress = false;
      }
    },
    returnToTable() {
      this.$router.replace({
        name: Routes.CassandraTableData,
        params: this.$route.params,
      });
    },
  },
});
</script>
<style module>
.dialog :global .el-dialog__body {
  padding-top: 0;
  padding-bottom: 0;
}

.dialogTitle {
  font-size: 18px;
}

.dialogTitleMode {
  text-transform: capitalize;
}

.warning :global .el-step__head {
  color: var(--red-400);
}

.card + .card {
  margin-left: 20px;
}

.grid {
  margin-top: 20px;
  display: grid;
  grid-gap: 10px;
  grid-template-columns: repeat(5, 1fr);
}

.warningIcon {
  color: var(--red-400);
  font-size: 20px;
}

.badgeValue {
  font-size: 30px;
  font-weight: bold;
  margin-bottom: 5px;
}

.badgeDescription {
  color: var(--neutral-400);
}

.badgeIcon {
  font-size: 24px;
  color: var(--yellow-500);
}
</style>
