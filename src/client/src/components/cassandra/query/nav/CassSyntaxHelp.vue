<template>
  <article>
    <header>
      <h3>{{ keyword }}</h3>
    </header>
    <section>
      <h4>Description</h4>
      <p>{{ description }}</p>
    </section>
    <section>
      <h4>Syntax</h4>
      <pre>{{ syntax }}</pre>
    </section>
  </article>
</template>
<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
  name: 'CassSyntaxHelp',
  props: {
    keyword: {
      type: String,
    },
    description: {
      type: String,
    },
    syntax: {
      type: String,
    },
  },
});
</script>
<style scoped>
h3 {
  margin-top: 8px;
}

h4 {
  margin-bottom: 0;
}

pre {
  white-space: pre-wrap;
}
</style>
