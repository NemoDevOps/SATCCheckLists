import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Checklist, ChecklistItem
from db_init import DB_PATH

DATABASE_URL = f"sqlite:///{DB_PATH}"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
Session = sessionmaker(bind=engine)

def verify_import(file_path):
    # Загружаем Excel
    df_checklists = pd.read_excel(file_path, sheet_name="Checklist")
    df_items = pd.read_excel(file_path, sheet_name="ChecklistItems")

    df_checklists.columns = df_checklists.columns.str.strip().str.lower()
    df_items.columns = df_items.columns.str.strip().str.lower()

    s = Session()

    try:
        # Проверка чек-листов
        print("🔍 Проверка чек-листов:")
        for _, row in df_checklists.iterrows():
            title = row["title"]
            description = row.get("description", "")
            match = s.query(Checklist).filter_by(title=title, description=description).first()
            if match:
                print(f"✅ Найден: {title}")
            else:
                print(f"❌ Не найден в БД: {title}")

        # Проверка пунктов
        print("\n🔍 Проверка пунктов:")
        for _, item_row in df_items.iterrows():
            text = item_row["text"]
            position = item_row["position"]
            checklist_title = df_checklists[df_checklists["id"] == item_row["checklist_id"]]["title"].values[0]

            checklist = s.query(Checklist).filter_by(title=checklist_title).first()
            if not checklist:
                print(f"⚠️ Чек-лист '{checklist_title}' не найден — пункт '{text}' пропущен")
                continue

            item_match = s.query(ChecklistItem).filter_by(
                checklist_id=checklist.id,
                text=text,
                position=position
            ).first()

            if item_match:
                print(f"✅ Пункт найден: {text} (в '{checklist_title}')")
            else:
                print(f"❌ Пункт не найден: {text} (в '{checklist_title}')")

    finally:
        s.close()

if __name__ == "__main__":
    verify_import("checklists.xlsx")
