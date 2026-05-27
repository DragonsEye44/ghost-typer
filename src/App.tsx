import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from "socket.io-client";

// --- SOCKET INITIALIZATION ---
const socket = io("https://ghost-typer-backend.onrender.com", {
  reconnectionAttempts: 3,
  timeout: 5000,
});

// --- DICTIONARY MATRIX ---
const DICTIONARIES: Record<string, Record<'easy' | 'medium' | 'hard', string[]>> = {
  en: {
    easy: ["the", "be", "to", "of", "and", "a", "in", "that", "have", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time", "no", "just", "him", "know", "take", "people", "into", "year", "your", "good", "some"],
    medium: ["config", "infrastructure", "connection", "telemetry", "algorithm", "bandwidth", "interface", "workspace", "synchronize", "deployment", "repository", "compiler", "variable", "function", "database", "analytics", "parameter", "framework", "component", "protocol", "security", "terminal", "authentication", "encryption", "optimization", "constructor", "payload", "operational"],
    hard: ["anachronistic", "sesquipedalian", "idiosyncratic", "juxtaposition", "quintessential", "ephemeral", "obfuscation", "paradigmatic", "phenomenological", "hermeneutic", "cacophony", "recalcitrant", "solipsism", "vicissitude", "perfunctory", "ubiquitous", "magnanimous", "acquiesce", "capricious", "nefarious", "ostentatious", "sycophant", "amalgamate"]
  },
  es: {
    easy: ["el", "la", "de", "que", "y", "a", "en", "un", "ser", "se", "no", "haber", "por", "con", "su", "para", "como", "estar", "tener", "le", "lo", "todo", "pero", "hacer", "o", "poder", "decir", "este", "ir", "otro", "ese", "si", "me", "ya", "ver", "porque", "dar", "cuando", "él", "muy", "sin", "vez", "mucho", "saber", "qué", "sobre", "mi", "mismo"],
    medium: ["configuracion", "infraestructura", "conexion", "telemetria", "algoritmo", "interfaz", "despliegue", "repositorio", "compilador", "variable", "funciones", "servidor", "autenticacion", "encriptacion", "optimizacion", "protocolo", "terminal", "computadora", "desarrollo", "arquitectura", "sincronizar", "rendimiento"],
    hard: ["anacronico", "idiosincrasia", "yuxtaposicion", "quintaesencia", "efimero", "ofuscacion", "paradigmatico", "cacofonia", "recalcitrante", "solipsismo", "vicisitud", "perentorio", "ubicuidad", "magnanimo", "aquiescencia", "caprichoso", "nefario", "ostentoso"]
  },
  de: {
    easy: ["der", "die", "und", "in", "den", "von", "zu", "das", "mit", "sich", "des", "auf", "für", "ist", "im", "dem", "nicht", "ein", "eine", "als", "auch", "es", "an", "werden", "aus", "er", "hat", "dass", "sie", "nach", "wird", "bei", "einer", "um", "am", "sind", "noch", "wie", "einem", "über", "einen", "so", "zum", "war", "haben", "nur", "oder"],
    medium: ["konfiguration", "infrastruktur", "verbindung", "telemetrie", "algorithmus", "schnittstelle", "arbeitsbereich", "bereitstellung", "datenbank", "parameter", "protokoll", "sicherheit", "authentifizierung", "verschluesselung", "optimierung", "anwendung", "entwicklung", "komponente"],
    hard: ["anachronistisch", "idiosynkratisch", "nebeneinanderstellung", "quintessenz", "vergaenglich", "verschleierung", "paradigmatisch", "hermeneutisch", "kakophonie", "widerspenstig", "solipsismus", "pflichtbewusst", "allgegenwaertig", "grossmuetig"]
  },
  fr: {
    easy: ["le", "la", "de", "et", "les", "des", "en", "un", "une", "que", "est", "il", "pour", "qui", "dans", "a", "par", "plus", "pas", "au", "sur", "ne", "se", "ce", "sont", "cas", "pouvoir", "faire", "lui", "être", "ou", "comme", "avec", "tout", "son", "sa", "fait", "nous", "mais", "ils", "aux", "si", "bien", "elle", "on", "peut", "ces"],
    medium: ["configuration", "infrastructure", "connexion", "telemetrie", "algorithme", "interface", "deploiement", "repertoire", "compilateur", "variable", "fonction", "donnees", "protocole", "securite", "authentification", "chiffrement", "optimisation", "composant", "application", "terminal", "environnement", "architecture"],
    hard: ["anachronique", "idiosyncrasie", "juxtaposition", "quintessence", "ephemere", "obfuscation", "paradigmatique", "hermeneutique", "cacophonie", "recalcitrant", "solipsisme", "vicissitude", "peremptoire", "ubiquite", "magnanime", "acquiescer"]
  }
};

interface HistoryLog { id: string; wpm: number; accuracy: number; mode: string; date: string; errors: number; }

export default function App() {
  // --- CORE ENGINE ---
  const [targetText, setTargetText] = useState<string>("loading clean workspace...");
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [actualMistakes, setActualMistakes] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isTypingActive, setIsTypingActive] = useState<boolean>(false);
  
  // --- NEW FEATURES ---
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [targetWpm, setTargetWpm] = useState<number>(60);
  const [pacerIndex, setPacerIndex] = useState<number>(0);
  const [soundVolume, setSoundVolume] = useState<number>(50);
  const [isServerConnected, setIsServerConnected] = useState<boolean>(false);
  const [botInterval, setBotInterval] = useState<any>(null);

  // --- COLORS & STYLING ---
  const [colorBg, setColorBg] = useState<string>("#1e1e2e");
  const [colorText, setColorText] = useState<string>("#6c7086");
  const [colorAccent, setColorAccent] = useState<string>("#cba6f7");
  const [colorCaret, setColorCaret] = useState<string>("#f38ba8");
  const [fontFamily, setFontFamily] = useState<'font-mono' | 'font-sans' | 'font-serif'>('font-mono');
  const [textSize, setTextSize] = useState<'text-xl' | 'text-2xl' | 'text-3xl' | 'text-4xl'>('text-3xl');
  const [caretStyle, setCaretStyle] = useState<'block' | 'line' | 'underline'>('line');
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [bgOpacity, setBgOpacity] = useState<number>(20);
  const [bgBlur, setBgBlur] = useState<number>(4);

  // --- SETTINGS & MODES ---
  const [activeTab, setActiveTab] = useState<'none' | 'settings' | 'multiplayer' | 'history'>('none');
  const [soundProfile, setSoundProfile] = useState<'none' | 'mx-brown' | 'thock' | 'clicky'>('thock');
  const [showLiveStats, setShowLiveStats] = useState<boolean>(true);
  
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [modifier, setModifier] = useState<'none' | 'sudden-death' | 'blind'>('none');
  const [language, setLanguage] = useState<'en' | 'es' | 'de' | 'fr'>('en');
  const [testMode, setTestMode] = useState<'time' | 'words'>('time');
  const [timeLimit, setTimeLimit] = useState<number>(30);
  const [wordLimit, setWordLimit] = useState<number>(25);
  const [timeLeft, setTimeLeft] = useState<number>(30);

  // --- MULTIPLAYER ---
  const [roomCode, setRoomCode] = useState<string>("");
  const [inputCode, setInputCode] = useState<string>("");
  const [opponentIndex, setOpponentIndex] = useState<number>(0);
  
  // --- METRICS ---
  const [finalWpm, setFinalWpm] = useState<number>(0);
  const [finalAccuracy, setFinalAccuracy] = useState<number>(100);
  const [history, setHistory] = useState<HistoryLog[]>([]);
  const [rawInputBuffer, setRawInputBuffer] = useState<string>("");

  const audioCtxRef = useRef<AudioContext | null>(null);

  // --- SOCKET CONNECTION HANDLING ---
  useEffect(() => {
    socket.on("connect", () => setIsServerConnected(true));
    socket.on("disconnect", () => setIsServerConnected(false));
    socket.on("room-created", (code: string) => setRoomCode(code));
    socket.on("room-joined", (code: string) => setRoomCode(code));
    socket.on("update-opponent", (index: number) => setOpponentIndex(index));
    socket.on("match-reset-triggered", () => forceLocalReset());

    return () => {
      socket.off("connect"); socket.off("disconnect");
      socket.off("room-created"); socket.off("room-joined");
      socket.off("update-opponent"); socket.off("match-reset-triggered");
    };
  }, []);

  const createRoom = () => socket.emit("create-room", Math.random().toString(36).substring(2, 6).toUpperCase());
  const joinRoom = () => { if (inputCode.trim()) socket.emit("join-room", inputCode.trim().toUpperCase()); };
  
  // --- OFFLINE BOT SIMULATOR ---
  const startBotOpponent = () => {
    setRoomCode("BOT-ROOM");
    setOpponentIndex(0);
    if (botInterval) clearInterval(botInterval);
  };

  useEffect(() => {
    if (roomCode === "BOT-ROOM" && isTypingActive && !isFinished) {
      const wpmVariation = targetWpm * (0.8 + Math.random() * 0.4); 
      const msPerChar = 60000 / (wpmVariation * 5);
      const interval = setInterval(() => {
        setOpponentIndex(prev => Math.min(prev + 1, targetText.length));
      }, msPerChar);
      setBotInterval(interval);
      return () => clearInterval(interval);
    }
  }, [roomCode, isTypingActive, isFinished, targetText.length, targetWpm]);

  // --- CORE LOGIC ---
  const updateMyProgress = (newIndex: number) => {
    if (roomCode && roomCode !== "BOT-ROOM") socket.emit("typed", { roomCode, index: newIndex });
  };

  useEffect(() => {
    const saved = localStorage.getItem('ghost_typer_vault');
    if (saved) { try { setHistory(JSON.parse(saved)); } catch (e) {} }
  }, []);

  // PACER & TIMERS
  useEffect(() => {
    let timer: any;
    let pacerTimer: any;

    if (isTypingActive && !isFinished) {
      // Game Timer
      if (testMode === 'time' && timeLeft > 0) {
        timer = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) { triggerTestCompletion(); return 0; }
            return prev - 1;
          });
        }, 1000);
      }
      
      // Pacer Marker Timer
      if (targetWpm > 0 && startTime) {
        pacerTimer = setInterval(() => {
          const elapsedMinutes = (Date.now() - startTime) / 60000;
          const expectedChars = Math.floor(elapsedMinutes * targetWpm * 5);
          setPacerIndex(Math.min(expectedChars, targetText.length));
        }, 100);
      }
    }
    return () => { clearInterval(timer); clearInterval(pacerTimer); };
  }, [isTypingActive, testMode, timeLeft, isFinished, targetWpm, startTime, targetText.length]);

  // MOUSE MOVEMENT FOR ZEN MODE
  useEffect(() => {
    const handleMouseMove = () => { if (isZenMode) setIsZenMode(false); };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isZenMode]);

  const triggerTestCompletion = useCallback(() => {
    setIsFinished(true);
    setIsTypingActive(false);
    setIsZenMode(false);
    if (botInterval) clearInterval(botInterval);

    const totalMinutes = (Date.now() - (startTime || Date.now())) / 60000;
    const totalTyped = rawInputBuffer.length;
    const realCorrectChars = Math.max(0, totalTyped - actualMistakes);

    const calcWpm = Math.max(0, Math.round((realCorrectChars / 5) / (totalMinutes || 0.01)));
    const calcAcc = Math.min(100, Math.max(0, Math.round((realCorrectChars / (totalTyped || 1)) * 100)));
    
    setFinalWpm(calcWpm); setFinalAccuracy(calcAcc);

    const log: HistoryLog = {
      id: Math.random().toString(36).substring(2, 8).toUpperCase(),
      wpm: calcWpm, accuracy: calcAcc, errors: actualMistakes,
      mode: `${testMode} - ${difficulty}`, date: new Date().toLocaleTimeString()
    };
    setHistory(prev => {
      const updated = [log, ...prev].slice(0, 20);
      localStorage.setItem('ghost_typer_vault', JSON.stringify(updated));
      return updated;
    });
  }, [startTime, rawInputBuffer, actualMistakes, testMode, difficulty, botInterval]);

  const forceLocalReset = useCallback(() => {
    setCurrentIndex(0); setActualMistakes(0); setStartTime(null); setIsFinished(false);
    setIsTypingActive(false); setRawInputBuffer(""); setOpponentIndex(0); setPacerIndex(0);
    if (botInterval) clearInterval(botInterval);

    const pool = DICTIONARIES[language][difficulty];
    const length = testMode === 'time' ? 150 : wordLimit;
    setTargetText(Array.from({ length }).map(() => pool[Math.floor(Math.random() * pool.length)]).join(' '));
    setTimeLeft(testMode === 'time' ? timeLimit : 0);
  }, [testMode, timeLimit, wordLimit, language, difficulty, botInterval]);

  useEffect(() => { forceLocalReset(); }, [forceLocalReset]);

  // TERMINAL INPUT
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { forceLocalReset(); setIsZenMode(false); return; }
      if (isFinished || activeTab !== 'none') return;

      if (!isTypingActive && e.key.length === 1 && !e.ctrlKey) setIsZenMode(true);

      if (e.key === 'Backspace') {
        e.preventDefault();
        if (currentIndex > 0) {
          const prev = currentIndex - 1;
          setCurrentIndex(prev); setRawInputBuffer(b => b.slice(0, -1)); updateMyProgress(prev);
        }
        return;
      }

      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
      e.preventDefault();

      setIsTypingActive(true);
      const isCorrect = e.key === targetText[currentIndex];
      simulateAudioFeedback();
      if (!startTime) setStartTime(Date.now());

      if (!isCorrect) {
        setActualMistakes(p => p + 1);
        if (modifier === 'sudden-death') { triggerTestCompletion(); return; }
      }

      const next = currentIndex + 1;
      setCurrentIndex(next); setRawInputBuffer(b => b + targetText[currentIndex]); updateMyProgress(next);

      if (next >= targetText.length) {
        if (testMode === 'words') triggerTestCompletion();
        else setTargetText(prev => prev + " " + DICTIONARIES[language][difficulty][Math.floor(Math.random() * DICTIONARIES[language][difficulty].length)]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, startTime, isFinished, activeTab, targetText, rawInputBuffer, testMode, modifier, language, difficulty, triggerTestCompletion, forceLocalReset]);

  // AUDIO
  const simulateAudioFeedback = () => {
    if (soundProfile === 'none') return;
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();

    const ctx = audioCtxRef.current;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      const now = ctx.currentTime;
      
      const volMultiplier = soundVolume / 100;

      if (soundProfile === 'mx-brown') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(280, now); osc.frequency.exponentialRampToValueAtTime(90, now + 0.04);
        gain.gain.setValueAtTime(0.08 * volMultiplier, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      } else if (soundProfile === 'thock') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(130, now); osc.frequency.exponentialRampToValueAtTime(45, now + 0.07);
        gain.gain.setValueAtTime(0.18 * volMultiplier, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      } else {
        osc.type = 'square'; osc.frequency.setValueAtTime(750, now); osc.frequency.exponentialRampToValueAtTime(250, now + 0.02);
        gain.gain.setValueAtTime(0.04 * volMultiplier, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      }
      osc.start(now); osc.stop(now + 0.08);
    } catch (e) {}
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setBgImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`relative min-h-screen ${fontFamily} flex flex-col justify-between p-6 select-none overflow-x-hidden transition-all duration-300`} style={{ backgroundColor: colorBg, color: colorText }}>
      {bgImage && <div className="absolute inset-0 pointer-events-none transition-all duration-300" style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: bgOpacity / 100, filter: `blur(${bgBlur}px)`, zIndex: 0 }} />}

      {/* HEADER */}
      <header className={`w-full max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center z-10 transition-opacity duration-500 ${isZenMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <h1 className="text-3xl font-black tracking-tighter flex items-center gap-2" style={{ color: colorAccent }}>
            GHOST <span className="opacity-50" style={{ color: colorText }}>TYPER</span>
          </h1>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: `${colorText}10` }}>
            <span className={`w-2 h-2 rounded-full ${isServerConnected ? 'bg-green-400' : 'bg-red-400 animate-pulse'}`}></span>
            {isServerConnected ? 'Live' : 'Offline'}
          </div>
        </div>

        <nav className="flex gap-6 text-sm font-bold tracking-wide">
          {['settings', 'multiplayer', 'history'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(activeTab === tab ? 'none' : tab as any)} className="hover:opacity-100 transition-colors uppercase cursor-pointer" style={{ color: activeTab === tab ? colorAccent : colorText, opacity: activeTab === tab ? 1 : 0.6 }}>
              {tab}
            </button>
          ))}
        </nav>
      </header>

      {/* SETTINGS PANELS */}
      {activeTab !== 'none' && !isZenMode && (
        <div className="w-full max-w-4xl mx-auto p-6 rounded-2xl z-20 mt-6 shadow-2xl space-y-8 backdrop-blur-md border" style={{ backgroundColor: `${colorBg}dd`, borderColor: `${colorText}20` }}>
          
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold" style={{ color: colorAccent }}>Appearance & Feel</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[{l: 'Background', v: colorBg, s: setColorBg}, {l: 'Text', v: colorText, s: setColorText}, {l: 'Accent', v: colorAccent, s: setColorAccent}, {l: 'Caret', v: colorCaret, s: setColorCaret}].map(c => (
                  <div key={c.l} className="flex flex-col gap-2">
                    <label className="text-xs uppercase font-bold opacity-60">{c.l} Color</label>
                    <input type="color" value={c.v} onChange={(e) => c.s(e.target.value)} className="w-full h-10 rounded cursor-pointer bg-transparent border-none" />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t" style={{ borderColor: `${colorText}20` }}>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold opacity-60">Typography & Font</label>
                  <div className="flex gap-2 mb-2">
                    {['text-xl', 'text-2xl', 'text-3xl', 'text-4xl'].map(s => (
                      <button key={s} onClick={() => setTextSize(s as any)} className="flex-1 py-1 rounded text-xs font-bold border cursor-pointer" style={{ borderColor: textSize === s ? colorAccent : 'transparent', backgroundColor: `${colorText}10` }}>{s.replace('text-', '')}</button>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    {(['font-mono', 'font-sans', 'font-serif'] as const).map(f => (
                      <button key={f} onClick={() => setFontFamily(f)} className="flex-1 py-1 rounded text-[10px] font-bold border cursor-pointer" style={{ borderColor: fontFamily === f ? colorAccent : 'transparent', backgroundColor: `${colorText}05` }}>{f.replace('font-', '')}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold opacity-60">Caret Style</label>
                  <div className="flex gap-2">
                    {['block', 'line', 'underline'].map(s => (
                      <button key={s} onClick={() => setCaretStyle(s as any)} className="flex-1 py-2 rounded text-sm font-bold border cursor-pointer" style={{ borderColor: caretStyle === s ? colorAccent : 'transparent', backgroundColor: `${colorText}10` }}>{s}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold opacity-60 flex justify-between">Audio Volume <span>{soundVolume}%</span></label>
                  <input type="range" min="0" max="100" value={soundVolume} onChange={e => setSoundVolume(Number(e.target.value))} className="w-full mt-1" />
                  <select value={soundProfile} onChange={(e) => setSoundProfile(e.target.value as any)} className="w-full p-2 rounded text-sm border-none outline-none cursor-pointer" style={{ backgroundColor: `${colorText}10`, color: colorText }}>
                    {['none', 'mx-brown', 'thock', 'clicky'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <h2 className="text-xl font-bold pt-4 border-t" style={{ color: colorAccent, borderColor: `${colorText}20` }}>Game Mechanics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold opacity-60">Mode & Limits</label>
                  <div className="flex gap-2 mb-2">
                    {['time', 'words'].map(m => (
                      <button key={m} onClick={() => setTestMode(m as any)} className="flex-1 py-2 rounded text-sm font-bold border cursor-pointer" style={{ borderColor: testMode === m ? colorAccent : 'transparent', backgroundColor: `${colorText}10` }}>{m}</button>
                    ))}
                  </div>
                  <select value={testMode === 'time' ? timeLimit : wordLimit} onChange={(e) => testMode === 'time' ? setTimeLimit(Number(e.target.value)) : setWordLimit(Number(e.target.value))} className="w-full p-2 rounded text-sm outline-none cursor-pointer" style={{ backgroundColor: `${colorText}10`, color: colorText }}>
                    {testMode === 'time' ? [15, 30, 60, 120].map(t => <option key={t} value={t}>{t} Seconds</option>) : [10, 25, 50, 100].map(w => <option key={w} value={w}>{w} Words</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold opacity-60">Dictionary & Modifiers</label>
                  <div className="flex flex-col gap-2">
                    <select value={language} onChange={(e) => setLanguage(e.target.value as any)} className="w-full p-1.5 rounded text-xs outline-none cursor-pointer" style={{ backgroundColor: `${colorText}10`, color: colorText }}>
                      {['en', 'es', 'de', 'fr'].map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
                    </select>
                    <div className="flex gap-1">
                      {['easy', 'medium', 'hard'].map(d => (
                        <button key={d} onClick={() => setDifficulty(d as any)} className="flex-1 py-1 rounded text-[10px] font-bold border cursor-pointer" style={{ borderColor: difficulty === d ? colorAccent : 'transparent', backgroundColor: `${colorText}10` }}>{d}</button>
                      ))}
                    </div>
                    <div className="flex gap-1 mt-1">
                      {(['none', 'sudden-death', 'blind'] as const).map(m => (
                        <button key={m} onClick={() => setModifier(m)} className="flex-1 py-1 rounded text-[9px] font-bold border cursor-pointer truncate" style={{ borderColor: modifier === m ? colorAccent : 'transparent', backgroundColor: `${colorText}05` }}>{m.replace('-', ' ')}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold opacity-60 flex justify-between">Ghost Pacer Target <span>{targetWpm} WPM</span></label>
                  <input type="range" min="0" max="200" step="10" value={targetWpm} onChange={(e) => setTargetWpm(Number(e.target.value))} className="w-full" />
                  
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs uppercase font-bold opacity-60">Show Live HUD</span>
                    <input type="checkbox" checked={showLiveStats} onChange={e => setShowLiveStats(e.target.checked)} className="cursor-pointer accent-current" />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: `${colorText}20` }}>
                 <div className="space-y-1">
                   <label className="text-xs uppercase font-bold opacity-60">Custom Background Frame</label>
                   <input type="file" accept="image/*" onChange={handleImageUpload} className="block text-xs" />
                 </div>
                 {bgImage && (
                   <div className="grid grid-cols-2 gap-3 text-[11px]">
                     <div>Opacity: {bgOpacity}% <input type="range" min="5" max="90" value={bgOpacity} onChange={e => setBgOpacity(Number(e.target.value))} className="w-full" /></div>
                     <div>Blur: {bgBlur}px <input type="range" min="0" max="15" value={bgBlur} onChange={e => setBgBlur(Number(e.target.value))} className="w-full" /></div>
                   </div>
                 )}
              </div>
            </div>
          )}

          {activeTab === 'multiplayer' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold" style={{ color: colorAccent }}>Multiplayer Lobby</h2>
              {!isServerConnected && (
                <div className="p-4 rounded border text-sm bg-red-500/10 border-red-500/30 text-red-400">
                  <strong>Warning:</strong> Sourcing link configuration error. Cloud channel parameters non-responsive. Real-time racing is disabled. You can test elements natively inside the Offline Bot array below.
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl border space-y-4" style={{ borderColor: `${colorText}20`, backgroundColor: `${colorText}05` }}>
                  <h3 className="font-bold text-lg">Host a Match</h3>
                  <p className="text-sm opacity-70">Create a room and share the code.</p>
                  <button onClick={createRoom} disabled={!isServerConnected} className="w-full py-3 rounded font-bold uppercase transition-all disabled:opacity-30 cursor-pointer" style={{ backgroundColor: colorAccent, color: colorBg }}>Generate Code</button>
                  {roomCode && roomCode !== "BOT-ROOM" && <div className="text-center p-3 rounded font-mono text-xl tracking-widest font-black border" style={{ borderColor: colorAccent }}>{roomCode}</div>}
                </div>
                <div className="p-6 rounded-xl border space-y-4" style={{ borderColor: `${colorText}20`, backgroundColor: `${colorText}05` }}>
                  <h3 className="font-bold text-lg">Join a Match</h3>
                  <p className="text-sm opacity-70">Enter a friend's 4-letter code.</p>
                  <div className="flex gap-2">
                    <input type="text" value={inputCode} onChange={e => setInputCode(e.target.value)} disabled={!isServerConnected} placeholder="CODE" className="flex-1 px-4 rounded font-mono uppercase text-lg border outline-none" style={{ backgroundColor: `${colorBg}`, borderColor: `${colorText}30`, color: colorAccent }} />
                    <button onClick={joinRoom} disabled={!isServerConnected} className="px-6 rounded font-bold uppercase border cursor-pointer" style={{ borderColor: colorAccent, color: colorAccent }}>Join</button>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t text-center" style={{ borderColor: `${colorText}20` }}>
                <h3 className="font-bold text-lg mb-2">Practice Offline</h3>
                <p className="text-sm opacity-70 mb-4">Spawn an AI opponent that types near your Target WPM ({targetWpm} WPM).</p>
                <button onClick={startBotOpponent} className="px-8 py-3 rounded-xl font-bold uppercase border cursor-pointer" style={{ borderColor: colorCaret, color: colorCaret }}>Start Bot Match</button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
               <div className="flex justify-between">
                  <h2 className="text-xl font-bold" style={{ color: colorAccent }}>Your Statistics</h2>
                  <button onClick={() => {localStorage.removeItem('ghost_typer_vault'); setHistory([]);}} className="text-xs font-bold text-red-400 hover:underline cursor-pointer">Clear History</button>
               </div>
               <div className="grid grid-cols-4 gap-4 text-sm font-bold opacity-60 border-b pb-2" style={{ borderColor: `${colorText}20` }}>
                 <div>WPM</div><div>Accuracy</div><div>Mode</div><div>Date</div>
               </div>
               {history.map(h => (
                 <div key={h.id} className="grid grid-cols-4 gap-4 text-sm py-2 border-b" style={{ borderColor: `${colorText}10` }}>
                   <div style={{ color: colorAccent }} className="font-bold">{h.wpm}</div>
                   <div>{h.accuracy}%</div>
                   <div className="opacity-70">{h.mode}</div>
                   <div className="opacity-50 text-xs">{h.date}</div>
                 </div>
               ))}
            </div>
          )}
        </div>
      )}

      {/* TYPING AREA */}
      <main className="w-full max-w-5xl mx-auto flex-1 flex flex-col justify-center py-10 z-10">
        
        {/* HUD */}
        {!isFinished && showLiveStats && (
          <div className={`flex gap-6 mb-6 text-xl font-bold transition-opacity duration-500 ${isZenMode ? 'opacity-0' : 'opacity-100'}`} style={{ color: colorAccent }}>
            {testMode === 'time' && <div>{timeLeft}s</div>}
            {testMode === 'words' && <div>{currentIndex} / {targetText.length}</div>}
            {modifier !== 'none' && <div className="text-amber-400 uppercase text-sm flex items-center">{modifier}</div>}
          </div>
        )}

        {!isFinished ? (
          <div className={`relative leading-relaxed break-words tracking-wide outline-none ${textSize}`}>
            
            {/* OPPONENT MARKER */}
            {roomCode && opponentIndex > 0 && opponentIndex <= targetText.length && (
              <span className="absolute text-sm px-2 py-1 rounded bg-red-500 text-white font-bold transition-all duration-200 shadow-lg z-20" style={{ left: `${Math.min(95, (opponentIndex / targetText.length) * 100)}%`, top: '-35px' }}>
                {roomCode === "BOT-ROOM" ? '🤖 AI' : '👻 Opponent'}
              </span>
            )}

            {modifier === 'blind' && isTypingActive ? (
              <div className="text-center italic opacity-50 py-10">Blind Mode active. Type from memory.</div>
            ) : (
              targetText.split("").map((char, index) => {
                let styleObj: React.CSSProperties = { color: colorText, opacity: 0.4 }; 

                if (index < currentIndex) {
                  styleObj = { color: colorText, opacity: 1 }; 
                }
                
                if (index === currentIndex) {
                  styleObj = { color: colorText, opacity: 1 };
                  if (caretStyle === 'block') styleObj = { backgroundColor: `${colorCaret}40`, color: colorCaret, borderRadius: '4px' };
                  else if (caretStyle === 'line') styleObj = { borderLeft: `3px solid ${colorCaret}` };
                  else if (caretStyle === 'underline') styleObj = { borderBottom: `3px solid ${colorCaret}` };
                }

                const isPacer = targetWpm > 0 && index === pacerIndex && index > currentIndex;

                return (
                  <span 
                    key={index} 
                    style={{ ...styleObj, borderBottomColor: isPacer ? colorText : undefined }} 
                    className={`relative transition-all duration-100 ${isPacer ? 'border-b-2 border-dashed' : ''}`}
                  >
                    {char}
                  </span>
                );
              })
            )}
          </div>
        ) : (
          /* RESULTS SCREEN */
          <div className="flex flex-col items-center justify-center space-y-8 animate-fadeIn">
            <div className="text-center space-y-2">
              <h2 className="text-6xl font-black" style={{ color: colorAccent }}>{finalWpm} <span className="text-2xl opacity-50">WPM</span></h2>
              <div className="text-2xl font-bold opacity-80">{finalAccuracy}% Accuracy</div>
            </div>
            
            <div className="flex gap-4 text-sm font-bold opacity-60">
              <div>Keystrokes: {rawInputBuffer.length}</div>
              <div>Errors: <span className="text-red-400">{actualMistakes}</span></div>
              <div>Mode: {testMode} {testMode === 'time' ? timeLimit : wordLimit}</div>
            </div>

            <div className="flex gap-4 pt-8">
              <button onClick={forceLocalReset} className="px-8 py-3 rounded-xl font-bold text-lg border hover:bg-white/5 transition-colors cursor-pointer" style={{ borderColor: colorText }}>
                Next Test (Tab / Esc)
              </button>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className={`w-full text-center text-xs opacity-40 font-bold uppercase tracking-widest pb-4 transition-opacity duration-500 ${isZenMode ? 'opacity-0' : 'opacity-100'}`}>
        Tab/Esc to reset • {isZenMode ? 'Zen Mode Active' : 'Start Typing to Focus'}
      </footer>
    </div>
  );
}