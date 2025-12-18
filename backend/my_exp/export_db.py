import sqlite3
import pandas as pd
import shutil
import os

# Автоматически строим путь к базе рядом со скриптом
base_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(base_dir, "app.db")   # если база лежит в той же папке
# db_path = os.path.join(base_dir, "backend", "app.db")  # если внутри backend

excel_path = "app_export.xlsx"
schema_path = "app_schema.sql"
target_dir = "/sdcard/Download/Telegram/"

# Папка для копирования (например, Android /sdcard/Download/Telegram/)
target_dir = "/sdcard/Download/Telegram/"

# === Подключение к базе ===
conn = sqlite3.connect(db_path)

# === Получаем список таблиц ===
tables = pd.read_sql("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';", conn)

# === Экспорт таблиц в Excel ===
with pd.ExcelWriter(excel_path, engine="openpyxl") as writer:
    for table in tables["name"]:
        df = pd.read_sql(f"SELECT * FROM {table}", conn)
        df.to_excel(writer, sheet_name=table[:31], index=False)  
        # Excel ограничивает длину имени листа до 31 символа

print(f"✅ Данные выгружены в {excel_path}")

# === Экспорт структуры таблиц ===
schema = pd.read_sql("SELECT sql FROM sqlite_master WHERE type='table' AND sql NOT NULL;", conn)

with open(schema_path, "w", encoding="utf-8") as f:
    for row in schema["sql"]:
        f.write(row + ";\n\n")

print(f"✅ Структура таблиц сохранена в {schema_path}")

# === Закрываем подключение ===
conn.close()

# === Копирование файлов в /sdcard/Download/Telegram/ ===
if not os.path.exists(target_dir):
    os.makedirs(target_dir)

shutil.copy2(excel_path, target_dir)
shutil.copy2(schema_path, target_dir)

print(f"📂 Файлы скопированы в {target_dir}")
