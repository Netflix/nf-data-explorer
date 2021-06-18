import cassandra from '@/store/modules/cassandra/index';
import config from '@/store/modules/config';
import user from '@/store/modules/user';
import { IAppState } from '@/typings/store';
import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const isDebug = process.env.NODE_ENV !== 'production';

export default new Vuex.Store<IAppState>({
  modules: {
    config,
    cassandra,
    user,
  },
  strict: isDebug,
});
