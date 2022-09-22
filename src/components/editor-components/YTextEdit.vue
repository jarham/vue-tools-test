<template lang="pug">
.y-component.y-text-edit.px-2.py-1.rounded.border.editable.position-relative(
  :class='{active: active}'
  ref='editorWrap'
  @focusin='setActive(true)'
  @focusout='setActive(false)'
)
  .y-text-edit-editor(
      :contenteditable='typeof text === "string" ? "true" : "false"'
      style='min-width: 1ch;'
      @beforeinput='onBeforeInput'
      @input='onInput'
      @compositionstart='onComposition'
      @compositionupdate='onComposition'
      @compositionend='onComposition'
      ref='editor'
    ) {{ text ? text : '' }}
</template>

<script setup lang="ts">
import {onBeforeUnmount, onMounted, onUpdated, ref, watch} from 'vue';
import type {TextSelectionChangeEvent} from './editor-events';
import * as Y from 'yjs';
import {useYCursors} from '../../vue-plugins/YCursors';
import type {TextCursor} from '../../vue-plugins/YCursors';
import type {Selection} from './selection-aware';

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
  autofocus?: boolean;
}>();
const emit = defineEmits<{
  (e: 'text-selection-change', change: TextSelectionChangeEvent): void;
}>();

const text = ref<string | undefined>('');
const editor = ref<HTMLDivElement>();
const editorWrap = ref<HTMLDivElement>();
const yCursors = useYCursors();
const active = ref(false);
let start = -1;
let end = -1;
let txtModded = false;
let lastScrollLeft = -1;

