import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from "socket.io-client";

// Initialize the socket outside to prevent dirty multi-reconnection loops
const socket = io("https://ghost-typer-backend.onrender.com");

// --- EXPANDED MULTI-TIER DICTIONARY MATRIX ---
const DICTIONARIES: Record<string, Record<'easy' | 'medium' | 'hard', string[]>> = {
  en: {
    easy: ["the", "be", "to", "of", "and", "a", "in", "that", "have", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time", "no", "just", "him", "know", "take", "people", "into", "year", "your", "good", "some"],
    medium: ["config", "infrastructure", "connection", "telemetry", "algorithm", "bandwidth", "interface", "workspace", "synchronize", "deployment", "repository", "compiler", "variable", "function", "database", "analytics", "parameter", "framework", "component", "protocol", "security", "terminal", "authentication", "encryption", "optimization", "constructor", "payload", "operational"],
    hard: ["anachronistic", "sesquipedalian", "idiosyncratic", "juxtaposition", "quintessential", "ephemeral", "obfuscation", "paradigmatic", "phenomenological", "hermeneutic", "cacophony", "recalcitrant", "solipsism", "vicissitude", "perfunctory", "ubiquitous", "magnanimous", "acquiesce", "capricious", "nefarious", "ostentatious", "sycophant", "amalgamate"]
  },
  es: {
    easy: ["el", "la", "de", "que", "y", "a", "en", "un", "ser", "se", "no", "haber", "por", "con", "su", "para", "como", "estar", "tener", "le", "lo", "todo", "pero", "más", "hacer", "o", "poder", "decir", "este", "ir", "otro", "ese", "si", "me", "ya", "ver", "porque", "dar", "cuando", "él", "muy", "sin", "vez", "mucho", "saber", "qué", "sobre", "mi", "alguno", "mismo"],
    medium: ["configuracion", "infraestructura", "conexion", "telemetria", "algoritmo", "interfaz", "despliegue", "repositorio", "compilador", "variable", "funciones", "servidor", "autenticacion", "encriptacion", "optimizacion", "protocolo", "terminal", "computadora", "desarrollo", "arquitectura", "sincronizar", "rendimiento", "analitica", "matriz"],
    hard: ["anacronico", "idiosincrasia", "yuxtaposicion", "quintaesencia", "efimero", "ofuscacion", "paradigmatico", "cacofonia", "recalcitrante", "solipsismo", "vicisitud", "perentorio", "ubicuidad", "magnanimo", "aquiescencia", "caprichoso", "nefario", "ostentoso", "sicofante", "amalgama", "esquizofrenico", "ventrilocuo"]
  },
  de: {
    easy: ["der", "die", "und", "in", "den", "von", "zu", "das", "mit", "sich", "des", "auf", "für", "ist", "im", "dem", "nicht", "ein", "eine", "als", "auch", "es", "an", "werden", "aus", "er", "hat", "dass", "sie", "nach", "wird", "bei", "einer", "um", "am", "sind", "noch", "wie", "einem", "über", "einen", "so", "zum", "war", "haben", "nur", "oder"],
    medium: ["konfiguration", "infrastruktur", "verbindung", "telemetrie", "algorithmus", "schnittstelle", "arbeitsbereich", "bereitstellung", "datenbank", "parameter", "protokoll", "sicherheit", "authentifizierung", "verschluesselung", "optimierung", "anwendung", "entwicklung", "komponente", "speicherverwaltung", "netzwerkstrom"],
    hard: ["anachronistisch", "idiosynkratisch", "nebeneinanderstellung", "quintessenz", "vergaenglich", "verschleierung", "paradigmatisch", "hermeneutisch", "kakophonie", "widerspenstig", "solipsismus", "wienerisch", "pflichtbewusst", "allgegenwaertig", "grossmuetig", "launenhaft", "nefariös", "prahlerisch", "sycophant", "verschmelzen"]
  },
  fr: {
    easy: ["le", "la", "de", "et", "les", "des", "en", "un", "une", "que", "est", "il", "pour", "qui", "dans", "a", "par", "plus", "pas", "au", "sur", "ne", "se", "ce", "sont", "cas", "pouvoir", "faire", "lui", "être", "ou", "comme", "avec", "tout", "son", "sa", "fait", "nous", "mais", "ils", "aux", "same", "si", "bien", "elle", "on", "peut", "ces"],
    medium: ["configuration", "infrastructure", "connexion", "telemetrie", "algorithme", "interface", "deploiement", "repertoire", "compilateur", "variable", "fonction", "donnees", "protocole", "securite", "authentification", "chiffrement", "optimisation", "composant", "application", "terminal", "environnement", "architecture"],
    hard: ["anachronique", "idiosyncrasie", "juxtaposition", "quintessence", "ephemere", "obfuscation", "paradigmatique", "hermeneutique", "cacophonie", "recalcitrant", "solipsisme", "vicissitude", "peremptoire", "ubiquite", "magnanime", "acquiescer", "capricieux", "nefaste", "ostentatoire", "sycophante", "amalgamer"]
  }
};

interface HistoryLog {
  id: string;
  wpm: number;
  accuracy: number;
  mode: string;
  date: string;
  errors: number;
}

export default function App() {
  // --- CORE ENGINE STATE ---
  const [targetText, setTargetText] = useState<string>("loading system core configuration...");
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [actualMistakes, setActualMistakes] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpmTimeline, setWpmTimeline] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isTypingActive, setIsTypingActive] = useState<boolean>(false);

  // --- GRANULAR INDIVIDUAL COLOR STATES ---
  const [colorBg, setColorBg] = useState<string>("#0a0f1d");
  const [colorText, setColorText] = useState<string>("#94a3b8");
  const [colorAccent, setColorAccent] = useState<string>("#22d3ee");
  const [colorCaret, setColorCaret] = useState<string>("#22d3ee");

  // --- ADVANCED CONFIGURATION STATE ---
  const [activeTab, setActiveTab] = useState<'none' | 'settings' | 'credits' | 'copyright' | 'history' | 'multiplayer'>('none');
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [bgOpacity, setBgOpacity] = useState<number>(20);
  const [bgBlur, setBgBlur] = useState<number>(4);
  const [caretStyle, setCaretStyle] = useState<'block' | 'line' | 'underline'>('block');
  const [soundProfile, setSoundProfile] = useState<'none' | 'mx-brown' | 'thock' | 'clicky'>('mx-brown');
  const [textSize, setTextSize] = useState<'text-lg' | 'text-xl' | 'text-2xl'>('text-xl');
  const [showLiveStats, setShowLiveStats] = useState<boolean>(true);
  const [fontFamily, setFontFamily] = useState<'font-mono' | 'font-sans' | 'font-serif'>('font-mono');
  
  // --- MULTIPLAYER ROOM ENGINE ---
  const [roomCode, setRoomCode] = useState<string>("");
  const [inputCode, setInputCode] = useState<string>("");
  const [opponentIndex, setOpponentIndex] = useState<number>(0);
  const [multiplayerStatus, setMultiplayerStatus] = useState<string>("Standalone Stream");
  
  // --- MODIFIERS & EXPANDED MODES ---
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [modifier, setModifier] = useState<'none' | 'sudden-death' | 'blind'>('none');
  const [textSource, setTextSource] = useState<'random' | 'coherent' | 'custom'>('random');
  const [language, setLanguage] = useState<'en' | 'es' | 'de' | 'fr'>('en');
  const [testMode, setTestMode] = useState<'time' | 'words' | 'custom'>('time');
  const [timeLimit, setTimeLimit] = useState<number>(30);
  const [wordLimit, setWordLimit] = useState<number>(25);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [customInputText, setCustomInputText] = useState<string>("");
  const [history, setHistory] = useState<HistoryLog[]>([]);
  const [rawInputBuffer, setRawInputBuffer] = useState<string>("");

  // --- ANALYTICS SCOREBOARD ---
  const [finalWpm, setFinalWpm] = useState<number>(0);
  const [finalAccuracy, setFinalAccuracy] = useState<number>(100);
  const [consistencyScore, setConsistencyScore] = useState<number>(95);
  const [burstSpeed, setBurstSpeed] = useState<number>(0);
  const [rawWpmScore, setRawWpmScore] = useState<number>(0);
  const [finalErrorsLog, setFinalErrorsLog] = useState<number>(0);

  const timelineInterval = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // --- NETWORKING LOGIC ROOM RECEPTORS ---
  useEffect(() => {
    socket.on("room-created", (code: string) => {
      setRoomCode(code);
      setMultiplayerStatus(`Host Profile: Room ${code}`);
    });

    socket.on("room-joined", (code: string) => {
      setRoomCode(code);
      setMultiplayerStatus(`Linked Profile: Room ${code}`);
    });

    socket.on("update-opponent", (index: number) => {
      setOpponentIndex(index);
    });

    socket.on("match-reset-triggered", () => {
      forceLocalReset();
    });

    return () => {
      socket.off("room-created");
      socket.off("room-joined");
      socket.off("update-opponent");
      socket.off("match-reset-triggered");
    };
  }, []);

  const createPrivateRoom = () => {
    const generatedCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    socket.emit("create-room", generatedCode);
  };

  const joinPrivateRoom = () => {
    if (inputCode.trim()) {
      socket.emit("join-room", inputCode.trim().toUpperCase());
    }
  };

  const updateMyProgress = (newIndex: number) => {
    if (roomCode) {
      socket.emit("typed", { roomCode, index: newIndex });
    } else {
      socket.emit("typed", newIndex);
    }
  };

  const triggerNextMatchForAll = () => {
    if (roomCode) {
      socket.emit("request-match-reset", roomCode);
    } else {
      forceLocalReset();
    }
  };

  // --- DATASTACK ENGINE ---
  useEffect(() => {
    const saved = localStorage.getItem('ghost_typer_vault_v6');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  // --- TIME LIMIT TICKER ---
  useEffect(() => {
    let timer: any;
    if (isTypingActive && testMode === 'time' && timeLeft > 0 && !isFinished) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            triggerTestCompletion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTypingActive, testMode, timeLeft, isFinished]);

  // --- GRAPH METRIC BUFFER ---
  useEffect(() => {
    if (startTime && !isFinished && isTypingActive) {
      timelineInterval.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000 / 60;
        if (elapsed > 0) {
          const currentWpm = Math.round((currentIndex / 5) / elapsed);
          setWpmTimeline(prev => [...prev, currentWpm]);
        }
      }, 1000);
    } else {
      if (timelineInterval.current) clearInterval(timelineInterval.current);
    }
    return () => { if (timelineInterval.current) clearInterval(timelineInterval.current); };
  }, [startTime, isFinished, currentIndex, isTypingActive]);

  // --- METRIC COMPLIANCE ENGINE ---
  const calculateComprehensiveMetrics = useCallback((overrideEndTime?: number) => {
    if (!startTime) return;
    const finalTime = overrideEndTime || Date.now();
    const totalMinutes = (finalTime - startTime) / 1000 / 60;
    const totalTypedLength = rawInputBuffer.length;
    const realCorrectChars = Math.max(0, totalTypedLength - actualMistakes);

    const calculatedWpm = Math.max(0, Math.round((realCorrectChars / 5) / (totalMinutes || 0.01)));
    const calculatedRawWpm = Math.max(0, Math.round((totalTypedLength / 5) / (totalMinutes || 0.01)));
    
    setFinalWpm(calculatedWpm);
    setRawWpmScore(calculatedRawWpm);
    setFinalErrorsLog(actualMistakes);

    const totalKeys = totalTypedLength || 1;
    const adjustedAccuracy = Math.min(100, Math.max(0, Math.round((realCorrectChars / totalKeys) * 100)));
    setFinalAccuracy(adjustedAccuracy);

    setBurstSpeed(Math.round(calculatedWpm * 1.25));
    setConsistencyScore(Math.max(10, Math.round(100 - (actualMistakes * 1.5))));

    const matchLog: HistoryLog = {
      id: Math.random().toString(36).substring(2, 8).toUpperCase(),
      wpm: calculatedWpm,
      accuracy: adjustedAccuracy,
      errors: actualMistakes,
      mode: `${testMode.toUpperCase()} (${difficulty.toUpperCase()})`,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setHistory(prev => {
      const updated = [matchLog, ...prev].slice(0, 30);
      localStorage.setItem('ghost_typer_vault_v6', JSON.stringify(updated));
      return updated;
    });
  }, [startTime, rawInputBuffer, actualMistakes, testMode, difficulty]);

  const triggerTestCompletion = useCallback(() => {
    setIsFinished(true);
    setIsTypingActive(false);
    calculateComprehensiveMetrics();
  }, [calculateComprehensiveMetrics]);

  const fetchCoherentQuote = async () => {
    try {
      const res = await fetch('https://dummyjson.com/quotes/random');
      const data = await res.json();
      return data.quote.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    } catch (e) {
      return "the communication system fallback generated an alternative localized phrase sequence";
    }
  };

  // --- SEAMLESS ENGINE RESET REBUILDS ---
  const forceLocalReset = useCallback(async () => {
    setCurrentIndex(0);
    setActualMistakes(0);
    setStartTime(null);
    setWpmTimeline([]);
    setIsFinished(false);
    setIsTypingActive(false);
    setRawInputBuffer("");
    setFinalWpm(0);
    setFinalAccuracy(100);
    setRawWpmScore(0);
    setBurstSpeed(0);
    setFinalErrorsLog(0);
    setOpponentIndex(0);

    const pool = DICTIONARIES[language]?.[difficulty] || DICTIONARIES['en']['medium'];

    if (textSource === 'coherent') {
      setTargetText("fetching satellite data string...");
      const text = await fetchCoherentQuote();
      setTargetText(text);
      setTimeLeft(testMode === 'time' ? timeLimit : 0);
    } else if (textSource === 'random') {
      if (testMode === 'time') {
        setTimeLeft(timeLimit);
        const block = Array.from({ length: 180 }).map(() => pool[Math.floor(Math.random() * pool.length)]).join(' ');
        setTargetText(block);
      } else {
        setTimeLeft(0);
        const block = Array.from({ length: wordLimit }).map(() => pool[Math.floor(Math.random() * pool.length)]).join(' ');
        setTargetText(block);
      }
    } else {
      setTimeLeft(0);
      setTargetText(customInputText.trim() || "no custom language string parameters detected");
    }
  }, [testMode, timeLimit, wordLimit, customInputText, language, textSource, difficulty]);

  useEffect(() => {
    forceLocalReset();
  }, [forceLocalReset, testMode, timeLimit, wordLimit, language, textSource, difficulty]);

  // --- TERMINAL ENTRY INTERCEPTOR ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        forceLocalReset();
        return;
      }
      if (isFinished || activeTab !== 'none') return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        if (currentIndex > 0) {
          const prevIdx = currentIndex - 1;
          setCurrentIndex(prevIdx);
          setRawInputBuffer(prev => prev.slice(0, -1));
          updateMyProgress(prevIdx);
        }
        return;
      }

      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;

      e.preventDefault();
      setIsTypingActive(true);

      const targetChar = targetText[currentIndex];
      const isCorrect = e.key === targetChar;

      if (soundProfile !== 'none') simulateAudioFeedback();

      if (!startTime) setStartTime(Date.now());

      if (!isCorrect) {
        setActualMistakes(prev => prev + 1);
        if (modifier === 'sudden-death') {
          setIsFinished(true);
          setIsTypingActive(false);
          return;
        }
      }

      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setRawInputBuffer(prev => prev + targetChar);
      updateMyProgress(nextIndex);

      if (testMode === 'words' && nextIndex >= targetText.length) {
        setIsFinished(true);
        setIsTypingActive(false);
        setTimeout(() => calculateComprehensiveMetrics(Date.now()), 10);
      } else if (testMode === 'time' && nextIndex >= targetText.length && textSource === 'random') {
        const pool = DICTIONARIES[language][difficulty];
        setTargetText(prev => prev + " " + pool[Math.floor(Math.random() * pool.length)]);
      } else if ((testMode === 'custom' || textSource === 'coherent') && nextIndex >= targetText.length) {
        setIsFinished(true);
        setIsTypingActive(false);
        setTimeout(() => calculateComprehensiveMetrics(Date.now()), 10);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, startTime, isFinished, activeTab, soundProfile, targetText, rawInputBuffer, testMode, language, textSource, difficulty, modifier, calculateComprehensiveMetrics, forceLocalReset]);

  // --- AUDIO CONTROLLER ENGINE ---
  const simulateAudioFeedback = () => {
    if (!audioCtxRef.current) {
      const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtor();
    }
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();

    const ctx = audioCtxRef.current;
    if (!ctx || soundProfile === 'none') return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;

      if (soundProfile === 'mx-brown') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.04);
        gain.gain.setValueAtTime(0.08, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      } else if (soundProfile === 'thock') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(130, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.07);
        gain.gain.setValueAtTime(0.18, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      } else if (soundProfile === 'clicky') {
        osc.type = 'square'; osc.frequency.setValueAtTime(750, now);
        osc.frequency.exponentialRampToValueAtTime(250, now + 0.02);
        gain.gain.setValueAtTime(0.04, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      }
      osc.start(now); osc.stop(now + 0.08);
    } catch (e) {}
  };

  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => { if (ev.target?.result) setBgImage(ev.target.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const getLiveWpm = () => {
    if (!startTime) return 0;
    const elapsed = (Date.now() - startTime) / 1000 / 60;
    return elapsed > 0 ? Math.round((currentIndex / 5) / elapsed) : 0;
  };

  return (
    <div 
      className={`relative min-h-screen ${fontFamily} flex flex-col justify-between p-3 select-none overflow-x-hidden transition-all duration-200`}
      style={{ backgroundColor: colorBg, color: colorText }}
    >
      {bgImage && (
        <div 
          className="absolute inset-0 pointer-events-none transition-all duration-300"
          style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: `${bgOpacity / 100}`, filter: `blur(${bgBlur}px)`, zIndex: 0 }}
        />
      )}

      {/* --- SLEEK UNIFIED TOP BAR --- */}
      <header className={`w-full max-w-5xl mx-auto flex flex-col sm:flex-row gap-2 justify-between items-center border-b pb-1.5 z-10 text-[11px] uppercase tracking-wider opacity-90`} style={{ borderColor: `${colorText}20` }}>
        <div className="flex items-center gap-2">
          <span className="font-black text-xs tracking-widest" style={{ color: colorAccent }}>GHOST TYPER</span>
          <span className="opacity-40 text-[9px]">v2.6.4</span>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {['settings', 'multiplayer', 'history', 'credits', 'copyright'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(activeTab === tab ? 'none' : tab as any)}
              className="font-bold tracking-tight transition-all cursor-pointer"
              style={{ color: activeTab === tab ? colorAccent : colorText, opacity: activeTab === tab ? 1 : 0.6 }}
            >
              {tab === 'settings' ? '⚙️ Colors & Custom' : tab === 'multiplayer' ? '⚔️ Lobby' : tab === 'history' ? '📊 History' : tab === 'credits' ? 'Specs' : 'Legal'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] opacity-50">{multiplayerStatus}</span>
          <button onClick={() => forceLocalReset()} className="px-2 py-0.5 rounded text-[10px] border tracking-tighter" style={{ borderColor: `${colorText}30` }}>Reset [Esc]</button>
        </div>
      </header>

      {/* --- CONDENSED DASHBOARD PANELS --- */}
      {activeTab !== 'none' && !isTypingActive && (
        <div className="w-full max-w-4xl mx-auto p-4 rounded-xl border z-20 mt-2 max-h-[65vh] overflow-y-auto text-xs space-y-4 shadow-xl" style={{ backgroundColor: `${colorBg}F0`, borderColor: `${colorAccent}40` }}>
          <div className="flex justify-between items-center border-b pb-1" style={{ borderColor: `${colorText}20` }}>
            <span className="font-bold uppercase tracking-widest" style={{ color: colorAccent }}>Engine Matrix // {activeTab}</span>
            <button onClick={() => setActiveTab('none')} className="opacity-60 hover:opacity-100 font-bold">✕ Close</button>
          </div>

          {activeTab === 'multiplayer' && (
            <div className="space-y-3">
              <p className="opacity-70 text-[11px]">Generate a unique cloud channel or paste an execution code to link real-time metrics with an opponent.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border bg-black/10 space-y-2" style={{ borderColor: `${colorText}20` }}>
                  <span className="block font-bold uppercase tracking-wider" style={{ color: colorAccent }}>Host Session</span>
                  <button onClick={createPrivateRoom} className="w-full py-1.5 rounded font-bold uppercase text-[10px] tracking-widest border transition-all" style={{ backgroundColor: `${colorAccent}15`, borderColor: colorAccent, color: colorAccent }}>
                    Generate Room Code
                  </button>
                  {roomCode && (
                    <div className="text-center p-1.5 rounded font-mono text-xs tracking-widest bg-black/30 border border-dashed border-current">
                      YOUR CODE: <span className="font-black text-base">{roomCode}</span>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-lg border bg-black/10 space-y-2" style={{ borderColor: `${colorText}20` }}>
                  <span className="block font-bold uppercase tracking-wider" style={{ color: colorAccent }}>Link Active Channel</span>
                  <div className="flex gap-1">
                    <input 
                      type="text" 
                      value={inputCode} 
                      onChange={(e) => setInputCode(e.target.value)} 
                      placeholder="ENTER ROOM CODE..." 
                      className="flex-1 px-2 py-1 rounded font-mono uppercase bg-black/20 outline-none border" 
                      style={{ borderColor: `${colorText}30`, color: colorAccent }}
                    />
                    <button onClick={joinPrivateRoom} className="px-4 py-1 rounded font-bold text-[10px] uppercase border" style={{ borderColor: colorAccent, color: colorAccent }}>
                      Connect
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4">
              {/* GRANULAR INDIVIDUAL HEX COLOR CONTROLS */}
              <div>
                <span className="block font-bold uppercase tracking-wider mb-2" style={{ color: colorAccent }}>🎨 Individual Component Color Controllers</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2 rounded bg-black/10 border" style={{ borderColor: `${colorText}20` }}>
                    <label className="block text-[10px] mb-1 opacity-70">Terminal Base (BG)</label>
                    <input type="color" value={colorBg} onChange={(e) => setColorBg(e.target.value)} className="w-full h-6 rounded cursor-pointer bg-transparent" />
                  </div>
                  <div className="p-2 rounded bg-black/10 border" style={{ borderColor: `${colorText}20` }}>
                    <label className="block text-[10px] mb-1 opacity-70">Unread Stream (Text)</label>
                    <input type="color" value={colorText} onChange={(e) => setColorText(e.target.value)} className="w-full h-6 rounded cursor-pointer bg-transparent" />
                  </div>
                  <div className="p-2 rounded bg-black/10 border" style={{ borderColor: `${colorText}20` }}>
                    <label className="block text-[10px] mb-1 opacity-70">Metric Accent</label>
                    <input type="color" value={colorAccent} onChange={(e) => setColorAccent(e.target.value)} className="w-full h-6 rounded cursor-pointer bg-transparent" />
                  </div>
                  <div className="p-2 rounded bg-black/10 border" style={{ borderColor: `${colorText}20` }}>
                    <label className="block text-[10px] mb-1 opacity-70">Active Pointer (Caret)</label>
                    <input type="color" value={colorCaret} onChange={(e) => setColorCaret(e.target.value)} className="w-full h-6 rounded cursor-pointer bg-transparent" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* TEXT GENERATION LOGIC */}
                <div className="p-2.5 rounded-lg border bg-black/10" style={{ borderColor: `${colorText}20` }}>
                  <span className="block font-bold uppercase mb-1.5" style={{ color: colorAccent }}>Payload Source</span>
                  <div className="flex gap-1">
                    {['random', 'coherent', 'custom'].map((src) => (
                      <button key={src} onClick={() => setTextSource(src as any)} className="flex-1 py-1 text-[10px] font-bold uppercase border rounded" style={{ borderColor: textSource === src ? colorAccent : 'transparent', opacity: textSource === src ? 1 : 0.5 }}>{src}</button>
                    ))}
                  </div>
                </div>

                {/* LANGUAGE SYSTEM EXPANDED */}
                <div className="p-2.5 rounded-lg border bg-black/10" style={{ borderColor: `${colorText}20` }}>
                  <span className="block font-bold uppercase mb-1.5" style={{ color: colorAccent }}>Language Core</span>
                  <div className="flex gap-1">
                    {['en', 'es', 'de', 'fr'].map((lang) => (
                      <button key={lang} onClick={() => setLanguage(lang as any)} disabled={textSource !== 'random'} className="flex-1 py-1 text-[10px] font-bold uppercase border rounded disabled:opacity-20" style={{ borderColor: language === lang ? colorAccent : 'transparent', opacity: language === lang ? 1 : 0.5 }}>{lang}</button>
                    ))}
                  </div>
                </div>

                {/* OPERATIONAL DIFFICULTY LOGIC */}
                <div className="p-2.5 rounded-lg border bg-black/10" style={{ borderColor: `${colorText}20` }}>
                  <span className="block font-bold uppercase mb-1.5" style={{ color: colorAccent }}>Vocabulary Pool Tier</span>
                  <div className="flex gap-1">
                    {['easy', 'medium', 'hard'].map((d) => (
                      <button key={d} onClick={() => setDifficulty(d as any)} disabled={textSource !== 'random'} className="flex-1 py-1 text-[10px] font-bold uppercase border rounded disabled:opacity-20" style={{ borderColor: difficulty === d ? colorAccent : 'transparent', opacity: difficulty === d ? 1 : 0.5 }}>{d}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* OPERATIONAL TESTING MODE */}
                <div className="p-2.5 rounded-lg border bg-black/10" style={{ borderColor: `${colorText}20` }}>
                  <span className="block font-bold uppercase mb-1.5" style={{ color: colorAccent }}>Quantization Model</span>
                  <div className="flex gap-2 items-center">
                    {['time', 'words'].map((m) => (
                      <button key={m} onClick={() => setTestMode(m as any)} className="px-3 py-1 text-[10px] font-bold uppercase border rounded" style={{ borderColor: testMode === m ? colorAccent : 'transparent', opacity: testMode === m ? 1 : 0.5 }}>{m}</button>
                    ))}
                    {testMode === 'time' && (
                      <select value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} className="bg-black/40 px-1 py-0.5 rounded outline-none text-inherit">
                        {[15, 30, 60, 120].map(t => <option key={t} value={t}>{t}s</option>)}
                      </select>
                    )}
                    {testMode === 'words' && (
                      <select value={wordLimit} onChange={(e) => setWordLimit(Number(e.target.value))} className="bg-black/40 px-1 py-0.5 rounded outline-none text-inherit">
                        {[10, 25, 50, 100].map(w => <option key={w} value={w}>{w} words</option>)}
                      </select>
                    )}
                  </div>
                </div>

                {/* FUN RUNTIME MODIFIERS */}
                <div className="p-2.5 rounded-lg border bg-black/10" style={{ borderColor: `${colorText}20` }}>
                  <span className="block font-bold uppercase mb-1.5" style={{ color: colorAccent }}>Operational Modifier Injection</span>
                  <div className="flex gap-1">
                    {['none', 'sudden-death', 'blind'].map((mod) => (
                      <button key={mod} onClick={() => setModifier(mod as any)} className="flex-1 py-1 text-[10px] font-bold uppercase border rounded" style={{ borderColor: modifier === mod ? colorAccent : 'transparent', opacity: modifier === mod ? 1 : 0.5 }}>
                        {mod.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {textSource === 'custom' && (
                <div className="space-y-1">
                  <span className="block opacity-70 uppercase font-bold">Custom Payload Data Array</span>
                  <textarea value={customInputText} onChange={(e) => setCustomInputText(e.target.value)} placeholder="Insert custom data block arrays here..." className="w-full h-16 p-2 rounded bg-black/20 border text-xs outline-none" style={{ borderColor: `${colorText}30` }} />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* TYPOGRAPHY MODULE */}
                <div className="p-2 rounded bg-black/5 border" style={{ borderColor: `${colorText}20` }}>
                  <span className="block mb-1 font-bold opacity-70">Font Matrix</span>
                  <div className="flex gap-1">
                    {['font-mono', 'font-sans', 'font-serif'].map(f => <button key={f} onClick={() => setFontFamily(f as any)} className="flex-1 py-0.5 text-[10px] border rounded" style={{ borderColor: fontFamily === f ? colorAccent : 'transparent' }}>{f.replace('font-', '')}</button>)}
                  </div>
                </div>
                <div className="p-2 rounded bg-black/5 border" style={{ borderColor: `${colorText}20` }}>
                  <span className="block mb-1 font-bold opacity-70">Pointer Shape</span>
                  <div className="flex gap-1">
                    {['block', 'line', 'underline'].map(s => <button key={s} onClick={() => setCaretStyle(s as any)} className="flex-1 py-0.5 text-[10px] border rounded" style={{ borderColor: caretStyle === s ? colorAccent : 'transparent' }}>{s}</button>)}
                  </div>
                </div>
                <div className="p-2 rounded bg-black/5 border" style={{ borderColor: `${colorText}20` }}>
                  <span className="block mb-1 font-bold opacity-70">Audio Profile</span>
                  <select value={soundProfile} onChange={(e) => setSoundProfile(e.target.value as any)} className="w-full bg-black/30 p-0.5 rounded text-xs outline-none">
                    {['none', 'mx-brown', 'thock', 'clicky'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* BACKGROUND MATRIX SLIDERS */}
              <div className="p-2 rounded bg-black/5 border space-y-2" style={{ borderColor: `${colorText}20` }}>
                <div className="flex justify-between items-center">
                  <span className="font-bold opacity-70">Image Matrix Injector</span>
                  <input type="file" accept="image/*" onChange={handleLocalImageUpload} className="text-[10px] opacity-60" />
                </div>
                {bgImage && (
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>Opacity: {bgOpacity}% <input type="range" min="5" max="80" value={bgOpacity} onChange={(e) => setBgOpacity(Number(e.target.value))} className="w-full" /></div>
                    <div>Blur: {bgBlur}px <input type="range" min="0" max="10" value={bgBlur} onChange={(e) => setBgBlur(Number(e.target.value))} className="w-full" /></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center opacity-70 text-[10px]">
                <span>Stored Diagnostic Node Logs</span>
                <button onClick={() => { localStorage.removeItem('ghost_typer_vault_v6'); setHistory([]); }} className="text-red-400 font-bold hover:underline">Purge Vault</button>
              </div>
              {history.length === 0 ? <p className="text-center italic opacity-40 py-4">No logged runs inside active cycle.</p> : (
                <div className="overflow-x-auto max-h-[30vh]">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="border-b font-bold opacity-60" style={{ borderColor: `${colorText}30` }}>
                        <th className="pb-1">NODE ID</th><th>WPM</th><th>ACCURACY</th><th>FAULTS</th><th>CONFIGURATION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map(h => (
                        <tr key={h.id} className="border-b/10 border-current font-mono">
                          <td className="py-1 opacity-50">{h.id}</td>
                          <td className="font-bold" style={{ color: colorAccent }}>{h.wpm}</td>
                          <td>{h.accuracy}%</td>
                          <td className="text-red-400">{h.errors}</td>
                          <td className="opacity-70">{h.mode}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'credits' && (
            <div className="text-[11px] opacity-80 space-y-1 font-mono">
              <p>• Engine Architecture: Reactive Functional Data Arrays</p>
              <p>• Matrix Sync Frequency: Quantized 1000ms Loop Matrices</p>
              <p>• Distributed Infrastructure: Direct Cloud WebSockets Layer</p>
            </div>
          )}

          {activeTab === 'copyright' && (
            <p className="text-[10px] opacity-50 font-mono">© 2026 Ghost Typer Systems. Active monitoring and digital encryption layers are online.</p>
          )}
        </div>
      )}

      {/* --- CORE RUNTIME WORKSPACE --- */}
      <main className="w-full max-w-4xl mx-auto flex-1 flex flex-col justify-center my-4 z-10">
        
        {/* HEADS UP RUNTIME DATA MODULE */}
        {showLiveStats && !isFinished && isTypingActive && (
          <div className="flex gap-4 mb-3 text-[10px] font-mono uppercase tracking-wider opacity-60">
            {testMode === 'time' && <div>Time remaining: <span className="font-bold" style={{ color: colorAccent }}>{timeLeft}s</span></div>}
            <div>Current Speed: <span className="font-bold" style={{ color: colorAccent }}>{getLiveWpm()} WPM</span></div>
            <div>Fault Arrays: <span className="font-bold text-red-400">{actualMistakes}</span></div>
            {modifier !== 'none' && <div className="text-amber-400 font-bold">MODIFIER: {modifier}</div>}
          </div>
        )}

        {/* TYPING INTERFACE STREAM PANEL */}
        {!isFinished ? (
          <div className={`relative leading-relaxed break-words tracking-wide focus:outline-none select-none p-4 rounded-xl border bg-black/5 ${textSize}`} style={{ borderColor: `${colorText}10` }}>
            
            {/* OPPONENT FLOATING AVATAR */}
            {roomCode && opponentIndex > 0 && opponentIndex <= targetText.length && (
              <span 
                className="absolute text-[9px] font-mono px-1 rounded text-white bg-red-500 font-bold transition-all duration-150 animate-pulse"
                style={{ left: `${Math.min(95, (opponentIndex / targetText.length) * 100)}%`, top: '-14px' }}
              >
                👻 Opponent
              </span>
            )}

            {modifier === 'blind' && isTypingActive ? (
              <div className="opacity-80 italic text-center text-sm py-6">Blind Modifier Enabled. Complete string execution from muscle memory memory...</div>
            ) : (
              targetText.split("").map((char, index) => {
                let styleObj: React.CSSProperties = { opacity: 0.35 };

                if (index < currentIndex) {
                  styleObj = { color: colorAccent, fontWeight: 'bold', opacity: 1 };
                } else if (index === currentIndex) {
                  styleObj = {
                    color: colorBg,
                    backgroundColor: colorCaret,
                    fontWeight: 'bold',
                    boxShadow: `0 0 4px ${colorCaret}`,
                    animation: 'pulse 1s infinite'
                  };
                  if (caretStyle === 'line') {
                    styleObj = { color: 'inherit', borderLeft: `2px solid ${colorCaret}`, paddingLeft: '1px', animation: 'pulse 1s infinite' };
                  } else if (caretStyle === 'underline') {
                    styleObj = { color: 'inherit', borderBottom: `2px solid ${colorCaret}`, animation: 'pulse 1s infinite' };
                  }
                }

                return (
                  <span key={index} style={styleObj} className="transition-all duration-700">
                    {char}
                  </span>
                );
              })
            )}
          </div>
        ) : (
          
          /* METRIC EVALUATION SUMMARY MODULE */
          <div className="p-4 rounded-xl border space-y-4 shadow-2xl animate-scaleUp" style={{ backgroundColor: `${colorBg}E6`, borderColor: colorAccent }}>
            <div className="border-b pb-2" style={{ borderColor: `${colorText}20` }}>
              <h2 className="text-base font-black uppercase tracking-widest" style={{ color: colorAccent }}>Execution Diagnostics Complete</h2>
              <p className="text-[10px] opacity-50 font-mono">Telemetry database updated across cloud profiles.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
              <div className="p-2 bg-black/20 rounded border" style={{ borderColor: `${colorText}10` }}>
                <span className="block text-[9px] uppercase opacity-50">Net Velocity</span>
                <span className="text-xl font-black" style={{ color: colorAccent }}>{finalWpm} <span className="text-[10px]">WPM</span></span>
              </div>
              <div className="p-2 bg-black/20 rounded border" style={{ borderColor: `${colorText}10` }}>
                <span className="block text-[9px] uppercase opacity-50">Precision Matrix</span>
                <span className="text-xl font-black">{finalAccuracy}%</span>
              </div>
              <div className="p-2 bg-black/20 rounded border" style={{ borderColor: `${colorText}10` }}>
                <span className="block text-[9px] uppercase opacity-50">Logged Faults</span>
                <span className="text-xl font-black text-red-400">{finalErrorsLog}</span>
              </div>
              <div className="p-2 bg-black/20 rounded border" style={{ borderColor: `${colorText}10` }}>
                <span className="block text-[9px] uppercase opacity-50">Burst Speed</span>
                <span className="text-xl font-black opacity-60">{rawWpmScore} <span className="text-[10px]">WPM</span></span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center text-[10px] gap-2 pt-1">
              <div className="space-y-0.5 opacity-70 font-mono text-center sm:text-left">
                <div>Consistency Diagnostic Index: <span className="font-bold">{consistencyScore}%</span></div>
                <div>Burst Energy Vector Peak: <span className="font-bold">{burstSpeed} WPM Max</span></div>
                {wpmTimeline.length > 0 && (
                  <div className="text-[9px] opacity-40 max-w-xs truncate">
                    Timeline Array Samples: {wpmTimeline.join(" → ")}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                {roomCode && (
                  <button 
                    onClick={triggerNextMatchForAll}
                    className="px-3 py-1.5 font-bold uppercase tracking-wider rounded text-[10px] border transition-all"
                    style={{ backgroundColor: `${colorAccent}20`, borderColor: colorAccent, color: colorAccent }}
                  >
                    Next Match (All Players)
                  </button>
                )}
                <button 
                  onClick={() => forceLocalReset()}
                  className="px-3 py-1.5 font-bold uppercase tracking-wider rounded text-[10px] border transition-all"
                  style={{ borderColor: `${colorText}40` }}
                >
                  New Run [Esc]
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- FOOTER STATUS NODE --- */}
      <footer className="w-full text-center text-[9px] tracking-widest uppercase opacity-30 z-10 font-mono">
        Ghost Typer Network Stream Connected • Channel Active
      </footer>
    </div>
  );
}