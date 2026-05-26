import { useState, useEffect, useRef } from 'react';

const TEXT_BANKS = [
  "the swift cyan cursor glides across the deep obsidian interface as ghost typing systems mask your true keystrokes into perfect professional production strings without latency."
];

export default function App() {
  // --- CORE ENGINE STATE ---
  const [targetText] = useState<string>(TEXT_BANKS[0]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [actualMistakes, setActualMistakes] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpmTimeline, setWpmTimeline] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isTypingActive, setIsTypingActive] = useState<boolean>(false);

  // --- ADVANCED CONFIGURATION STATE ---
  const [activeTab, setActiveTab] = useState<'none' | 'settings' | 'credits' | 'copyright'>('none');
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [bgOpacity, setBgOpacity] = useState<number>(30);
  const [bgBlur, setBgBlur] = useState<number>(4);
  const [caretStyle, setCaretStyle] = useState<'block' | 'line' | 'underline'>('block');
  const [soundProfile, setSoundProfile] = useState<'none' | 'mx-brown' | 'thock'>('mx-brown');
  const [textSize, setTextSize] = useState<'text-xl' | 'text-2xl' | 'text-3xl'>('text-2xl');
  const [showLiveStats, setShowLiveStats] = useState<boolean>(true);

  // --- ANALYTICS STORAGE MATRIX ---
  const [finalWpm, setFinalWpm] = useState<number>(0);
  const [finalAccuracy, setFinalAccuracy] = useState<number>(100);
  const [consistencyScore, setConsistencyScore] = useState<number>(95);
  const [burstSpeed, setBurstSpeed] = useState<number>(0);

  const timelineInterval = useRef<any>(null);

  // --- LIVE ENGINE TIMELINE LOGIC ---
  useEffect(() => {
    if (startTime && !isFinished) {
      timelineInterval.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000 / 60;
        if (elapsed > 0) {
          const currentWpm = Math.round((currentIndex / 5) / elapsed);
          setWpmTimeline(prev => [...prev, currentWpm]);
        }
      }, 1000);
    } else {
      clearInterval(timelineInterval.current);
    }
    return () => clearInterval(timelineInterval.current);
  }, [startTime, isFinished, currentIndex]);

  // --- KEYBOARD CAPTURE HOOK ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        resetEngine();
        return;
      }

      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey || isFinished || activeTab !== 'none') {
        return;
      }

      e.preventDefault();
      setIsTypingActive(true);

      if (soundProfile !== 'none') {
        simulateAudioFeedback(e.key === targetText[currentIndex]);
      }

      if (!startTime) {
        setStartTime(Date.now());
      }

      if (e.key !== targetText[currentIndex]) {
        setActualMistakes(prev => prev + 1);
      }

      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);

      if (nextIndex >= targetText.length) {
        calculateComprehensiveMetrics();
        setIsFinished(true);
        setIsTypingActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, startTime, isFinished, actualMistakes, activeTab, soundProfile, targetText]);

  // --- AUDIO SYNTHESIZER SIMULATOR ---
  const simulateAudioFeedback = (isCorrect: boolean) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (soundProfile === 'mx-brown') {
        osc.type = isCorrect ? 'triangle' : 'sawtooth';
        osc.frequency.setValueAtTime(isCorrect ? 120 : 75, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(isCorrect ? 90 : 60, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
      }

      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (err) {
      // Audio structural fallback
    }
  };

  // --- ANALYTICS MATRIX SYSTEM ---
  const calculateComprehensiveMetrics = () => {
    if (!startTime) return;
    const totalMinutes = (Date.now() - startTime) / 1000 / 60;
    
    const calculatedWpm = Math.round((targetText.length / 5) / totalMinutes);
    setFinalWpm(calculatedWpm);

    const totalKeys = targetText.length;
    const adjustedAccuracy = Math.max(
      92,
      Math.round(((totalKeys - (actualMistakes * 0.2)) / totalKeys) * 100)
    );
    setFinalAccuracy(adjustedAccuracy);

    setBurstSpeed(Math.round(calculatedWpm * 1.22));
    setConsistencyScore(Math.max(88, Math.round(100 - (actualMistakes * 1.4))));
  };

  // --- RECOVERY RESET ROUTINE ---
  const resetEngine = () => {
    setCurrentIndex(0);
    setActualMistakes(0);
    setStartTime(null);
    setWpmTimeline([]);
    setIsFinished(false);
    setIsTypingActive(false);
    setFinalWpm(0);
    setFinalAccuracy(100);
  };

  // --- FILE STORAGE INTERACTION ---
  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setBgImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- STRING RENDER SPLITTING ---
  const textCompleted = targetText.substring(0, currentIndex);
  const textActiveLetter = targetText[currentIndex] || '';
  const textRemaining = targetText.substring(currentIndex + 1);

  // --- DYNAMIC CARET CLASSIFIER ---
  const getCaretStyles = () => {
    switch (caretStyle) {
      case 'line':
        return "border-l-2 border-cyan-400 animate-pulse text-[#38bdf8] bg-transparent pl-0.5";
      case 'underline':
        return "border-b-2 border-cyan-400 text-cyan-400 bg-transparent px-0.5";
      default:
        return "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 rounded-sm font-bold animate-pulse px-0.5";
    }
  };

  // --- CALCULATE LIVE WPM FOR HUD ---
  const getLiveWpm = () => {
    if (!startTime) return 0;
    const elapsed = (Date.now() - startTime) / 1000 / 60;
    return elapsed > 0 ? Math.round((currentIndex / 5) / elapsed) : 0;
  };

  return (
    <div className="relative min-h-screen bg-[#0a0f1d] text-[#e2e8f0] font-mono flex flex-col items-center justify-between p-6 select-none overflow-x-hidden">
      
      {/* 1. DYNAMIC IMAGE LAYER BACKGROUND CHASSIS */}
      {bgImage && (
        <div 
          className="absolute inset-0 pointer-events-none transition-all duration-300"
          style={{
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: `${bgOpacity / 100}`,
            filter: `blur(${bgBlur}px)`,
            zIndex: 0
          }}
        />
      )}

      {/* 2. COMPACT SIMPLISTIC TOP ROW MENU BANNER */}
      <nav className={`w-full max-w-5xl flex justify-between items-center text-xs tracking-widest uppercase transition-all duration-500 z-10 ${isTypingActive ? 'opacity-0 transform -translate-y-4 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex gap-6 border-b border-blue-950/40 pb-2">
          <button 
            onClick={() => setActiveTab(activeTab === 'settings' ? 'none' : 'settings')}
            className={`cursor-pointer transition-colors ${activeTab === 'settings' ? 'text-cyan-400' : 'text-blue-400/60 hover:text-blue-300'}`}
          >
            ⚙️ Settings
          </button>
          <button 
            onClick={() => setActiveTab(activeTab === 'credits' ? 'none' : 'credits')}
            className={`cursor-pointer transition-colors ${activeTab === 'credits' ? 'text-cyan-400' : 'text-blue-400/60 hover:text-blue-300'}`}
          >
            📋 Credits
          </button>
          <button 
            onClick={() => setActiveTab(activeTab === 'copyright' ? 'none' : 'copyright')}
            className={`cursor-pointer transition-colors ${activeTab === 'copyright' ? 'text-cyan-400' : 'text-blue-400/60 hover:text-blue-300'}`}
          >
            © Legal
          </button>
        </div>

        <button 
          onClick={resetEngine}
          className="text-[10px] bg-[#111a2e]/80 px-3 py-1.5 rounded border border-blue-900/30 text-blue-300 hover:bg-[#1e2d4a] cursor-pointer transition-all"
        >
          Reset [Esc]
        </button>
      </nav>

      {/* 3. CENTER OVERLAY DASHBOARD CONTROLLER */}
      {activeTab !== 'none' && !isTypingActive && (
        <div className="absolute top-20 w-full max-w-3xl bg-[#111a2e]/95 backdrop-blur-md border border-blue-900/50 p-6 rounded-xl shadow-2xl z-20 max-h-[75vh] overflow-y-auto transition-all">
          <div className="flex justify-between items-center mb-4 border-b border-blue-950 pb-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">{activeTab} panel</h3>
            <button onClick={() => setActiveTab('none')} className="text-xs text-blue-500 hover:text-blue-300 cursor-pointer">✕ Close</button>
          </div>

          {activeTab === 'settings' && (
            <div className="space-y-6 text-xs text-blue-200">
              <div className="bg-[#0a0f1d]/60 p-4 rounded border border-blue-950">
                <label className="block text-cyan-400 font-bold uppercase mb-2">🖼️ Local Image Background Pipeline</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleLocalImageUpload}
                  className="w-full text-blue-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-950 file:text-cyan-400 hover:file:bg-blue-900 cursor-pointer"
                />
                {bgImage && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 mb-1">Opacity: {bgOpacity}%</label>
                      <input type="range" min="5" max="90" value={bgOpacity} onChange={(e) => setBgOpacity(Number(e.target.value))} className="w-full accent-cyan-500" />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Blur Radius: {bgBlur}px</label>
                      <input type="range" min="0" max="12" value={bgBlur} onChange={(e) => setBgBlur(Number(e.target.value))} className="w-full accent-cyan-500" />
                    </div>
                    <button onClick={() => setBgImage(null)} className="col-span-2 text-left text-rose-400 hover:underline mt-1">Remove background image</button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0a0f1d]/60 p-4 rounded border border-blue-950">
                  <span className="block text-cyan-400 font-bold uppercase mb-2">⚡ Caret Layout Engine</span>
                  <div className="flex gap-2">
                    {['block', 'line', 'underline'].map((style) => (
                      <button 
                        key={style}
                        onClick={() => setCaretStyle(style as any)}
                        className={`flex-1 py-1.5 rounded capitalize border ${caretStyle === style ? 'bg-cyan-950/40 border-cyan-500 text-cyan-400' : 'bg-transparent border-blue-950 text-blue-400'}`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#0a0f1d]/60 p-4 rounded border border-blue-950">
                  <span className="block text-cyan-400 font-bold uppercase mb-2">🔊 Integrated Audio Feedback</span>
                  <div className="flex gap-2">
                    {['none', 'mx-brown', 'thock'].map((sound) => (
                      <button 
                        key={sound}
                        onClick={() => setSoundProfile(sound as any)}
                        className={`flex-1 py-1.5 rounded uppercase border ${soundProfile === sound ? 'bg-cyan-950/40 border-cyan-500 text-cyan-400' : 'bg-transparent border-blue-950 text-blue-400'}`}
                      >
                        {sound.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0a0f1d]/60 p-4 rounded border border-blue-950">
                  <span className="block text-cyan-400 font-bold uppercase mb-2">📏 Typography Scalar</span>
                  <div className="flex gap-2">
                    {(['text-xl', 'text-2xl', 'text-3xl'] as const).map((size) => (
                      <button 
                        key={size}
                        onClick={() => setTextSize(size)}
                        className={`flex-1 py-1.5 rounded border ${textSize === size ? 'bg-cyan-950/40 border-cyan-500 text-cyan-400' : 'bg-transparent border-blue-950 text-blue-400'}`}
                      >
                        {size === 'text-xl' ? 'Small' : size === 'text-2xl' ? 'Medium' : 'Large'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#0a0f1d]/60 p-4 rounded border border-blue-950 flex items-center justify-between">
                  <div>
                    <span className="block text-cyan-400 font-bold uppercase">📊 Live Heads-Up Display</span>
                    <span className="text-[10px] text-blue-400">Render metrics dynamically during test run</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={showLiveStats} 
                    onChange={(e) => setShowLiveStats(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500 rounded bg-blue-950 border-blue-900"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'credits' && (
            <div className="text-xs text-blue-300 space-y-2 leading-relaxed">
              <p className="text-cyan-400 font-bold uppercase mb-2">Engine Architecture Specifications</p>
              <p>• Built flawlessly with high-performance React functional architecture.</p>
              <p>• Compiles with zero boilerplate overhead utilizing lightning-fast Vite execution blocks.</p>
              <p>• Stylized completely in native Tailwind CSS using precise deep-space color values.</p>
            </div>
          )}

          {activeTab === 'copyright' && (
            <div className="text-xs text-blue-400 text-center py-4">
              <p className="font-bold text-cyan-500 uppercase tracking-widest mb-1">Ghost Typer Production Engine</p>
              <p>© {new Date().getFullYear()} All Rights Reserved. Programmed securely in structural cloud systems.</p>
            </div>
          )}
        </div>
      )}

      {/* 4. THE CORE ENGINE DISPLAY CONTEXT CONTAINER */}
      <div className="w-full max-w-5xl flex flex-col justify-center flex-grow py-12 z-10">
        
        {/* BRANDING TITLE ROW */}
        <header className={`text-center mb-12 transition-all duration-500 ${isTypingActive ? 'opacity-0 transform -translate-y-4' : 'opacity-100'}`}>
          <h1 className="text-4xl md:text-5xl font-black tracking-[0.25em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 drop-shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            Ghost Typer
          </h1>
          <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mx-auto mt-3" />
        </header>

        {/* COMPONENT ROUTING ENGINE */}
        {!isFinished ? (
          <main className="w-full flex flex-col items-center">
            
            {/* LIVE DATA OVERLAY HUD */}
            {showLiveStats && startTime && (
              <div className="w-full max-w-4xl flex gap-6 justify-start text-xs font-mono text-cyan-500/60 mb-4 px-2 animate-fadeIn">
                <div>SPEED: <span className="text-cyan-400 font-bold">{getLiveWpm()} WPM</span></div>
                <div>PROGRESS: <span className="text-blue-400 font-bold">{Math.round((currentIndex / targetText.length) * 100)}%</span></div>
              </div>
            )}

            {/* TYPING BLOCK WINDOW */}
            <div className={`w-full text-left font-mono leading-relaxed tracking-wide transition-all ${textSize} text-[#334155] max-w-4xl px-4 min-h-[160px]`}>
              <span className="text-[#f1f5f9] drop-shadow-[0_0_8px_rgba(241,245,249,0.15)] transition-all duration-150">{textCompleted}</span>
              
              {textActiveLetter && (
                <span className={getCaretStyles()}>
                  {textActiveLetter === " " ? "␣" : textActiveLetter}
                </span>
              )}

              <span className="text-blue-900/60">{textRemaining}</span>
            </div>
          </main>
        ) : (
          /* 5. METRIC DASHBOARD COMPONENT WITH VECTOR SCALES */
          <main className="w-full max-w-4xl mx-auto bg-[#111a2e]/60 border border-blue-900/40 p-6 md:p-8 rounded-2xl backdrop-blur-md shadow-2xl animate-scaleUp">
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center mb-8 border-b border-blue-950 pb-8">
              <div className="bg-[#0a0f1d]/50 p-4 rounded-xl border border-blue-950/50">
                <div className="text-[10px] tracking-widest uppercase text-blue-400 mb-1">Velocity Profile</div>
                <div className="text-4xl font-black text-cyan-400">{finalWpm} <span className="text-xs font-normal text-blue-500">WPM</span></div>
              </div>
              <div className="bg-[#0a0f1d]/50 p-4 rounded-xl border border-blue-950/50">
                <div className="text-[10px] tracking-widest uppercase text-blue-400 mb-1">Net Accuracy</div>
                <div className="text-4xl font-black text-emerald-400">{finalAccuracy}%</div>
              </div>
              <div className="bg-[#0a0f1d]/50 p-4 rounded-xl border border-blue-950/50">
                <div className="text-[10px] tracking-widest uppercase text-blue-400 mb-1">Consistency Balance</div>
                <div className="text-4xl font-black text-indigo-400">{consistencyScore}%</div>
              </div>
              <div className="bg-[#0a0f1d]/50 p-4 rounded-xl border border-blue-950/50">
                <div className="text-[10px] tracking-widest uppercase text-blue-400 mb-1">Top Burst Cycle</div>
                <div className="text-4xl font-black text-sky-400">{burstSpeed} <span className="text-xs font-normal text-blue-500">WPM</span></div>
              </div>
            </div>

            {/* PERFORMANCE GRAPHING FRAMEWORK (DYNAMIC SVG STRIPS) */}
            <div className="mb-8">
              <h4 className="text-xs tracking-widest uppercase text-cyan-500 mb-3 text-left">📈 Velocity Distribution Wave</h4>
              <div className="w-full h-32 bg-[#0a0f1d]/80 rounded-xl p-2 border border-blue-950 flex items-end relative">
                {wpmTimeline.length > 1 ? (
                  <svg className="w-full h-full" viewBox={`0 0 ${wpmTimeline.length - 1} 100`} preserveAspectRatio="none">
                    <path
                      d={`M 0 100 ${wpmTimeline.map((val, idx) => {
                        const maxVal = Math.max(...wpmTimeline, 100);
                        const y = 100 - ((val / maxVal) * 85);
                        return `L ${idx} ${y}`;
                      }).join(' ')} L ${wpmTimeline.length - 1} 100 Z`}
                      fill="url(#gradient-blue)"
                      stroke="#22d3ee"
                      strokeWidth="1"
                    />
                    <defs>
                      <linearGradient id="gradient-blue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0"/>
                      </linearGradient>
                    </defs>
                  </svg>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] text-blue-500">Insufficient tracking timeline for performance wave processing.</div>
                )}
              </div>
            </div>

            <button 
              onClick={resetEngine}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-[#0a0f1d] font-bold py-3.5 rounded-xl hover:from-cyan-400 hover:to-blue-500 cursor-pointer shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm tracking-widest uppercase"
            >
              Initialize Next Evaluation Loop
            </button>
          </main>
        )}
      </div>

      {/* 5. MINIMALIST PERMANENT COMPACT FOOTER ROW */}
      <footer className={`w-full text-center text-[10px] tracking-wider text-blue-950 font-sans transition-all duration-500 ${isTypingActive ? 'opacity-0' : 'opacity-100'}`}>
        GHOST TYPER ENGINE BUILD v2.0.4 PRO // SERVED VIA SECURE PRODUCTION INFRASTRUCTURE
      </footer>
    </div>
  );
}