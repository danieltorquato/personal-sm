import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage),

    data: { userType: 'personal' }
  },
  {
    path: 'home-pupil',
    loadComponent: () => import('./home-pupil/home-pupil.page').then(m => m.HomePupilPage),

    data: { userType: 'aluno' }
  },
  // Auth Routes
  {
    path: 'login',
    loadComponent: () => import('./View/pages/auth/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./View/pages/auth/register/register.page').then(m => m.RegisterPage)
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () => import('./View/pages/auth/forgot-password/forgot-password.page').then(m => m.ForgotPasswordPage)
  },
  {
    path: 'auth/reset-password',
    loadComponent: () => import('./View/pages/auth/reset-password/reset-password.page').then(m => m.ResetPasswordPage)
  },
  {
    path: 'auth/reset-password-success',
    loadComponent: () => import('./View/pages/auth/reset-password-success/reset-password-success.page').then(m => m.ResetPasswordSuccessPage)
  },
  {
    path: 'auth/verify-email',
    loadComponent: () => import('./View/pages/auth/verify-email/verify-email.page').then(m => m.VerifyEmailPage)
  },
  {
    path: 'auth/verify-email-error',
    loadComponent: () => import('./View/pages/auth/verify-email-error/verify-email-error.page').then(m => m.VerifyEmailErrorPage)
  },

  // Personal Trainer Routes
  {
    path: 'personal',
    data: { userType: 'personal' },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./View/pages/personal/dashboard/dashboard.page').then(m => m.DashboardPage)
      },
      {
        path: 'settings',
        loadComponent: () => import('./View/pages/personal/settings/settings.page').then(m => m.PersonalSettingsPage)
      },
      {
        path: 'manage-students',
        loadComponent: () => import('./View/pages/personal/manage-students/manage-students.page').then(m => m.ManageStudentsPage)
      },
      {
        path: 'create-workout',
        loadComponent: () => import('./View/pages/personal/create-workout/create-workout.page').then(m => m.CreateWorkoutPage)
      },
      {
        path: 'performance',
        loadComponent: () => import('./View/pages/personal/performance/performance.page').then(m => m.PerformancePage)
      },
      {
        path: 'dynamic-pool-workout',
        loadComponent: () => import('./View/pages/personal/dynamic-pool-workout/dynamic-pool-workout.page').then(m => m.DynamicPoolWorkoutPage)
      },
      {
        path: 'create-pool-workout',
        loadComponent: () => import('./View/pages/personal/create-pool-workout/create-pool-workout.page').then(m => m.CreatePoolWorkoutPage)
      },
    ]
  },

  // Pupil Routes
  {
    path: 'pupil',
    data: { userType: 'aluno' },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./View/pages/pupil/dashboard/dashboard.page').then(m => m.PupilDashboardPage)
      },
      {
        path: 'settings',
        loadComponent: () => import('./View/pages/pupil/settings/settings.page').then(m => m.PupilSettingsPage)
      },
      {
        path: 'profile',
        loadComponent: () => import('./View/pages/pupil/profile/profile.page').then(m => m.PupilProfilePage)
      },
      {
        path: 'current-workout',
        loadComponent: () => import('./View/pages/pupil/current-workout/current-workout.page').then(m => m.CurrentWorkoutPage)
      },
      {
        path: 'workout-history',
        loadComponent: () => import('./View/pages/pupil/workout-history/workout-history.page').then(m => m.WorkoutHistoryPage)
      },
      {
        path: 'pool-workout',
        loadComponent: () => import('./View/pages/pupil/pool-workout/pool-workout.page').then(m => m.PoolWorkoutPage)
      },
      {
        path: 'pool-workout-summary/:id',
        loadComponent: () => import('./View/pages/pupil/pool-workout-summary/pool-workout-summary.page').then(m => m.PoolWorkoutSummaryPage)
      },
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
