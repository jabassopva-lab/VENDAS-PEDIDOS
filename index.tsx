
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log("INDEX.TSX: Starting App", { ReactVersion: React.version });
const debugDiv = document.createElement('div');
debugDiv.style.position = 'fixed';
debugDiv.style.top = '0';
debugDiv.style.right = '0';
debugDiv.style.background = 'red';
debugDiv.style.color = 'white';
debugDiv.style.padding = '5px';
debugDiv.style.zIndex = '9999';
debugDiv.innerText = `JS OK - Rv:${React.version}`;
document.body.appendChild(debugDiv);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  console.log("INDEX.TSX: Attempting to render App");
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <App />
  );
  console.log("INDEX.TSX: Render triggered");
} catch (error: any) {
  console.error("INDEX.TSX: Render failed", error);
  const errorDiv = document.createElement('div');
  errorDiv.style.position = 'fixed';
  errorDiv.style.top = '50px';
  errorDiv.style.left = '0';
  errorDiv.style.background = 'black';
  errorDiv.style.color = 'yellow';
  errorDiv.style.padding = '20px';
  errorDiv.style.zIndex = '9999';
  errorDiv.style.width = '100%';
  errorDiv.innerText = `ERROR: ${error.message}\n${error.stack}`;
  document.body.appendChild(errorDiv);
}
