<template>
  <basic-line-chart
    :chart-data="dataCollection"
    :options="chartOptions"
  ></basic-line-chart>
</template>
<script lang="ts">
import Vue from 'vue';
import BasicLineChart from '@/components/common/charts/BasicLineChart.vue';
import { Prop } from 'vue/types/options';

export default Vue.extend({
  name: 'SparkLine',
  components: {
    BasicLineChart,
  },
  props: {
    chartData: {
      type: Array as Prop<number[]>,
    },
    backgroundColor: {
      type: Array,
    },
  },
  computed: {
    dataCollection(): any {
      return {
        labels: this.chartData.map((_val, index) => index),
        datasets: [
          {
            backgroundColor: this.backgroundColor,
            data: this.chartData,
            pointRadius: 0,
          },
        ],
      };
    },
    chartOptions(): any {
      return {
        responsive: true,
        maintainAspectRatio: false,
        legend: { display: false },
        tooltips: { enabled: false },
        title: { display: false },
        scales: {
          yAxes: [{ display: false }],
          xAxes: [{ display: false }],
        },
      };
    },
  },
});
</script>
<style module></style>
