import { createRouter, createWebHashHistory } from 'vue-router'

const PdfIndex = () =>  import('../views/PdfIndex.vue');



const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: PdfIndex,
    },
  ]
})

export default router
