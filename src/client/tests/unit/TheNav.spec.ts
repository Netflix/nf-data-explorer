import TheNav from '@/components/TheNav.vue';
import i18n from '@/i18n';
import { IAppState, IConfigModuleState } from '@/typings/store';
import { createLocalVue, shallowMount } from '@vue/test-utils';
import VueRouter from 'vue-router';
import Vuex, { Module } from 'vuex';

const localVue = createLocalVue();
localVue.use(VueRouter);
localVue.use(Vuex);

describe('TheNav', () => {
  let store;

  beforeEach(() => {
    const config: Module<IConfigModuleState, IAppState> = {
      state: {
        clusters: [],
        currentCluster: 'TEST_CLUSTER',
        currentDatastoreScope: 'cassandra',
        environments: undefined,
      },
    };

    store = new Vuex.Store({
      modules: {
        config,
      },
    });
  });

  it('should display the app title', () => {
    const wrapper = shallowMount(TheNav, {
      i18n,
      store,
      localVue,
    });
    expect(wrapper.find('h1').text()).toEqual('Data Explorer');
  });
});
