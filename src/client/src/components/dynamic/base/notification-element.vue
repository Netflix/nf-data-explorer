<template>
  <div class="notification-element"><h3>Sample notification</h3></div>
</template>
<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
  name: 'NotificationElement',
});
</script>
<style scoped>
.notification-element {
  display: none;
  /* add custom styling... */
}
</style>