watch(
  () => props.ytext,
  (ytext) => {
    if (ytext) {
      ytext.observe((evt, tr) => {
        // console.log('origin', tr.origin);
        applyDelta(evt.delta, !tr.origin);
      });
      text.value = ytext.toJSON();
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

  // Hack to get cursor back to visible when writing to the end
  // of text
  if (me) {
    const sel = document.getSelection();
    const mr = getRangeInEditor();
    if (sel && mr && editor.value) {
      console.log(
        'SEL RANGE HACK',
        editor.value.scrollLeft,
        editor.value.scrollWidth,
      );
      sel.removeAllRanges();
      sel.addRange(mr.cloneRange());
    }
  }

  console.log(
    `applyDelta exit, me=${me}, da=${JSON.stringify(
      da,
    )}, start=${start}, end=${end}, range=`,
    r,
  );
};

function getRangeInEditor(): Range | null {
  const sel = document.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const r = sel.getRangeAt(0);
  if (!r) return null;

  const startInEditor = r.startContainer.parentElement === editor.value;
  const endInEditor = r.endContainer.parentElement === editor.value;
  if (!startInEditor || !endInEditor) {
    // At least in Firefox select all (ctrl+a) causes range's start and end
    // containers to be the editor (with startOffset=0 && endOffset=1). In that
    // case r.commonAncestorContainer must still be the editor and we
    // can create a range containing the text node child.
    if (
      r.commonAncestorContainer === editor.value &&
      editor.value.firstChild &&
      text.value
    ) {
      const tr = document.createRange();
      tr.setStart(editor.value.firstChild, 0);
      tr.setEnd(editor.value.firstChild, text.value.length);
      return tr;
    }
    return null;
  }

  return r;
}

const onBeforeInput = (e: InputEvent) => {
  const rr = getRangeInEditor();
  const tr = e.getTargetRanges()[0];
  const r = tr || rr || null;

  const t = e.target as HTMLInputElement;
  // console.log('beforeinput', r?.startOffset);
  // console.log('beforeinput', r?.endOffset);
  // console.log('beforeinput', tr?.startOffset);
  // console.log('beforeinput', tr?.endOffset);
  // console.log('beforeinput, e.inputType', e.inputType);
  // console.log('beforeinput', e);
  // console.log('beforeinput', e.getTargetRanges());
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
        (e.data || e.dataTransfer?.getData('text/plain') || '').replaceAll(
          /\r?\n\r?/g,
          ' ',
        ),
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
  if (!editor.value || composing || !editorWrap.value) return;
  const r = getRangeInEditor();
  const oldStart = selStart;
  const oldEnd = selEnd;
  let rangeVisible = false;
  let r1: DOMRect | undefined = undefined;
  let r2: DOMRect | undefined = undefined;

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

    r1 = r.getBoundingClientRect();
    r2 = editorWrap.value.getBoundingClientRect();

    rangeVisible =
      r1.right > r2.left &&
      r1.left < r2.right &&
      r1.bottom > r2.top &&
      r1.top < r2.bottom;
    if (r1.left > r2.right) {
      const d = r1.left - r2.right;
      console.log('FIX SCROLL', editorWrap.value.scrollLeft, d);
      editorWrap.value.scrollLeft += d;
      console.log('FIX SCROLL', editorWrap.value.scrollLeft, d);
    } else if (r1.right < r2.left) {
      // const d = r1.left - r2.right;
      // if (editorWrap.value.scrollLeft < d) editorWrap.value.scrollLeft = d;
    }
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
  console.log('selChange', selStart, selEnd, rangeVisible, r1, r2, r);
  if (oldStart !== selStart || oldEnd !== selEnd) {
    console.log('selChange emit', selStart, selEnd);
    emit('text-selection-change', {
      cid: props.cid,
      ranges:
        selStart >= 0 && selEnd >= 0 ? [{start: selStart, end: selEnd}] : null,
    });
    if (lastScrollLeft >= 0 && lastScrollLeft !== editorWrap.value.scrollLeft) {
      redrawCursors();
    }
    lastScrollLeft = editorWrap.value.scrollLeft;
  }
};

onMounted(() => {
  document.addEventListener('selectionchange', selChange);
  window.addEventListener('resize', redrawCursors);
  if (editor.value && props.autofocus) {
    editor.value.focus();
  }
});
onBeforeUnmount(() => {
  userCursors.forEach((userCursor) => userCursor.discard());
  userCursors.clear();
  document.removeEventListener('selectionchange', selChange);
  window.removeEventListener('resize', redrawCursors);
  emit('text-selection-change', {
    cid: props.cid,
    ranges: null,
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

const colors = [
  'rgb(255, 97, 97)',
  'rgb(76, 186, 64)',
  'rgb(152, 152, 255)',
  'rgb(250, 148, 31)',
  'rgb(193, 78, 250)',
];
let colorIndex = 0;

const userCursors = new Map<string, TextCursor>();
function redrawCursors() {
  if (!editor.value || !editorWrap.value) return;
  const txtNode = editor.value.childNodes[0];
  if (!txtNode) return;
  userCursors.forEach((userCursor) =>
    userCursor.redraw({startNode: txtNode, endNode: txtNode}),
  );
}
function setSelection(
  id: string,
  name: string,
  selections: Selection[] | null,
) {
  if (!editor.value || !editorWrap.value) return;
  const userCursor = ((editor: HTMLDivElement) => {
    let uc = userCursors.get(id);
    if (!uc) {
      uc = yCursors.createTextCursor({
        userId: id,
        target: editor,
        color: colors[colorIndex],
        name,
      });
      colorIndex = (colorIndex + 1) % colors.length;
      userCursors.set(id, uc);
    }
    return uc;
  })(editorWrap.value);

  if (!selections) {
    userCursor.discard();
    userCursors.delete(id);
  } else {
    const txtNode = editor.value.childNodes[0];
    if (!txtNode) return;

    userCursor.update({
      name,
      ranges: selections
        .filter((s) => s.type === 'text')
        .map((s) => ({
          startNode: txtNode,
          startOffset: s.start,
          endNode: txtNode,
          endOffset: s.end,
        })),
    });
  }
}

const setActive = (a: boolean) => {
  active.value = a;
  if (!a) {
    emit('text-selection-change', {
      cid: props.cid,
      ranges: null,
    });
  }
};

defineExpose({
  setSelection,
});
</script>

<style lang="scss">
.y-text-edit {
  // Can't use overflow hidden because that prevents scrolling
  // when mouse selecting (ie. "paiting" text over the element borders).
  overflow: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
  &.active {
    outline: auto;
  }
  .y-text-edit-editor {
    white-space: pre;
    outline: none;
  }
}
</style>
