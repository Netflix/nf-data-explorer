import { Routes } from '@/router/routes';
import store from '@/store';
import { IAppState } from '@/typings/store';
import { buildBreadcrumbsFromRoute } from '@/utils/route-utils';
import Vue from 'vue';
import Router from 'vue-router';
import { adminRoutes } from './admin-routes';
import { cassandraRoutes } from './cassandra-routes';
import { dynomiteRoutes } from './dynomite-routes';

Vue.use(Router);

const router = new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: Routes.Datastores,
      component: () =>
        import(/* webpackChunkName: 'common' */ '@/views/DatastoresView.vue'),
    },
    cassandraRoutes,
    dynomiteRoutes,
    adminRoutes,
  ],
});

const DEFAULT_ROUTE_NAME = Routes.Datastores;

router.beforeEach((to, _from, next) => {
  function transition() {
    const user = store.state.user;
    if (to.matched.some((route) => route.meta.requiresAdmin) && !user.isAdmin) {
      next({ name: DEFAULT_ROUTE_NAME });
    } else {
      document.title = [
        'Data Explorer',
        ...buildBreadcrumbsFromRoute(to).map((crumb) => crumb.label),
      ].join(' | ');
      next();
    }
  }

  if (!store.state.user.email) {
    store.watch(
      (state: IAppState) => state.user.email,
      () => transition(),
    );
  } else {
    transition();
  }
});

router.onError((err) => {
  // If a lazy-loaded chunk failed to load, it's probably because a deployment
  // happened under the covers and caused the chunkhash to change.
  // So perform a full page refresh to get the latest version of the code.
  if (err.message && err.message.startsWith('Loading chunk')) {
    window.location.reload(true);
  }
});

export default router;
