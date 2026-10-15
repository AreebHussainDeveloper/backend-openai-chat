import { SuccessCodes } from './success-codes.enum.js';

export const SuccessMessages: Record<SuccessCodes, string> = {
  [SuccessCodes.LOGIN_SUCCESS]: 'Login successful.',
  [SuccessCodes.SIGNUP_SUCCESS]: 'Signup successful.',
  [SuccessCodes.PASSWORD_RESET_SUCCESS]: 'Password reset successfully.',
  [SuccessCodes.PASSWORD_RESET_EMAIL_SENT]:
    'If this email is registered, a reset link has been sent.',
  [SuccessCodes.USER_DELETED_SUCCESSFULLY]: 'User deleted successfully',
};
