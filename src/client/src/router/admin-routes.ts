import { RouteConfig } from 'vue-router';
import { Routes } from './routes';

export const adminRoutes: RouteConfig = {
  path: '/admin',
  name: Routes.Admin,
  component: () =>
    import(/* webpackChunkName: 'admin' */ '@/views/AdminView.vue'),
  meta: {
    breadcrumbText: 'Admin',
    requiresAdmin: true,
  },
};
