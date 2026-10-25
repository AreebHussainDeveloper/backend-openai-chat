
import {
  BadRequestException,
  ValidationPipe,
} from '@nestjs/common';

export class CustomValidationPipe extends ValidationPipe {
  constructor() {
    super({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
      exceptionFactory: (errors) => {
        const firstError = errors[0];

        const message = firstError
          ? Object.values(firstError.constraints ?? {})[0] ??
            'Validation failed'
          : 'Validation failed';

        return new BadRequestException(message);
      },
    });
  }
}
