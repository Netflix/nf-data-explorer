import {
  fetchDataTypes,
  fetchKeyspace,
  fetchKeyspaceTables,
  fetchTable,
} from '@/services/cassandra/CassService';
import { ActionTypes } from '@/store/actions';
import { IAppState, ICassExploreModuleState } from '@/typings/store';
import { Module, ActionTree, MutationTree } from 'vuex';

const SET_KEYSPACE = 'SET_KEYSPACE';
const SET_KEYSPACE_ERROR = 'SET_KEYSPACE_ERROR';
const SET_KEYSPACE_TABLES = 'SET_KEYSPACE_TABLES';
const SET_KEYSPACE_LOADING = 'SET_KEYSPACE_LOADING';
const SET_KEYSPACE_TABLES_LOADING = 'SET_KEYSPACE_TABLES_LOADING';
const SET_TABLE_SCHEMA = 'SET_TABLE_SCHEMA';
const SET_TABLE_SCHEMA_LOADING = 'SET_TABLE_SCHEMA_LOADING';
const SET_KEYSPACE_UDTS = 'SET_KEYSPACE_UDTS';

const initialState = {
  keyspace: undefined,
  keyspaceError: undefined,
  keyspaceLoading: false,
  keyspaceTables: [],
  keyspaceTablesLoading: false,
  keyspaceUDTs: [],
  tableSchema: undefined,
  tableSchemaLoading: false,
} as ICassExploreModuleState;

const actions: ActionTree<ICassExploreModuleState, IAppState> = {
  async [ActionTypes.SetCurrentKeyspace](
    { commit, dispatch },
    { clusterName, keyspaceName },
  ) {
    try {
      commit(SET_KEYSPACE_ERROR, { error: undefined });
      commit(SET_KEYSPACE_LOADING, { loading: true });

      const keyspace = await fetchKeyspace(clusterName, keyspaceName);
      commit(SET_KEYSPACE, { keyspace });

      dispatch(ActionTypes.FetchKeyspaceTables, { clusterName, keyspaceName });
      dispatch(ActionTypes.FetchKeyspaceDataTypes, {
        clusterName,
        keyspaceName,
      });
    } catch (err) {
      commit(SET_KEYSPACE_ERROR, { error: err });
    } finally {
      commit(SET_KEYSPACE_LOADING, { loading: false });
    }
  },
  async [ActionTypes.FetchKeyspaceTables](
    { commit },
    { clusterName, keyspaceName },
  ) {
    try {
      commit(SET_KEYSPACE_TABLES_LOADING, { loading: true });
      const keyspaceTables = await fetchKeyspaceTables(
        clusterName,
        keyspaceName,
      );
      commit(SET_KEYSPACE_TABLES, { keyspaceTables });
    } finally {
      commit(SET_KEYSPACE_TABLES_LOADING, { loading: false });
    }
  },
  async [ActionTypes.FetchKeyspaceDataTypes](
    { commit },
    { clusterName, keyspaceName },
  ) {
    const dataTypes = await fetchDataTypes(clusterName, keyspaceName);
    commit(SET_KEYSPACE_UDTS, { udts: dataTypes.user });
  },
  async [ActionTypes.FetchTable]({ commit }, { cluster, keyspace, table }) {
    if (table) {
      try {
        commit(SET_TABLE_SCHEMA_LOADING, { loading: true });
        const tableSchema = await fetchTable(cluster, keyspace, table);
        commit(SET_TABLE_SCHEMA, { tableSchema });
      } finally {
        commit(SET_TABLE_SCHEMA_LOADING, { loading: false });
      }
    } else {
      commit(SET_TABLE_SCHEMA, { tableSchema: undefined });
    }
  },
};

const mutations: MutationTree<ICassExploreModuleState> = {
  [SET_KEYSPACE](state, { keyspace }) {
    state.keyspace = keyspace;
  },
  [SET_KEYSPACE_LOADING](state, { loading }) {
    state.keyspaceLoading = loading;
  },
  [SET_KEYSPACE_TABLES](state, { keyspaceTables }) {
    state.keyspaceTables = keyspaceTables;
  },
  [SET_KEYSPACE_TABLES_LOADING](state, { loading }) {
    state.keyspaceTablesLoading = loading;
  },
  [SET_TABLE_SCHEMA](state, { tableSchema }) {
    state.tableSchema = tableSchema;
  },
  [SET_TABLE_SCHEMA_LOADING](state, { loading }) {
    state.tableSchemaLoading = loading;
  },
  [SET_KEYSPACE_UDTS](state, { udts }) {
    state.keyspaceUDTs = udts;
  },
  [SET_KEYSPACE_ERROR](state, { error }) {
    state.keyspaceError = error;
  },
};

export default {
  state: initialState,
  actions,
  mutations,
} as Module<ICassExploreModuleState, IAppState>;
