import {defineStore} from 'pinia';
import {
  uniqueNamesGenerator,
  Config,
  adjectives,
  colors,
  animals,
  starWars,
} from 'unique-names-generator';

interface StoreState {
  locales: string[];
  locale: string;
  referenceLocale: string;
  theme: string | null;
  name: string;
  ungConfig: number;
}

const ungConfigs: Config[] = [
  {
    dictionaries: [adjectives, colors, animals],
    style: 'capital',
    separator: ' ',
  },
  {
    dictionaries: [adjectives, animals],
    style: 'capital',
    separator: ' ',
  },
  {
    dictionaries: [colors, animals],
    style: 'capital',
    separator: ' ',
  },
  {
    dictionaries: [adjectives, colors, animals],
    style: 'capital',
    separator: ' ',
  },
  {
    dictionaries: [adjectives, animals],
    style: 'capital',
    separator: ' ',
  },
  {
    dictionaries: [colors, animals],
    style: 'capital',
    separator: ' ',
  },
  {
    dictionaries: [adjectives, starWars],
    style: 'capital',
    separator: ' ',
  },
  {
    dictionaries: [starWars],
  },
];

function randomName() {
  const i = Math.floor(Math.random() * ungConfigs.length);
  return uniqueNamesGenerator(ungConfigs[i]);
}

export const useStore = defineStore('main', {
  state: (): StoreState => {
    return {
      locales: [],
      locale: '',
      referenceLocale: '',
      theme: null,
      name: '',
      ungConfig: 0,
    };
  },
  actions: {
    randomName() {
      this.name = randomName();
    },
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
        state.name = randomName();
      });
    },
  },
});

export type MainStore = ReturnType<typeof useStore>;
