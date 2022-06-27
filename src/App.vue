<template lang="pug">
img(alt="Vue logo" src="./assets/logo.png")
HelloWorld
</template>

<script setup lang="ts">
import {watch} from 'vue';
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
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
