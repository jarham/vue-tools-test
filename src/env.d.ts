/// <reference types="vite/client" />

declare module '*.vue' {
  import type {DefineComponent} from 'vue';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module '*translations/_config.yaml' {
  import type {I18nConfig} from './lib/i18n-config';
  const config: I18nConfig;
  export default config;
}

// For defines in vite.config.js
declare const __APP_VERSION__: string;
declare const __APP_LINK__: string | null;
declare const __APP_THEMES__: string[];
