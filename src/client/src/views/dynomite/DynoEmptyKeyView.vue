<template>
  <div class="padded">
    <h4>Getting Started</h4>
    <div>
      Search for a key using the search box on the left.
    </div>
    <div>
      You can search for exact matches or use wildcards to search for keys by
      prefix or suffix (e.g. prefix* or *suffix).
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
  name: 'DynoEmptyKeyView',
});
</script>
