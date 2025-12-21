// Разработчик Багиров Артем - artem.bagirov777@gmail.com
import React, { useState, useEffect, useCallback } from "react";
import { fetchUsers, login, voiceLogin } from "../api";
import "./LoginSelect.css";

export default function LoginSelect({ onLogin }) {
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [listening, setListening] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [voiceOnly, setVoiceOnly] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'recognized'
  
  const filteredUsers = React.useMemo(() => {
    if (filter === "all") return users;
    if (filter === "vushka") {
      return users.filter(u => u.name.startsWith("РПА") || u.name.startsWith("Ст.ДПА"));
    }
    if (filter === "zal") {
      return users.filter(u => u.name.startsWith("РПР") || u.name.startsWith("Ст.РЦ"));
    }
    return users;
  }, [users, filter]);

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch(err => {
        console.error("Ошибка загрузки пользователей:", err);
        setError("Не удалось загрузить пользователей");
      });
  }, []);

  const handleLogin = useCallback(async () => {
    if (!userId || !password) {
      setError("Выберите пользователя и введите пароль.");
      return;
    }
    setError("");
    try {
      await login(Number(userId), password);
      const user = users.find(u => u.id === Number(userId));
      onLogin(user);
    } catch (e) {
      setError(e.detail || "Ошибка ввода пароля");
    }
  }, [userId, password, users, onLogin]);

  // Voice recognition: listens for spoken 4-digit password (digits only)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
    if (!SpeechRecognition) {
      setRecognitionSupported(false);
      return;
    }
    setRecognitionSupported(true);
    const recog = new SpeechRecognition();
    recog.lang = 'ru-RU';
    recog.interimResults = false;
    recog.maxAlternatives = 1;
    recog.maxSpeechStart = 5000; // 5 секунд максимум до начала речи
    recog.speechEndSilenceTime = 1000; // 1 секунда тишины = конец

    recog.onresult = async (event) => {
      // Отменить таймаут, т.к. получен результат
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      const text = event.results[0][0].transcript || '';
      const digits = text.replace(/[^0-9]/g, '');
      setVoiceStatus('processing');
      
      if (digits.length >= 4) {
        const pin = digits.slice(-4); // Берем последние 4 цифры
        setPassword(pin);
        setVoiceStatus('recognized');
        
        try {
          const user = await voiceLogin(pin);
          if (user && user.id) {
            // Найден пользователь, подставляем данные и логинимся
            setUserId(String(user.id));
            setPassword(pin);
            // Вызываем логин с новыми данными напрямую
            await login(Number(user.id), pin);
            onLogin(user);
          } else {
            setError('❌ Пароль не найден. Попробуйте еще раз.');
            setVoiceStatus('idle');
          }
        } catch (err) {
          setError('❌ ' + (err.detail || 'Ошибка голосовой авторизации'));
          setVoiceStatus('idle');
        }
      } else {
        setError('⚠️ Распознано меньше 4 цифр (услышано: ' + digits + '). Повторите попытку.');
        setVoiceStatus('idle');
      }
      active = false;
      setListening(false);
      setVoiceOnly(false);
    };

    recog.onerror = (e) => {
      // Отменить таймаут при ошибке
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      let errorMsg = 'Ошибка распознавания: ' + (e.error || 'unknown');
      if (e.error === 'not-allowed') {
        errorMsg = '❌ Доступ к микрофону запрещён. Разрешите доступ в настройках браузера (кнопка с иконкой микрофона в адресной строке)';
      } else if (e.error === 'no-speech') {
        errorMsg = '⚠️ Микрофон не обнаружил речь. Убедитесь, что микрофон включен и говорите четче. Попробуйте снова.';
      } else if (e.error === 'network') {
        errorMsg = '❌ Ошибка сети. Проверьте ваше интернет-соединение и попробуйте снова.';
      } else if (e.error === 'audio-capture') {
        errorMsg = '❌ Микрофон недоступен или не подключен.';
      }
      setError(errorMsg);
      setListening(false);
      active = false;
      setVoiceStatus('idle');
    };

    // attach to ref on demand via startListening
    let active = false;
    let timeoutId = null;
    
    const startListening = () => {
      if (active) return;
      try {
        recog.start();
        active = true;
        setListening(true);
        setVoiceStatus('listening');
        
        // Автоматический стоп через 3 секунды
        timeoutId = setTimeout(() => {
          try {
            recog.stop();
          } catch (e) {}
          active = false;
          setListening(false);
          if (voiceStatus === 'listening') {
            setVoiceStatus('idle');
            setError('⚠️ Время прослушивания истекло (3 сек). Попробуйте снова.');
          }
        }, 3000);
      } catch (e) {
        // Если попытаемся запустить, когда уже запущено
        active = false;
        setListening(false);
        setVoiceStatus('idle');
        setError('⚠️ Микрофон уже слушает. Дождитесь завершения.');
      }
    };

    // expose startListening via window for this component scope
    (window).__startVoiceLogin = startListening;

    return () => {
      try { recog.stop(); } catch (e) {}
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      active = false;
      (window).__startVoiceLogin = null;
    };
  }, [onLogin, users]);

  const triggerVoice = useCallback(() => {
    setError('');

    if (!recognitionSupported) {
      setError('Распознавание речи не поддерживается в этом браузере');
      return;
    }
    
    // Проверяем и запрашиваем разрешение на микрофон
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        // Разрешение есть, можно начинать слушать
        stream.getTracks().forEach(track => track.stop()); // Останавливаем трек, чтобы индикатор микрофона погас
        setVoiceOnly(true);
        if (window.__startVoiceLogin) {
          window.__startVoiceLogin();
        } else {
          setError('Ошибка инициализации распознавания речи');
        }
      })
      .catch(err => {
        // Ошибка или отказ в доступе
        console.error("Ошибка доступа к микрофону:", err);
        setError('❌ Доступ к микрофону запрещён. Разрешите доступ в настройках браузера.');
      });
  }, [recognitionSupported]);

  return (
    <div className="login-container">
      <h2>🔑 Вход</h2>

      <div className="filter-buttons">
        <button 
          className={`filter-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => { setFilter("all"); setUserId(""); }}
        >
          Все
        </button>
        <button 
          className={`filter-btn ${filter === "vushka" ? "active" : ""}`}
          onClick={() => { setFilter("vushka"); setUserId(""); }}
        >
          Вышка
        </button>
        <button 
          className={`filter-btn ${filter === "zal" ? "active" : ""}`}
          onClick={() => { setFilter("zal"); setUserId(""); }}
        >
          Зал
        </button>
      </div>

      <select value={userId} onChange={e => setUserId(e.target.value)}>
        <option value="">Выберите пользователя</option>
        {filteredUsers.map(user => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>

      <div className="input-row">
        <input
          type="password"
          placeholder="Пароль (4 цифры)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          maxLength={4}
          pattern="[0-9]*"
          inputMode="numeric"
        />
        <button 
          className={`mic-btn mic-${voiceStatus}`}
          onClick={triggerVoice} 
          title={voiceStatus === 'listening' ? 'Слушаю... говорите в микрофон' : 'Ввести пароль голосом'}
          disabled={voiceStatus === 'listening' || voiceStatus === 'processing'}
        >
          {voiceStatus === 'listening' && '🎤📢'}
          {voiceStatus === 'processing' && '⏳'}
          {voiceStatus === 'recognized' && '✅'}
          {voiceStatus === 'idle' && '🎤'}
        </button>
      </div>
      {voiceStatus !== 'idle' && (
        <div style={{ textAlign: 'center', fontSize: '0.9em', marginBottom: '10px', color: '#666' }}>
          {voiceStatus === 'listening' && '🔴 Микрофон активен...'}
          {voiceStatus === 'processing' && '⏳ Обработка речи...'}
          {voiceStatus === 'recognized' && '✅ Распознано!'}
        </div>
      )}

      {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}

      <button onClick={handleLogin}>Войти</button>
    </div>
  );
}
