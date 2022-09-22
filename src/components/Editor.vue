<template lang="pug">
.editor
  .d-flex.justify-content-center.align-items-center.flex-column
    .input-group.input-group-sm.justify-content-center.align-items-center
      span.input-group-text You are
      input.form-control(type=text v-model='name' placeholder='unknown' style='max-width: 40ch;')
      button.btn.btn-outline-secondary(@click='store.randomName()') Randomize
    .form-check
      input.form-check-input(type='checkbox' value='' id='editor-debug' v-model='editorDebug')
      label.form-check-label(for='editor-debug') Editor debug
    .form-check
      input.form-check-input(type='checkbox' value='' id='debug-dupe-check' v-model='rectDupCheck')
      label.form-check-label(for='debug-dupe-check') De-dupe selection rects
    .form-check
      input.form-check-input(type='checkbox' value='' id='debug-mouse-info' v-model='mouseInfo')
      label.form-check-label(for='debug-mouse-info') Include mouse
  .d-flex.justify-content-center.align-items-start.flex-wrap
    small.before.text-nowrap.m-1.mt-2 1 line edit -&gt;
    YTextEdit(
      cid='testedit'
      :ytext='title'
      style='width: 30ch;'
      @text-selection-change='onTextSelectionChange'
      ref='editTxt'
    )
    small.after.text-nowrap.m-1.mt-2 &lt;-1 line edit
  .d-flex.justify-content-center.align-items-start.flex-wrap
    small.before.text-nowrap.m-1.mt-2 multiline edit-&gt;
    YTextEdit(
      cid='testedit2'
      :ytext='text'
      style='width: 30ch;'
      @text-selection-change='onTextSelectionChange'
      ref='editTxt2'
      :multiline='true'
    )
    small.after.text-nowrap.m-1.mt-2 &lt;-multiline edit
  .d-flex.justify-content-center
    p(style='max-width: 20ch;') Some text #[small with variable size] font and line wrapping. #[small (For testing selections.)]
  EventLogger(style='width: 20ch;display: none;' :debug='editorDebug' :rect-dup-check='rectDupCheck' :mouse-info='mouseInfo')
</template>
<script lang="ts">
interface AwarenessInfo {
  selection?: TextSelectionChangeEvent;
  name?: string;
}
interface AwarenessUpdate {
  added: number[];
  updated: number[];
  removed: number[];
}
</script>
<script setup lang="ts">
import {onMounted, ref, watch} from 'vue';
import {useStore} from '../store';
import {storeToRefs} from 'pinia';
import * as Y from 'yjs';
import {WebsocketProvider} from 'y-websocket';
import YTextEdit from './editor-components/YTextEdit.vue';
import EventLogger from './editor-components/EventLogger.vue';
import type {TextSelectionChangeEvent} from './editor-components/editor-events';
import type {SelectionAware} from './editor-components/selection-aware';

const store = useStore();
const {name} = storeToRefs(store);

const editTxt = ref<InstanceType<typeof YTextEdit>>();
const editTxt2 = ref<InstanceType<typeof YTextEdit>>();

const editorDebug = ref(false);
const rectDupCheck = ref(false);
const mouseInfo = ref(true);

const doc = new Y.Doc();
let map: Y.Map<any> | undefined;
let title = ref<Y.Text | undefined>();
let text = ref<Y.Text | undefined>();

// Quick'n'dirty hack to get this working on Docker compose and localhost dev.
// Basically, we assume that localhost address includes port number and
// keep 8080 for localhost docker tests.
const host =
  /:\d+$/.test(window.location.host) && !/:8080$/.test(window.location.host)
    ? window.location.host.replace(/:\d+$/, ':1234')
    : window.location.host;
const path =
  /:\d+$/.test(window.location.host) && !/:8080$/.test(window.location.host)
    ? ''
    : 'yjsws';

const wsProvider = new WebsocketProvider(
  `${
    window.location.protocol.startsWith('https') ? 'wss' : 'ws'
  }://${host}/${path}`,
  'my-roomname',
  doc,
);
const awareness = wsProvider.awareness;
awareness.on('update', (update: AwarenessUpdate) => {
  console.log('awareness update:', update);
  const all = update.added.concat(update.updated);
  all
    .filter((u) => u !== awareness.clientID)
    .forEach((u) => {
      const s = awareness.getStates().get(u) as AwarenessInfo;
      console.log(`awareness ${u}:`, s);
      if (s.selection) {
        const sel = s.selection;
        let cmp: SelectionAware;
        if (sel.cid === 'testedit' && editTxt.value) cmp = editTxt.value;
        else if (editTxt2.value) cmp = editTxt2.value;
        else return;
        const name = s.name || 'unknown';
        cmp.setSelection(
          `${u}`,
          name,
          sel.ranges ? sel.ranges.map((r) => ({type: 'text', ...r})) : null,
        );
      }
    });
  update.removed
    .filter((u: number) => u !== awareness.clientID)
    .forEach((u: number) => {
      console.log(`awareness remove ${u}`);
      if (editTxt.value) {
        editTxt.value.setSelection(`${u}`, '', null);
      }
      if (editTxt2.value) {
        editTxt2.value.setSelection(`${u}`, '', null);
      }
    });
});
wsProvider.on('status', (event: any) => {
  console.log(event.status); // logs "connected" or "disconnected"
});
let tries = 0;
doc.on('error', (e) => console.error(e));
wsProvider.on('sync', (synced: any) => {
  console.log('synced:', synced);
  if (synced) {
    map = doc.getMap();

    console.log('whole doc', doc.toJSON());

    if (!map.has('title')) {
      // Ugly hack to workaround _server_ bug where the first client
      // connected doesn't get persisted document: Just dis- and re-
      // connect after a while.
      if (tries === -1) {
        wsProvider.disconnect();
        tries++;
        setTimeout(() => wsProvider.connect(), 2000);
        return;
      }
      tries = 0;

      console.log('New Title');
      title.value = new Y.Text('untitled');
      text.value = new Y.Text('initial text');
      map.set('title', title.value);
      map.set('text', text.value);
    } else {
      title.value = map.get('title');
      text.value = map.get('text');
    }
    console.log('Title is:', title.value?.toJSON());
    if (!map.has('items')) {
      console.log('New Items');
      const arr = new Y.Array();
      map.set('items', arr);
    }
    let arr = map.get('items') as Y.Array<any>;
    arr.push([`${arr.length}`]);
    console.log('map:', map.toJSON(), map);
  }
});

onMounted(() => {
  awareness.setLocalStateField('name', name.value);
});
watch(name, (name) => awareness.setLocalStateField('name', name));

const onTextSelectionChange = (change: TextSelectionChangeEvent) => {
  console.log('onTextSelectionChange:', change);
  awareness.setLocalStateField('selection', change);
};
</script>
