
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import { GoogleOAuthProvider } from '@react-oauth/google';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || '451807747604-tjs116nqmg4su77osh2vi7l6fusufqkp.apps.googleusercontent.com'}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
