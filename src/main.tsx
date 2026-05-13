import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AppStateProvider } from './state/AppState';
import { initErrorTracking, SentryErrorBoundary } from './lib/errorTracking';
import './styles/globals.css';

initErrorTracking();

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SentryErrorBoundary
      fallback={
        <div className="loading" style={{ marginTop: 80 }}>
          Something broke. Try refreshing the page.
        </div>
      }
    >
      <BrowserRouter basename={basename}>
        <AppStateProvider>
          <App />
        </AppStateProvider>
      </BrowserRouter>
    </SentryErrorBoundary>
  </React.StrictMode>
);
