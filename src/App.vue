<template lang="pug">
.container.text-center
  img(alt="Vue logo" src="./assets/logo.png")
  HelloWorld
</template>

<script setup lang="ts">
import {onMounted, watch} from 'vue';
import {storeToRefs} from 'pinia';
import {useI18n} from 'vue-i18n';
import {useStore} from './store';
import HelloWorld from './components/HelloWorld.vue';

const store = useStore();
const {locale} = useI18n();
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
