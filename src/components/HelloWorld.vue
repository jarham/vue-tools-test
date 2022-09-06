<template lang="pug">
.container.text-center
  .lang-select
    select.form-select.d-inline-block(
      v-model='store.locale'
      style='width: initial'
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
  .fix.text-secondary {{ t('test-fix', {n: ".11 - the excitement"}) }}
  .text-secondary
    i.bi.bi-app-indicator
  .theme-select
    select.form-select.d-inline-block(
      v-model='store.theme'
      style='width: initial'
    )
      option(
        v-for='t in themes'
        :value='t.value'
      ) {{ t.name }}
    .current
      small {{ t('current-theme') }} {{ store.theme || '(default)' }}

</template>

<script setup lang="ts">
import {useI18n} from 'vue-i18n';
import {useStore} from '../store';

const {t} = useI18n();
const store = useStore();

const version = __APP_VERSION__;
const appLink = __APP_LINK__;
const themesArray = ['(default)', ...__APP_THEMES__];
const themes = themesArray.map((t) => {
  if (__APP_THEMES__.includes(t)) return {name: t, value: t};
  else return {name: t, value: null};
});
</script>
