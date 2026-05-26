import React, { useState, useEffect } from 'react';

// The starter paragraph. Later, we can pull random phrases from an API or database.
const TARGET_TEXT = "the quick brown fox jumps over the lazy dog because typing fast feels incredibly satisfying when you never make mistakes.";

export default function App() {
  // --- STATE CORE ---
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [actualMistakes, setActualMistakes] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(100);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // --- KEYBOARD CAPTURE LOGIC ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore functional keys like Shift, CapsLock, or if the test is already over
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey || isFinished) {
        if (e.key === 'Escape') resetEngine();
        return;
      }

      // THE HIJACK: Prevents whatever key they hit from messing up the screen
      e.preventDefault();

      // Start the clock on the very first physical keystroke
      if (!startTime) {
        setStartTime(Date.now());
      }

      // Behind-the-scenes verification: Did they hit the right key?
      const correctLetter = TARGET_TEXT[currentIndex];
      if (e.key !== correctLetter) {
        setActualMistakes((prev) => prev + 1);
      }

      // GHOST MOVE: Advance the text pointer forward regardless of accuracy
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);

      // Check if they reached the end of the paragraph
      if (nextIndex >= TARGET_TEXT.length) {
        calculateFinalStats();
        setIsFinished(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, startTime, isFinished, actualMistakes]);

  // --- CALCULATIONS MATRIX ---
  const calculateFinalStats = () => {
    if (!startTime) return;
    const timeElapsedInMinutes = (Date.now() - startTime) / 1000 / 60;
    
    // Standard metric: 5 characters typed = 1 word
    const calculatedWpm = Math.round((TARGET_TEXT.length / 5) / timeElapsedInMinutes);
    setWpm(calculatedWpm);

    // Creates a realistic, "boosted" accuracy profile (e.g., 95% - 98%)
    const totalKeys = TARGET_TEXT.length;
    const customAccuracy = Math.max(
      94, 
      Math.round(((totalKeys - (actualMistakes * 0.25)) / totalKeys) * 100)
    );
    setAccuracy(customAccuracy);
  };

  const resetEngine = () => {
    setCurrentIndex(0);
    setActualMistakes(0);
    setStartTime(null);
    setWpm(0);
    setAccuracy(100);
    setIsFinished(false);
  };

  // --- STRING RENDERING SEGMENTS ---
  const typedPart = TARGET_TEXT.substring(0, currentIndex);
  const currentLetter = TARGET_TEXT[currentIndex] || '';
  const untypedPart = TARGET_TEXT.substring(currentIndex + 1);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#111216] text-[#e2e4e9] font-mono p-6 select-none">
      <div className="w-full max-w-4xl">
        
        {/* Header Branding */}
        <header className="flex justify-between items-center mb-16">
          <div className="text-xl font-bold tracking-wider text-yellow-500 opacity-80">zenType</div>
          <button 
            onClick={resetEngine}
            className="text-xs tracking-widest uppercase bg-[#1c1e24] px-4 py-2 rounded border border-[#2d3139] hover:bg-[#252932] cursor-pointer transition-all"
          >
            Reset [Esc]
          </button>
        </header>

        {/* Live Interface Switching */}
        {!isFinished ? (
          <main className="relative text-2xl md:text-3xl leading-relaxed tracking-wide text-left min-h-[200px]">
            {/* Characters successfully masqueraded */}
            <span className="text-[#e2e4e9]">{typedPart}</span>
            
            {/* Current Active Character Block */}
            {currentLetter && (
              <span className="relative inline-block text-yellow-500 font-bold border-b-2 border-yellow-500 animate-pulse bg-yellow-500/10 px-0.5 rounded-sm">
                {currentLetter === " " ? "␣" : currentLetter}
              </span>
            )}

            {/* Gray text waiting to be typed */}
            <span className="text-[#4c5264]">{untypedPart}</span>
          </main>
        ) : (
          /* Results Dashboard */
          <main className="grid grid-cols-2 gap-8 bg-[#1c1e24] p-8 rounded-xl border border-[#2d3139] text-center max-w-xl mx-auto">
            <div>
              <div className="text-sm tracking-wider uppercase text-[#4c5264] mb-1">Raw Speed</div>
              <div className="text-5xl font-black text-yellow-500">{wpm} <span className="text-sm font-normal text-[#4c5264]">WPM</span></div>
            </div>
            <div>
              <div className="text-sm tracking-wider uppercase text-[#4c5264] mb-1">Calculated Accuracy</div>
              <div className="text-5xl font-black text-emerald-400">{accuracy}%</div>
            </div>
            <button 
              onClick={resetEngine}
              className="col-span-2 mt-4 bg-yellow-500 text-[#111216] font-bold py-3 rounded-lg hover:bg-yellow-400 cursor-pointer transition-colors"
            >
              Test Again
            </button>
          </main>
        )}
      </div>
    </div>
  );
}