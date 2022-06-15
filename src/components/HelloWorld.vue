<script setup lang="ts">
import { ref } from "vue";

defineProps<{ msg: string }>();
const version = __APP_VERSION__;
const appLink = __APP_LINK__;

const count = ref(1);
const random = ref(Math.random());
const randomInt = ref(Math.floor(Math.random() * 101));
</script>

<template>
  <h1>{{ msg }}</h1>

  <p>
    Recommended IDE setup:
    <a href="https://code.visualstudio.com/" target="_blank">VS Code</a>
    +
    <a href="https://github.com/johnsoncodehk/volar" target="_blank">Volar</a>
  </p>

  <p>See <code>README.md</code> for more information.</p>

  <p>
    <a href="https://vitejs.dev/guide/features.html" target="_blank">
      Vite Docs
    </a>
    |
    <a href="https://v3.vuejs.org/" target="_blank">Vue 3 Docs</a>
  </p>

  <button type="button" @click="count++">count is: {{ count }}</button>
  <p>
    Edit
    <code>components/HelloWorld.vue</code> to test hot module replacement.
  </p>
  <p>Let's pretend this breaks it.</p>
  <p>Let's pretend this is a feature.</p>
  <p>Let's pretend this is another feature + a fix.</p>
  <p>This is a fake feature</p>
  <p>This is a random feature: {{ random }}</p>
  <p>This is another random feature: {{ randomInt }}</p>
  <p>Checking what a feature does on rc.</p>
  <p v-if="appLink">
    <a :href="appLink" target="_blank">App version: {{ version }}</a>
  </p>
  <p v-else>App version: {{ version }}</p>
  <p>
    Github link: <a :href="appLink || '#'">{{ appLink || "#" }}</a>
  </p>
  <p><small>A little fixed thing (was fixed again).</small></p>
  <p><small class="really-small">This is a really small feature.</small></p>
  <p><small class="really-small">Another small feature.</small></p>
  <p><small class="really-small">A small feature test.</small></p>
</template>

<style scoped>
a {
  color: #42b983;
}

label {
  margin: 0 0.5em;
  font-weight: bold;
}

code {
  background-color: #eee;
  padding: 2px 4px;
  border-radius: 4px;
  color: #304455;
}

.btn-major {
  font-size: 5rem;
}

.really-small {
  font-size: 33%;
}
</style>
