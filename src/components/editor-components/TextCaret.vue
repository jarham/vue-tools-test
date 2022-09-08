<template lang="pug">
.position-absolute.y-caret(ref='ol')
  .y-caret-indicator(ref='cd')
  .y-caret-name(ref='nd')
</template>

<script setup lang="ts">
import {ref} from 'vue';
import type {SelectionData} from './common';

const ol = ref<HTMLDivElement>();
const cd = ref<HTMLDivElement>();
const nd = ref<HTMLDivElement>();

function updateCaretPosition(
  s: SelectionData,
  er: DOMRect,
  txtNode: ChildNode,
) {
  if (!ol.value || !cd.value || !nd.value) return;
  const rn = document.createRange();
  rn.setStart(txtNode, s.start);
  rn.setEnd(txtNode, s.end);
  const r = rn.getBoundingClientRect();
  console.log(`updateCaretPosition: `, rn, r, s);
  const l = r.left - er.left - 1;
  ol.value.style.top = `${r.top - er.top}px`;
  ol.value.style.left = `${l}px`;
  ol.value.style.height = `${r.height}px`;
  if (s.start !== s.end) {
    cd.value.style.width = `${r.width}px`;
    cd.value.style.opacity = `0.4`;
  } else {
    cd.value.style.removeProperty('width');
    cd.value.style.opacity = `0.5`;
  }
  nd.value.textContent = s.name;
  nd.value.style.bottom = `${r.height}px`;
  ol.value.style.display = 'inline-block';
  ol.value.style.backgroundColor = s.color;
  cd.value.style.backgroundColor = s.color;
  nd.value.style.backgroundColor = s.color;
}

defineExpose({
  updateCaretPosition,
});
</script>
