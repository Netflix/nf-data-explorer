import { Route, RouteConfig } from 'vue-router';
import { Routes } from './routes';
import { QueryParams } from './params';
import CassQueryView from '@/views/cassandra/query/CassQueryView.vue';

export const cassandraRoutes: RouteConfig = {
  path: '/cassandra',
  redirect: { name: Routes.CassandraClusters },
  component: () =>
    import(
      /* webpackChunkName: 'cassandra' */ '@/views/cassandra/CassView.vue'
    ),
  children: [
    {
      path: '/',
      redirect: {
        name: Routes.CassandraClusters,
      },
    },
    {
      path: 'clusters',
      name: Routes.CassandraClusters,
      props: {
        type: 'cassandra',
        clusterRouteName: Routes.CassandraKeyspaces,
      },
      component: () =>
        import(
          /* webpackChunkName: 'common' */ '@/components/common/DatastoreOverview.vue'
        ),
      meta: {
        breadcrumbText: 'C* Clusters',
      },
    },
    {
      path: 'clusters/:clusterName',
      redirect: { name: Routes.CassandraKeyspaces },
    },
    {
      path: 'clusters/:clusterName/explore',
      component: () =>
        import(
          /* webpackChunkName: 'cassandra-explore' */ '@/views/cassandra/explore/CassExploreView.vue'
        ),
      props: true,
      meta: {
        breadcrumbText: (route) => route.params.clusterName,
      },
      children: [
        {
          path: '',
          name: Routes.CassandraKeyspaces,
          props: true,
          component: () =>
            import(
              /* webpackChunkName: 'cassandra-explore' */ '@/views/cassandra/explore/CassKeyspacesView.vue'
            ),
          meta: {
            breadcrumbText: 'All Keyspaces',
          },
          children: [
            {
              path: '_create',
              props: true,
              name: Routes.CassandraKeyspaceCreate,
              component: () =>
                import(
                  /* webpackChunkName: 'cassandra-explore' */ '@/views/cassandra/explore/CassCreateKeyspaceView.vue'
                ),
            },
          ],
        },
        {
          path: ':keyspaceName',
          props: true,
          component: () =>
            import(
              /* webpackChunkName: 'cassandra-explore' */ '@/views/cassandra/explore/CassKeyspaceDetailsView.vue'
            ),
          meta: {
            breadcrumbText: (route) => route.params.keyspaceName,
          },
          children: [
            {
              path: '/',
              props: true,
              name: Routes.CassandraKeyspace,
              redirect: { name: Routes.CassandraKeyspaceTables },
            },
            {
              path: 'tables',
              props: true,
              name: Routes.CassandraKeyspaceTables,
              component: () =>
                import(
                  /* webpackChunkName: "cassandra-explore" */ '@/views/cassandra/explore/CassKeyspaceTablesView.vue'
                ),
            },
            {
              path: 'udts/:udtName?',
              name: Routes.CassandraKeyspaceUDTs,
              props: true,
              component: () =>
                import(
                  /* webpackChunkName: 'cassandra-explore' */ '@/views/cassandra/explore/CassKeyspaceUdtsView.vue'
                ),
            },
          ],
        },
        {
          path: ':keyspaceName/_create',
          props: true,
          name: Routes.CassandraTableCreate,
          component: () =>
            import(
              /* webpackChunkName: 'cassandra-create-table' */ '@/views/cassandra/explore/CassCreateTableView.vue'
            ),
        },
        {
          path: ':keyspaceName/_createAdvanced',
          props: (route) => ({
            ...route.params,
            statement: route.query.statement,
          }),
          name: Routes.CassandraTableCreateAdvanced,
          component: () =>
            import(
              /* webpackChunkName: 'cassandra-create-table' */ '@/views/cassandra/explore/CassCreateTableAdvancedView.vue'
            ),
        },
        {
          path: ':keyspaceName/tables/:tableName',
          props: true,
          component: () =>
            import(
              /* webpackChunkName: 'cassandra-explore' */ '@/views/cassandra/explore/CassTableView.vue'
            ),
          meta: {
            breadcrumbText: (route) =>
              `${route.params.keyspaceName} | ${route.params.tableName}`,
          },
          children: [
            {
              path: '/',
              redirect: { name: Routes.CassandraTableData },
            },
            {
              path: 'data',
              name: Routes.CassandraTableData,
              props: true,
              component: () =>
                import(
                  /* webpackChunkName: 'cassandra-explore' */ '@/views/cassandra/explore/CassTableDataView.vue'
                ),
              children: [
                {
                  path: '_create',
                  name: Routes.CassandraTableDataCreate,
                  props: (route: Route): any => {
                    return {
                      create: true,
                      cluster: route.params.clusterName,
                      keyspace: route.params.keyspaceName,
                      table: route.params.tableName,
                    };
                  },
                  component: () =>
                    import(
                      /* webpackChunkName: 'cassandra-explore-edit' */ '@/views/cassandra/explore/CassAddRowDialog.vue'
                    ),
                },
                {
                  path: 'row',
                  name: Routes.CassandraTableDataEdit,
                  props: (route: Route): any => {
                    const primaryKey = route.query[QueryParams.PrimaryKey];
                    return {
                      cluster: route.params.clusterName,
                      keyspace: route.params.keyspaceName,
                      table: route.params.tableName,
                      primaryKey: primaryKey
                        ? JSON.parse(primaryKey as string)
                        : {},
                    };
                  },
                  component: () =>
                    import(
                      /* webpackChunkName: 'cassandra-explore-edit' */ '@/views/cassandra/explore/CassEditRowDialog.vue'
                    ),
                },
                {
                  path: 'drop',
                  name: Routes.CassandraTableDrop,
                  props: (route) => ({
                    ...route.params,
                    mode: 'drop',
                  }),
                  component: () =>
                    import(
                      /* webpackChunkName: 'cassandra-explore-drop' */ '@/views/cassandra/explore/CassDropTableDialog.vue'
                    ),
                },
                {
                  path: 'truncate',
                  name: Routes.CassandraTableTruncate,
                  props: (route) => ({
                    ...route.params,
                    mode: 'truncate',
                  }),
                  component: () =>
                    import(
                      /* webpackChunkName: 'cassandra-explore-drop' */ '@/views/cassandra/explore/CassDropTableDialog.vue'
                    ),
                },
              ],
            },
            {
              path: 'columns',
              name: Routes.CassandraTableColumns,
              component: () =>
                import(
                  /* webpackChunkName: 'cassandra-explore' */ '@/views/cassandra/explore/CassTableColumnsView.vue'
                ),
            },
            {
              path: 'properties',
              name: Routes.CassandraTableProperties,
              props: {
                disabled: true,
              },
              component: () =>
                import(
                  /* webpackChunkName: 'cassandra-explore' */ '@/views/cassandra/explore/CassTablePropertiesView.vue'
                ),
            },
            {
              path: 'samples',
              name: Routes.CassandraTableSamples,
              component: () =>
                import(
                  /* webpackChunkName: 'cassandra-explore' */ '@/views/cassandra/explore/CassTableSampleQueriesView.vue'
                ),
            },
            {
              path: 'activity',
              name: Routes.CassandraTableActivity,
              props: true,
              component: () =>
                import(
                  /* webpackChunkName: 'cassandra-explore' */ '@/views/cassandra/explore/CassTableActivityView.vue'
                ),
            },
          ],
        },
        {
          path: ':keyspaceName/*',
          redirect: { name: Routes.CassandraKeyspace },
        },
      ],
    },
    {
      path: 'clusters/:clusterName/query',
      name: Routes.CassandraQuery,
      component: CassQueryView, // avoid asynchronously loading the query view as it doesn't play well with ace
      props: true,
      meta: {
        breadcrumbText: (route) => `${route.params.clusterName} | Query`,
      },
      children: [
        {
          path: '_create',
          name: Routes.CassandraQueryDataCreate,
          props: (route: Route): any => {
            const { params, query } = route;
            const { encoding, keyspace, table } = query;
            return {
              create: true,
              cluster: params.clusterName,
              keyspace,
              table,
              encoding,
            };
          },
          component: () =>
            import(
              /* webpackChunkName: 'cassandra-query-edit' */ '@/views/cassandra/explore/CassAddRowDialog.vue'
            ),
        },
        {
          path: 'row',
          name: Routes.CassandraQueryDataEdit,
          props: (route: Route): any => {
            const primaryKey = route.query[QueryParams.PrimaryKey];
            return {
              cluster: route.params.clusterName,
              keyspace: route.query.keyspace,
              table: route.query.table,
              primaryKey: primaryKey ? JSON.parse(primaryKey as string) : {},
            };
          },
          component: () =>
            import(
              /* webpackChunkName: 'cassandra-query-edit' */ '@/views/cassandra/explore/CassEditRowDialog.vue'
            ),
        },
      ],
    },
  ],
};
