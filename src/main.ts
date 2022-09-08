import {createApp, watch} from 'vue';
import App from './App.vue';
import {createPinia, storeToRefs} from 'pinia';
import {createI18n} from 'vue-i18n';
import messages from '@intlify/vite-plugin-vue-i18n/messages';
import {useStore} from './store';
import i18nConfig from './translations/_config.yaml';
import Cookies from 'js-cookie';
import createRouter from './router';

const themeCssId = 'vtt-theme';

const pinia = createPinia();
const i18n = createI18n({
  locale: 'en',
  fallbackLocale: i18nConfig.fallbackLocale,
  fallbackWarn: i18nConfig.fallbackWarn,
  missingWarn: i18nConfig.missingWarn,
  messages,
});

const router = createRouter();
const app = createApp(App).use(pinia).use(i18n).use(router);
const store = useStore();
const {theme, name} = storeToRefs(store);
let mounted = false;

function mountApp() {
  if (!mounted) {
    mounted = true;
    app.mount('#app');
  }
}

watch(theme, (theme) => {
  let themeCss = document.querySelector<HTMLLinkElement>(`link#${themeCssId}`);
  if (!theme) {
    themeCss?.remove();
    Cookies.remove('vtt-theme');
    return;
  }
  if (!themeCss) {
    themeCss = document.createElement('link');
    themeCss.id = themeCssId;
    themeCss.type = 'text/css';
    themeCss.rel = 'stylesheet';
    themeCss.onload = () => {
      if (!mounted) mountApp();
    };
    document.head.appendChild(themeCss);
  }
  themeCss.href = new URL(
    `../node_modules/bootswatch/dist/${theme}/bootstrap.css`,
    import.meta.url,
  ).href;
  Cookies.set('vtt-theme', theme);
  console.log('theme set');
});
watch(name, (name) => {
  Cookies.set('vtt-name', name);
});

const initTheme = (() => {
  const theme = Cookies.get('vtt-theme');
  if (theme && __APP_THEMES__.includes(theme)) {
    return theme;
  }
  Cookies.remove('vtt-theme');
  return undefined;
})();
const initName = (() => {
  const name = Cookies.get('vtt-name');
  if (typeof name === 'string') {
    return name;
  }
  Cookies.remove('vtt-name');
  return undefined;
})();
store.initStore(
  Object.keys(messages),
  i18nConfig.referenceLocale,
  i18nConfig.referenceLocale,
  initTheme,
  initName,
);

if (!initTheme) {
  mountApp();
} else {
  // Backup in case of failed css load
  setTimeout(mountApp, 750);
}
