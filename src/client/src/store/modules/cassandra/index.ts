import { getFeatures } from '@/services/cassandra/CassService';
import { ActionTypes } from '@/store/actions';
import cluster from '@/store/modules/cassandra/cluster';
import explore from '@/store/modules/cassandra/explore';
import query from '@/store/modules/cassandra/query';
import {
  IAppState,
  ICassClusterModuleState,
  ICassExploreModuleState,
  ICassModuleState,
  ICassQueryModuleState,
} from '@/typings/store';
import { ICassandraFeatureMap } from '@cassandratypes/cassandra';
import { ActionTree, Module, MutationTree } from 'vuex';

const SET_FEATURES = 'SET_FEATURES';

const initialState: ICassModuleState = {
  cluster: {} as ICassClusterModuleState,
  explore: {} as ICassExploreModuleState,
  features: {} as ICassandraFeatureMap,
  query: {} as ICassQueryModuleState,
};

const actions: ActionTree<ICassModuleState, IAppState> = {
  async [ActionTypes.FetchCassandraFeatures]({ commit }) {
    const features = await getFeatures();
    commit(SET_FEATURES, { features });
  },
};

const mutations: MutationTree<ICassModuleState> = {
  [SET_FEATURES](state: ICassModuleState, { features }) {
    state.features = features;
  },
};

export default {
  modules: {
    cluster,
    explore,
    query,
  },
  state: initialState,
  actions,
  mutations,
} as Module<ICassModuleState, IAppState>;
