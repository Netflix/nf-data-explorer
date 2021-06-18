import App from '@/App.vue';
import registerDynamicComponents from '@/setup/dynamic-components';
import user from '@/store/modules/user';
import { createLocalVue, shallowMount } from '@vue/test-utils';
import VueRouter from 'vue-router';
import Vuex from 'vuex';

jest.mock('@/services/user/UserService');

const localVue = createLocalVue();
localVue.use(Vuex);
localVue.use(VueRouter);

registerDynamicComponents();

const router = new VueRouter();

describe('App', () => {
  let store;
  beforeEach(() => {
    store = new Vuex.Store({ modules: { user } });
  });

  it('should perform a user login on creation', (done) => {
    const wrapper = shallowMount(App, { store, localVue, router });
    expect(wrapper.text()).toContain('Netflix Data Explorer Signing in...');

    setTimeout(() => {
      try {
        expect(wrapper.find('#app').isVisible()).toBeTruthy();
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});
