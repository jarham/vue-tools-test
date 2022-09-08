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
import {onBeforeUnmount, onMounted, watch} from 'vue';

const props = defineProps<{
  debug: boolean;
  rectDupCheck: boolean;
  mouseInfo: boolean;
}>();

const onInputEvent = (e: InputEvent) => {
  console.log(`${e.type} / ${e.inputType} (data=${e.data}):`, e);
};

watch(
  () => props.debug,
  () => refreshAll(),
);
watch(
  () => props.rectDupCheck,
  () => refreshAll(),
);
watch(
  () => props.mouseInfo,
  () => refreshAll(),
);

const refreshAll = () => {
  refreshRects();
  refreshMouse();
};

const rects: HTMLDivElement[] = [];
let selRects: DOMRect[] = [];
const onGenericEvent = (e: Event) => {
  console.log(`${e.type}:`, e);
  if (e.type === 'selectionchange') {
    refreshAll();
  }
};
const refreshRects = () => {
  removeRects();
  if (!props.debug) return;
  addRects();
};
const removeRects = () => {
  rects.forEach((e) => e.remove());
  rects.splice(0, rects.length);
};
const addRects = () => {
  const s = document.getSelection();
  if (!s) return;
  const n = s.rangeCount;
  for (let i = 0; i < n; i++) {
    const r = s.getRangeAt(i);
    if (!r) continue;
    selRects = Array.from(r.getClientRects()).filter(
      (rect, i, arr) =>
        !props.rectDupCheck ||
        arr.findIndex(
          (r1) =>
            r1.bottom === rect.bottom &&
            r1.height === rect.height &&
            r1.left === rect.left &&
            r1.right === rect.right &&
            r1.top === rect.top &&
            r1.width === rect.width &&
            r1.x === rect.x &&
            r1.y === rect.y,
        ) >= i,
    );
    for (let j = 0; j < selRects.length; j++) {
      const rc = selRects[j];
      if (!rc) continue;
      console.log(`  selection range ${i}, rect ${j}:`, rc);
      const div = document.createElement('div');
      rects.push(div);
      div.style.top = `${rc.top + window.scrollY}px`;
      div.style.left = `${rc.left + window.scrollX}px`;
      div.style.width = `${rc.width}px`;
      div.style.height = `${rc.height}px`;
      div.classList.add(
        's-rect',
        'position-absolute',
        'd-flex',
        'justify-content-center',
        'align-items-center',
      );
      const span = document.createElement('span');
      span.textContent = `${i}/${j}`;
      div.appendChild(span);
      document.body.appendChild(div);
    }
  }
};

let mx = -1;
let my = -1;
const onMouseEvent = (e: MouseEvent) => {
  if (
    e.type === 'mousemove' ||
    e.type === 'mouseenter' ||
    e.type === 'mouseover'
  ) {
    mx = e.offsetX;
    my = e.offsetY;
    mx = e.pageX;
    my = e.pageY;
    mx = e.clientX;
    my = e.clientY;
  } else if (e.type === 'mouseleave') {
    mx = -1;
    my = -1;
  }
  console.log(`${e.type}: ${mx}, ${my}`);
  refreshMouse();
};

let mouseElem: HTMLPreElement | null = null;
let mouseInfoElem: HTMLPreElement | null = null;
const refreshMouse = () => {
  removeMouse();
  addMouse();
};
const removeMouse = () => {
  if (mouseElem) {
    mouseElem.textContent = '';
    if (!selRects || selRects.length === 0) {
      mouseElem.remove();
      mouseElem = null;
    }
  }
  if (mouseInfoElem) {
    mouseInfoElem.textContent = '';
    if (mx < 0) {
      mouseInfoElem.remove();
      mouseInfoElem = null;
    }
  }
};
const addMouse = () => {
  if (selRects && selRects.length > 0) {
    if (!mouseElem) {
      mouseElem = document.createElement('pre');
      mouseElem.classList.add('position-fixed', 'text-danger', 's-box-info');
      document.body.appendChild(mouseElem);
    }
    const txt = selRects
      .filter(
        (r) =>
          r.x <= mx && r.y <= my && r.x + r.width >= mx && r.y + r.height >= my,
      )
      .map((r) => `x: ${r.x}, y: ${r.y}, w: ${r.width}, h: ${r.height}`)
      .join('\n');
    mouseElem.textContent = txt;
  }
  if (mx >= 0 && props.debug && props.mouseInfo) {
    if (!mouseInfoElem) {
      mouseInfoElem = document.createElement('pre');
      mouseInfoElem.classList.add(
        'position-fixed',
        'text-danger',
        'mouse-info',
      );
      document.body.appendChild(mouseInfoElem);
    }
    const txt = `x: ${mx}, y: ${my}`;
    mouseInfoElem.textContent = txt;
  }
};

onMounted(() => {
  document.addEventListener('selectionchange', onGenericEvent);
  document.body.addEventListener('mouseover', onMouseEvent);
  document.body.addEventListener('mouseenter', onMouseEvent);
  document.body.addEventListener('mouseleave', onMouseEvent);
  document.body.addEventListener('mousemove', onMouseEvent);
  window.addEventListener('resize', refreshAll);
  window.addEventListener('scroll', refreshAll);
  refreshAll();
});
onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', onGenericEvent);
  document.body.removeEventListener('mouseover', onMouseEvent);
  document.body.removeEventListener('mouseenter', onMouseEvent);
  document.body.removeEventListener('mouseleave', onMouseEvent);
  document.body.removeEventListener('mousemove', onMouseEvent);
  window.removeEventListener('resize', refreshAll);
  window.removeEventListener('scroll', refreshAll);
  removeRects();
  removeMouse();
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
