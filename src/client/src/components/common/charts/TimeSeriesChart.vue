<template>
  <basic-line-chart
    :chart-data="dataCollection"
    :options="chartOptions"
  ></basic-line-chart>
</template>
<script lang="ts">
import Vue from 'vue';
import { Prop, PropOptions } from 'vue/types/options';
import { formatNumber } from '@/filters';
import BasicLineChart from './BasicLineChart.vue';
import { movingAverage } from '@/utils/math-utils';

export default Vue.extend({
  name: 'TimeSeriesChart',
  components: {
    BasicLineChart,
  },
  props: {
    chartData: {
      type: Array as Prop<number[]>,
    },
    startDate: {
      type: Number as Prop<number>,
    },
    stepSize: {
      type: Number,
    },
    backgroundColor: {
      type: String,
      default: 'rgba(0, 0, 0, 0.1)',
    },
    title: {
      type: String,
    },
    tooltips: {
      type: Boolean,
      default: true,
    },
    tooltipFormat: {
      type: String,
      default: '0,0.[00000]',
    },
    tooltipSuffix: {
      type: String,
    },
    showAverage: {
      type: Boolean as Prop<boolean>,
    },
    yAxisWidth: {
      type: Number,
    },
    yAxisFormat: {
      type: String,
    },
    movingAverages: {
      type: Array as Prop<number[]>,
    },
    units: {
      type: String,
      required: true,
      validator: (value) =>
        ['second', 'minute', 'hour', 'day', 'week', 'month'].includes(value),
    } as PropOptions<'second' | 'minute' | 'hour' | 'day' | 'week' | 'month'>,
  },
  computed: {
    dataCollection(): any {
      const labels = [this.startDate];
      for (let i = 1; i < this.chartData.length; i++) {
        labels.push(labels[i - 1] + this.stepSize);
      }

      const data = {
        labels,
        datasets: [
          {
            label: this.title,
            backgroundColor: this.backgroundColor,
            data: this.chartData,
            pointRadius: this.tooltips ? 2 : 0,
          },
        ] as any[],
      };

      if (this.movingAverages) {
        const movingAverageColors = ['rgba(32, 189, 126, 0.7)', 'orange'];
        data.datasets.push(
          ...this.movingAverages.map((size, index) => {
            const color =
              index < movingAverageColors.length
                ? movingAverageColors[index]
                : undefined;

            return {
              label: `${size} ${this.getStepDisplayUnit()} moving average`,
              type: 'line',
              borderColor: color,
              backgroundColor: color,
              fill: false,
              data: movingAverage(this.chartData, size / 2, size / 2),
              pointRadius: 0,
              borderWidth: 2,
            };
          }),
        );
      }

      return data;
    },
    chartOptions(): any {
      const annotation = {
        annotations: new Array<any>(),
      };
      if (this.showAverage) {
        const items = this.chartData.filter((value) => value !== null);
        const avg = items.reduce((prev, curr) => prev + curr, 0) / items.length;
        annotation.annotations = [
          {
            type: 'line',
            mode: 'horizontal',
            scaleID: 'y-axis-0',
            value: avg,
            borderColor: 'rgba(0, 0, 0, 0.6)',
            borderDash: [5, 5],
            borderWidth: 2,
            label: {
              enabled: true,
              content: 'Avg',
              position: 'right',
              fontSize: 10,
              backgroundColor: 'rgba(0,0,0,0.75)',
              xAdjust: 3,
            },
          },
        ];
      }
      return {
        annotation,
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          display: false,
        },
        tooltips: {
          enabled: this.tooltips,
          intersect: false,
          callbacks: {
            label: (tooltipItem, data) => {
              const dataset = data.datasets[tooltipItem.datasetIndex];
              const label = dataset.label || 'Value';
              const value = tooltipItem.yLabel;
              const formattedValue = this.tooltipFormat
                ? formatNumber(value, this.tooltipFormat)
                : value;
              return `${label}: ${formattedValue} ${this.tooltipSuffix || ''}`;
            },
          },
        },
        title: {
          display: this.title !== undefined,
          text: this.title,
        },
        scales: {
          yAxes: [
            {
              display: true,
              ticks: {
                beginAtZero: true,
                suggestedMax:
                  Math.max(...this.chartData, 0) < 0.000000001
                    ? 0.00001
                    : undefined,
                // Note: never use `min`. using min with very small numbers can cause infinite loops in chart.js
                callback: (label) => {
                  if (this.yAxisFormat) {
                    return formatNumber(label, this.yAxisFormat);
                  }
                  return label;
                },
              },
              afterFit: (scaleInstance) => {
                if (this.yAxisWidth) {
                  scaleInstance.width = this.yAxisWidth;
                }
              },
            },
          ],
          xAxes: [
            {
              display: true,
              type: 'time',
              min: undefined,
              ticks: {
                stepSize: 1,
              },
              time: {
                unit: this.units,
              },
            },
          ],
        },
      };
    },
  },
  methods: {
    getStepDisplayUnit() {
      const step = this.stepSize / 1000;
      if (step % (60 * 60) === 0) {
        return 'hour';
      } else if (step % 60 === 0) {
        return 'minute';
      } else {
        return 'second';
      }
    },
  },
});
</script>
