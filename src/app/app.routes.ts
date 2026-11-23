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
        title: 'Assistants · RAGDesk',
        loadComponent: () => import('./features/bots/bots-page').then((m) => m.BotsPage),
      },
      {
        path: 'bots/:id',
        loadComponent: () => import('./features/bots/bot-detail').then((m) => m.BotDetail),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'documents' },
          {
            path: 'documents',
            title: 'Documents · RAGDesk',
            loadComponent: () =>
              import('./features/sources/documents-tab').then((m) => m.DocumentsTab),
          },
          {
            path: 'conversations',
            title: 'Conversations · RAGDesk',
            loadComponent: () =>
              import('./features/insights/conversations-tab').then((m) => m.ConversationsTab),
          },
          {
            path: 'unanswered',
            title: 'Unanswered · RAGDesk',
            loadComponent: () =>
              import('./features/insights/unanswered-tab').then((m) => m.UnansweredTab),
          },
          {
            path: 'install',
            title: 'Install · RAGDesk',
            loadComponent: () => import('./features/bots/install-tab').then((m) => m.InstallTab),
          },
          {
            path: 'settings',
            title: 'Settings · RAGDesk',
            loadComponent: () => import('./features/bots/settings-tab').then((m) => m.SettingsTab),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: 'bots' },
];
