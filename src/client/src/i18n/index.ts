import Vue from 'vue';
import VueI18n from 'vue-i18n';
import enUS from './locales/en-US';

Vue.use(VueI18n);

export default new VueI18n({
  locale: 'en-US',
  fallbackLocale: 'en-US',
  silentTranslationWarn: true,
  messages: {
    'en-US': enUS,
  },
});
