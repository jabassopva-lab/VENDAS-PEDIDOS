
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Registrar Service Worker para suporte a PWA (Progressive Web App) e atualização automática
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('Service Worker registrado com sucesso:', reg.scope);

        // Força checagem imediata de atualizações na Vercel
        reg.update().catch(() => {});

        // Se houver uma versão esperando, comanda ativação imediata
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nova versão instalada com sucesso, recarrega para exibir a nova interface
                console.log('Nova versão encontrada! Recarregando aplicação...');
                window.location.reload();
              }
            });
          }
        });
      })
      .catch((err) => {
        console.error('Falha ao registrar o Service Worker:', err);
      });

    // Quando o novo Service Worker assumir o controle dos clientes
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <App />
);


