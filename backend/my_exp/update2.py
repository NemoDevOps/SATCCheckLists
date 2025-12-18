import pandas as pd
import os
import shutil

# === Пути ===
old_excel = "app_export.xlsx"         # старый экспорт
new_excel = "exported_tables1.xlsx"   # новые данные
output_excel = "export_db2.xlsx"      # выходной файл
target_dir = "/sdcard/Download/Telegram/"

# === Загружаем данные ===
old_data = pd.read_excel(old_excel, sheet_name=None)
new_data = pd.read_excel(new_excel, sheet_name=None)

# --- USERS ---
users_new = new_data["users"].copy()
users_new["id"] = range(1, len(users_new) + 1)

# --- CHECKLISTS ---
checklists_new = new_data["checklists"].copy()
checklists_new = checklists_new.iloc[:12].copy()
checklists_new["id"] = range(1, len(checklists_new) + 1)

# --- CHECKLIST_ITEMS ---
items_new = new_data["checklist_items"].copy()
items_new = items_new.iloc[:79].copy()
items_new["id"] = range(1, len(items_new) + 1)

# --- TEMPLATES ---
templates_new = pd.DataFrame({
    "templates_id": range(1, len(new_data["templates"]) + 1),
    "text": new_data["templates"]["text"]
})

# --- REPORTS (очищаем) ---
reports_new = old_data["reports"].copy()
reports_new = reports_new.iloc[0:0]

# === Собираем обновлённые данные ===
final_data = {
    "users": users_new,
    "checklists": checklists_new,
    "checklist_items": items_new,
    "templates": templates_new,
    "reports": reports_new
}

# === Сохраняем в Excel ===
with pd.ExcelWriter(output_excel, engine="openpyxl") as writer:
    for name, df in final_data.items():
        df.to_excel(writer, sheet_name=name, index=False)

print(f"✅ Обновлённая база сохранена в {output_excel}")

# === Копируем файл в /sdcard/Download/Telegram/ ===
try:
    if not os.path.exists(target_dir):
        os.makedirs(target_dir)
    shutil.copy2(output_excel, target_dir)
    print(f"📂 Файл скопирован в {target_dir}{output_excel}")
except Exception as e:
    print(f"⚠️ Не удалось скопировать файл: {e}")
