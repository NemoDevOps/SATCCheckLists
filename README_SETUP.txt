CHECKLIST APP - CLEAN PROTOTYPE
Files created in folder: /mnt/data/checklist_app_clean

Quick start (backend):
1. cd backend
2. python -m venv venv
3. Activate venv (Windows: venv\Scripts\activate, macOS/Linux: source venv/bin/activate)
4. pip install -r requirements.txt
5. python db_init.py     # will create sqlite DB with users and placeholder checklists
6. Edit .env and set SMTP_PASS to your SMTP password or Gmail app password
7. uvicorn main:app --reload --host 0.0.0.0 --port 8000

Notes about SMTP (Gmail):
- If you use Gmail, you should create an App Password:
  1) Enable 2-step verification on the Google account used for SMTP.
  2) Go to Google Account -> Security -> App passwords.
  3) Create an app password for 'Mail' (Custom) and copy the 16-character password.
  4) Put that value into SMTP_PASS in the .env file.
- If SMTP_USER is not a full email (e.g. 'CheckListAppAdmin'), Gmail may reject. Use a real gmail address as SMTP_USER (e.g. checklistappadmin@gmail.com).
- EMAIL_FROM should be the same email as SMTP_USER.

Frontend (development):
1. cd frontend
2. npm install
3. npm start
- The frontend expects the backend at http://localhost:8000 by default.
- To change, set REACT_APP_API_BASE environment variable before starting the frontend.

What I included:
- Backend: main.py, models.py, schemas.py, db_init.py, requirements.txt, .env (placeholder)
- Frontend: React app skeleton with components for login, dashboard, checklist player
- DB init populates 20 users (from your list) and 15 checklists x5 items (placeholders)
- Telegram token and chat id placed in backend/.env (as provided)
- SMTP settings placed, but SMTP_PASS must be filled in by you
- Reports are saved in backend/reports.csv after submission

To-do / recommendations:
- Replace SMTP_USER with a real email address if using Gmail.
- Consider storing passwords hashed (security) if moving to production.
- For photo attachments: currently not implemented in prototype UI/backend. Can add file upload endpoint and Telegram photo send in next iteration.

If you want, I can now create a ZIP archive of the project folder for you to download.
