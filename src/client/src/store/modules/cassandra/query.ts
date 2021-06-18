import { ActionTypes } from '@/store/actions';
import { IAppState, ICassQueryModuleState } from '@/typings/store';
import {
  addRecentQuery,
  getRecentQueries,
  IRecentQuery,
} from '@/utils/recent-queries-utils';
import { Module, ActionTree, MutationTree } from 'vuex';

const SET_RECENT_QUERIES = 'SET_RECENT_QUERIES';

const initialState: ICassQueryModuleState = {
  queryHistory: [],
};

const actions: ActionTree<ICassQueryModuleState, IAppState> = {
  async [ActionTypes.AddQueryToHistory](
    { dispatch },
    { cluster, query }: { cluster: string; query: string },
  ) {
    addRecentQuery('cassandra', cluster, query);
    dispatch(ActionTypes.LoadQueryHistory, { cluster });
  },
  async [ActionTypes.LoadQueryHistory](
    { commit },
    { cluster }: { cluster: string },
  ) {
    commit(SET_RECENT_QUERIES, {
      history: getRecentQueries('cassandra', cluster),
    });
  },
};

const mutations: MutationTree<ICassQueryModuleState> = {
  [SET_RECENT_QUERIES](state, { history }: { history: IRecentQuery[] }) {
    state.queryHistory = history;
  },
};

export default {
  state: initialState,
  actions,
  mutations,
} as Module<ICassQueryModuleState, IAppState>;
