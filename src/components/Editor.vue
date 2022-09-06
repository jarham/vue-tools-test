<template lang="pug">
.editor.d-flex.justify-content-center
  .before.m-1 BEFORE
  YTextEdit(:ytext='title' style='width: 20ch;')
  .after.m-1 AFTER
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {useStore} from '../store';
import * as Y from 'yjs';
import {WebsocketProvider} from 'y-websocket';
import YTextEdit from './editor-components/YTextEdit.vue';

const {t} = useI18n();

const doc = new Y.Doc();
let map: Y.Map<any> | undefined;
let title = ref<Y.Text | undefined>();
const wsProvider = new WebsocketProvider(
  'ws://localhost:1234',
  'my-roomname',
  doc,
);
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
</script>
