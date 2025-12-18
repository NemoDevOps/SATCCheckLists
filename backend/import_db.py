import sqlite3
import pandas as pd
import os

# === Пути к файлам ===
base_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(base_dir, "app.db")
excel_path = os.path.join(base_dir, "app_export.xlsx")

# === Подключение к базе ===
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# === Отключаем внешние ключи на время импорта ===
cursor.execute("PRAGMA foreign_keys = OFF;")

# === Получаем список таблиц из базы ===
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
db_tables = [row[0] for row in cursor.fetchall()]
db_tables_lower = {t.lower(): t for t in db_tables}  # для сопоставления без учёта регистра

# === Загружаем Excel ===
xls = pd.ExcelFile(excel_path)

# === Импорт с очисткой и проверкой колонок ===
for sheet_name in xls.sheet_names:
    sheet_key = sheet_name.strip().lower()
    if sheet_key not in db_tables_lower:
        print(f"⚠️ Лист '{sheet_name}' не соответствует ни одной таблице в базе, пропускаем.")
        continue

    table_name = db_tables_lower[sheet_key]
    print(f"\n🔄 Обновляем таблицу: {table_name}")

    # Чтение данных из Excel
    df = pd.read_excel(xls, sheet_name=sheet_name)

    # Получаем список колонок из базы
    cursor.execute(f"PRAGMA table_info({table_name});")
    db_columns = [row[1] for row in cursor.fetchall()]
    excel_columns = df.columns.tolist()

    # Проверка соответствия колонок
    if set(excel_columns) != set(db_columns):
        print(f"❌ Несоответствие колонок в таблице '{table_name}'")
        print(f"Excel: {excel_columns}")
        print(f"DB:    {db_columns}")
        continue

    try:
        # Очистка таблицы
        cursor.execute(f"DELETE FROM {table_name};")
        conn.commit()

        # Импорт данных
        df.to_sql(table_name, conn, if_exists='append', index=False)
        print(f"✅ Таблица '{table_name}' успешно обновлена.")
    except Exception as e:
        print(f"❌ Ошибка при обновлении таблицы '{table_name}': {e}")

# === Включаем внешние ключи обратно ===
cursor.execute("PRAGMA foreign_keys = ON;")

# === Закрываем подключение ===
conn.close()
print("\n🏁 Импорт завершён.")

