// Replace this with your specific Render URL
const socket = io("https://ghost-typer-backend.onrender.com");
import { useState, useEffect, useRef, useCallback } from 'react';

// --- SYSTEM WORD BANKS & TELEMETRY DICTIONARIES ---
const DICTIONARIES: Record<string, string[]> = {
  en: ["the", "be", "to", "of", "and", "a", "in", "that", "have", "I", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time", "no", "just", "him", "know", "take", "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", "than", "then", "now", "look", "only", "come", "its", "over", "think", "also"],
  es: ["el", "la", "de", "que", "y", "a", "en", "un", "ser", "se", "no", "haber", "por", "con", "su", "para", "como", "estar", "tener", "le", "lo", "todo", "pero", "más", "hacer", "o", "poder", "decir", "este", "ir", "otro", "ese", "si", "me", "ya", "ver", "porque", "dar", "cuando", "él", "muy", "sin", "vez", "mucho", "saber", "qué", "sobre", "mi", "alguno", "mismo", "yo", "también", "hasta", "año", "dos", "querer", "entre", "así", "primero", "desde", "grande", "eso", "ni", "nos", "llegar", "pasar", "tiempo", "ella", "sí", "día", "uno", "bien", "poco", "deber", "entonces", "poner", "cosa", "tanto", "hombre", "parecer", "nuestro", "tan", "donde", "ahora", "parte", "después", "vida", "quedar", "siempre", "creer", "hablar", "llevar", "dejar", "nada", "cada", "seguir", "menos", "nuevo", "encontrar"],
  de: ["der", "die", "und", "in", "den", "von", "zu", "das", "mit", "sich", "des", "auf", "für", "ist", "im", "dem", "nicht", "ein", "eine", "als", "auch", "es", "an", "werden", "aus", "er", "hat", "dass", "sie", "nach", "wird", "bei", "einer", "um", "am", "sind", "noch", "wie", "einem", "über", "einen", "so", "zum", "war", "haben", "nur", "oder", "aber", "vor", "zur", "bis", "mehr", "durch", "man", "sein", "wurde", "sei", "kann", "gegen", "vom", "können", "schon", "wenn", "habe", "seine", "ihre", "dann", "unter", "wir", "soll", "ich", "eines", "Jahr", "zwei", "diese", "dieser", "wieder", "keine", "Uhr", "seiner", "worden", "will", "zwischen", "immer", "was", "sagte", "gibt", "alle"],
  fr: ["le", "la", "de", "et", "les", "des", "en", "un", "une", "que", "est", "il", "pour", "qui", "dans", "a", "par", "plus", "pas", "au", "sur", "ne", "se", "ce", "sont", "cas", "pouvoir", "faire", "lui", "être", "ou", "comme", "avec", "tout", "son", "sa", "fait", "nous", "mais", "ils", "aux", "même", "si", "bien", "elle", "on", "peut", "ces", "deux", "avoir", "cette", "aussi", "été", "dont", "sans", "je", "leur", "très", "où", "temps", "cela", "part", "autre", "après", "ans", "toujours", "dire", "reste", "sous", "voir", "donc", "moins", "avant", "encore", "mon", "rien", "quelques", "ceux", "était", "tous", "alors", "jour", "homme", "vie", "quand", "oui", "déjà", "bon", "nouveau"]
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
  const [targetText, setTargetText] = useState<string>("loading system configuration...");
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [actualMistakes, setActualMistakes] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpmTimeline, setWpmTimeline] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isTypingActive, setIsTypingActive] = useState<boolean>(false);

  // --- ADVANCED CONFIGURATION STATE ---
  const [activeTab, setActiveTab] = useState<'none' | 'settings' | 'credits' | 'copyright' | 'history'>('none');
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [bgOpacity, setBgOpacity] = useState<number>(30);
  const [bgBlur, setBgBlur] = useState<number>(4);
  const [caretStyle, setCaretStyle] = useState<'block' | 'line' | 'underline'>('block');
  const [soundProfile, setSoundProfile] = useState<'none' | 'mx-brown' | 'thock' | 'clicky'>('mx-brown');
  const [textSize, setTextSize] = useState<'text-xl' | 'text-2xl' | 'text-3xl'>('text-2xl');
  const [showLiveStats, setShowLiveStats] = useState<boolean>(true);
  const [fontFamily, setFontFamily] = useState<'font-mono' | 'font-sans' | 'font-serif'>('font-mono');
  const [opponentIndex, setOpponentIndex] = useState<number>(0);
  
  // --- EXPANDED MULTI-MODAL LOGIC ---
  const [textSource, setTextSource] = useState<'random' | 'coherent' | 'custom'>('random');
  const [language, setLanguage] = useState<'en' | 'es' | 'de' | 'fr'>('en');
  const [testMode, setTestMode] = useState<'time' | 'words' | 'custom'>('time');
  const [timeLimit, setTimeLimit] = useState<number>(30);
  const [wordLimit, setWordLimit] = useState<number>(25);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [themeMode, setThemeMode] = useState<'obsidian' | 'bright' | 'neon' | 'midnight'>('bright');
  const [customInputText, setCustomInputText] = useState<string>("");
  const [history, setHistory] = useState<HistoryLog[]>([]);
  const [rawInputBuffer, setRawInputBuffer] = useState<string>("");

  // --- ANALYTICS STORAGE MATRIX ---
  const [finalWpm, setFinalWpm] = useState<number>(0);
  const [finalAccuracy, setFinalAccuracy] = useState<number>(100);
  const [consistencyScore, setConsistencyScore] = useState<number>(95);
  const [burstSpeed, setBurstSpeed] = useState<number>(0);
  const [rawWpmScore, setRawWpmScore] = useState<number>(0);
  const [finalErrorsLog, setFinalErrorsLog] = useState<number>(0);

  const timelineInterval = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // --- PERSISTENT HISTORY LOADER ---
  useEffect(() => {
    const saved = localStorage.getItem('dragon_type_history_v5');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  // --- TIMEOUT CONTROLLER FOR TIME MODE ---
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

  // --- LIVE ENGINE TIMELINE LOGIC ---
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
      if (timelineInterval.current) {
        clearInterval(timelineInterval.current);
      }
    }
    return () => {
      if (timelineInterval.current) {
        clearInterval(timelineInterval.current);
      }
    };
  }, [startTime, isFinished, currentIndex, isTypingActive]);

    // 1. Listen for the opponent
  useEffect(() => {
    socket.on("update-opponent", (index: number) => {
      setOpponentIndex(index);
    });
    return () => { socket.off("update-opponent"); };
  }, []);

  // 2. Tell the server when you move (put this inside your handleKeyDown or key-typing logic)
  const updateMyProgress = (newIndex: number) => {
    socket.emit("typed", newIndex);
  };

  // --- METRICS CALCULATION METHOD ---
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
      id: Math.random().toString(36).substring(2, 9),
      wpm: calculatedWpm,
      accuracy: adjustedAccuracy,
      errors: actualMistakes,
      mode: `${testMode.toUpperCase()} (${textSource})`,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setHistory(prev => {
      const updated = [matchLog, ...prev].slice(0, 50);
      localStorage.setItem('dragon_type_history_v5', JSON.stringify(updated));
      return updated;
    });
  }, [startTime, rawInputBuffer, actualMistakes, testMode, textSource]);

  const triggerTestCompletion = useCallback(() => {
    setIsFinished(true);
    setIsTypingActive(false);
    calculateComprehensiveMetrics();
  }, [calculateComprehensiveMetrics]);

  // --- INTERNET API FETCH FOR COHERENT TEXT ---
  const fetchCoherentQuote = async () => {
    try {
      const res = await fetch('https://dummyjson.com/quotes/random');
      const data = await res.json();
      return data.quote.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    } catch (e) {
      return "the system failed to connect to the internet so this fallback simple english phrase was deployed instead";
    }
  };

  // --- RECOVERY RESET ROUTINE ---
  const resetEngine = useCallback(async () => {
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

    const wordsBank = DICTIONARIES[language] || DICTIONARIES['en'];

    if (textSource === 'coherent') {
      setTargetText("connecting to internet database...");
      const internetText = await fetchCoherentQuote();
      setTargetText(internetText);
      setTimeLeft(testMode === 'time' ? timeLimit : 0);
    } else if (textSource === 'random') {
      if (testMode === 'time') {
        setTimeLeft(timeLimit);
        const block = Array.from({ length: 200 })
          .map(() => wordsBank[Math.floor(Math.random() * wordsBank.length)])
          .join(' ');
        setTargetText(block);
      } else if (testMode === 'words') {
        setTimeLeft(0);
        const block = Array.from({ length: wordLimit })
          .map(() => wordsBank[Math.floor(Math.random() * wordsBank.length)])
          .join(' ');
        setTargetText(block);
      }
    } else {
      setTimeLeft(0);
      setTargetText(customInputText.trim() || "please insert your custom text into the configuration matrix");
    }
  }, [testMode, timeLimit, wordLimit, customInputText, language, textSource]);

  useEffect(() => {
    resetEngine();
  }, [resetEngine, testMode, timeLimit, wordLimit, language, textSource]);

  // --- KEYBOARD CAPTURE HOOK ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        resetEngine();
        return;
      }

      if (isFinished || activeTab !== 'none') return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        if (currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
          setRawInputBuffer(prev => prev.slice(0, -1));
        }
        return;
      }

      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      e.preventDefault();
      setIsTypingActive(true);

      const targetChar = targetText[currentIndex];
      const isActuallyCorrect = e.key === targetChar;

      if (soundProfile !== 'none') {
        simulateAudioFeedback(true);
      }

      if (!startTime) {
        setStartTime(Date.now());
      }

      if (!isActuallyCorrect) {
        setActualMistakes(prev => prev + 1);
      }

      const ghostForcedChar = targetChar;
      const nextIndex = currentIndex + 1;
      const nextBuffer = rawInputBuffer + ghostForcedChar;
      
      setCurrentIndex(nextIndex);
      setRawInputBuffer(nextBuffer);

      if (testMode === 'words' && nextIndex >= targetText.length) {
        setIsFinished(true);
        setIsTypingActive(false);
        setTimeout(() => calculateComprehensiveMetrics(Date.now()), 10);
      } else if (testMode === 'time' && nextIndex >= targetText.length && textSource === 'random') {
        const wordsBank = DICTIONARIES[language];
        setTargetText(prev => prev + " " + wordsBank[Math.floor(Math.random() * wordsBank.length)]);
      } else if ((testMode === 'custom' || textSource === 'coherent') && nextIndex >= targetText.length) {
        setIsFinished(true);
        setIsTypingActive(false);
        setTimeout(() => calculateComprehensiveMetrics(Date.now()), 10);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, startTime, isFinished, activeTab, soundProfile, targetText, rawInputBuffer, testMode, language, textSource, calculateComprehensiveMetrics, resetEngine]);

  // --- AUDIO SYNTHESIZER SIMULATOR ---
  const initAudioCtx = () => {
    if (!audioCtxRef.current) {
      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContextCtor();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const simulateAudioFeedback = (_isCorrect: boolean, overrideProfile?: string) => {
    initAudioCtx();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const profile = overrideProfile || soundProfile;
    if (profile === 'none') return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (profile === 'mx-brown') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      } else if (profile === 'thock') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      } else if (profile === 'clicky') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      }

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (err) {
      console.error("Audio block bypassed");
    }
  };

  // --- FILE STORAGE INTERACTION ---
  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setBgImage(event.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getLiveWpm = () => {
    if (!startTime) return 0;
    const elapsed = (Date.now() - startTime) / 1000 / 60;
    return elapsed > 0 ? Math.round((currentIndex / 5) / elapsed) : 0;
  };

  const clearMetricsLog = () => {
    localStorage.removeItem('dragon_type_history_v5');
    setHistory([]);
  };

  const getThemeClasses = () => {
    switch(themeMode) {
      case 'bright': return { bg: 'bg-[#f8fafc]', text: 'text-[#334155]', border: 'border-slate-200', panel: 'bg-white', accent: 'text-amber-500', caret: 'bg-amber-500' };
      case 'neon': return { bg: 'bg-[#000000]', text: 'text-green-400', border: 'border-green-900', panel: 'bg-black', accent: 'text-green-400', caret: 'bg-green-400' };
      case 'midnight': return { bg: 'bg-[#0f0c29]', text: 'text-purple-200', border: 'border-purple-900/50', panel: 'bg-[#302b63]/40', accent: 'text-purple-400', caret: 'bg-purple-400' };
      case 'obsidian': 
      default: return { bg: 'bg-[#0a0f1d]', text: 'text-[#e2e8f0]', border: 'border-blue-900/40', panel: 'bg-[#111a2e]/95', accent: 'text-cyan-400', caret: 'bg-cyan-400' };
    }
  };
  const T = getThemeClasses();

  return (
    <div className={`relative min-h-screen ${fontFamily} flex flex-col items-center justify-between p-6 select-none overflow-x-hidden transition-colors duration-300 ${T.bg} ${T.text}`}>
      
      {bgImage && (
        <div 
          className="absolute inset-0 pointer-events-none transition-all duration-300"
          style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: `${bgOpacity / 100}`, filter: `blur(${bgBlur}px)`, zIndex: 0 }}
        />
      )}

      <nav className={`w-full max-w-5xl flex flex-col md:flex-row gap-4 justify-between items-center text-xs tracking-widest uppercase transition-all duration-500 z-10 ${isTypingActive ? 'opacity-0 transform -translate-y-4 pointer-events-none' : 'opacity-100'}`}>
        <div className={`flex flex-wrap gap-4 border-b pb-2 ${T.border}`}>
          {['settings', 'history', 'credits', 'copyright'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(activeTab === tab ? 'none' : tab as any)}
              className={`cursor-pointer font-bold transition-colors ${activeTab === tab ? T.accent : 'opacity-60 hover:opacity-100'}`}
            >
              {tab === 'settings' ? '⚙️ Config' : tab === 'history' ? `📊 Logs (${history.length})` : tab === 'credits' ? '📋 Specs' : '© Legal'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center rounded-lg p-1 border ${T.border} bg-black/10`}>
            {['bright', 'obsidian', 'neon', 'midnight'].map((tm) => (
              <button 
                key={tm}
                onClick={() => setThemeMode(tm as any)} 
                className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-tight transition-all ${themeMode === tm ? `bg-white/10 ${T.accent} shadow-sm` : 'opacity-50'}`}
              >
                {tm}
              </button>
            ))}
          </div>
          <button onClick={resetEngine} className={`text-[10px] px-3 py-1.5 rounded border transition-all font-bold cursor-pointer ${T.border} bg-black/10 hover:bg-white/10`}>
            Reset [Esc]
          </button>
        </div>
      </nav>

      {activeTab !== 'none' && !isTypingActive && (
        <div className={`w-full max-w-4xl border p-6 rounded-2xl shadow-2xl z-20 mt-4 max-h-[70vh] overflow-y-auto transition-all duration-300 ${T.panel} ${T.border}`}>
          <div className={`flex justify-between items-center mb-4 border-b pb-2 ${T.border}`}>
            <h3 className={`text-xs font-black uppercase tracking-widest ${T.accent}`}>{activeTab} Deployment Console</h3>
            <button onClick={() => setActiveTab('none')} className="text-xs font-bold hover:underline cursor-pointer">✕ Close</button>
          </div>

          {activeTab === 'settings' && (
            <div className="space-y-6 text-xs">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border bg-black/5 ${T.border}`}>
                  <span className={`block font-black uppercase mb-3 tracking-wider ${T.accent}`}>🌍 Text Generation Source</span>
                  <div className="flex gap-2">
                    {['random', 'coherent', 'custom'].map((src) => (
                      <button
                        key={src}
                        onClick={() => setTextSource(src as any)}
                        className={`flex-1 py-2 rounded-lg font-bold uppercase tracking-widest border transition-all ${textSource === src ? `bg-black/20 ${T.accent} ${T.border}` : 'bg-transparent opacity-50 border-transparent'}`}
                      >
                        {src}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={`p-4 rounded-xl border bg-black/5 ${T.border}`}>
                  <span className={`block font-black uppercase mb-3 tracking-wider ${T.accent}`}>🗣️ Vocabulary Language Engine</span>
                  <div className="flex gap-2">
                    {['en', 'es', 'de', 'fr'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang as any)}
                        disabled={textSource === 'coherent' || textSource === 'custom'}
                        className={`flex-1 py-2 rounded-lg font-bold uppercase tracking-widest border transition-all ${language === lang ? `bg-black/20 ${T.accent} ${T.border}` : 'bg-transparent opacity-50 border-transparent'} disabled:opacity-20 disabled:cursor-not-allowed`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-xl border bg-black/5 ${T.border}`}>
                <span className={`block font-black uppercase mb-3 tracking-wider ${T.accent}`}>🎯 Operational Test Mode</span>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {(['time', 'words', 'custom'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setTestMode(m)}
                      className={`py-2 rounded-lg font-bold uppercase tracking-widest border transition-all ${testMode === m ? `bg-black/20 ${T.accent} ${T.border}` : 'bg-transparent opacity-50 border-transparent'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {testMode === 'time' && textSource !== 'coherent' && (
                  <div>
                    <span className="block opacity-60 font-bold uppercase mb-2">Duration Intervals (Seconds)</span>
                    <div className="flex gap-2">
                      {[15, 30, 60, 120].map((t) => (
                        <button key={t} onClick={() => setTimeLimit(t)} className={`flex-1 py-1.5 rounded font-bold border ${timeLimit === t ? 'bg-black/30' : 'bg-transparent opacity-50'}`}>{t}s</button>
                      ))}
                    </div>
                  </div>
                )}

                {testMode === 'words' && textSource !== 'coherent' && (
                  <div>
                    <span className="block opacity-60 font-bold uppercase mb-2">Quantized Word Targets</span>
                    <div className="flex gap-2">
                      {[10, 25, 50, 100].map((w) => (
                        <button key={w} onClick={() => setWordLimit(w)} className={`flex-1 py-1.5 rounded font-bold border ${wordLimit === w ? 'bg-black/30' : 'bg-transparent opacity-50'}`}>{w}</button>
                      ))}
                    </div>
                  </div>
                )}

                {textSource === 'custom' && (
                  <div className="space-y-2 mt-4">
                    <span className="block opacity-60 font-bold uppercase">Insert Custom Payload Array</span>
                    <textarea
                      value={customInputText}
                      onChange={(e) => setCustomInputText(e.target.value)}
                      placeholder="Type or paste custom language profiles directly into this terminal..."
                      className={`w-full h-24 p-3 ${fontFamily} text-xs rounded-xl border outline-none bg-black/10 ${T.border} ${T.accent}`}
                    />
                    <button onClick={resetEngine} className={`px-4 py-2 bg-black/20 font-bold rounded-lg ${T.border} hover:bg-black/40`}>Apply Custom Text</button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border bg-black/5 ${T.border}`}>
                  <span className={`block font-black uppercase mb-3 tracking-wider ${T.accent}`}>🔊 Acoustic Synth Driver (Click to Preview)</span>
                  <div className="flex gap-2">
                    {['none', 'mx-brown', 'thock', 'clicky'].map((sound) => (
                      <button 
                        key={sound}
                        onClick={() => { setSoundProfile(sound as any); simulateAudioFeedback(true, sound); }}
                        className={`flex-1 py-2 rounded-lg uppercase text-[10px] font-bold border transition-all ${soundProfile === sound ? `bg-black/20 ${T.accent} ${T.border}` : 'bg-transparent opacity-50 border-transparent'}`}
                      >
                        {sound.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`p-4 rounded-xl border bg-black/5 ${T.border}`}>
                  <span className={`block font-black uppercase mb-3 tracking-wider ${T.accent}`}>⚡ Caret & Typography Core</span>
                  <div className="flex gap-2 mb-3">
                    {['font-mono', 'font-sans', 'font-serif'].map((font) => (
                      <button 
                        key={font}
                        onClick={() => setFontFamily(font as any)}
                        className={`flex-1 py-1.5 rounded-lg border font-bold ${font} ${fontFamily === font ? `bg-black/20 ${T.accent} ${T.border}` : 'bg-transparent opacity-50 border-transparent'}`}
                      >
                        {font.replace('font-', '')}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {['block', 'line', 'underline'].map((style) => (
                      <button 
                        key={style}
                        onClick={() => setCaretStyle(style as any)}
                        className={`flex-1 py-1.5 rounded-lg border font-bold ${caretStyle === style ? `bg-black/20 ${T.accent} ${T.border}` : 'bg-transparent opacity-50 border-transparent'}`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border bg-black/5 ${T.border}`}>
                  <span className={`block font-black uppercase mb-3 tracking-wider ${T.accent}`}>📏 Text Geometry Scalar Matrix</span>
                  <div className="flex gap-2">
                    {(['text-xl', 'text-2xl', 'text-3xl'] as const).map((size) => (
                      <button 
                        key={size}
                        onClick={() => setTextSize(size)}
                        className={`flex-1 py-2 rounded-lg font-bold border ${textSize === size ? 'bg-black/20 ' + T.accent + ' ' + T.border : 'bg-transparent opacity-50 border-transparent'}`}
                      >
                        {size === 'text-xl' ? 'Compact' : size === 'text-2xl' ? 'Standard' : 'Magnified'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`p-4 rounded-xl border flex items-center justify-between bg-black/5 ${T.border}`}>
                  <div>
                    <span className={`block font-black uppercase tracking-wider ${T.accent}`}>📊 Heads Up Realtime Diagnostics</span>
                    <span className="text-[10px] opacity-40">Stream evaluations fluidly across standard terminal buffers</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={showLiveStats} 
                    onChange={(e) => setShowLiveStats(e.target.checked)}
                    className="w-5 h-5 accent-current rounded cursor-pointer"
                  />
                </div>
              </div>
              
              <div className={`p-4 rounded-xl border bg-black/5 ${T.border}`}>
                <label className={`block font-black uppercase mb-3 tracking-wider ${T.accent}`}>🖼️ Wallpaper Matrix Injector</label>
                <input 
                  type="file" accept="image/*" onChange={handleLocalImageUpload}
                  className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-black/20 file:text-inherit hover:file:bg-black/40 cursor-pointer opacity-80"
                />
                {bgImage && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block opacity-60 mb-1">Opacity: {bgOpacity}%</label>
                      <input type="range" min="5" max="90" value={bgOpacity} onChange={(e) => setBgOpacity(Number(e.target.value))} className="w-full accent-current" />
                    </div>
                    <div>
                      <label className="block opacity-60 mb-1">Blur Radius: {bgBlur}px</label>
                      <input type="range" min="0" max="12" value={bgBlur} onChange={(e) => setBgBlur(Number(e.target.value))} className="w-full accent-current" />
                    </div>
                    <button onClick={() => setBgImage(null)} className="col-span-2 text-left text-red-500 hover:underline font-bold mt-1">Disconnect Image</button>
                  </div>
                )}
              </div>

            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4 text-xs animate-fadeIn">
              <div className="flex justify-between items-center">
                <span className="font-bold tracking-wider uppercase opacity-60">Stored Diagnostic Sequences</span>
                {history.length > 0 && (
                  <button onClick={clearMetricsLog} className="text-red-500 font-bold hover:underline">Clear Datastack</button>
                )}
              </div>
              {history.length === 0 ? (
                <div className="text-center py-8 opacity-40 italic">No verifications logged.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b ${T.border} font-bold opacity-70`}>
                        <th className="py-2">NODE ID</th>
                        <th>WPM</th>
                        <th>ACCURACY</th>
                        <th>ERRORS</th>
                        <th>MODE</th>
                        <th>TIMESTAMP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((log) => (
                        <tr key={log.id} className={`border-b ${T.border} hover:bg-black/5`}>
                          <td className="py-2 opacity-60 font-bold">{log.id}</td>
                          <td className="font-black text-sm">{log.wpm}</td>
                          <td className="font-bold opacity-90">{log.accuracy}%</td>
                          <td className="font-bold text-red-400">{log.errors}</td>
                          <td className="opacity-60">{log.mode}</td>
                          <td className="opacity-50">{log.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'credits' && (
            <div className="text-xs space-y-3 leading-relaxed opacity-70 font-sans">
              <p className="font-bold uppercase tracking-widest opacity-100">Dragon Inc. Core Systems</p>
              <p>• Ghost Engine V2 installed: Auto-corrects visual typos while silently recording true error metrics.</p>
              <p>• Real-time API fetching dynamically pulls coherent quote vectors from external networks.</p>
              <p>• Web Audio Synth API bypasses hardware latency for pure mechanical switch feedback.</p>
            </div>
          )}

          {activeTab === 'copyright' && (
            <div className="text-xs text-center py-6 space-y-2 opacity-60">
              <p className="font-bold tracking-widest uppercase">Dragon Inc. Ghost Typer Module</p>
              <p>© {new Date().getFullYear()} All Rights Reserved. Protected by Multi-Cluster Networks.</p>
            </div>
          )}
        </div>
      )}

      <div className="w-full max-w-5xl flex flex-col justify-center flex-grow py-8 z-10">
        
        <header className={`text-center mb-10 transition-all duration-500 ${isTypingActive ? 'opacity-0 transform -translate-y-6' : 'opacity-100'}`}>
          <div className="text-[10px] tracking-[0.4em] uppercase font-bold opacity-50 mb-1">Cluster Production Framework</div>
          <h1 className={`text-5xl font-black tracking-tighter uppercase ${T.accent}`}>
            Dragon Typer
          </h1>
          <div className={`h-[3px] w-36 mx-auto mt-4 rounded-full ${T.caret}`} />
        </header>

        {!isFinished ? (
          <main className="w-full flex flex-col items-center">
            
            <div className="w-full max-w-4xl flex gap-6 justify-between text-[11px] font-bold opacity-60 mb-4 px-2 tracking-wider uppercase">
              <div className="flex gap-4">
                {showLiveStats && startTime && (
                  <>
                    <div>SPEED: <span className={`${T.accent} font-black`}>{getLiveWpm()} WPM</span></div>
                    <div>PROGRESS: <span className="font-bold">{Math.round((currentIndex / targetText.length) * 100)}%</span></div>
                  </>
                )}
              </div>
              {testMode === 'time' && (
                <div className={`text-sm font-black ${T.accent} bg-black/10 px-3 py-1 rounded-lg`}>
                  ⏳ {timeLeft}s
                </div>
              )}
              {testMode === 'words' && (
                <div className={`text-sm font-black ${T.accent} bg-black/10 px-3 py-1 rounded-lg`}>
                  🔤 {currentIndex} / {targetText.length}
                </div>
              )}
            </div>

            <div className={`w-full text-left leading-relaxed tracking-wide transition-all ${textSize} max-w-4xl px-6 py-8 rounded-2xl border min-h-[200px] select-none ${T.panel} ${T.border}`}>
              
              {targetText.split('').map((char, i) => {
                let charClass = "";
                if (i < currentIndex) {
                  charClass = `opacity-100 ${themeMode === 'bright' ? 'font-medium text-black' : 'text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]'}`;
                } else {
                  charClass = "opacity-30";
                }

                const isCaretActive = i === currentIndex;
                const caretRender = () => {
                  if (!isCaretActive) return null;
                  if (caretStyle === 'block') return <span className={`absolute left-0 top-0 h-full w-[1ch] opacity-40 animate-pulse ${T.caret}`} />;
                  if (caretStyle === 'underline') return <span className={`absolute left-0 bottom-0 h-[3px] w-[1ch] animate-pulse ${T.caret}`} />;
                  return <span className={`absolute -left-[1px] top-[10%] h-[80%] w-[2px] animate-pulse ${T.caret}`} />;
                };

                return (
                  <span key={i} className="relative">
                    {caretRender()}
                    <span className={`${charClass} transition-all duration-75`}>
                      {char}
                    </span>
                  </span>
                );
              })}
              
              {currentIndex >= targetText.length && (
                <span className={`inline-block w-2 h-5 animate-pulse ${T.caret}`} />
              )}
            </div>

            <div className="text-[10px] opacity-50 font-bold uppercase mt-6 tracking-widest animate-pulse">
              💡 Press <kbd className="bg-black/20 px-1.5 py-0.5 rounded border border-white/10">Esc</kbd> to restart engine
            </div>
          </main>
        ) : (
          <main className={`w-full max-w-4xl mx-auto border p-6 md:p-8 rounded-3xl shadow-2xl animate-scaleUp transition-colors duration-300 ${T.panel} ${T.border}`}>
            
            <div className={`grid grid-cols-2 md:grid-cols-6 gap-4 text-center mb-8 border-b pb-8 ${T.border}`}>
              <div className={`p-4 rounded-2xl border bg-black/10 ${T.border}`}>
                <div className="text-[10px] tracking-widest uppercase opacity-60 mb-1 font-bold">Speed</div>
                <div className={`text-5xl font-black ${T.accent}`}>{finalWpm} <span className="text-xs font-bold opacity-50">WPM</span></div>
              </div>
              <div className={`p-4 rounded-2xl border bg-black/10 ${T.border}`}>
                <div className="text-[10px] tracking-widest uppercase opacity-60 mb-1 font-bold">Accuracy</div>
                <div className="text-5xl font-black">{finalAccuracy}%</div>
              </div>
              <div className={`p-4 rounded-2xl border bg-black/10 ${T.border}`}>
                <div className="text-[10px] tracking-widest uppercase opacity-60 mb-1 font-bold">Raw Vol</div>
                <div className="text-5xl font-black opacity-70">{rawWpmScore} <span className="text-xs font-normal">WPM</span></div>
              </div>
              <div className={`p-4 rounded-2xl border bg-black/10 ${T.border}`}>
                <div className="text-[10px] tracking-widest uppercase opacity-60 mb-1 font-bold">Consistency</div>
                <div className="text-5xl font-black opacity-80">{consistencyScore}%</div>
              </div>
              <div className={`p-4 rounded-2xl border bg-black/10 ${T.border}`}>
                <div className="text-[10px] tracking-widest uppercase opacity-60 mb-1 font-bold flex items-center justify-center gap-1">
                  True Errors
                  <span className="text-[8px] bg-red-500/20 text-red-500 px-1 rounded">GHOST LOG</span>
                </div>
                <div className="text-5xl font-black text-red-400">{finalErrorsLog}</div>
              </div>
              <div className={`p-4 rounded-2xl border bg-black/10 ${T.border}`}>
                <div className="text-[10px] tracking-widest uppercase opacity-60 mb-1 font-bold">Burst</div>
                <div className="text-5xl font-black opacity-90">{burstSpeed} <span className="text-xs font-normal">WPM</span></div>
              </div>
            </div>

            <div className="mb-8 animate-fadeIn">
              <h4 className="text-xs tracking-widest uppercase opacity-60 font-bold mb-3 text-left">📈 Structural Velocity Distribution Wave</h4>
              <div className={`w-full h-40 rounded-2xl p-4 border flex items-end relative bg-black/10 ${T.border}`}>
                {wpmTimeline.length > 1 ? (
                  <svg className="w-full h-full" viewBox={`0 0 ${wpmTimeline.length - 1} 100`} preserveAspectRatio="none">
                    <path
                      d={`M 0 100 ${wpmTimeline.map((val, idx) => {
                        const maxVal = Math.max(...wpmTimeline, 80);
                        const y = 100 - ((val / maxVal) * 80);
                        return `L ${idx} ${y}`;
                      }).join(' ')} L ${wpmTimeline.length - 1} 100 Z`}
                      fill="url(#dragon-gradient-fill)"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={T.accent}
                    />
                    <defs>
                      <linearGradient id="dragon-gradient-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0.0"/>
                      </linearGradient>
                    </defs>
                  </svg>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[11px] opacity-40 italic">
                    Graphing matrix calculating nodes...
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={resetEngine}
              className={`w-full text-white font-bold py-4 rounded-xl cursor-pointer shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-xs font-black tracking-widest uppercase bg-black/40 hover:bg-black/60 border ${T.border}`}
            >
              Initialize Next Evaluation Loop [Enter / Esc]
            </button>
          </main>
        )}
      </div>

      <footer className={`w-full text-center text-[9px] font-bold tracking-widest uppercase transition-all duration-500 z-10 ${isTypingActive ? 'opacity-0' : 'opacity-30'}`}>
        DRAGON INCORPORATED // GHOST TYPER V5.0 // MULTI-MODAL DEPLOYMENT
      </footer>
    </div>
  );
}