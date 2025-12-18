const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

// 🔹 Общая функция запроса
async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Ошибка сервера" }));
    throw error;
  }
  return response.json();
}

// 🔹 Получить список пользователей
export async function fetchUsers() {
  const response = await fetch(`${API_BASE}/users`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Ошибка сервера" }));
    throw error;
  }
  return await response.json();
}

// 🔹 Авторизация пользователя
export async function login(user_id, password) {
  return request("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, password }),
  });
}

// 🔹 Получить все чек-листы
export async function fetchChecklists() {
  return request("/checklists");
}

// 🔹 Получить конкретный чек-лист по ID
export async function fetchChecklist(id) {
  return request(`/checklists/${id}`);
}

// 🔹 Отправить отчёт
export async function submitReport(payload) {
  return request("/submit_report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
