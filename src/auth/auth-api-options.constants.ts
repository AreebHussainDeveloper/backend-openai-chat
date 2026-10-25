export const AUTH_API_TAG = 'Auth';
export const AUTH_API_PREFIX = 'auth';

export const AUTH_API_OPTIONS = {
  signup: {
    path: 'signup',
    operation: { summary: 'Register a new user' },
  },
  dashboardSignup: {
    path: 'dashboard/signup',
    operation: { summary: 'Register a dashboard staff account' },
  },
  login: {
    path: 'login',
    operation: { summary: 'Login with email and password' },
  },
  dashboardLogin: {
    path: 'dashboard/login',
    operation: { summary: 'Login to the dashboard' },
  },
  refresh: {
    path: 'refresh',
    operation: { summary: 'Refresh access token using refresh token' },
  },
  dashboardRefresh: {
    path: 'dashboard/refresh',
    operation: { summary: 'Refresh a dashboard access token' },
  },
  forgotPassword: {
    path: 'forgot-password',
    operation: { summary: 'Request password reset' },
  },
  dashboardForgotPassword: {
    path: 'dashboard/forgot-password',
    operation: { summary: 'Request a dashboard password reset' },
  },
  resetPassword: {
    path: 'reset-password',
    operation: { summary: 'Reset password with token' },
  },
  dashboardResetPassword: {
    path: 'dashboard/reset-password',
    operation: { summary: 'Reset a dashboard password with token' },
  },
} as const;
