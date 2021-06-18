import * as Sentry from '@sentry/browser';
import { setClientAccessToken } from '@/services/BaseService';
import { fetchUserInfo } from '@/services/user/UserService';
import { ADMIN_MEMBERS } from '@/shared/shared-constants';
import { ActionTypes } from '@/store/actions';
import { IUserInfo } from '@/typings/userinfo';
import { IUserModuleState, IAppState } from '@/typings/store';
import { ActionTree } from 'vuex';

// mutation types
const SET_USER_INFO = 'SET_USER_INFO';
const SET_SESSION_INVALIDATED = 'SET_SESSION_INVALIDATED';

// initial state
const initialState: IUserModuleState = {
  email: undefined,
  username: undefined,
  isAdmin: false,
  isSessionInvalidated: false,
  token: undefined,
};

// getters
const getters = {};

// actions
const actions: ActionTree<IUserModuleState, IAppState> = {
  async [ActionTypes.FetchUserInfo]({ commit }) {
    try {
      const userInfo = await fetchUserInfo();
      setClientAccessToken(userInfo.access_token);
      commit(SET_USER_INFO, { userInfo });
    } catch (err) {
      commit(SET_SESSION_INVALIDATED);
    }
  },
};

// mutations
const mutations = {
  [SET_USER_INFO](
    state: IUserModuleState,
    { userInfo }: { userInfo: IUserInfo },
  ): void {
    const email = userInfo.userinfo.email;
    state.email = email;
    state.token = userInfo.access_token;
    state.username = userInfo.userinfo.preferred_username;
    const isAdmin = ADMIN_MEMBERS.some(
      (adminGroup) =>
        userInfo.userinfo.googleGroups.includes(adminGroup) ||
        email === adminGroup,
    );
    // Admin access can be turned off for testing by including an '?admin=false' query string in the URL
    const hasNoOverride = !window.location.search.includes('admin=false');
    state.isAdmin = isAdmin && hasNoOverride;

    Sentry.setUser({ email: state.email });
  },

  [SET_SESSION_INVALIDATED](state: IUserModuleState): void {
    state.isSessionInvalidated = true;
  },
};

export default {
  state: initialState,
  getters,
  actions,
  mutations,
};
