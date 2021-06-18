<template>
  <div class="layout horizontal">
    <time-series-chart
      v-for="chart in charts"
      :key="chart.title + '-' + range"
      :class="$style.chart"
      :title="chart.title"
      :chart-data="chart.data"
      :background-color="chart.backgroundColor"
      :style="{ position: 'relative', width: '30%' }"
      :start-date="startDate"
      :step-size="stepSize"
      :show-average="false"
      :tooltips="tooltips"
      :moving-averages="movingAverages"
      :units="range === 'week' ? 'day' : 'hour'"
      tooltip-format="0,0.[00000]"
      y-axis-format="0,0.[00000]"
    >
    </time-series-chart>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import TimeSeriesChart from '@/components/common/charts/TimeSeriesChart.vue';
import { ICassMetricsTableUsage } from '@cassandratypes/cassandra';
import { PropOptions, Prop } from 'vue/types/options';
import { addWeeks, addHours, addDays } from 'date-fns';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export default Vue.extend({
  name: 'CassTableActivity',
  components: {
    TimeSeriesChart,
  },
  props: {
    tableMetrics: {
      type: Object as Prop<ICassMetricsTableUsage>,
      required: true,
    },
    range: {
      type: String,
      required: true,
      validator: (value) => ['week', 'day'].includes(value),
    } as PropOptions<'week' | 'day'>,
    step: {
      type: String,
      required: true,
      validator: (value) => ['day', 'hour'].includes(value),
    } as PropOptions<'day' | 'hour'>,
    tooltips: {
      type: Boolean,
    },
    showMovingAverage: {
      type: Boolean,
    },
  },
  computed: {
    charts(): any[] {
      if (!this.tableMetrics) return [];
      const {
        replicaHistoricalReads,
        replicaHistoricalWrites,
      } = this.tableMetrics;
      return [
        {
          title: 'Coordinator Reads/Second',
          data: this.coordinatorHistoricalReads,
          backgroundColor: 'rgba(130,200,240,0.5)',
        },
        {
          title: 'Replica Reads/Second',
          data: replicaHistoricalReads,
        },
        {
          title: 'Replica Writes/Second',
          data: replicaHistoricalWrites,
        },
      ];
    },
    coordinatorHistoricalReads(): number[] {
      if (!this.tableMetrics) return [];
      return this.tableMetrics.coordinatorHistoricalReads;
    },
    chartLabels(): any[] {
      if (!this.tableMetrics) return [];
      const startFn = this.range === 'week' ? addWeeks : addDays;
      const stepFn = this.step === 'day' ? addDays : addHours;
      const result = [startFn(Date.now(), -1)];
      for (let i = 1; i < this.coordinatorHistoricalReads.length; i++) {
        result.push(stepFn(result[i - 1], 1));
      }
      return result;
    },
    startDate(): number {
      const days = this.range === 'week' ? DAY * 7 : DAY;
      return Date.now() - days;
    },
    stepSize(): number {
      return this.step === 'day' ? DAY : HOUR;
    },
    movingAverages(): number[] {
      if (!this.showMovingAverage) return [];
      return this.range === 'week' ? [10, 50] : [10];
    },
  },
});
</script>
<style module>
.chart:first-child {
  margin-right: 40px;
}

.chart + .chart {
  margin-left: 20px;
}
</style>
