import React, { useState } from "react";
import { sendShiftAccept, sendShiftHandOver } from "../api";
import "./ShiftMenu.css";

export default function ShiftMenu({ user, onOpenChecklists, onLogout }) {
  const [view, setView] = useState("menu"); // menu | accept | handover
  const [acceptComment, setAcceptComment] = useState("");
  const [handoverRole, setHandoverRole] = useState("DPA");
  const [flightOut, setFlightOut] = useState(0);
  const [flightIn, setFlightIn] = useState(0);
  const [transit, setTransit] = useState(0);
  const [handoverComment, setHandoverComment] = useState("");

  const nowStr = () => new Date().toLocaleString();

  const handleAcceptNoComments = async () => {
    try {
      await sendShiftAccept({ user_id: user.id, no_comments: true });
      alert("✅ Отправлено");
      setView("menu");
      setAcceptComment("");
    } catch (e) {
      alert("❌ Ошибка отправки");
    }
  };

  const handleAcceptWithComments = async () => {
    try {
      await sendShiftAccept({ user_id: user.id, no_comments: false, comment: acceptComment });
      alert("✅ Отправлено");
      setView("menu");
      setAcceptComment("");
    } catch (e) {
      alert("❌ Ошибка отправки");
    }
  };

  const handleHandoverSubmit = async () => {
    try {
      const payload = { user_id: user.id, role: handoverRole, comment: handoverComment };
      if (handoverRole === "DPA") {
        payload.out = Number(flightOut || 0);
        payload.in = Number(flightIn || 0);
      } else {
        payload.transit = Number(transit || 0);
      }
      await sendShiftHandOver(payload);
      alert("✅ Отправлено");
      setView("menu");
      setHandoverComment("");
      setFlightOut(0);
      setFlightIn(0);
      setTransit(0);
    } catch (e) {
      alert("❌ Ошибка отправки");
    }
  };

  return (
    <div className="shift-menu">
      {view === "menu" && (
        <div className="shift-grid">
          <div className="row big-2">
            <button className="big-btn" onClick={() => setView("accept")}>ПРИЕМ ДЕЖУРСТВА</button>
            <button className="big-btn" onClick={() => setView("handover")}>СДАЧА ДЕЖУРСТВА</button>
          </div>
          <div className="row">
            <button className="wide-btn" onClick={onOpenChecklists}>ЧЕК-ЛИСТЫ</button>
          </div>
          <div className="row">
            <button className="logout-btn" onClick={onLogout}>ВЫХОД</button>
          </div>
        </div>
      )}

      {view === "accept" && (
        <div className="accept-form text-backdrop">
          <h3>Прием дежурства — {user.name}</h3>
          <p>{nowStr()}</p>
          <div className="accept-actions">
            <button className="accept-btn" onClick={handleAcceptNoComments}>ПРИНЯЛ. ЗАМЕЧАНИЙ НЕТ</button>
          </div>
          <div className="accept-comments">
            <label>ЗАМЕЧАНИЯ</label>
            <textarea value={acceptComment} onChange={e => setAcceptComment(e.target.value)} />
            <button className="accept-btn" onClick={handleAcceptWithComments}>ПРИНЯЛ. С ЗАМЕЧАНИЯМИ</button>
            <button className="back-btn" onClick={() => setView("menu")}>МЕНЮ</button>
          </div>
        </div>
      )}

      {view === "handover" && (
        <div className="handover-form text-backdrop">
          <h3>Сдача дежурства — {user.name}</h3>
          <div className="role-switch">
            <label>
              <input type="radio" checked={handoverRole === "DPA"} onChange={() => setHandoverRole("DPA")} /> ДПА
            </label>
            <label>
              <input type="radio" checked={handoverRole === "RC"} onChange={() => setHandoverRole("RC")} /> РЦ
            </label>
          </div>

          {handoverRole === "DPA" && (
            <div className="dpa-fields">
              <label>ВЫЛЕТ</label>
              <input type="number" min="0" max="1000" value={flightOut} onChange={e => setFlightOut(Math.max(0, Math.min(1000, Number(e.target.value || 0))))} />
              <label>ПРИЛЕТ</label>
              <input type="number" min="0" max="1000" value={flightIn} onChange={e => setFlightIn(Math.max(0, Math.min(1000, Number(e.target.value || 0))))} />
            </div>
          )}

          {handoverRole === "RC" && (
            <div className="rc-fields">
              <label>ТРАНЗИТ</label>
              <input type="number" min="0" max="1000" value={transit} onChange={e => setTransit(Math.max(0, Math.min(1000, Number(e.target.value || 0))))} />
            </div>
          )}

          <label>ЗАМЕЧАНИЯ</label>
          <textarea value={handoverComment} onChange={e => setHandoverComment(e.target.value)} />

          <div className="handover-actions">
            <button className="submit-btn" onClick={handleHandoverSubmit}>Смену Сдал</button>
            <button className="back-btn" onClick={() => setView("menu")}>МЕНЮ</button>
          </div>
        </div>
      )}
    </div>
  );
}
