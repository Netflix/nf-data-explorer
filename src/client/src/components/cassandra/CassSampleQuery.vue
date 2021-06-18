<template>
  <!-- eslint-disable vue/no-v-html -->
  <div
    class="cass-sample-query"
    :class="$style.query"
    @click="onClick"
    v-html="highlightedStatement"
  >
    <!-- eslint-enable vue/no-v-html -->
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
  name: 'CassSampleQuery',
  props: {
    query: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      keywords: [
        'SELECT',
        'INSERT',
        'UPDATE',
        'DELETE',
        'INTO',
        'FROM',
        'SET',
        'VALUES',
        'WHERE',
        'AND',
        'NOT',
        'LIMIT',
      ],
    };
  },
  computed: {
    highlightedStatement(): string {
      const valueRegex = new RegExp(/'([a-zA-Z0-9_]+?)'/, 'gim');
      const valueMap = new Map<number, string>();
      let index = 0;

      // to avoid a complex regex, we swap out any CQL values with indices before we
      // highlight TERMS to avoid false positives in the value strings.
      let highlightedQuery = this.query.replace(valueRegex, (_match, value) => {
        valueMap.set(index, value);
        return `'${index++}'`;
      });

      // add keyword highlights
      this.keywords.forEach((keyword) => {
        const re = new RegExp(`\\b${keyword}\\b`, 'ig');
        highlightedQuery = highlightedQuery.replace(
          re,
          `<span class="keyword">${keyword}</span>`,
        );
      });

      // restore values in place of tokens
      return highlightedQuery.replace(
        valueRegex,
        (_match, groupValue: string) => {
          if (groupValue) {
            const valueStr = valueMap.get(parseInt(groupValue, 10));
            if (valueStr) {
              return `'${valueStr}'`;
            }
          }
          return groupValue;
        },
      );
    },
  },
  methods: {
    onClick() {
      this.$emit('select', this.query);
    },
  },
});
</script>
<style module>
.query {
  white-space: pre-wrap;
}
</style>
<style scoped>
.cass-sample-query >>> .keyword {
  color: rgb(147, 15, 128);
}
</style>
