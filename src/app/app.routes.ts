import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/authenticate.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  if (authService.currentUser()) {
    return true;
  }
  return inject(Router).createUrlTree(['/login']);
};

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register').then((m) => m.Register),
  },
  {
    path: 'scheduler',
    canActivate: [authGuard],
    loadComponent: () => import('./scheduler/scheduler').then((m) => m.Scheduler),
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
];
