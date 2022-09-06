<template lang="pug">
.event-logger.rounded.border.editable(
    :contenteditable='true'
    style='min-width: 1ch;'
    @keydown='onKeyEvent'
    @beforeinput='onInputEvent'
    @input='onInputEvent'
    @compositionstart='onCompositionEvent'
    @compositionupdate='onCompositionEvent'
    @compositionend='onCompositionEvent'
    ref='editor'
  )
</template>

<script setup lang="ts">
import {onBeforeUnmount, onMounted} from 'vue';

const onInputEvent = (e: InputEvent) => {
  console.log(`${e.type} / ${e.inputType} (data=${e.data}):`, e);
};

const onGenericEvent = (e: Event) => {
  console.log(`${e.type}:`, e);
};

onMounted(() => {
  document.addEventListener('selectionchange', onGenericEvent);
});
onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', onGenericEvent);
});

const onCompositionEvent = (e: CompositionEvent) => {
  console.log(`${e.type}:`, e);
};

const onKeyEvent = (e: KeyboardEvent) => {
  console.log(`${e.type}:`, e);
};
</script>

<style lang="scss">
.event-logger {
  overflow-x: hidden;
  white-space: nowrap;
}
</style>
