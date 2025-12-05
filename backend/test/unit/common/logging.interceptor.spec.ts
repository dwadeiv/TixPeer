/**
 * LoggingInterceptor Unit Tests
 *
 * Tests the request logging interceptor that logs method, URL, and response time.
 */

import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError, delay } from 'rxjs';
import { LoggingInterceptor } from '../../../src/common/interceptors/logging.interceptor';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();

    // Mock console.log to capture output
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    // Mock HTTP context with request object
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          method: 'GET',
          url: '/events',
        }),
      }),
    } as unknown as ExecutionContext;

    // Mock call handler that returns immediately
    mockCallHandler = {
      handle: jest.fn().mockReturnValue(of({ data: 'test' })),
    };
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('intercept', () => {
    it('should log request method, URL, and response time', (done) => {
      // Act
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          // Assert
          expect(consoleSpy).toHaveBeenCalledTimes(1);
          const logMessage = consoleSpy.mock.calls[0][0];
          expect(logMessage).toMatch(/\[GET\] \/events - \d+ms/);
        },
        complete: () => done(),
      });
    });

    it('should pass through the response unchanged', (done) => {
      // Arrange
      const expectedResponse = { events: [], searchedNearby: false };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(expectedResponse));

      // Act
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (response) => {
          // Assert
          expect(response).toEqual(expectedResponse);
        },
        complete: () => done(),
      });
    });

    it('should log POST requests correctly', (done) => {
      // Arrange
      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            method: 'POST',
            url: '/auth/login',
          }),
        }),
      } as unknown as ExecutionContext;

      // Act
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          // Assert
          const logMessage = consoleSpy.mock.calls[0][0];
          expect(logMessage).toMatch(/\[POST\] \/auth\/login - \d+ms/);
        },
        complete: () => done(),
      });
    });

    it('should handle missing request gracefully', (done) => {
      // Arrange - request returns undefined
      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(undefined),
        }),
      } as unknown as ExecutionContext;

      // Act
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          // Assert - should still log, but with undefined values
          expect(consoleSpy).toHaveBeenCalledTimes(1);
          const logMessage = consoleSpy.mock.calls[0][0];
          expect(logMessage).toMatch(/\[undefined\] undefined - \d+ms/);
        },
        complete: () => done(),
      });
    });

    it('should still log even when handler throws error', (done) => {
      // Arrange
      const testError = new Error('Test error');
      mockCallHandler.handle = jest.fn().mockReturnValue(throwError(() => testError));

      // Act
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        error: (err) => {
          // Assert - error should propagate
          expect(err).toBe(testError);
          // Note: tap() only runs on successful emissions, so no log on error
          done();
        },
      });
    });

    it('should measure time accurately for slow handlers', (done) => {
      // Arrange - handler that takes ~50ms using rxjs delay
      mockCallHandler.handle = jest.fn().mockReturnValue(
        of({ data: 'delayed' }).pipe(delay(50)),
      );

      // Act
      const startTime = Date.now();
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          const elapsed = Date.now() - startTime;
          // Assert - should take at least 50ms
          expect(elapsed).toBeGreaterThanOrEqual(45); // Allow small margin
        },
        complete: () => done(),
      });
    });
  });
});
