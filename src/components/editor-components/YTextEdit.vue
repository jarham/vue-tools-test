<template lang="pug">
.y-component.y-text-edit.px-2.py-1.rounded.border.editable.position-relative(
    :contenteditable='typeof text === "string" ? "true" : "false"'
    style='min-width: 1ch;'
    @beforeinput='onBeforeInput'
    @input='onInput'
    @compositionstart='onComposition'
    @compositionupdate='onComposition'
    @compositionend='onComposition'
    ref='editor'
  ) {{ text ? text : '' }}
  template(
    v-for='(v, k) in selections'
  )
    .position-absolute.y-caret(:ref='(e: HTMLDivElement | null) => selRef(e, v)')
</template>

<script setup lang="ts">
import {onBeforeUnmount, onMounted, onUpdated, ref, watch} from 'vue';
import type {TextSelectionChangeEvent} from './editor-events';
import * as Y from 'yjs';

// Copy paste from Y
interface Delta {
  insert?: string | object | Y.AbstractType<any> | undefined;
  delete?: number | undefined;
  retain?: number | undefined;
  attributes?:
    | {
        [x: string]: any;
      }
    | undefined;
}

const props = defineProps<{
  cid: string;
  ytext?: Y.Text;
}>();
const emit = defineEmits<{
  (e: 'text-selection-change', change: TextSelectionChangeEvent): void;
}>();

const text = ref<string | undefined>();
const editor = ref<HTMLDivElement>();
let start = -1;
let end = -1;
let txtModded = false;

watch(
  () => props.ytext,
  (ytext) => {
    if (ytext) {
      ytext.observe((evt, tr) => {
        // console.log('origin', tr.origin);
        applyDelta(evt.delta, !tr.origin);
      });
      text.value = ytext.toJSON();
      // setInterval(() => {
      //   const txtNode =
      //     document.querySelector<HTMLDivElement>('.editable')?.childNodes[0];
      //   if (txtNode) {
      //     console.log('txtNode:', txtNode);
      //   }
      // }, 2000);
    } else {
      text.value = undefined;
    }
  },
);

const applyDelta = (da: Delta[], me: boolean) => {
  if (!da || typeof text.value !== 'string') return;
  txtModded = true;
  let txt = text.value || '';
  let pos = 0;
  const r = getRangeInEditor();
  if (!me) {
    // Our own start & end should've been updated in beforeInput

    // if (r) r.collapse();
    // console.log('old range', r);
    start = r ? r.startOffset : 0;
    end = r ? r.endOffset : 0;
  } else {
    if (start < 0) start = 0;
    if (end < 0) end = 0;
  }
  console.log(
    `applyDelta, me=${me}, da=${JSON.stringify(
      da,
    )}, start=${start}, end=${end}, range=`,
    r,
  );

  da.forEach((d) => {
    if (typeof d.retain === 'number') {
      pos += d.retain;
    } else if (typeof d.insert === 'string') {
      txt = txt.slice(0, pos) + d.insert + txt.slice(pos);
      if (r || me) {
        if ((me && (!start || pos <= start)) || (!me && pos < start)) {
          start += d.insert.length;
        }
        if ((me && (!end || pos <= end)) || (!me && pos < end)) {
          end += d.insert.length;
        }
        // if (start < end) {
        //   if (pos <= start) {
        //     r.setEnd(r.endContainer, end + d.insert.length);
        //     r.setStart(r.startContainer, start + d.insert.length);
        //   } else if (pos < end) {
        //     r.setEnd(r.endContainer, end + d.insert.length);
        //   }
        // } else {
        //   if (pos <= end) {
        //     r.setStart(r.startContainer, start + d.insert.length);
        //     r.setEnd(r.endContainer, end + d.insert.length);
        //   } else if (pos < end) {
        //     r.setStart(r.startContainer, start + d.insert.length);
        //   }
        // }
      }
      pos += d.insert.length;
    } else if (typeof d.delete === 'number') {
      txt = txt.slice(0, pos) + txt.slice(pos + d.delete);
      if (r || me) {
        if (pos < start) {
          start -= Math.min(start - pos, d.delete);
        }
        if (pos < end) {
          end -= Math.min(end - pos, d.delete);
        }
      }
    }
  });
  text.value = txt;
  console.log(
    `applyDelta exit, me=${me}, da=${JSON.stringify(
      da,
    )}, start=${start}, end=${end}, range=`,
    r,
  );
  // if (sel && editor.value) {
  //   const rn = document.createRange();

  //   rn.setStart(editor.value.childNodes[0], start);
  //   rn.setEnd(editor.value.childNodes[0], end);
  //   sel.removeAllRanges();
  //   sel.addRange(rn);
  //   console.log('new range', rn);
  // }
};

