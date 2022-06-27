import {defineStore} from 'pinia';
interface StoreState {
  locales: string[];
  locale: string;
  referenceLocale: string;
}

export const useStore = defineStore('main', {
  state: (): StoreState => {
    return {
      locales: [],
      locale: '',
      referenceLocale: '',
    };
  },
  actions: {
    initStore(locales: string[], locale: string, referenceLocale: string) {
      this.$patch((state) => {
        state.locales = [...locales];
        state.locale = locale;
        state.referenceLocale = referenceLocale;
      });
    },
  },
});

export type MainStore = ReturnType<typeof useStore>;
