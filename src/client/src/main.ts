import App from '@/App.vue';
import '@/assets/styles.css';
import router from '@/router/index';
import registerDynamicComponents from '@/setup/dynamic-components';
import store from '@/store/index';
import '@netflix/element-theme/lib/index.css';
import { Loading } from 'element-ui';
import locale from 'element-ui/lib/locale';
import lang from 'element-ui/lib/locale/lang/en';
import Vue from 'vue';
import i18n from './i18n';
import './registerServiceWorker';
import '@netflix/element-theme/lib/index.css';
import '@/assets/styles.css';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import icons from '@/icons';
import 'splitpanes/dist/splitpanes.css';
import PortalVue from 'portal-vue';

Vue.config.productionTip = false;
Vue.use(Loading.directive);
locale.use(lang);
Vue.prototype.$ELEMENT = { size: 'small' };

// eslint-disable-next-line vue/component-definition-name-casing
Vue.component('font-awesome-icon', FontAwesomeIcon);
library.add(...icons);
Vue.use(PortalVue);
registerDynamicComponents();

new Vue({
  i18n,
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');
