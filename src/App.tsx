import { useState, useEffect, useRef, useCallback } from 'react';

// --- ROBUST WORD DICTIONARY ---
const COMMON_WORDS = [
  "the", "be", "of", "and", "a", "to", "in", "he", "have", "it", "that", "for", "they", "with", "as", "not", "on", "she", "at", "by", "this", "we", "you", "do", "but", "from", "or", "which", "one", "would", "all", "will", "there", "say", "who", "make", "when", "can", "more", "if", "no", "man", "out", "other", "so", "what", "time", "up", "go", "about", "than", "into", "could", "state", "only", "new", "year", "some", "take", "come", "these", "know", "see", "use", "get", "like", "then", "first", "any", "work", "now", "may", "such", "give", "over", "think", "most", "even", "find", "day", "also", "after", "way", "many", "must", "look", "before", "great", "back", "through", "long", "where", "much", "should", "well", "people", "down", "own", "just", "because", "good", "each", "those", "feel", "seem", "how", "high", "too", "place", "little", "world", "very", "still", "nation", "hand", "old", "life", "tell", "write", "become", "here", "show", "house", "both", "between", "need", "mean", "call", "develop", "under", "last", "right", "move", "thing", "general", "school", "never", "same", "another", "begin", "while", "number", "part", "turn", "real", "leave", "might", "want", "point", "form", "off", "child", "few", "small", "since", "against", "ask", "late", "home", "interest", "large", "person", "end", "open", "public", "follow", "during", "present", "without", "again", "hold", "govern", "around", "possible", "head", "consider", "word", "program", "problem", "however", "lead", "system", "set", "order", "eye", "plan", "run", "keep", "face", "fact", "group", "play", "stand", "increase", "early", "course", "change", "help", "line"
];

// --- HELPER TO GENERATE TEXT ---
const generateWords = (count: number) => {
  return Array.from({ length: count })
    .map(() => COMMON_WORDS[Math.floor(Math.random() * COMMON_WORDS.length)])
    .join(' ');
};

type TestMode = 'time' | 'words' | 'custom';
type TestStatus = 'idle' | 'running' | 'finished';

