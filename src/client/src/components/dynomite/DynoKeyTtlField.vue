<template>
  <div>
    <div v-if="currentValueInSeconds === -1">Key does not expire</div>
    <div v-else>{{ formattedTtl }}</div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { format, formatDistance } from 'date-fns';

export default Vue.extend({
  name: 'DynoKeyTtlField',
  props: {
    value: {
      type: Number,
    },
  },
  data() {
    return {
      currentValueInSeconds: this.value,
      formattedTtl: '',
      timer: undefined as number | undefined,
    };
  },
  watch: {
    value: {
      immediate: true,
      handler(ttl) {
        this.currentValueInSeconds = ttl;
        this.updateFormattedTtl();
        if (this.timer) {
          window.clearInterval(this.timer);
        }
        if (ttl >= 0) {
          this.timer = window.setInterval(() => {
            if (this.currentValueInSeconds <= 0) {
              this.$emit('key-expired');
              if (this.timer) {
                clearInterval(this.timer);
              }
            } else {
              this.updateFormattedTtl();
              this.currentValueInSeconds -= 1;
            }
          }, 1000);
        }
      },
    },
  },
  destroyed() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  },
  methods: {
    updateFormattedTtl() {
      const futureTimestamp = Date.now() + this.currentValueInSeconds * 1000;
      const formatted = format(futureTimestamp, 'MM/dd/yyyy HH:SS');
      const distance = formatDistance(Date.now(), futureTimestamp, {
        includeSeconds: true,
      });
      this.formattedTtl = `Expires @ ${formatted} (${distance})`;
    },
  },
});
</script>
