import router from '@/router';
import { Routes } from '@/router/routes';
import { changeRegion } from '@/services/ConfigService';
import store from '@/store';

export function routeToCluster(
  datastoreType: string,
  cluster: string,
  env: string,
  region: string,
): void {
  if (!store.state.config.environments) {
    return;
  }
  const { current } = store.state.config.environments;
  if (env === current.env && region === current.region) {
    let routeName;
    switch (datastoreType) {
      case 'cassandra':
        routeName = Routes.CassandraKeyspaces;
        break;
      case 'dynomite':
        routeName = Routes.DynomiteCluster;
        break;
      default:
        throw new Error('unexpected datastore type: ' + datastoreType);
    }

    router.push({
      name: routeName,
      params: {
        clusterName: cluster,
      },
    });
  } else {
    changeRegion(datastoreType, cluster, env, region);
  }
}
