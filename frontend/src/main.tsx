import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Start MSW in development mode
async function enableMocking() {
  if (import.meta.env.DEV) {
    console.log('🔧 Development mode detected - initializing MSW...');
    const { worker } = await import('./mocks/browser.ts')

    return worker.start({
      onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
    }).then(() => {
      console.log('✅ MSW (Mock Service Worker) enabled!');
      console.log('📡 Mock API handlers are now intercepting requests');
    });
  } else {
    console.log('🚀 Production mode - MSW disabled');
  }
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
