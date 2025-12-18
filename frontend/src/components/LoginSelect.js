import React, { useState, useEffect } from "react";
import { fetchUsers, login } from "../api";

export default function LoginSelect({ onLogin }) {
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch(err => {
        console.error("Ошибка загрузки пользователей:", err);
        setError("Не удалось загрузить пользователей");
      });
  }, []);

  const handleLogin = async () => {
    setError("");
    try {
      await login(Number(userId), password);
      const user = users.find(u => u.id === Number(userId));
      onLogin(user);
    } catch (e) {
      setError(e.detail || "Ошибка ввода пароля");
    }
  };

  return (
    <div className="login-container">
      <h2>🔑 Вход</h2>

      <select value={userId} onChange={e => setUserId(e.target.value)}>
        <option value="">Выберите пользователя</option>
        {users.map(user => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>

      <input
        type="password"
        placeholder="Пароль"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}

      <button onClick={handleLogin}>Войти</button>
    </div>
  );
}