export default function App() {
  // --- CONFIGURATION STATE ---
  const [mode, setMode] = useState<TestMode>('time');
  const [timeConfig, setTimeConfig] = useState<number>(30); // 15, 30, 60, 120
  const [wordConfig, setWordConfig] = useState<number>(25); // 10, 25, 50, 100
  const [customText, setCustomText] = useState<string>("Paste or type your custom text here...");

  // --- ENGINE STATE ---
  const [targetText, setTargetText] = useState<string>("");
  const [typedChars, setTypedChars] = useState<string>("");
  const [status, setStatus] = useState<TestStatus>('idle');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);

  // --- INITIALIZATION ---
  const initializeTest = useCallback(() => {
    setStatus('idle');
    setTypedChars("");
    setStartTime(null);
    setEndTime(null);

    if (mode === 'time') {
      setTargetText(generateWords(200)); // Load a huge buffer for time mode
      setTimeLeft(timeConfig);
    } else if (mode === 'words') {
      setTargetText(generateWords(wordConfig));
      setTimeLeft(0);
    } else if (mode === 'custom') {
      setTargetText(customText.trim() || "Please enter some text.");
      setTimeLeft(0);
    }
  }, [mode, timeConfig, wordConfig, customText]);

  // Run initialization on mount and when configs change
  useEffect(() => {
    initializeTest();
  }, [initializeTest]);

  // --- TIMER LOGIC ---
  useEffect(() => {
    let interval: any;
    if (status === 'running' && mode === 'time') {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setStatus('finished');
            setEndTime(Date.now());
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, mode]);

  // --- KEYBOARD LISTENER ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Quick Reset
      if (e.key === 'Escape') {
        initializeTest();
        return;
      }

      // Ignore inputs if finished or using modifiers
      if (status === 'finished') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      
      // Prevent scrolling on space
      if (e.key === ' ') e.preventDefault();

      // Start test on first valid keystroke
      if (status === 'idle' && e.key.length === 1) {
        setStatus('running');
        setStartTime(Date.now());
      }

      // Handle typing
      if (e.key === 'Backspace') {
        setTypedChars((prev) => prev.slice(0, -1));
      } else if (e.key.length === 1) {
        setTypedChars((prev) => {
          const newTyped = prev + e.key;
          
          // Check for completion in words/custom mode
          if ((mode === 'words' || mode === 'custom') && newTyped.length >= targetText.length) {
            setStatus('finished');
            setEndTime(Date.now());
          }
          
          return newTyped;
        });
      }
    };

    // Only attach listener if we are NOT editing custom text
    if (mode !== 'custom' || status !== 'idle' || targetText !== customText) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, mode, targetText, customText, initializeTest]);

  // --- METRICS CALCULATION ---
  const calculateStats = () => {
    let correct = 0;
    let incorrect = 0;
    
    for (let i = 0; i < typedChars.length; i++) {
      if (typedChars[i] === targetText[i]) {
        correct++;
      } else {
        incorrect++;
      }
    }

    const elapsedMs = endTime && startTime ? endTime - startTime : 1;
    const elapsedMinutes = mode === 'time' 
      ? (timeConfig - timeLeft) / 60 
      : elapsedMs / 1000 / 60;

    const wpm = Math.round((correct / 5) / (elapsedMinutes || 1));
    const rawWpm = Math.round((typedChars.length / 5) / (elapsedMinutes || 1));
    const accuracy = typedChars.length > 0 ? Math.round((correct / typedChars.length) * 100) : 0;
    const extra = Math.max(0, typedChars.length - targetText.length);
    const missed = Math.max(0, targetText.length - typedChars.length);

    return { wpm, rawWpm, accuracy, correct, incorrect, extra, missed, time: Math.round(elapsedMinutes * 60) };
  };

  const stats = status === 'finished' ? calculateStats() : null;

  // --- RENDER HELPERS ---
  const renderText = () => {
    return targetText.split('').map((char, index) => {
      let colorClass = "text-[#94a3b8]"; // Remaining un-typed text (Slate 400)
      
      if (index < typedChars.length) {
        if (typedChars[index] === char) {
          colorClass = "text-[#0f172a]"; // Correct text (Slate 900)
        } else {
          colorClass = "text-red-500 bg-red-100/50 rounded-sm"; // Incorrect text
        }
      }

      const isCaret = index === typedChars.length && status !== 'finished';

      return (
        <span key={index} className="relative">
          {isCaret && (
            <span className="absolute -left-[1px] top-[10%] h-[80%] w-[2px] bg-[#eab308] animate-pulse"></span>
          )}
          <span className={`${colorClass} transition-colors duration-75`}>
            {char === " " ? "\u00A0" : char}
          </span>
        </span>
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#475569] font-sans flex flex-col items-center p-8 selection:bg-yellow-200">
      
      {/* 1. HEADER ROW */}
      <header className="w-full max-w-5xl flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#eab308] flex items-center justify-center text-white font-bold shadow-sm">
            GT
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#0f172a]">Ghost Typer</h1>
        </div>
        <nav className="flex gap-6 text-sm font-medium text-[#64748b]">
          <button className="hover:text-[#0f172a] transition-colors">Settings</button>
          <button className="hover:text-[#0f172a] transition-colors">Profile</button>
        </nav>
      </header>

      {/* 2. CONFIGURATION BAR (Hidden while typing) */}
      <div className={`w-full max-w-5xl flex justify-center mb-8 transition-opacity duration-300 ${status === 'running' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="bg-[#e2e8f0] p-1.5 rounded-lg flex items-center gap-2 text-sm font-medium">
          
          {/* Mode Selectors */}
          <div className="flex gap-1 px-2 border-r border-[#cbd5e1]">
            {(['time', 'words', 'custom'] as TestMode[]).map((m) => (
              <button 
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded-md capitalize transition-all ${mode === m ? 'bg-white text-[#0f172a] shadow-sm' : 'text-[#64748b] hover:text-[#0f172a]'}`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Value Selectors (Contextual) */}
          <div className="flex gap-1 px-2">
            {mode === 'time' && [15, 30, 60, 120].map((t) => (
              <button 
                key={t}
                onClick={() => setTimeConfig(t)}
                className={`px-3 py-1.5 rounded-md transition-all ${timeConfig === t ? 'bg-white text-[#eab308] shadow-sm' : 'text-[#64748b] hover:text-[#0f172a]'}`}
              >
                {t}
              </button>
            ))}
            
            {mode === 'words' && [10, 25, 50, 100].map((w) => (
              <button 
                key={w}
                onClick={() => setWordConfig(w)}
                className={`px-3 py-1.5 rounded-md transition-all ${wordConfig === w ? 'bg-white text-[#eab308] shadow-sm' : 'text-[#64748b] hover:text-[#0f172a]'}`}
              >
                {w}
              </button>
            ))}

            {mode === 'custom' && (
              <span className="px-3 py-1.5 text-[#64748b] italic">Insert your text below</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE */}
      <main className="w-full max-w-5xl flex-grow flex flex-col justify-center relative">
        
        {/* Active Timer / Progress */}
        {status === 'running' && mode === 'time' && (
          <div className="absolute top-0 left-0 text-2xl font-bold text-[#eab308] mb-4">
            {timeLeft}s
          </div>
        )}
        {status === 'running' && mode === 'words' && (
          <div className="absolute top-0 left-0 text-2xl font-bold text-[#eab308] mb-4">
            {typedChars.split(' ').length - 1} / {wordConfig}
          </div>
        )}

        {/* The Typing Interface */}
        {status !== 'finished' ? (
          <div className="w-full relative mt-12">
            {mode === 'custom' && status === 'idle' ? (
              <div className="w-full flex flex-col gap-4">
                <textarea 
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="w-full h-48 bg-white border border-[#cbd5e1] rounded-xl p-6 text-xl text-[#0f172a] shadow-sm focus:ring-2 focus:ring-[#eab308] focus:border-transparent outline-none resize-none"
                  placeholder="Paste your custom text here..."
                />
                <button 
                  onClick={() => {
                    setTargetText(customText.trim());
                    setStatus('idle'); // Requires user to press a key to start
                  }}
                  className="self-end px-6 py-2 bg-[#0f172a] text-white rounded-lg font-medium hover:bg-[#334155] transition-colors"
                >
                  Apply & Lock Text
                </button>
              </div>
            ) : (
              <div 
                className="text-3xl leading-relaxed font-mono tracking-wide w-full break-words outline-none"
                tabIndex={0}
                autoFocus
              >
                {renderText()}
              </div>
            )}
          </div>
        ) : (
          /* 4. RESULTS SCREEN (Monkeytype Style) */
          <div className="w-full flex flex-col items-start animate-fadeIn mt-12">
            <div className="flex gap-12 mb-12">
              <div>
                <div className="text-sm font-semibold uppercase tracking-widest text-[#64748b] mb-1">WPM</div>
                <div className="text-6xl font-black text-[#eab308]">{stats?.wpm}</div>
              </div>
              <div>
                <div className="text-sm font-semibold uppercase tracking-widest text-[#64748b] mb-1">Acc</div>
                <div className="text-6xl font-black text-[#0f172a]">{stats?.accuracy}%</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full border-t border-[#e2e8f0] pt-8">
              <div>
                <div className="text-xs uppercase font-bold text-[#94a3b8] mb-1">Test Type</div>
                <div className="text-lg text-[#0f172a] font-medium capitalize">{mode} {mode === 'time' ? `${timeConfig}s` : mode === 'words' ? wordConfig : ''}</div>
              </div>
              <div>
                <div className="text-xs uppercase font-bold text-[#94a3b8] mb-1">Raw WPM</div>
                <div className="text-lg text-[#0f172a] font-medium">{stats?.rawWpm}</div>
              </div>
              <div>
                <div className="text-xs uppercase font-bold text-[#94a3b8] mb-1">Characters</div>
                <div className="text-lg font-medium">
                  <span className="text-[#10b981]">{stats?.correct}</span> / <span className="text-red-500">{stats?.incorrect}</span> / <span className="text-[#64748b]">{stats?.extra}</span> / <span className="text-[#64748b]">{stats?.missed}</span>
                </div>
              </div>
              <div>
                <div className="text-xs uppercase font-bold text-[#94a3b8] mb-1">Time</div>
                <div className="text-lg text-[#0f172a] font-medium">{stats?.time}s</div>
              </div>
            </div>

            {/* Restart Actions */}
            <div className="flex gap-4 mt-12 w-full justify-center">
              <button 
                onClick={initializeTest}
                className="px-8 py-3 bg-[#eab308] hover:bg-[#ca8a04] text-white rounded-lg font-bold transition-all transform hover:scale-105 shadow-sm"
              >
                Next Test (Esc)
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 5. MINIMALIST FOOTER */}
      <footer className={`w-full max-w-5xl flex justify-between items-center text-xs font-medium text-[#94a3b8] mt-8 transition-opacity duration-300 ${status === 'running' ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex gap-4">
          <span><kbd className="bg-[#e2e8f0] px-1.5 py-0.5 rounded text-[#475569]">Esc</kbd> - reset</span>
        </div>
        <div>
          © {new Date().getFullYear()} Dragon Inc.
        </div>
      </footer>

    </div>
  );
}