import {defineStore} from 'pinia';
interface StoreState {
  locales: string[];
  locale: string;
  referenceLocale: string;
  theme: string | null;
}

export const useStore = defineStore('main', {
  state: (): StoreState => {
    return {
      locales: [],
      locale: '',
      referenceLocale: '',
      theme: null,
    };
  },
  actions: {
    initStore(
      locales: string[],
      locale: string,
      referenceLocale: string,
      theme?: string | null,
    ) {
      this.$patch((state) => {
        state.locales = [...locales];
        state.locale = locale;
        state.referenceLocale = referenceLocale;
        if (theme && __APP_THEMES__.includes(theme)) {
          state.theme = theme;
        } else {
          state.theme = null;
        }
      });
    },
  },
});

export type MainStore = ReturnType<typeof useStore>;
