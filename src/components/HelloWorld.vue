<template lang="pug">
.lang-select
  select(
    v-model='store.locale'
  )
    option(
      v-for='l in store.locales'
      :value='l'
    ) {{ t(`language.${l}`, 0, {locale: store.referenceLocale}) }}
  .current
    small {{ t('current-locale') }} {{ t(`language.${store.locale}`, 0, {locale: store.referenceLocale}) }}
h1 {{ t('greeting') }}
h2 {{ t('fb-test') }}
h3
  a.link-secondary(v-if='appLink' :href='appLink') {{ version }}
  span.text-secondary(v-else) {{ version }}
.feat
  small {{ t('small-feat') }}
.feat {{ t('cache-control-test-feat') }}
.fix.text-secondary {{ t('test-fix', {n: 2}) }}
</template>

<script setup lang="ts">
import {useI18n} from 'vue-i18n';
import {useStore} from '../store';

const {t} = useI18n();
const store = useStore();

const version = __APP_VERSION__;
const appLink = __APP_LINK__;
</script>

<style scoped>
a {
  color: #42b983;
}

label {
  margin: 0 0.5em;
  font-weight: bold;
}

code {
  background-color: #eee;
  padding: 2px 4px;
  border-radius: 4px;
  color: #304455;
}

.btn-major {
  font-size: 5rem;
}

.really-small {
  font-size: 33%;
}
</style>
