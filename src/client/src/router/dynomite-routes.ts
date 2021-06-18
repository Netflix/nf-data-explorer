import { RouteConfig } from 'vue-router';
import { Routes } from './routes';

export const dynomiteRoutes: RouteConfig = {
  path: '/dynomite',
  redirect: { name: Routes.DynomiteClusters },
  component: () =>
    import(
      /* webpackChunkName: 'dynomite-explore' */ '@/views/dynomite/DynoView.vue'
    ),
  children: [
    {
      path: '/',
      name: Routes.DynomiteClusters,
      props: {
        type: 'dynomite',
        clusterRouteName: Routes.DynomiteCluster,
      },
      component: () =>
        import(
          /* webpackChunkName: 'common' */ '@/components/common/DatastoreOverview.vue'
        ),
      meta: {
        breadcrumbText: 'Dynomite Clusters',
      },
    },
    {
      path: 'clusters/:clusterName',
      props: true,
      component: () =>
        import(
          /* webpackChunkName: 'dynomite-explore' */ '@/views/dynomite/DynoClusterView.vue'
        ),
      meta: {
        breadcrumbText: (route) => route.params.clusterName,
      },
      children: [
        {
          path: '/',
          name: Routes.DynomiteCluster,
          redirect: {
            name: Routes.DynomiteEmptyKeyView,
          },
        },
        {
          path: 'keys',
          name: Routes.DynomiteEmptyKeyView,
          component: () =>
            import(
              /* webpackChunkName: 'dynomite-explore' */ '@/views/dynomite/DynoEmptyKeyView.vue'
            ),
        },
        {
          path: 'keys/_create',
          name: Routes.DynomiteCreateKey,
          props: (route) => ({
            clusterName: route.params.clusterName,
            type: route.query.type || 'string',
          }),
          component: () =>
            import(
              /* webpackChunkName: 'dynomite-explore' */ '@/views/dynomite/DynoCreateKeyView.vue'
            ),
        },
        {
          path: 'keys/:keyName',
          name: Routes.DynomiteEditKey,
          props: true,
          component: () =>
            import(
              /* webpackChunkName: 'dynomite-explore' */ '@/views/dynomite/DynoEditKeyView.vue'
            ),
        },
      ],
    },
  ],
};
