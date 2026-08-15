import { createRouter, createWebHashHistory } from 'vue-router'
// 改这里
const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/Home.vue'),
    meta: { title: '首页' },
  },
  {
    path: '/practice',
    name: 'practice',
    component: () => import('@/pages/Practice.vue'),
    meta: { title: '刷题' },
  },
  {
    path: '/exam',
    name: 'exam',
    component: () => import('@/pages/Exam.vue'),
    meta: { title: '模拟考试' },
  },
  {
    path: '/questions',
    name: 'questions',
    component: () => import('@/pages/Questions.vue'),
    meta: { title: '题库管理' },
  },
  {
    path: '/wrong',
    name: 'wrong',
    component: () => import('@/pages/WrongBook.vue'),
    meta: { title: '错题本' },
  },
  {
    path: '/favorites',
    name: 'favorites',
    component: () => import('@/pages/Favorites.vue'),
    meta: { title: '收藏夹' },
  },
  {
    path: '/stats',
    name: 'stats',
    component: () => import('@/pages/Statistics.vue'),
    meta: { title: '数据统计' },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/pages/Settings.vue'),
    meta: { title: '设置' },
  },
]

const router = createRouter({
  history: createWebHashHistory(),// 改这里
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to, _from, next) => {
  const title = (to.meta?.title as string) || 'IT刷题'
  document.title = `${title} - IT刷题`
  next()
})

export default router
