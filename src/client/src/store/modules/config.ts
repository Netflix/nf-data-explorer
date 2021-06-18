import { getClusters } from '@/services/ClusterService';
import { getAvailableEnvironments } from '@/services/ConfigService';
import { ActionTypes } from '@/store/actions';
import { IAppState, IConfigModuleState } from '@/typings/store';
import { GetterTree, Module, ActionTree, MutationTree } from 'vuex';

const SET_CLUSTERS = 'SET_CLUSTERS';
const SET_ENVIRONMENTS = 'SET_ENVIRONMENTS';
const SET_CURRENT_CLUSTER = 'SET_CURRENT_CLUSTER';
const SET_DATASTORE_SCOPE = 'SET_DATASTORE_SCOPE';

const initialState = {
  clusters: [],
  currentCluster: undefined,
  environments: undefined,
  currentDatastoreScope: undefined,
} as IConfigModuleState;

const actions: ActionTree<IConfigModuleState, IAppState> = {
  async [ActionTypes.FetchEnvironments]({ commit }) {
    const environments = await getAvailableEnvironments();
    commit(SET_ENVIRONMENTS, { environments: Object.freeze(environments) });
  },
  async [ActionTypes.FetchClusters]({ commit }) {
    const clusters = await getClusters();
    commit(SET_CLUSTERS, { clusters: Object.freeze(clusters) });
  },
  [ActionTypes.SetCurrentCluster]({ commit }, { name }) {
    commit(SET_CURRENT_CLUSTER, { name });
  },
  [ActionTypes.SetDatastoreScope]({ commit }, { datastoreType }) {
    commit(SET_DATASTORE_SCOPE, { datastoreType });
  },
};

const getters: GetterTree<IConfigModuleState, IAppState> = {
  isSharedCluster(state) {
    const {
      clusters,
      currentCluster,
      currentDatastoreScope,
      environments,
    } = state;

    if (!currentCluster || !currentDatastoreScope || !environments) {
      return false;
    }

    const cluster = clusters.find(
      (item) =>
        item.type === currentDatastoreScope &&
        item.env === environments.current.env &&
        item.region === environments.current.region &&
        item.name === currentCluster,
    );

    return cluster ? cluster.isShared : false;
  },
  isLocal(state): boolean {
    const { environments } = state;
    if (!environments) {
      return false;
    }
    const { env, region } = environments.current;
    return env === 'local' && region === 'local';
  },
};

const mutations: MutationTree<IConfigModuleState> = {
  [SET_CLUSTERS](state: IConfigModuleState, { clusters }) {
    state.clusters = clusters;
  },
  [SET_ENVIRONMENTS](state: IConfigModuleState, { environments }) {
    state.environments = environments;
  },
  [SET_CURRENT_CLUSTER](state: IConfigModuleState, { name }) {
    state.currentCluster = name;
  },
  [SET_DATASTORE_SCOPE](state: IConfigModuleState, { datastoreType }) {
    state.currentDatastoreScope = datastoreType;
  },
};

export default {
  state: initialState,
  actions,
  getters,
  mutations,
} as Module<IConfigModuleState, IAppState>;
