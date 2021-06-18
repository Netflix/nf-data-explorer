<template>
  <div class="cass-view full-height">
    <router-view class="flex"></router-view>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Routes } from '@/router/routes';
import RouteBreadcrumbs from '@/components/common/RouteBreadcrumbs.vue';
import store from '@/store';
import { ActionTypes } from '@/store/actions';

export default Vue.extend({
  name: 'CassView',
  components: {
    RouteBreadcrumbs,
  },
  data() {
    return {
      Routes,
    };
  },
  created() {
    store.dispatch(ActionTypes.FetchCassandraFeatures);
  },
});
</script>
<style scoped>
a {
  display: block;
}
</style>