function getRangeInEditor(): Range | null {
  const sel = document.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const r = sel.getRangeAt(0);
  if (!r) return null;

  const startInEditor = r.startContainer.parentElement === editor.value;
  const endInEditor = r.endContainer.parentElement === editor.value;
  if (!startInEditor || !endInEditor) return null;

  return r;
}

const onBeforeInput = (e: InputEvent) => {
  const rr = getRangeInEditor();
  const tr = e.getTargetRanges()[0];
  const r = tr || rr || null;

  // console.log('before collapse:', r);
  // r.collapse();
  // console.log('after collapse:', r);
  // console.log(r);
  const t = e.target as HTMLInputElement;
  console.log('beforeinput', r?.startOffset);
  console.log('beforeinput', r?.endOffset);
  console.log('beforeinput', tr?.startOffset);
  console.log('beforeinput', tr?.endOffset);
  console.log('beforeinput, e.inputType', e.inputType);
  console.log('beforeinput', e);
  console.log('beforeinput', e.getTargetRanges());
  // console.log('beforeinput', e.getTargetRanges());
  // console.log('beforeinput', e.dataTransfer);
  const start = r?.startOffset || 0;
  const end = r?.endOffset || start;
  const count = Math.max(end - start, 1);
  if (!props.ytext || composing) return;
  switch (e.inputType) {
    case 'insertText':
    case 'insertReplacementText':
    case 'insertFromPaste':
    case 'insertFromDrop':
      if (end > start) {
        props.ytext.delete(start, count);
      }
      props.ytext.insert(
        start,
        e.data || e.dataTransfer?.getData('text/plain') || '',
      );
      e.preventDefault();
      break;
    case 'deleteContentForward':
    case 'deleteByCut':
    case 'deleteByDrag':
      props.ytext.delete(start, count);
      e.preventDefault();
      break;
    case 'deleteContentBackward':
      if (end === start) {
        props.ytext.delete(start - count, count);
      } else {
        props.ytext.delete(start, count);
      }
      e.preventDefault();
      break;
    case 'insertLineBreak':
    case 'insertParagraph':
      e.preventDefault();
      break;
    default:
      console.log('beforeinput, unhandled: ', e);
      break;
  }
};
const onInput = (e: InputEvent) => {
  const t = e.target as HTMLInputElement;
  // console.log('input', t.selectionStart);
  // console.log('input', t.selectionEnd);
  console.log('input', e);
  e.preventDefault();
  // console.log('input', e.getTargetRanges());
  // console.log('input', e.dataTransfer);
};

let selStart = -1;
let selEnd = -1;
const selChange = () => {
  if (!editor.value || composing) return;
  // const contained =
  //   editor.value.childNodes[0] &&
  //   sel.containsNode(editor.value.childNodes[0], true);
  // const contained =
  //   editor.value.contains(sel.anchorNode) &&
  //   editor.value.contains(sel.focusNode);
  const r = getRangeInEditor();
  const oldStart = selStart;
  const oldEnd = selEnd;

  if (!r) {
    selStart = -1;
    selEnd = -1;
    start = -1;
    end = -1;
  } else {
    selStart = r.startOffset;
    selEnd = r.endOffset;
    start = r.startOffset;
    end = r.endOffset;
  }
  // console.log(
  //   'selChange',
  //   start,
  //   end,
  //   'anchor:',
  //   sel.anchorNode,
  //   'focus:',
  //   sel.focusNode,
  // );
  console.log('selChange', selStart, selEnd, r);
  if (oldStart !== selStart || oldEnd !== selEnd) {
    console.log('selChange emit', selStart, selEnd);
    emit('text-selection-change', {
      cid: props.cid,
      start: selStart,
      end: selEnd,
      oldStart,
      oldEnd,
    });
  }
};

onMounted(() => {
  document.addEventListener('selectionchange', selChange);
});
onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', selChange);
  emit('text-selection-change', {
    cid: props.cid,
    start: -1,
    end: -1,
  });
});

onUpdated(() => {
  console.log('onUpdated', txtModded, start, end);
  if (txtModded) {
    const sel = document.getSelection();
    const txtNode = editor.value?.childNodes[0];
    if (sel && txtNode) {
      const rn = document.createRange();

      rn.setStart(txtNode, start);
      rn.setEnd(txtNode, end);
      sel.removeAllRanges();
      sel.addRange(rn);
      console.log('new range', rn);
    }
  }
  txtModded = false;
  const txtNode = editor.value?.childNodes[0];
  if (txtNode) {
    console.log('onUpdated txtNode:', txtNode);
  }
});

