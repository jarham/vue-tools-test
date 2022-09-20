<template lang="pug">
.editor
  .d-flex.justify-content-center.align-items-center.flex-column
    .input-group.justify-content-center.align-items-center
      span.input-group-text You are
      input.form-control(type=text v-model='name' placeholder='unknown' style='max-width: 40ch;')
      button.btn.btn-outline-secondary(@click='store.randomName()') Randomize
    .form-check
      input.form-check-input(type='checkbox' value='' id='editor-debug' v-model='editorDebug')
      label.form-check-label(for='editor-debug') Editor debug
    .form-check
      input.form-check-input(type='checkbox' value='' id='editor-debug' v-model='rectDupCheck')
      label.form-check-label(for='editor-debug') Collapse rect dupes
    .form-check
      input.form-check-input(type='checkbox' value='' id='editor-debug' v-model='mouseInfo')
      label.form-check-label(for='editor-debug') Include mouse
  .d-flex.justify-content-center
    .before.m-1 BEFORE
    YTextEdit(
      cid='testedit'
      :ytext='title'
      style='width: 20ch;'
      @text-selection-change='onTextSelectionChange'
      ref='editTxt'
    )
    .after.m-1 AFTER
  .d-flex.justify-content-center
    p(style='max-width: 20ch;') Some text #[small with variable size] font and line wrapping.
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

const store = useStore();
const {name} = storeToRefs(store);

const editTxt = ref<InstanceType<typeof YTextEdit>>();

const editorDebug = ref(false);
const rectDupCheck = ref(false);
const mouseInfo = ref(true);

const doc = new Y.Doc();
let map: Y.Map<any> | undefined;
let title = ref<Y.Text | undefined>();
const wsProvider = new WebsocketProvider(
  'ws://localhost:1234',
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
      if (editTxt.value && s.selection) {
        const sel = s.selection;
        const name = s.name || 'unknown';
        editTxt.value.setSelection(
          `${u}`,
          name,
          sel.start !== null && sel.start >= 0 ? sel.start : null,
          sel.end !== null && sel.end >= 0 ? sel.end : null,
        );
      }
    });
  update.removed
    .filter((u: number) => u !== awareness.clientID)
    .forEach((u: number) => {
      console.log(`awareness remove ${u}`);
      if (editTxt.value) {
        editTxt.value.setSelection(`${u}`, '', null, null);
      }
    });
});
wsProvider.on('status', (event) => {
  console.log(event.status); // logs "connected" or "disconnected"
});
let tries = 0;
doc.on('error', (e) => console.error(e));
wsProvider.on('sync', (synced) => {
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
      map.set('title', title.value);
    } else {
      title.value = map.get('title');
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
