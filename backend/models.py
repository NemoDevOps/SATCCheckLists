from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship, declarative_base
import datetime

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    telegram_id = Column(String, nullable=True)
    password = Column(String, nullable=False)  # stored in plain text per requirement

    reports = relationship("Report", back_populates="user")


class Template(Base):
    __tablename__ = "templates"

    templates_id = Column(Integer, primary_key=True)
    text = Column(Text, nullable=False)

    checklists = relationship("Checklist", back_populates="template")


class Checklist(Base):
    __tablename__ = "checklists"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    templates_id = Column(Integer, ForeignKey("templates.templates_id"))  # 🔹 связь с templates

    items = relationship("ChecklistItem", back_populates="checklist")
    reports = relationship("Report", back_populates="checklist")
    template = relationship("Template", back_populates="checklists")  # 🔹 объект Template


class ChecklistItem(Base):
    __tablename__ = "checklist_items"

    id = Column(Integer, primary_key=True)
    checklist_id = Column(Integer, ForeignKey("checklists.id"), nullable=False)
    position = Column(Integer, nullable=False)  # order
    text = Column(Text, nullable=False)

    checklist = relationship("Checklist", back_populates="items")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    checklist_id = Column(Integer, ForeignKey("checklists.id"))
    date_of_incident = Column(String, nullable=True)
    flight_number = Column(String, nullable=True)
    place = Column(String, nullable=True)
    time_of_incident = Column(String, nullable=True)
    items_checked_count = Column(Integer, default=0)
    total_items = Column(Integer, default=0)
    completed = Column(Boolean, default=False)
    comment = Column(Text, nullable=True)
    date_report = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="reports")
    checklist = relationship("Checklist", back_populates="reports")
