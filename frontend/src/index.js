import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// ✅ Подключаем PWA (service worker)
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

// ✅ (Необязательно) логируем производительность
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ✅ Регистрируем service worker для PWA
serviceWorkerRegistration.register();

// ✅ Включаем отчёт о производительности (можно отключить)
reportWebVitals();
