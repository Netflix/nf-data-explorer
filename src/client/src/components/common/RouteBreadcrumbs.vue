<template>
  <h2 class="el-route-breadcrumbs">
    <span v-for="(crumb, index) in matchedBreadcrumbs" :key="crumb.path">
      <router-link :to="crumb.path">{{ crumb.label }}</router-link>
      <span
        v-if="index < matchedBreadcrumbs.length - 1"
        class="el-route-breadcrumbs__separator"
        >&raquo;</span
      >
    </span>
  </h2>
</template>
<script lang="ts">
import Vue from 'vue';
import { Route } from 'vue-router';

export default Vue.extend({
  name: 'RouteBreadcrumbs',
  props: {
    route: {
      type: Object,
      required: true,
    },
  },

  computed: {
    matchedBreadcrumbs(): Array<{
      label: string;
      path: string;
    }> {
      return this.buildBreadcrumbsFromRoute(this.route);
    },
  },

  methods: {
    buildBreadcrumbsFromRoute(
      route: Route,
    ): Array<{
      label: string;
      path: string;
    }> {
      const crumbs = new Array<{
        label: string;
        path: string;
      }>();
      if (route && route.matched) {
        route.matched.forEach((routeMatch) => {
          let { breadcrumbText } = routeMatch.meta;
          if (breadcrumbText) {
            if (typeof breadcrumbText === 'function') {
              breadcrumbText = breadcrumbText.call(null, route);
            }
            const pathWithParams = routeMatch.path.replace(
              /:(\w*)/g,
              (_match, pathParam) =>
                encodeURIComponent(route.params[pathParam]),
            );
            crumbs.push({ label: breadcrumbText, path: pathWithParams });
          }
        });
      }
      return crumbs;
    },
  },
});
</script>
