import sqlite3
import pandas as pd

# Подключение к базе
conn = sqlite3.connect('app.db')
cursor = conn.cursor()

# Очистка существующих таблиц
cursor.execute("DROP TABLE IF EXISTS checklists")
cursor.execute("DROP TABLE IF EXISTS templates")
cursor.execute("DROP TABLE IF EXISTS items")
cursor.execute("DROP TABLE IF EXISTS users")
cursor.execute("DROP TABLE IF EXISTS settings")

# Пересоздание таблиц
cursor.execute("""
CREATE TABLE templates (
    templates_id INTEGER PRIMARY KEY,
    text TEXT
)
""")

cursor.execute("""
CREATE TABLE checklists (
    checklist_id INTEGER PRIMARY KEY,
    name TEXT,
    created_at TEXT,
    templates_id INTEGER,
    FOREIGN KEY (templates_id) REFERENCES templates(templates_id)
)
""")

# Остальные таблицы — без изменений
cursor.execute("""
CREATE TABLE items (
    item_id INTEGER PRIMARY KEY,
    checklist_id INTEGER,
    description TEXT,
    status TEXT,
    FOREIGN KEY (checklist_id) REFERENCES checklists(checklist_id)
)
""")

cursor.execute("""
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY,
    username TEXT,
    email TEXT
)
""")

cursor.execute("""
CREATE TABLE settings (
    setting_id INTEGER PRIMARY KEY,
    user_id INTEGER,
    key TEXT,
    value TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
)
""")

conn.commit()

# Импорт из обновлённого Excel-файла
xls = pd.ExcelFile('exported_tables1.xlsx')

for sheet_name in xls.sheet_names:
    df = pd.read_excel(xls, sheet_name=sheet_name)
    df.to_sql(sheet_name, conn, if_exists='append', index=False)
    print(f"Импортировано: {sheet_name}")

conn.close()
