import sqlite3

db_path = "app.db"  # укажи правильный путь, если у тебя другой

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Список таблиц
print("📌 Таблицы в базе данных:\n")
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()

for t in tables:
    table_name = t[0]
    print(f"=== {table_name} ===")
    cursor.execute(f"PRAGMA table_info({table_name});")
    columns = cursor.fetchall()
    for col in columns:
        cid, name, ctype, notnull, dflt_value, pk = col
        pk_flag = " (PK)" if pk else ""
        print(f" - {name} {ctype}{pk_flag}")
    print()

conn.close()
