import {defineConfig, loadEnv, Plugin} from 'vite';
import vue from '@vitejs/plugin-vue';
import vueI18n from '@intlify/vite-plugin-vue-i18n';
import yaml from '@rollup/plugin-yaml';
import * as path from 'path';
import * as fg from 'fast-glob';
import {
  configFilter,
  translationFilter,
  bootswatchFilter,
} from './tools/file-filters';

const bootSwatchMatcher = /dist\/(\w+)\/bootstrap\.css$/;

function getAppVersion(env: Record<string, string>): string {
  // env.APP_VERSION is read from .env.production.local file
  // which is generated at release build time.
  if (env.APP_VERSION) return JSON.stringify(env.APP_VERSION);
  if (env.NODE_ENV !== 'production') {
    return JSON.stringify(`v${env.npm_package_version}-development`);
  }
  return JSON.stringify(`v${env.npm_package_version}`);
}

function getAppLink(env: Record<string, string>): string {
  if (env.NODE_ENV !== 'production') {
    return JSON.stringify(null);
  }
  return env.APP_LINK ? JSON.stringify(env.APP_LINK) : JSON.stringify(null);
}

function getThemes() {
  const themes = fg
    .sync(bootswatchFilter)
    .map((f) => {
      const m = f.match(bootSwatchMatcher);
      return m && m[1] ? m[1] : '';
    })
    .filter((t) => !!t)
    .sort();
  return JSON.stringify(themes);
}

function assetFilename(
  isRelease: boolean,
  assetInfo: {name: string},
  env: Record<string, string>,
): string {
  // `assets/[name]-${env.APP_VERSION}.[ext]`
  // `assets/[name]-[hash].[ext]`
  const bootMatch = assetInfo.name.match(bootSwatchMatcher);
  const isBootswatchCss = !!bootMatch;
  const pathPart = isBootswatchCss ? `assets/${bootMatch[1]}` : 'assets';
  const hashPart = isRelease ? `${env.APP_VERSION}` : '[hash]';
  return `${pathPart}/[name]-${hashPart}.[ext]`;
}

// https://vitejs.dev/config/
export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Use app version instead of generated hash in filenames
  // when building a release.
  const build =
    env.APP_VERSION && env.APP_IS_RELEASE === 'true'
      ? {
          rollupOptions: {
            output: {
              assetFileNames: (assetInfo) =>
                assetFilename(true, assetInfo, env),
              chunkFileNames: `assets/[name]-${env.APP_VERSION}.[ext]`,
              entryFileNames: `assets/[name]-${env.APP_VERSION}.js`,
            },
          },
        }
      : {
          rollupOptions: {
            output: {
              assetFileNames: (assetInfo) =>
                assetFilename(false, assetInfo, env),
              chunkFileNames: `assets/[name]-[hash].[ext]`,
              entryFileNames: `assets/[name]-[hash].js`,
            },
          },
        };

  // vueI18n's `include` option uses `createFilter()` from @rollup/pluginutils
  // which uses separate `include` and `exclude` options but vueI18n only
  // hasn `include`. Use fast-glob to find actual translation files first.
  const translationFiles = fg
    .sync(translationFilter)
    .map((f) => path.resolve(__dirname, f));

  getThemes();

  return {
    assetsInclude: [bootswatchFilter],
    plugins: [
      vue(),
      vueI18n({include: translationFiles}),
      yaml({include: configFilter}) as Plugin,
    ],
    base: '',
    define: {
      __APP_VERSION__: getAppVersion(env),
      __APP_LINK__: getAppLink(env),
      __APP_THEMES__: getThemes(),
    },
    build,
  };
});
