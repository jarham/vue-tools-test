import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

function getAppVersion(env: Record<string, string>): string {
  if (env.APP_VERSION) return JSON.stringify(env.APP_VERSION);
  if (env.NODE_ENV !== "production") {
    return JSON.stringify(`v${env.npm_package_version}-development`);
  }
  return JSON.stringify(`v${env.npm_package_version}`);
}

function getAppLink(env: Record<string, string>): string {
  if (env.NODE_ENV !== "production") {
    return JSON.stringify(null);
  }
  return env.APP_LINK ? JSON.stringify(env.APP_LINK) : JSON.stringify(null);
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [vue()],
    base: "",
    define: {
      __APP_VERSION__: getAppVersion(env),
      __APP_LINK__: getAppLink(env),
    },
  };
});
