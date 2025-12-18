import React, { useEffect, useState } from "react";
import { fetchChecklists } from "../api";

export default function Dashboard({ user, onOpenChecklist }) {
  const [cls, setCls] = useState([]);

  useEffect(() => {
    fetchChecklists().then(setCls);
  }, []);

  return (
    <div className="dashboard">
      <h2>📋 Чек-листы</h2>
      {cls.map(c => (
        <button key={c.id} onClick={() => onOpenChecklist(c.id)}>
          {c.title}
        </button>
      ))}
    </div>
  );
}
