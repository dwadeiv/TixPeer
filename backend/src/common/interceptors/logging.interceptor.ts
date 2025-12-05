/**
 * Request Logging Interceptor
 *
 * Logs incoming HTTP requests with method, URL, and response time.
 * Useful for performance monitoring and debugging.
 */

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - now;
        const method = req?.method;
        const url = req?.url;
        // eslint-disable-next-line no-console
        console.log(`[${method}] ${url} - ${ms}ms`);
      }),
    );
  }
}
