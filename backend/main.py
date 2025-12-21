import os
import datetime
import requests
import smtplib
from email.message import EmailMessage
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from models import Base, User, Checklist, ChecklistItem, Report, Template  # 🔹 добавили Template
from schemas import UserOut, LoginRequest, ChecklistOut, ReportIn
from db_init import DB_PATH
from dotenv import load_dotenv
from typing import List

load_dotenv()

DATABASE_URL = f"sqlite:///{DB_PATH}"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
Session = sessionmaker(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/ping")
def ping():
        """Возвращает минимальную HTML-страницу с мигающим кружком.

        Кружок зелёный, если простая проверка БД проходит, иначе — красный.
        При проблеме с БД возвращаем код 503.
        """
        ok = True
        try:
                with engine.connect() as conn:
                        conn.execute(text("SELECT 1"))
        except Exception:
                ok = False

        color = "#28a745" if ok else "#dc3545"
        status_code = 200 if ok else 503

        html = f"""
        <!doctype html>
        <html lang="ru">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width,initial-scale=1">
            <style>
                .dot {{
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: {color};
                    display: inline-block;
                    animation: blink 1s infinite;
                }}
                @keyframes blink {{
                    0% {{ opacity: 1; }}
                    50% {{ opacity: 0.2; }}
                    100% {{ opacity: 1; }}
                }}
                body {{
                    margin: 8px;
                    font-family: Arial, Helvetica, sans-serif;
                    font-size: 13px;
                }}
            </style>
        </head>
        <body>
            <span class="dot" aria-hidden="true"></span>
        </body>
        </html>
        """

        return HTMLResponse(content=html, status_code=status_code)

@app.get("/users", response_model=List[UserOut])
def list_users(): 
    with Session() as s: 
        return s.query(User).all()

@app.post("/login")
def login(payload: LoginRequest):
    with Session() as s:
        user = s.query(User).filter(User.id == payload.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if user.password != payload.password:
            raise HTTPException(status_code=401, detail="Invalid password")
        return {"status": "ok", "user": {"id": user.id, "name": user.name}}


@app.post("/login/voice")
def login_by_voice(payload: dict):
    """Authenticate by 4-digit password only; returns first matching user."""
    pwd = (payload.get("password") or "").strip()
    if not pwd:
        raise HTTPException(status_code=400, detail="Password required")
    with Session() as s:
        user = s.query(User).filter(User.password == pwd).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {"status": "ok", "user": {"id": user.id, "name": user.name}}

# 🔹 Чек-лист по ID с шаблоном
@app.get("/checklists/{cid}", response_model=ChecklistOut)
def get_checklist(cid: int):
    with Session() as s:
        cl = s.query(Checklist).filter(Checklist.id == cid).first()
        if not cl:
            raise HTTPException(status_code=404, detail="Checklist not found")
        items = (
            s.query(ChecklistItem)
            .filter(ChecklistItem.checklist_id == cid)
            .order_by(ChecklistItem.position)
            .all()
        )
        return {
            "id": cl.id,
            "title": cl.title,
            "template_text": cl.template.text if cl.template else None,
            "items": items,
        }

# 🔹 Все чек-листы с шаблонами
@app.get("/checklists")
def get_all_checklists():
    with Session() as s:
        cls = s.query(Checklist).all()
        return [
            {
                "id": c.id,
                "title": c.title,
                "template_text": c.template.text if c.template else None,
            }
            for c in cls
        ]

# --- Отправка отчёта по email ---
def send_email_report(report, user, checklist_title, skipped_text):
    try:
        msg = EmailMessage()
        msg["Subject"] = f"Отчёт от {user.name}"
        msg["From"] = os.getenv("SMTP_SENDER")
        msg["To"] = os.getenv("SMTP_RECEIVER")

        msg.set_content(f"""
📋 Отчёт #{report.id}
📑 Чек-лист: {checklist_title}
👤 Пользователь: {user.name}
✈️ Рейс: {report.flight_number}
📍 Место: {report.place}
📅 Дата события: {report.date_of_incident}
🕒 Время события: {report.time_of_incident}
🕓 Время заполнения: {report.date_report.strftime('%Y-%m-%d %H:%M')}
✅ Выполнено: {report.items_checked_count} из {report.total_items}
⚠️ Пропущено: {skipped_text}
💬 Комментарий: {report.comment}
""")

        with smtplib.SMTP(os.getenv("SMTP_HOST"), int(os.getenv("SMTP_PORT"))) as server:
            server.starttls()
            server.login(os.getenv("SMTP_USER"), os.getenv("SMTP_PASS"))
            server.send_message(msg)
        print("✅ Email отправлен")
    except Exception as e:
        print("❌ Ошибка email:", e)

# --- Отправка отчёта в Telegram ---
def send_telegram_report(report, user, checklist_title, skipped_text):
    try:
        token = os.getenv("TELEGRAM_BOT_TOKEN")
        chat_id = os.getenv("TELEGRAM_CHAT_ID")
        if not token or not chat_id:
            print("⚠️ Telegram config отсутствует")
            return

        text = f"""
📋 Отчёт #{report.id}
📑 Чек-лист: {checklist_title}
👤 {user.name}
✈️ {report.flight_number}
📍 {report.place}
📅 {report.date_of_incident}
🕒 {report.time_of_incident}
🕓 Заполнено: {report.date_report.strftime('%Y-%m-%d %H:%M')}
✅ Выполнено: {report.items_checked_count}/{report.total_items}
⚠️ Пропущено: {skipped_text}
💬 {report.comment}
"""

        r = requests.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": chat_id, "text": text},
        )
        print("✅ Telegram статус:", r.status_code)
    except Exception as e:
        print("❌ Ошибка Telegram:", e)


def send_telegram_text(text: str):
    try:
        token = os.getenv("TELEGRAM_BOT_TOKEN")
        chat_id = os.getenv("TELEGRAM_CHAT_ID")
        if not token or not chat_id:
            print("⚠️ Telegram config отсутствует")
            return False
        r = requests.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": chat_id, "text": text},
        )
        print("✅ Telegram статус:", r.status_code)
        return r.status_code == 200
    except Exception as e:
        print("❌ Ошибка Telegram send_text:", e)
        return False


