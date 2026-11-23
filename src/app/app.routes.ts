import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './core/auth/auth.guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'bots' },
  {
    path: '',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/auth-layout').then((m) => m.AuthLayout),
    children: [
      {
        path: 'login',
        title: 'Sign in · RAGDesk',
        loadComponent: () => import('./features/auth/login').then((m) => m.Login),
      },
      {
        path: 'register',
        title: 'Create account · RAGDesk',
        loadComponent: () => import('./features/auth/register').then((m) => m.Register),
      },
    ],
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    children: [
      {
        path: 'bots',
        title: 'Assistants � RAGDesk',
        loadComponent: () => import('./features/bots/bots-page').then((m) => m.BotsPage),
      },
    ],
  },
  { path: '**', redirectTo: 'bots' },
];