let composing = false;
let composingRange: Range | null = null;
const onComposition = (e: CompositionEvent) => {
  console.log(`${e.type}:`, e, composingRange);
  switch (e.type) {
    case 'compositionstart':
      composing = true;
      composingRange = getRangeInEditor();
      start = composingRange?.startOffset || 0;
      end = composingRange?.endOffset || start;
      break;
    case 'compositionend':
      composing = false;
      const count = Math.max(end - start, 1);
      if (end > start && props.ytext) {
        props.ytext.delete(start, count);
      }
      // Chromium has input data in this event.
      // FF does not but it sends a separate input event.
      if (e.data && props.ytext) {
        props.ytext.insert(start, e.data);
        e.preventDefault();
      }
      composingRange = null;
      break;
    default:
      break;
  }
};

interface SelectionData {
  id: string;
  name: string;
  start: number;
  end: number;
  color: string;
  ol: HTMLDivElement | null;
  cd: HTMLDivElement | null;
  nd: HTMLDivElement | null;
}

const colors = [
  'rgb(255, 97, 97)',
  'rgb(97, 255, 97)',
  'rgb(152, 152, 255)',
  'rgb(250, 148, 31)',
  'rgb(193, 78, 250)',
];
let colorIndex = 0;

const selections = ref<{[key: string]: SelectionData}>(Object.create(null));
function setSelection(
  id: string,
  name: string,
  start: number | null,
  end: number | null,
) {
  const sels = selections.value;
  console.log(`setSelection:`, id, name, start, end, sels);
  if (!sels) return;
  let sel = sels[id];
  if (start === null || end === null) {
    delete sels[id];
  } else {
    if (!sel) {
      sel = {
        id,
        name,
        start,
        end,
        ol: null,
        cd: null,
        nd: null,
        color: colors[colorIndex],
      };
      colorIndex = (colorIndex + 1) % colors.length;
    } else {
      sel.name = name;
      sel.start = start;
      sel.end = end;
    }
    sels[id] = sel;
    updateCaretPosition(sel);
  }
}

const selRef = (d: HTMLDivElement | null, s: SelectionData) => {
  console.log('selRef:', s, d);
  if (d) {
    s.ol = d;
    s.cd = document.createElement('div');
    s.nd = document.createElement('div');
    s.cd.classList.add('y-caret-indicator');
    s.cd.style.backgroundColor = s.color;
    s.nd.classList.add('y-caret-name');
    s.nd.style.backgroundColor = s.color;
    s.ol.appendChild(s.cd);
    s.ol.appendChild(s.nd);
  } else {
    if (s.ol) {
      s.ol.style.top = '0';
      s.ol.style.left = '0';
      s.ol.style.display = 'none';
      s.ol.remove();
    }
    if (s.cd) s.cd.remove();
    if (s.nd) s.nd.remove();
    s.ol = null;
    s.cd = null;
    s.nd = null;
  }
  updateCaretPosition(s);
};

function updateCaretPosition(s: SelectionData) {
  if (!s.ol || !s.cd || !s.nd || !editor.value) return;
  const rn = document.createRange();
  const txtNode = editor.value.childNodes[0];
  if (!txtNode) return;
  if (txtNode.textContent === null) return;
  if (s.start > txtNode.textContent.length) return;
  if (s.end > txtNode.textContent.length) return;
  const er = editor.value.getBoundingClientRect();
  rn.setStart(txtNode, s.start);
  rn.setEnd(txtNode, s.end);
  const r = rn.getBoundingClientRect();
  console.log(`updateCaretPosition: `, rn, r, s);
  const l = r.left - er.left - 1;
  s.ol.style.top = `${r.top - er.top}px`;
  s.ol.style.left = `${l}px`;
  s.ol.style.height = `${r.height}px`;
  if (s.start !== s.end) {
    s.cd.style.width = `${r.width}px`;
    s.cd.style.opacity = `0.4`;
  } else {
    s.cd.style.removeProperty('width');
    s.cd.style.opacity = `0.5`;
  }
  s.nd.textContent = s.name;
  s.nd.style.bottom = `${r.height}px`;
  s.ol.style.display = 'inline-block';
}

defineExpose({
  setSelection,
});
</script>

<style lang="scss">
.y-text-edit {
  overflow-x: hidden;
  white-space: nowrap;
}
.y-caret {
  min-width: 2px;
  background-color: rgb(255, 97, 97);
  z-index: 500;
  display: none;
  pointer-events: none;
  .y-caret-indicator {
    position: absolute;
    top: 0;
    opacity: 0.4;
  }
  .y-caret-name {
    padding: 1px;
    border-bottom-right-radius: 2px;
    border-top-right-radius: 2px;
    opacity: 8;
    position: absolute;
    color: white;
    font-size: xx-small;
  }
}
</style>
