import React, { useState, useEffect } from "react";
import LoginSelect from "./components/LoginSelect";
import Dashboard from "./components/Dashboard";
import ChecklistPlayer from "./components/ChecklistPlayer";

function App() {
  const [user, setUser] = useState(null);
  const [currentChecklist, setCurrentChecklist] = useState(null);
  const [backendStatus, setBackendStatus] = useState("⏳ Проверка...");

  // Проверка соединения с backend
  useEffect(() => {
    fetch("/ping")   // ⚡ теперь работает через proxy
      .then((res) => res.json())
      .then((data) => setBackendStatus("✅ Backend работает: " + data.message))
      .catch((err) =>
        setBackendStatus("❌ Ошибка fetch: " + err.message)
      );
  }, []);

  if (!user) {
    return (
      <div>
        <p>{backendStatus}</p>
        <LoginSelect onLogin={(u) => setUser(u)} />
      </div>
    );
  }

  if (currentChecklist) {
    return (
      <ChecklistPlayer
        user={user}
        checklistId={currentChecklist}
        onDone={() => {
          setCurrentChecklist(null);
          setUser(null);
          alert("Приложение закрывается.");
        }}
      />
    );
  }

  return (
    <div>
      <p>{backendStatus}</p>
      <Dashboard user={user} onOpenChecklist={(id) => setCurrentChecklist(id)} />
    </div>
  );
}

export default App;
