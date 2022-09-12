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

<style lang="scss">
body {
  position: relative;
  /* min-height because FF doesn't give mouseenter/-leave events for document;
  it needs "full height" body */
  min-height: 100vh;
}
.s-rect {
  user-select: none;
  pointer-events: none;
  border: 1px red solid;
  pointer-events: none;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 10000;
  * {
    font-size: xx-small;
    color: red;
  }
}
.s-box-info {
  user-select: none;
  pointer-events: none;
  font-size: x-small;
  top: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.7);
  white-space: pre-wrap;
  z-index: 10100;
}
.mouse-info {
  user-select: none;
  pointer-events: none;
  font-size: x-small;
  bottom: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.7);
  white-space: pre-wrap;
  z-index: 10100;
}
.y-cursor-wrap {
  display: inline-block;
  position: absolute;
  z-index: 500;
  display: none;
  pointer-events: none;
  .y-cursor-caret {
    min-width: 2px;
    display: inline-block;
    position: absolute;
    top: 0;
    left: 0;
    opacity: 0.4;
  }
  .y-cursor-name {
    display: inline-block;
    padding: 1px;
    border-bottom-right-radius: 2px;
    border-top-right-radius: 2px;
    opacity: 8;
    position: absolute;
    color: white;
    font-size: xx-small;
    bottom: 0;
    white-space: pre;
  }
}
</style>
