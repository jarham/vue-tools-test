import {createApp, watch} from 'vue';
import App from './App.vue';
import {createPinia, storeToRefs} from 'pinia';
import {createI18n} from 'vue-i18n';
import messages from '@intlify/vite-plugin-vue-i18n/messages';
import {useStore} from './store';
import i18nConfig from './translations/_config.yaml';
import Cookies from 'js-cookie';
import createRouter from './router';
import {createYCursors} from './vue-plugins/YCursors';

function init() {
  const themeCssId = 'vtt-theme';

  const pinia = createPinia();
  const i18n = createI18n({
    locale: 'en',
    fallbackLocale: i18nConfig.fallbackLocale,
    fallbackWarn: i18nConfig.fallbackWarn,
    missingWarn: i18nConfig.missingWarn,
    messages,
  });
  const yCursors = createYCursors();

  const router = createRouter();
  const app = createApp(App).use(pinia).use(i18n).use(router).use(yCursors);
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
    let themeCss = document.querySelector<HTMLLinkElement>(
      `link#${themeCssId}`,
    );
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
}

// ServiceWorker dereg (this is a poc, and other pocs
// deployed to same url earlier may have service workers registered).
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => {
      console.info(
        `Found ${regs.length} service worker${regs.length !== 1 ? 's' : ''}`,
      );
      regs.forEach((r, i) => {
        console.info(`Unregistering service worker ${i + 1}`);
        r.unregister()
          .then((unreg) => {
            if (unreg) console.info(`Unregistered service worker ${i + 1}`);
            else console.warn(`Did not unregister service worker ${i + 1}`);
          })
          .catch((e) =>
            console.error(
              `Error in service worker ${i + 1} unregistration:`,
              e,
            ),
          );
      });
    })
    .catch((e) => console.error(e))
    .finally(() => init());
} else {
  console.info(`Service workers not supported in this browser`);
  init();
}
