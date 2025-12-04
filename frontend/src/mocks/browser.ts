import { setupWorker } from 'msw/browser';
import { getHandlers } from './handlers';

// This configures a Service Worker with the given request handlers.
// Handlers are conditionally included based on environment variables
export const worker = setupWorker(...getHandlers());
