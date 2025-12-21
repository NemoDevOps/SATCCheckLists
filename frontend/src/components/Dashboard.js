import React, { useEffect, useState } from "react";
import { fetchChecklists } from "../api";

export default function Dashboard({ user, onOpenChecklist }) {
  const [cls, setCls] = useState([]);

  useEffect(() => {
    fetchChecklists().then(setCls);
  }, []);

  const isDeveloper = (u) => {
    if (!u) return false;
    const name = (u.name || "").toString();
    const login = (u.login || "").toString();
    return name === "Developer" || login === "Developer";
  };

  const allowedForUser = (checklist, u) => {
    if (!u) return true; // if no user, show all
    if (isDeveloper(u)) return true;

    const title = (checklist.title || "").toString().trim();
    const upTitle = title.toUpperCase();

    // match trailing 3-letter suffix (Cyrillic or Latin) if present
    const m = upTitle.match(/([A-ZА-Я]{3})$/);
    const suffix = m ? m[1] : null;

    // if no explicit suffix, checklist belongs to both
    if (!suffix) return true;

    const uname = (u.name || "").toString().toUpperCase();
    if (uname.startsWith("РПА") || uname.startsWith("СТ.ДПА")) {
      // show everything except those explicitly ending with РПР
      return suffix !== "РПР";
    }
    if (uname.startsWith("РПР") || uname.startsWith("СТ.РЦ")) {
      // show everything except those explicitly ending with РПА
      return suffix !== "РПА";
    }

    // default: show
    return true;
  };

  const visible = cls.filter(c => allowedForUser(c, user));

  return (
    <div className="dashboard">
      <h2>📋 Чек-листы</h2>
      {visible.map(c => (
        <button key={c.id} onClick={() => onOpenChecklist(c.id)}>
          {c.title}
        </button>
      ))}
    </div>
  );
}
