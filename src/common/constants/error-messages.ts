import { ErrorCodes } from './error-codes.enum.js';

export const ErrorMessages: Record<ErrorCodes, string> = {
  [ErrorCodes.NOT_FOUND]: 'Not found',
  [ErrorCodes.INTERNAL_ERROR]: 'Something went wrong.',
  [ErrorCodes.EXISTING_USER]: 'User already exists with this email.',
  [ErrorCodes.INVALID_EMAIL_AND_PASSWORD]: 'Invalid email or password',
  [ErrorCodes.INVALID_OR_EXPIRED_TOKEN]: 'Invalid or expired token',
  [ErrorCodes.INVALID_TOKEN]: 'Invalid token',
  [ErrorCodes.EMAIL_ALREADY_IN_USE]: 'Email already in use',
  [ErrorCodes.USER_DOESNOT_EXIT]: 'Email address does not exist.',
  [ErrorCodes.PRODUCT_WITH_THIS_NAME_ALREADY_EXISTS]:
    'A product with this name already exists',
};
