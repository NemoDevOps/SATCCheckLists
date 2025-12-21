import React, { useEffect, useState } from "react";
import { fetchChecklist, submitReport } from "../api";
import "./ChecklistPlayer.css";

export default function ChecklistPlayer({ user, checklistId, onDone }) {
  const [checklist, setChecklist] = useState(null);
  const [index, setIndex] = useState(0);
  const [checkedIds, setCheckedIds] = useState([]);
  const [comment, setComment] = useState("");
  const [showTemplate, setShowTemplate] = useState(false);
  const [meta, setMeta] = useState({
    date_of_incident: "",
    flight_number: "",
    place: "",
    time_of_incident: ""
  });

  const [reportTime, setReportTime] = useState("");

  useEffect(() => {
    fetchChecklist(checklistId).then(data => {
      setChecklist(data);
      setReportTime(new Date().toISOString().slice(0, 16)); // YYYY-MM-DDTHH:mm
    });
    setIndex(0);
    setCheckedIds([]);
    setComment("");
    setShowTemplate(false);
  }, [checklistId]);

  if (!checklist) return <div className="loading">Загрузка чек-листа...</div>;

  const items = checklist.items;
  const current = items[index];
  const progress = Math.round((checkedIds.length / items.length) * 100);
  const skippedItems = items.filter(item => !checkedIds.includes(item.id)).map(item => item.text);

  const markChecked = (id) => {
    if (!checkedIds.includes(id)) setCheckedIds([...checkedIds, id]);
  };

  const uncheck = (id) => {
    setCheckedIds(checkedIds.filter(i => i !== id));
  };

  const skip = () => setIndex(i => Math.min(items.length - 1, i + 1));
  const back = () => setIndex(i => Math.max(0, i - 1));
  const toggleTemplate = () => setShowTemplate(prev => !prev);

  const onNextAfterCheck = () => {
    markChecked(current.id);
    if (index < items.length - 1) setIndex(index + 1);
  };

  const handleSubmit = async () => {
    if (!meta.date_of_incident || !meta.time_of_incident) {
      alert("✋ Укажите дату и время события");
      return;
    }

    const payload = {
      user_id: user.id,
      checklist_id: checklist.id,
      date_of_incident: meta.date_of_incident,
      flight_number: meta.flight_number,
      place: meta.place,
      time_of_incident: meta.time_of_incident,
      checked_item_ids: checkedIds,
      comment,
      report_time: reportTime
    };

    try {
      await submitReport(payload);
      alert("✅ Отчёт успешно отправлен");
      onDone();
    } catch (e) {
      alert("❌ Ошибка отправки: " + (e.detail || e.message));
    }
  };

  const handleMenuClick = () => {
    onDone('menu');
  };

  const handleExitClick = () => {
    onDone('exit');
  };

  return (
    <div className="checklist-player">
      <div className="text-backdrop">
        <h2>{checklist.title}</h2>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
          <span className="progress-text">{progress}% выполнено</span>
        </div>
      </div>

      <div className="checklist-item text-backdrop">
        <strong>Пункт {index + 1} / {items.length}</strong>
        <p>{current.text}</p>
      </div>

      <div className="checklist-controls">
        <button onClick={back}>◀ НАЗАД</button>
        <button onClick={skip}>▶ ДАЛЕЕ</button>
      </div>

      <div className="checklist-controls">
        <button onClick={onNextAfterCheck}>✅ ВЫПОЛНЕНО</button>
        <button onClick={() => uncheck(current.id)}>⛔ ОТМЕНИТЬ</button>
      </div>

      <div className="checklist-template">
        <button onClick={toggleTemplate}>📄 ШАБЛОН</button>
        {showTemplate && (
          <div className="template-text text-backdrop">
            <p>🔹 Шаблон для чек-листа: {checklist.title}</p>
            <p>{checklist.template_text || "❌ Шаблон отсутствует"}</p>
          </div>
        )}
      </div>

      {index === items.length - 1 && (
        <div className="report-form text-backdrop">
          <h4>📋 Форма отчёта</h4>
          <input type="text" placeholder="✈️ Рейс" value={meta.flight_number} onChange={e => setMeta({ ...meta, flight_number: e.target.value })} />
          <input type="text" placeholder="📍 Район/Зона" value={meta.place} onChange={e => setMeta({ ...meta, place: e.target.value })} />
          <input type="date" value={meta.date_of_incident} onChange={e => setMeta({ ...meta, date_of_incident: e.target.value })} />
          <input type="time" value={meta.time_of_incident} onChange={e => setMeta({ ...meta, time_of_incident: e.target.value })} />
          <textarea placeholder="💬 Комментарий" value={comment} onChange={e => setComment(e.target.value)} />
          <div className="report-buttons">
            <button onClick={handleSubmit} className="submit-btn">📤 Отправить отчёт</button>
          </div>
        </div>
      )}

      <div className="bottom-buttons text-backdrop">
        <button onClick={handleMenuClick} className="menu-btn">📋 МЕНЮ</button>
        <button onClick={handleExitClick} className="exit-btn">🚪 ВЫХОД</button>
      </div>

      <div className="checklist-status text-backdrop">
        <p>✅ Отмечено: {checkedIds.length} / {items.length}</p>
        <p>🕒 Заполнено: {reportTime.replace("T", " ")}</p>
        {skippedItems.length > 0 && (
          <p>⚠️ Пропущено: {skippedItems.join(", ")}</p>
        )}
      </div>
    </div>
  );
}
