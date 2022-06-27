import {createApp} from 'vue';
import App from './App.vue';
import {createPinia} from 'pinia';
import {createI18n} from 'vue-i18n';
import messages from '@intlify/vite-plugin-vue-i18n/messages';
import {useStore} from './store';
import i18nConfig from './translations/_config.yaml';

const pinia = createPinia();
const i18n = createI18n({
  locale: 'en',
  fallbackLocale: i18nConfig.fallbackLocale,
  fallbackWarn: i18nConfig.fallbackWarn,
  missingWarn: i18nConfig.missingWarn,
  messages,
});

const app = createApp(App).use(pinia).use(i18n);
const store = useStore();
store.initStore(
  Object.keys(messages),
  i18nConfig.referenceLocale,
  i18nConfig.referenceLocale,
);
app.mount('#app');
