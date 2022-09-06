import {
  createRouter as createVueRouter,
  createWebHistory,
  Router,
} from 'vue-router';
import HelloWorld from './components/HelloWorld.vue';
import Editor from './components/Editor.vue';

export default function createRouter(): Router {
  const routes = [
    {path: '/:pathMatch(.*)*', component: HelloWorld},
    {path: '/editor', component: Editor},
  ];
  const router = createVueRouter({
    history: createWebHistory(),
    routes,
  });
  return router;
}
