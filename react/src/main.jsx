import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

const AdminPage = lazy(() => import('./admin/AdminPage.jsx'));

const isAdmin = window.location.pathname.replace(/\/+$/, '') === '/admin';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdmin
      ? <Suspense fallback={null}><AdminPage /></Suspense>
      : <App />}
  </React.StrictMode>
);
