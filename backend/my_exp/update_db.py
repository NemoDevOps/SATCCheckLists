import pandas as pd
import os
import shutil

# === Пути ===
old_excel = "app_export.xlsx"
new_excel = "exported_tables1.xlsx"
output_excel = "export_after_update.xlsx"
target_dir = "/sdcard/Download/Telegram/"

# === Загружаем все листы ===
old_data = pd.read_excel(old_excel, sheet_name=None)
new_data = pd.read_excel(new_excel, sheet_name=None)

# --- USERS ---
users_new = old_data["users"].copy()

# очистить name и password и вставить новые
users_new["name"] = new_data["users"]["name"]
users_new["password"] = new_data["users"]["password"]

# удалить email и telegram_id
users_new = users_new.drop(columns=["email", "telegram_id"], errors="ignore")

# перенумеровать id начиная с 1
users_new["id"] = range(1, len(users_new) + 1)

# --- CHECKLISTS ---
checklists_new = old_data["checklists"].copy()

# удалить title и description
checklists_new = checklists_new.drop(columns=["title", "description"], errors="ignore")

# создать новый столбец templates_id
checklists_new["templates_id"] = new_data["checklists"]["templates_id"]

# вставить title из нового файла
checklists_new["title"] = new_data["checklists"]["title"]

# перенумеровать id
checklists_new["id"] = range(1, len(checklists_new) + 1)

# --- CHECKLIST_ITEMS ---
items_new = old_data["checklist_items"].copy()

# очистить поля
items_new["checklist_id"] = new_data["checklist_items"]["checklist_id"]
items_new["position"] = new_data["checklist_items"]["position"]
items_new["text"] = new_data["checklist_items"]["text"]

# перенумерация id
items_new["id"] = range(1, len(items_new) + 1)

# --- TEMPLATES ---
templates_new = pd.DataFrame({
    "templates_id": range(1, len(new_data["templates"]) + 1),
    "text": new_data["templates"]["text"]
})

# --- REPORTS (очистить) ---
reports_new = old_data["reports"].copy()
reports_new = reports_new.iloc[0:0]  # очистка

# === Собираем финальный словарь таблиц ===
final_data = {
    "users": users_new,
    "checklists": checklists_new,
    "checklist_items": items_new,
    "templates": templates_new,
    "reports": reports_new
}

# === Сохраняем в новый Excel ===
with pd.ExcelWriter(output_excel, engine="openpyxl") as writer:
    for name, df in final_data.items():
        df.to_excel(writer, sheet_name=name, index=False)

print(f"✅ Обновлённая база сохранена в {output_excel}")

# === Копирование в /sdcard/Download/Telegram/ ===
if not os.path.exists(target_dir):
    os.makedirs(target_dir)

shutil.copy2(output_excel, target_dir)

print(f"📂 Файл скопирован в {target_dir}")
