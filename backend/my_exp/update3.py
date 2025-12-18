import sqlite3
import pandas as pd
import os

# === Пути ===
db_path = "app.db"
new_excel = "exported_tables1.xlsx"

# === Загружаем данные из Excel ===
new_data = pd.read_excel(new_excel, sheet_name=None)

# === Подключаемся к БД ===
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# --- USERS ---
cursor.execute("DELETE FROM users")
for i, row in new_data["users"].iterrows():
    cursor.execute(
        "INSERT INTO users (id, name, password) VALUES (?, ?, ?)",
        (i + 1, row["name"], row["password"])
    )

# --- CHECKLISTS ---
cursor.execute("DELETE FROM checklists")
for i, row in new_data["checklists"].iloc[:12].iterrows():
    cursor.execute(
        "INSERT INTO checklists (id, title, description) VALUES (?, ?, ?)",
        (i + 1, row["title"], str(row.get("templates_id", "")))  # временно templates_id в поле description
    )

# --- CHECKLIST_ITEMS ---
cursor.execute("DELETE FROM checklist_items")
for i, row in new_data["checklist_items"].iloc[:79].iterrows():
    cursor.execute(
        "INSERT INTO checklist_items (id, checklist_id, position, text) VALUES (?, ?, ?, ?)",
        (i + 1, int(row["checklist_id"]), int(row["position"]), row["text"])
    )

# --- REPORTS (очистка) ---
cursor.execute("DELETE FROM reports")

# --- TEMPLATES (создаём таблицу, если её нет) ---
cursor.execute("""
CREATE TABLE IF NOT EXISTS templates (
    templates_id INTEGER PRIMARY KEY,
    text TEXT NOT NULL
)
""")

cursor.execute("DELETE FROM templates")
for i, row in new_data["templates"].iterrows():
    cursor.execute(
        "INSERT INTO templates (templates_id, text) VALUES (?, ?)",
        (i + 1, row["text"])
    )

conn.commit()
conn.close()

print("✅ База app.db обновлена из exported_tables1.xlsx")
