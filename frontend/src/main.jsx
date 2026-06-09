import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Error handling
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
  document.body.innerHTML = `<pre style="padding: 20px; color: red;">Error: ${e.error?.message || e.message}</pre>`;
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled rejection:', e.reason);
  document.body.innerHTML = `<pre style="padding: 20px; color: red;">Unhandled Promise Rejection: ${e.reason?.message || e.reason}</pre>`;
});

try {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error('React render error:', error);
  document.body.innerHTML = `<pre style="padding: 20px; color: red;">React Render Error: ${error?.message || error}</pre>`;
}