@app.post("/shift/accept")
def shift_accept(payload: dict):
    user_id = payload.get("user_id")
    no_comments = payload.get("no_comments", False)
    comment = payload.get("comment", "").strip()
    with Session() as s:
        user = s.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    now = datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M')
    if no_comments:
        text = f"{user.name}\n{now}\nДежурство принял. Замечаний нет"
    else:
        text = f"{user.name}\n{now}\nДежурство принял. С замечаниями\n{comment}"
    ok = send_telegram_text(text)
    if not ok:
        raise HTTPException(status_code=500, detail="Telegram send failed")
    return {"status": "ok"}


@app.post("/shift/hand_over")
def shift_hand_over(payload: dict):
    user_id = payload.get("user_id")
    role = payload.get("role")
    comment = payload.get("comment", "").strip()
    with Session() as s:
        user = s.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    now = datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M')
    if role == "DPA":
        out = int(payload.get("out", 0))
        inp = int(payload.get("in", 0))
        text = f"{user.name}\n{now}\nДежурство сдал.\nВылет: {out}\nПрилет: {inp}"
    elif role == "RC":
        transit = int(payload.get("transit", 0))
        text = f"{user.name}\n{now}\nДежурство сдал.\nТранзит: {transit}"
    else:
        raise HTTPException(status_code=400, detail="Unknown role")
    if comment:
        text += f"\nЗамечания: {comment}"
    ok = send_telegram_text(text)
    if not ok:
        raise HTTPException(status_code=500, detail="Telegram send failed")
    return {"status": "ok"}

# --- Приём отчёта ---
@app.post("/submit_report")
def submit_report(r: ReportIn):
    with Session() as s:
        user = s.query(User).filter(User.id == r.user_id).first()
        cl = s.query(Checklist).filter(Checklist.id == r.checklist_id).first()
        if not user or not cl:
            raise HTTPException(status_code=404, detail="User or Checklist not found")

        items = (
            s.query(ChecklistItem)
            .filter(ChecklistItem.checklist_id == cl.id)
            .order_by(ChecklistItem.position)
            .all()
        )
        total = len(items)
        checked = len(r.checked_item_ids)
        completed = checked == total

        skipped_items = [item.text for item in items if item.id not in r.checked_item_ids]
        skipped_text = ", ".join(skipped_items) if skipped_items else "Нет"

        report = Report(
            user_id=user.id,
            checklist_id=cl.id,
            date_of_incident=r.date_of_incident,
            flight_number=r.flight_number,
            place=r.place,
            time_of_incident=r.time_of_incident,
            items_checked_count=checked,
            total_items=total,
            completed=completed,
            comment=r.comment,
            date_report=datetime.datetime.utcnow(),
        )

        s.add(report)
        s.commit()
        s.refresh(report)

        send_email_report(report, user, cl.title, skipped_text)
        send_telegram_report(report, user, cl.title, skipped_text)

        return {"status": "ok", "report_id": report.id}
