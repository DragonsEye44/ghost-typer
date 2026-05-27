import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from "socket.io-client";

// --- SOCKET INITIALIZATION ---
let socket = io("https://ghost-typer-backend.onrender.com", {
  reconnectionAttempts: 5,
  timeout: 5000,
  autoConnect: true
});

// --- DICTIONARY MATRIX (Adjusted Medium to be much easier) ---
const DICTIONARIES: Record<string, Record<'easy' | 'medium' | 'hard', string[]>> = {
  en: {
    easy: ["the", "be", "to", "of", "and", "a", "in", "that", "have", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time", "no", "just", "him", "know", "take", "people", "into", "year", "your", "good", "some"],
    medium: ["garden", "flight", "simple", "player", "window", "stream", "coffee", "school", "active", "nature", "forest", "planet", "guitar", "bright", "yellow", "market", "bridge", "travel", "winter", "summer", "autumn", "spring", "honest", "purple", "orange", "monkey", "banana", "bottle", "camera", "danger", "island", "shadow", "silver", "pocket"],
    hard: ["anachronistic", "sesquipedalian", "idiosyncratic", "juxtaposition", "quintessential", "ephemeral", "obfuscation", "paradigmatic", "phenomenological", "hermeneutic", "cacophony", "recalcitrant", "solipsism", "vicissitude", "perfunctory", "ubiquitous", "magnanimous", "acquiesce", "capricious", "nefarious", "ostentatious", "sycophant", "amalgamate"]
  },
  es: {
    easy: ["el", "la", "de", "que", "y", "a", "en", "un", "ser", "se", "no", "haber", "por", "con", "su", "para", "como", "estar", "tener", "le", "lo", "todo", "pero", "hacer", "o", "poder", "decir", "este", "ir", "otro", "ese", "si", "me", "ya", "ver", "porque", "dar", "cuando", "él", "muy", "sin", "vez", "mucho", "saber", "qué", "sobre", "mi", "mismo"],
    medium: ["jardin", "vuelo", "simple", "jugador", "ventana", "cafe", "escuela", "activo", "guitarra", "brillante", "amarillo", "mercado", "puente", "viajar", "invierno", "verano", "otono", "honesto", "morado", "naranja", "platano", "botella", "camara", "peligro", "isla", "sombra", "plata", "bolsillo", "madera", "viento"],
    hard: ["anacronico", "idiosincrasia", "yuxtaposicion", "quintaesencia", "efimero", "ofuscacion", "paradigmatico", "cacofonia", "recalcitrante", "solipsismo", "vicisitud", "perentorio", "ubicuidad", "magnanimo", "aquiescencia", "caprichoso", "nefario", "ostentoso"]
  }
};

// --- COHERENT TEXT POOL ---
const COHERENT_TEXTS: Record<string, string[]> = {
  en: [
    "The split-screen test interface allows local typing practice without any remote socket handshakes.",
    "A quick brown fox jumps over the lazy dog while the mechanical keyboard thocks quietly in the dark room.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts in the long run.",
    "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment."
  ],
  es: [
    "El exito no es el final, el fracaso no es fatal: lo que realmente cuenta es el valor para continuar avanzando.",
    "El veloz murcielago hindu comia feliz cardillo y algarroba durante las noches estrelladas de verano.",
    "Ser uno mismo en un mundo que constantemente intenta convertirte en otra persona es el mayor de los logros."
  ]
};

// --- THEME PRESETS ---
const THEMES = [
  { name: 'Catppuccin', bg: '#1e1e2e', text: '#6c7086', accent: '#cba6f7', caret: '#f38ba8' },
  { name: 'Cyberpunk', bg: '#000b19', text: '#00ffcc', accent: '#ff0055', caret: '#ffff00' },
  { name: 'Matrix', bg: '#030703', text: '#105010', accent: '#00ff00', caret: '#ffffff' },
  { name: 'Minimal Dark', bg: '#121212', text: '#666666', accent: '#ffffff', caret: '#ffffff' }
];

interface HistoryLog { id: string; wpm: number; accuracy: number; mode: string; date: string; errors: number; }

export default function App() {
  // --- CORE ENGINE ---
  const [targetText, setTargetText] = useState<string>("loading clean workspace...");
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [actualMistakes, setActualMistakes] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isTypingActive, setIsTypingActive] = useState<boolean>(false);
  
  // --- OPTIONS & ENGINE MODES ---
  const [textSourceType, setTextSourceType] = useState<'dictionary' | 'coherent' | 'custom'>('dictionary');
  const [customInputText, setCustomInputText] = useState<string>("Type or paste your custom training lines right here...");
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [targetWpm, setTargetWpm] = useState<number>(60);
  const [pacerIndex, setPacerIndex] = useState<number>(0);
  const [soundVolume, setSoundVolume] = useState<number>(50);
  const [isServerConnected, setIsServerConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [botInterval, setBotInterval] = useState<any>(null);

  // --- STYLING STATES ---
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

  // --- SETTINGS MODALS ---
  const [activeTab, setActiveTab] = useState<'none' | 'settings' | 'multiplayer' | 'history'>('none');
  const [soundProfile, setSoundProfile] = useState<'none' | 'mx-brown' | 'thock' | 'clicky'>('thock');
  const [showLiveStats, setShowLiveStats] = useState<boolean>(true);
  
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [modifier, setModifier] = useState<'none' | 'sudden-death' | 'blind'>('none');
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [testMode, setTestMode] = useState<'time' | 'words'>('time');
  const [timeLimit, setTimeLimit] = useState<number>(30);
  const [wordLimit, setWordLimit] = useState<number>(25);
  const [timeLeft, setTimeLeft] = useState<number>(30);

  // --- MULTIPLAYER ELEMENTS ---
  const [roomCode, setRoomCode] = useState<string>("");
  const [inputCode, setInputCode] = useState<string>("");
  const [opponentIndex, setOpponentIndex] = useState<number>(0);
  const [isLocalSplitScreen, setIsLocalSplitScreen] = useState<boolean>(false);
  const [localPlayer2Index, setLocalPlayer2Index] = useState<number>(0);
  
  // --- ANALYTICS STORAGE ---
  const [finalWpm, setFinalWpm] = useState<number>(0);
  const [finalAccuracy, setFinalAccuracy] = useState<number>(100);
  const [history, setHistory] = useState<HistoryLog[]>([]);
  const [rawInputBuffer, setRawInputBuffer] = useState<string>("");

  const audioCtxRef = useRef<AudioContext | null>(null);

  // --- SERVER CONNECTION ENGINE ---
  const checkConnectionStatus = useCallback(() => {
    setIsServerConnected(socket.connected);
  }, []);

  useEffect(() => {
    socket.on("connect", () => { setIsServerConnected(true); setIsConnecting(false); });
    socket.on("disconnect", () => setIsServerConnected(false));
    socket.on("room-created", (code: string) => setRoomCode(code));
    socket.on("room-joined", (code: string) => setRoomCode(code));
    socket.on("update-opponent", (index: number) => setOpponentIndex(index));
    socket.on("match-reset-triggered", () => forceLocalReset());

    const interval = setInterval(checkConnectionStatus, 2000);
    return () => {
      socket.off("connect"); socket.off("disconnect");
      socket.off("room-created"); socket.off("room-joined");
      socket.off("update-opponent"); socket.off("match-reset-triggered");
      clearInterval(interval);
    };
  }, [checkConnectionStatus]);

  const wakeServerChannel = () => {
    setIsConnecting(true);
    socket.disconnect();
    socket.connect();
    setTimeout(() => { checkConnectionStatus(); setIsConnecting(false); }, 4000);
  };

  const createRoom = () => socket.emit("create-room", Math.random().toString(36).substring(2, 6).toUpperCase());
  const joinRoom = () => { if (inputCode.trim()) socket.emit("join-room", inputCode.trim().toUpperCase()); };
  
  const startBotOpponent = () => {
    setIsLocalSplitScreen(false);
    setRoomCode("BOT-ROOM");
    setOpponentIndex(0);
    if (botInterval) clearInterval(botInterval);
  };

  const startLocalSplitScreen = () => {
    setRoomCode("");
    setIsLocalSplitScreen(true);
    setLocalPlayer2Index(0);
    forceLocalReset();
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

  // --- CORE ENGINE LOGIC ---
  const updateMyProgress = (newIndex: number) => {
    if (roomCode && roomCode !== "BOT-ROOM") socket.emit("typed", { roomCode, index: newIndex });
  };

  useEffect(() => {
    const saved = localStorage.getItem('ghost_typer_vault');
    if (saved) { try { setHistory(JSON.parse(saved)); } catch (e) {} }
  }, []);

  useEffect(() => {
    let timer: any;
    let pacerTimer: any;

    if (isTypingActive && !isFinished) {
      if (testMode === 'time' && timeLeft > 0) {
        timer = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) { triggerTestCompletion(); return 0; }
            return prev - 1;
          });
        }, 1000);
      }
      
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
      mode: `${textSourceType} - ${difficulty}`, date: new Date().toLocaleTimeString()
    };
    setHistory(prev => {
      const updated = [log, ...prev].slice(0, 20);
      localStorage.setItem('ghost_typer_vault', JSON.stringify(updated));
      return updated;
    });
  }, [startTime, rawInputBuffer, actualMistakes, textSourceType, difficulty, botInterval]);

  const forceLocalReset = useCallback(() => {
    setCurrentIndex(0); setActualMistakes(0); setStartTime(null); setIsFinished(false);
    setIsTypingActive(false); setRawInputBuffer(""); setOpponentIndex(0); setPacerIndex(0);
    setLocalPlayer2Index(0);
    if (botInterval) clearInterval(botInterval);

    if (textSourceType === 'custom') {
      setTargetText(customInputText.trim() || "No custom setup entered.");
    } else if (textSourceType === 'coherent') {
      const pool = COHERENT_TEXTS[language] || COHERENT_TEXTS['en'];
      setTargetText(pool[Math.floor(Math.random() * pool.length)]);
    } else {
      const pool = DICTIONARIES[language][difficulty];
      const length = testMode === 'time' ? 120 : wordLimit;
      setTargetText(Array.from({ length }).map(() => pool[Math.floor(Math.random() * pool.length)]).join(' '));
    }
    setTimeLeft(testMode === 'time' ? timeLimit : 0);
  }, [testMode, timeLimit, wordLimit, language, difficulty, textSourceType, customInputText, botInterval]);

  useEffect(() => { forceLocalReset(); }, [forceLocalReset]);

  // --- KEYBOARD LISTENER ENGINE ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // FIX: Stop engine from hijacking text input and textareas fields!
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        if (e.key === 'Escape') (e.target as HTMLElement).blur();
        return; 
      }

      if (e.key === 'Escape') { forceLocalReset(); setIsZenMode(false); return; }
      if (isFinished || activeTab !== 'none') return;

      // Handle split screen secondary keyboard layout tracking
      if (isLocalSplitScreen) {
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          // If player 2 types character match
          if (e.key === targetText[localPlayer2Index]) {
            const nextP2 = localPlayer2Index + 1;
            setLocalPlayer2Index(nextP2);
            if (nextP2 >= targetText.length) triggerTestCompletion();
          }
        }
      }

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
        if (testMode === 'words' || textSourceType !== 'dictionary') triggerTestCompletion();
        else setTargetText(prev => prev + " " + DICTIONARIES[language][difficulty][Math.floor(Math.random() * DICTIONARIES[language][difficulty].length)]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, startTime, isFinished, activeTab, targetText, rawInputBuffer, testMode, modifier, language, difficulty, textSourceType, isLocalSplitScreen, localPlayer2Index, triggerTestCompletion, forceLocalReset]);

  // --- AUDIO SYNTH ENGINE ---
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

  const applyThemePreset = (theme: typeof THEMES[0]) => {
    setColorBg(theme.bg);
    setColorText(theme.text);
    setColorAccent(theme.accent);
    setColorCaret(theme.caret);
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
          <button onClick={wakeServerChannel} className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all">
            <span className={`w-2 h-2 rounded-full ${isServerConnected ? 'bg-green-400' : 'bg-red-400 animate-pulse'}`}></span>
            {isServerConnected ? 'Live' : isConnecting ? 'Connecting...' : 'Offline (Click to Wake)'}
          </button>
        </div>

        <nav className="flex gap-6 text-sm font-bold tracking-wide">
          {['settings', 'multiplayer', 'history'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(activeTab === tab ? 'none' : tab as any)} className="hover:opacity-100 transition-colors uppercase cursor-pointer" style={{ color: activeTab === tab ? colorAccent : colorText, opacity: activeTab === tab ? 1 : 0.6 }}>
              {tab}
            </button>
          ))}
        </nav>
      </header>

      {/* UNIFIED DESIGN SETTINGS MODAL */}
      {activeTab !== 'none' && !isZenMode && (
        <div className="w-full max-w-4xl mx-auto p-6 rounded-2xl z-20 mt-6 shadow-2xl space-y-8 backdrop-blur-md border text-sm" style={{ backgroundColor: `${colorBg}dd`, borderColor: `${colorText}20` }}>
          
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold mb-3" style={{ color: colorAccent }}>Theme Presets Quick-Switch</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {THEMES.map(t => (
                    <button key={t.name} onClick={() => applyThemePreset(t)} className="p-2 rounded text-sm font-semibold border cursor-pointer hover:opacity-80 transition-all text-center" style={{ backgroundColor: t.bg, color: t.text, borderColor: `${t.accent}40` }}>
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4" style={{ borderColor: `${colorText}20` }}>
                <h2 className="text-lg font-bold mb-3" style={{ color: colorAccent }}>Custom Style Controls</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[{l: 'Background', v: colorBg, s: setColorBg}, {l: 'Text', v: colorText, s: setColorText}, {l: 'Accent', v: colorAccent, s: setColorAccent}, {l: 'Caret', v: colorCaret, s: setColorCaret}].map(c => (
                    <div key={c.l} className="flex flex-col gap-2">
                      <label className="text-sm uppercase font-bold opacity-70 tracking-wider">{c.l}</label>
                      <input type="color" value={c.v} onChange={(e) => c.s(e.target.value)} className="w-full h-10 rounded cursor-pointer bg-transparent border-none" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t" style={{ borderColor: `${colorText}20` }}>
                <div className="space-y-2">
                  <label className="text-sm uppercase font-bold opacity-70 tracking-wider">Font Options</label>
                  <div className="flex gap-2 mb-2">
                    {['text-xl', 'text-2xl', 'text-3xl', 'text-4xl'].map(s => (
                      <button key={s} onClick={() => setTextSize(s as any)} className="flex-1 py-2 rounded text-sm font-semibold border cursor-pointer" style={{ borderColor: textSize === s ? colorAccent : 'transparent', backgroundColor: `${colorText}10` }}>{s.replace('text-', '')}</button>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    {(['font-mono', 'font-sans', 'font-serif'] as const).map(f => (
                      <button key={f} onClick={() => setFontFamily(f)} className="flex-1 py-1 rounded text-sm font-semibold border cursor-pointer" style={{ borderColor: fontFamily === f ? colorAccent : 'transparent', backgroundColor: `${colorText}05` }}>{f.replace('font-', '')}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm uppercase font-bold opacity-70 tracking-wider">Caret Style</label>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      {['block', 'line', 'underline'].map(s => (
                        <button key={s} onClick={() => setCaretStyle(s as any)} className="flex-1 py-2 rounded text-sm font-semibold border cursor-pointer" style={{ borderColor: caretStyle === s ? colorAccent : 'transparent', backgroundColor: `${colorText}10` }}>{s}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm uppercase font-bold opacity-70 tracking-wider flex justify-between">Audio Feedback <span>{soundVolume}%</span></label>
                  <input type="range" min="0" max="100" value={soundVolume} onChange={e => setSoundVolume(Number(e.target.value))} className="w-full" />
                  <select value={soundProfile} onChange={(e) => setSoundProfile(e.target.value as any)} className="w-full p-2 rounded text-sm border-none outline-none cursor-pointer bg-white/5" style={{ color: colorText }}>
                    {['none', 'mx-brown', 'thock', 'clicky'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t" style={{ borderColor: `${colorText}20` }}>
                <h2 className="text-lg font-bold" style={{ color: colorAccent }}>Content Setup Modes</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm uppercase font-bold opacity-70 tracking-wider">Source Generation</label>
                    <div className="flex flex-col gap-1">
                      {([['dictionary', 'Standard Matrix'], ['coherent', 'Fluent Paragraphs'], ['custom', 'Custom Paste Window']] as const).map(([k, label]) => (
                        <button key={k} onClick={() => setTextSourceType(k)} className="w-full text-left p-2 rounded border text-sm font-semibold cursor-pointer" style={{ borderColor: textSourceType === k ? colorAccent : 'transparent', backgroundColor: `${colorText}10` }}>{label}</button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm uppercase font-bold opacity-70 tracking-wider">Dictionary Metrics</label>
                    <select value={language} onChange={(e) => setLanguage(e.target.value as any)} className="w-full p-2 rounded text-sm outline-none cursor-pointer bg-white/5 mb-1" style={{ color: colorText }}>
                      {['en', 'es'].map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
                    </select>
                    <div className="flex gap-1">
                      {['easy', 'medium', 'hard'].map(d => (
                        <button key={d} onClick={() => setDifficulty(d as any)} className="flex-1 py-1 rounded text-sm font-semibold border cursor-pointer" style={{ borderColor: difficulty === d ? colorAccent : 'transparent', backgroundColor: `${colorText}10` }}>{d}</button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm uppercase font-bold opacity-70 tracking-wider flex justify-between">Pacer Setup <span>{targetWpm} WPM</span></label>
                    <input type="range" min="0" max="200" step="10" value={targetWpm} onChange={(e) => setTargetWpm(Number(e.target.value))} className="w-full" />
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-sm uppercase font-bold opacity-70">Live Tracker UI</span>
                      <input type="checkbox" checked={showLiveStats} onChange={e => setShowLiveStats(e.target.checked)} className="cursor-pointer" />
                    </div>
                  </div>
                </div>

                {textSourceType === 'custom' && (
                  <div className="space-y-2 pt-2 animate-fadeIn">
                    <label className="text-sm uppercase font-bold opacity-70 tracking-wider">Input Custom Workspace Lines</label>
                    <textarea value={customInputText} onChange={e => setCustomInputText(e.target.value)} className="w-full h-24 p-3 rounded-xl border font-mono text-sm outline-none bg-transparent" style={{ borderColor: `${colorText}40`, color: colorAccent }} />
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: `${colorText}20` }}>
                 <div className="space-y-1">
                   <label className="text-sm uppercase font-bold opacity-70 tracking-wider">Upload Desktop Canvas Wallpapers</label>
                   <input type="file" accept="image/*" onChange={handleImageUpload} className="block text-sm" />
                 </div>
                 {bgImage && (
                   <div className="grid grid-cols-2 gap-3 text-sm">
                     <div>Opacity: {bgOpacity}% <input type="range" min="5" max="90" value={bgOpacity} onChange={e => setBgOpacity(Number(e.target.value))} className="w-full" /></div>
                     <div>Blur: {bgBlur}px <input type="range" min="0" max="15" value={bgBlur} onChange={e => setBgBlur(Number(e.target.value))} className="w-full" /></div>
                   </div>
                 )}
              </div>
            </div>
          )}

          {activeTab === 'multiplayer' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold" style={{ color: colorAccent }}>Matchmaking Array Hub</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl border space-y-4 shadow-sm" style={{ borderColor: `${colorText}20`, backgroundColor: `${colorText}05` }}>
                  <h3 className="font-bold text-sm uppercase tracking-wider text-white">Cloud Room Host</h3>
                  <p className="text-sm opacity-70">Create a remote room session on the web network cluster backend.</p>
                  <button onClick={createRoom} disabled={!isServerConnected} className="w-full py-3 rounded-xl font-bold uppercase transition-all disabled:opacity-30 cursor-pointer text-sm" style={{ backgroundColor: colorAccent, color: colorBg }}>Generate Code Matrix</button>
                  {roomCode && roomCode !== "BOT-ROOM" && <div className="text-center p-3 rounded-xl font-mono text-xl tracking-widest font-black border" style={{ borderColor: colorAccent }}>{roomCode}</div>}
                </div>

                <div className="p-6 rounded-xl border space-y-4 shadow-sm" style={{ borderColor: `${colorText}20`, backgroundColor: `${colorText}05` }}>
                  <h3 className="font-bold text-sm uppercase tracking-wider text-white">Join Active Channel</h3>
                  <p className="text-sm opacity-70">Input your friend's 4-character node access authorization code string.</p>
                  <div className="flex gap-2">
                    <input type="text" value={inputCode} onChange={e => setInputCode(e.target.value)} disabled={!isServerConnected} placeholder="CODE" className="flex-1 px-4 rounded-xl font-mono uppercase text-sm border outline-none bg-transparent" style={{ borderColor: `${colorText}30`, color: colorAccent }} />
                    <button onClick={joinRoom} disabled={!isServerConnected} className="px-6 rounded-xl font-bold uppercase border cursor-pointer text-sm" style={{ borderColor: colorAccent, color: colorAccent }}>Join Match</button>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t text-center space-y-4" style={{ borderColor: `${colorText}20` }}>
                <h3 className="font-bold text-sm uppercase tracking-wider text-white">Zero Handshake Offline Alternatives</h3>
                <p className="text-sm opacity-70 max-w-xl mx-auto">Skip remote network requirements completely with local engine arrays.</p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <button onClick={startBotOpponent} className="px-6 py-3 rounded-xl font-bold uppercase border cursor-pointer text-sm" style={{ borderColor: colorCaret, color: colorCaret }}>Spawn Target Bot Match</button>
                  <button onClick={startLocalSplitScreen} className="px-6 py-3 rounded-xl font-bold uppercase border cursor-pointer text-sm" style={{ borderColor: colorAccent, color: colorAccent }}>Local Split-Screen Arena</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
               <div className="flex justify-between">
                  <h2 className="text-lg font-bold" style={{ color: colorAccent }}>Analytics Logs Vault</h2>
                  <button onClick={() => {localStorage.removeItem('ghost_typer_vault'); setHistory([]);}} className="text-sm font-bold text-red-400 hover:underline cursor-pointer">Purge History Cache</button>
               </div>
               <div className="grid grid-cols-4 gap-4 text-sm font-bold opacity-60 border-b pb-2" style={{ borderColor: `${colorText}20` }}>
                 <div>WPM</div><div>Accuracy</div><div>Mode Layout</div><div>Timestamp</div>
               </div>
               {history.map(h => (
                 <div key={h.id} className="grid grid-cols-4 gap-4 text-sm py-2 border-b" style={{ borderColor: `${colorText}10` }}>
                   <div style={{ color: colorAccent }} className="font-bold">{h.wpm}</div>
                   <div>{h.accuracy}%</div>
                   <div className="opacity-70 truncate">{h.mode}</div>
                   <div className="opacity-50 text-xs">{h.date}</div>
                 </div>
               ))}
            </div>
          )}
        </div>
      )}

      {/* TYPING WORKSPACE AREA */}
      <main className="w-full max-w-5xl mx-auto flex-1 flex flex-col justify-center py-10 z-10">
        
        {/* RUNTIME MONITOR INTERFACE (HUD) */}
        {!isFinished && showLiveStats && (
          <div className={`flex gap-6 mb-6 text-xl font-bold transition-opacity duration-500 ${isZenMode ? 'opacity-0' : 'opacity-100'}`} style={{ color: colorAccent }}>
            {testMode === 'time' && textSourceType === 'dictionary' ? <div>{timeLeft}s</div> : <div>Active Engine</div>}
            <div>Index Matrix: {currentIndex} / {targetText.length}</div>
            {isLocalSplitScreen && <div className="text-red-400 animate-pulse">SPLIT-SCREEN MODE</div>}
          </div>
        )}

        {!isFinished ? (
          <div className="space-y-12">
            {/* PLAYER ONE (OR STANDARD ENGINE INTERFACE) */}
            <div className="relative">
              {isLocalSplitScreen && <div className="text-xs uppercase font-bold tracking-widest mb-2" style={{ color: colorAccent }}>Player 1 Matrix Track:</div>}
              
              {/* OPPONENT POSITION METRIC POINTERS */}
              {roomCode && opponentIndex > 0 && opponentIndex <= targetText.length && (
                <span className="absolute text-xs px-2 py-1 rounded-xl bg-red-500 text-white font-bold transition-all duration-200 shadow-lg z-20" style={{ left: `${Math.min(95, (opponentIndex / targetText.length) * 100)}%`, top: '-35px' }}>
                  {roomCode === "BOT-ROOM" ? '🤖 AI PACE' : '👻 REMOTE GHOST'}
                </span>
              )}

              <div className={`relative leading-relaxed break-words tracking-wide outline-none ${textSize}`}>
                {modifier === 'blind' && isTypingActive ? (
                  <div className="text-center italic opacity-50 py-10">Memory Core Blind Array Activated.</div>
                ) : (
                  targetText.split("").map((char, index) => {
                    let styleObj: React.CSSProperties = { color: colorText, opacity: 0.4 }; 
                    if (index < currentIndex) styleObj = { color: colorText, opacity: 1 }; 
                    
                    if (index === currentIndex) {
                      styleObj = { color: colorText, opacity: 1 };
                      if (caretStyle === 'block') styleObj = { backgroundColor: `${colorCaret}40`, color: colorCaret, borderRadius: '4px' };
                      else if (caretStyle === 'line') styleObj = { borderLeft: `3px solid ${colorCaret}` };
                      else if (caretStyle === 'underline') styleObj = { borderBottom: `3px solid ${colorCaret}` };
                    }

                    const isPacer = targetWpm > 0 && index === pacerIndex && index > currentIndex;

                    return (
                      <span key={index} style={{ ...styleObj, borderBottomColor: isPacer ? colorText : undefined }} className={`relative transition-all duration-100 ${isPacer ? 'border-b-2 border-dashed' : ''}`}>
                        {char}
                      </span>
                    );
                  })
                )}
              </div>
            </div>

            {/* PLAYER TWO SPLIT VIEW (EXCLUSIVELY FOR LOCAL PLAY SESSIONS) */}
            {isLocalSplitScreen && (
              <div className="border-t pt-8 relative animate-fadeIn" style={{ borderColor: `${colorText}30` }}>
                <div className="text-xs uppercase font-bold tracking-widest mb-2 text-red-400">Player 2 Matrix Track (Shared Focus Layout):</div>
                <div className={`relative leading-relaxed break-words tracking-wide outline-none opacity-80 ${textSize}`}>
                  {targetText.split("").map((char, index) => {
                    let styleObj: React.CSSProperties = { color: colorText, opacity: 0.3 };
                    if (index < localPlayer2Index) styleObj = { color: colorAccent, opacity: 1 };
                    if (index === localPlayer2Index) styleObj = { color: '#ffffff', borderBottom: '3px solid #ffffff' };
                    return (
                      <span key={index} style={styleObj}>
                        {char}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* PERFORMANCE EVALUATION DISPLAY MONITOR */
          <div className="flex flex-col items-center justify-center space-y-8 animate-fadeIn">
            <div className="text-center space-y-2">
              <h2 className="text-6xl font-black" style={{ color: colorAccent }}>{finalWpm} <span className="text-2xl opacity-50">WPM</span></h2>
              <div className="text-2xl font-bold opacity-80">{finalAccuracy}% Core Accuracy Matrix</div>
            </div>
            
            <div className="flex gap-6 text-sm font-bold opacity-60">
              <div>Raw Input Volume: {rawInputBuffer.length}</div>
              <div>Detected Structural Anomalies: <span className="text-red-400">{actualMistakes}</span></div>
              <div>Source Framework: {textSourceType}</div>
            </div>

            <div className="flex gap-4 pt-8">
              <button onClick={forceLocalReset} className="px-8 py-3 rounded-xl font-bold text-lg border hover:bg-white/5 transition-colors cursor-pointer" style={{ borderColor: colorText }}>
                Initialize Next Session (Tab / Esc)
              </button>
            </div>
          </div>
        )}
      </main>

      {/* RUNTIME FOOTER STATUS STRIP */}
      <footer className={`w-full text-center text-xs opacity-40 font-bold uppercase tracking-widest pb-4 transition-opacity duration-500 ${isZenMode ? 'opacity-0' : 'opacity-100'}`}>
        Esc / Tab to clear workspace state • Click Settings / Multiplayer tabs up top to modify configuration vectors
      </footer>
    </div>
  );
}