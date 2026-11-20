import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { SimulationProvider } from './context/SimulationContext';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <SimulationProvider>
      <App />
    </SimulationProvider>
  </React.StrictMode>
);
