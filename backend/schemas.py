from pydantic import BaseModel, Field
from typing import List, Optional

# 🔹 Пользователь (вывод)
class UserOut(BaseModel):
    id: int
    name: str

    class Config:
        orm_mode = True

# 🔹 Авторизация (вход)
class LoginRequest(BaseModel):
    user_id: int
    password: str

# 🔹 Элемент чек-листа
class ChecklistItemOut(BaseModel):
    id: int
    position: int
    text: str

    class Config:
        orm_mode = True

# 🔹 Чек-лист
class ChecklistOut(BaseModel):
    id: int
    title: str
    template_text: Optional[str] = None   # 🔹 текст шаблона из таблицы templates
    items: List[ChecklistItemOut] = Field(default_factory=list)

    class Config:
        orm_mode = True

# 🔹 Отчёт
class ReportIn(BaseModel):
    user_id: int
    checklist_id: int
    date_of_incident: Optional[str] = None
    flight_number: Optional[str] = None
    place: Optional[str] = None
    time_of_incident: Optional[str] = None
    checked_item_ids: List[int] = Field(default_factory=list)
    comment: Optional[str] = None
