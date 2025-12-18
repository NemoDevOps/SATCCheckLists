import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, User, Checklist, ChecklistItem

# 🔹 Путь к базе данных
DB_PATH = os.path.join(os.path.dirname(__file__), "app.db")

# 🔹 Подключение к SQLite
engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
Session = sessionmaker(bind=engine)

def init_db():
    Base.metadata.create_all(engine)
    s = Session()

    # 🔍 Проверка наличия данных
    user_count = s.query(User).count()
    checklist_count = s.query(Checklist).count()
    item_count = s.query(ChecklistItem).count()

    print(f"👥 Пользователей: {user_count}")
    print(f"📋 Чек-листов: {checklist_count}")
    print(f"✅ Пунктов чек-листов: {item_count}")

    if user_count == 0 or checklist_count == 0:
        print("⚠️ В базе отсутствуют данные. Заглушки не добавляются автоматически.")
    else:
        print("✅ База содержит чек-листы. Всё готово к работе.")

    s.close()

# 🔹 Запуск при вызове напрямую
if __name__ == "__main__":
    init_db()
