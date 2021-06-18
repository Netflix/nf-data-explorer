import {
  fetchClusterInfo,
  fetchDatacenters,
  fetchDataTypes,
  fetchKeyspaces,
  fetchSchema,
} from '@/services/cassandra/CassService';
import { ActionTypes } from '@/store/actions';
import { IAppState, ICassClusterModuleState } from '@/typings/store';
import { ActionTree, Module, MutationTree } from 'vuex';

const SET_INFO = 'SET_INFO';

const SET_KEYSPACES = 'SET_KEYSPACES';
const SET_KEYSPACES_LOADING = 'SET_KEYSPACES_LOADING';

const SET_SCHEMA = 'SET_SCHEMA';
const SET_SCHEMA_LOADING = 'SET_SCHEMA_LOADING';

const SET_DATACENTERS = 'SET_DATACENTERS';
const SET_DATACENTERS_LOADING = 'SET_DATACENTERS_LOADING';

const SET_DATA_TYPES = 'SET_DATA_TYPES';
const SET_DATA_TYPES_LOADING = 'SET_DATA_TYPES_LOADING';

const initialState: ICassClusterModuleState = {
  datacenters: [],
  datacentersLoading: false,
  info: undefined,
  keyspaces: [],
  keyspacesLoading: false,
  schema: [],
  schemaLoading: false,
  dataTypesLoading: false,
  dataTypes: {
    standard: [],
    user: [],
  },
};

const getters = {};

const actions: ActionTree<ICassClusterModuleState, IAppState> = {
  async [ActionTypes.FetchClusterInfo]({ commit }, { cluster }) {
    const info = await fetchClusterInfo(cluster);
    commit(SET_INFO, { info });
  },

  async [ActionTypes.FetchKeyspaces]({ commit }, { cluster }) {
    commit(SET_KEYSPACES_LOADING, { loading: true });
    commit(SET_KEYSPACES, { keyspaces: [] });
    try {
      const keyspaces = await fetchKeyspaces(cluster);
      commit(SET_KEYSPACES, { keyspaces });
    } finally {
      commit(SET_KEYSPACES_LOADING, { loading: false });
    }
  },

  async [ActionTypes.FetchSchema]({ commit }, { cluster }) {
    commit(SET_SCHEMA_LOADING, { loading: true });
    try {
      const schemaColumns = await fetchSchema(cluster);
      commit(SET_SCHEMA, { schema: schemaColumns });
    } finally {
      commit(SET_SCHEMA_LOADING, { loading: false });
    }
  },

  async [ActionTypes.FetchDatacenters]({ commit }, { cluster }) {
    commit(SET_DATACENTERS_LOADING, { loading: true });
    try {
      const datacenters = await fetchDatacenters(cluster);
      commit(SET_DATACENTERS, { datacenters });
    } finally {
      commit(SET_DATACENTERS_LOADING, { loading: false });
    }
  },

  async [ActionTypes.FetchDataTypes]({ commit }, { cluster, keyspace }) {
    commit(SET_DATA_TYPES_LOADING, { loading: true });
    try {
      const dataTypes = await fetchDataTypes(cluster, keyspace);
      commit(SET_DATA_TYPES, { dataTypes });
    } finally {
      commit(SET_DATA_TYPES_LOADING, { loading: false });
    }
  },
};

const mutations: MutationTree<ICassClusterModuleState> = {
  [SET_INFO](state, { info }) {
    state.info = info;
  },
  [SET_KEYSPACES](state, { keyspaces }) {
    state.keyspaces = keyspaces;
  },
  [SET_KEYSPACES_LOADING](state, { loading }) {
    state.keyspacesLoading = loading;
  },
  [SET_SCHEMA](state, { schema }) {
    state.schema = schema;
  },
  [SET_SCHEMA_LOADING](state, { loading }) {
    state.schemaLoading = loading;
  },
  [SET_DATACENTERS](state, { datacenters }) {
    state.datacenters = datacenters;
  },
  [SET_DATACENTERS_LOADING](state, { loading }) {
    state.datacentersLoading = loading;
  },
  [SET_DATA_TYPES_LOADING](state, { loading }) {
    state.dataTypesLoading = loading;
  },
  [SET_DATA_TYPES](state, { dataTypes }) {
    state.dataTypes = dataTypes;
  },
};

export default {
  state: initialState,
  getters,
  actions,
  mutations,
} as Module<ICassClusterModuleState, IAppState>;
