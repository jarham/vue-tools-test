<template lang="pug">
.editor
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
    .before.m-1 BEFORE
    EventLogger(style='width: 20ch;')
    .after.m-1 AFTER
</template>
<script lang="ts">
interface AwarenessInfo {
  selection?: TextSelectionChangeEvent;
}
interface AwarenessUpdate {
  added: number[];
  updated: number[];
  removed: number[];
}
</script>
<script setup lang="ts">
import {onMounted, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {useStore} from '../store';
import * as Y from 'yjs';
import {WebsocketProvider} from 'y-websocket';
import YTextEdit from './editor-components/YTextEdit.vue';
import EventLogger from './editor-components/EventLogger.vue';
import type {TextSelectionChangeEvent} from './editor-components/editor-events';

const {t} = useI18n();

const editTxt = ref<InstanceType<typeof YTextEdit>>();

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
        editTxt.value.setSelection(
          `${u}`,
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
        editTxt.value.setSelection(`${u}`, null, null);
      }
    });
});
wsProvider.on('status', (event) => {
  console.log(event.status); // logs "connected" or "disconnected"
});
wsProvider.on('sync', (synced) => {
  console.log('synced:', synced); // logs "connected" or "disconnected"
  if (synced) {
    map = doc.getMap();
    if (!map.has('title')) {
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
    console.log('map:', map.toJSON());
  }
});

onMounted(() => {
  console.log('XXX');
});

const onTextSelectionChange = (change: TextSelectionChangeEvent) => {
  console.log('onTextSelectionChange:', change);
  awareness.setLocalStateField('selection', change);
};
</script>
