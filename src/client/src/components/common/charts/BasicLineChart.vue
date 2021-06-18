<script>
import { Line, mixins } from 'vue-chartjs';
// eslint-disable-next-line
import chartjsPluginAnnotation from 'chartjs-plugin-annotation';

export default {
  extends: Line,
  mixins: [mixins.reactiveProp],
  props: {
    options: {
      type: Object,
    },
  },
  mounted() {
    this.renderChart(this.chartData, this.options);
  },
};
</script>
