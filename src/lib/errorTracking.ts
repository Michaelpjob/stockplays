import * as Sentry from '@sentry/react';

const DSN = import.meta.env.VITE_SENTRY_DSN;

export function initErrorTracking() {
  if (!DSN) return;
  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
  });
}

export const SentryErrorBoundary = Sentry.ErrorBoundary;

export function captureException(err: unknown, context?: Record<string, unknown>) {
  if (!DSN) {
    console.error('[error]', err, context);
    return;
  }
  Sentry.captureException(err, { extra: context });
}

export const isErrorTrackingActive = Boolean(DSN);
