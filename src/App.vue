<template lang="pug">
.container.text-center
  .d-block
    img(alt="Vue logo" src="./assets/logo.png")
  RouterLink(to='/') {{ t('nav.home') }}
  span |
  RouterLink(to='/editor') {{ t('nav.editor') }}
RouterView
</template>

<script setup lang="ts">
import {onMounted, watch} from 'vue';
import {storeToRefs} from 'pinia';
import {useI18n} from 'vue-i18n';
import {useStore} from './store';

const store = useStore();
const {locale, t} = useI18n();
const {locale: storeLocale} = storeToRefs(store);
watch(
  storeLocale,
  (l) => {
    locale.value = l;
  },
  {immediate: true},
);
onMounted(() => console.log('app mounted'));
</script>
