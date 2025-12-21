import React, { useState, useEffect } from "react";
import { API_BASE } from "./api";
import LoginSelect from "./components/LoginSelect";
import Dashboard from "./components/Dashboard";
import ChecklistPlayer from "./components/ChecklistPlayer";
import ShiftMenu from "./components/ShiftMenu";

function App() {
  const [user, setUser] = useState(null);
  const [currentChecklist, setCurrentChecklist] = useState(null);
  const [showShiftMenu, setShowShiftMenu] = useState(false);
  const [backendOk, setBackendOk] = useState(null); // null = проверка, true/false = статус
  const [backendError, setBackendError] = useState(null);

  // Проверка соединения с backend — смотрим HTTP статус
  useEffect(() => {
    fetch(`${API_BASE}/ping`, { cache: "no-store" })
      .then((res) => {
        if (res.ok) {
          setBackendOk(true);
        } else {
          setBackendOk(false);
        }
      })
      .catch((err) => {
        setBackendOk(false);
        setBackendError(err.message);
      });
  }, []);

  // Индикатор состояния backend
  const renderBackendDot = () => {
    const color =
      backendOk === null ? "#6c757d" : backendOk ? "#28a745" : "#dc3545";
    const title =
      backendOk === null
        ? "Проверка..."
        : backendOk
        ? "Backend OK"
        : `Ошибка${backendError ? ": " + backendError : ""}`;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <style>
          {`.dot{width:12px;height:12px;border-radius:50%;display:inline-block;animation:blink 1s infinite}
            @keyframes blink{0%{opacity:1}50%{opacity:0.2}100%{opacity:1}}`}
        </style>
        <span
          className="dot"
          style={{ background: color }}
          aria-hidden="true"
          title={title}
        ></span>
        <span style={{ fontSize: 13 }}>{title}</span>
      </div>
    );
  };

  // Экран логина
  if (!user) {
    return (
      <div>
        {renderBackendDot()}
        <LoginSelect
          onLogin={(u) => {
            setUser(u);
            setShowShiftMenu(true);
          }}
        />
      </div>
    );
  }

  // Промежуточное меню после логина
  if (showShiftMenu && !currentChecklist) {
    return (
      <ShiftMenu
        user={user}
        onOpenChecklists={() => setShowShiftMenu(false)}
        onLogout={() => {
          setUser(null);
          setCurrentChecklist(null);
          setShowShiftMenu(false);
        }}
      />
    );
  }

  // Игрок чеклистов
  if (currentChecklist) {
    return (
      <ChecklistPlayer
        user={user}
        checklistId={currentChecklist}
        onDone={(action) => {
          if (action === "menu") {
            setCurrentChecklist(null);
            setShowShiftMenu(true);
          } else if (action === "exit") {
            setCurrentChecklist(null);
            setUser(null);
            setShowShiftMenu(false);
          }
        }}
      />
    );
  }

  // Основная панель
  return (
    <div>
      {renderBackendDot()}
      <Dashboard user={user} onOpenChecklist={(id) => setCurrentChecklist(id)} />
    </div>
  );
}

export default App;
