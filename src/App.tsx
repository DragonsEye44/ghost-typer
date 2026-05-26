import { useState, useEffect, useRef } from 'react';

// Sample paragraph array for potential scaling
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

      // Audio Synthesis Simulation Engine
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
      } else { // Deep Thock profile
        osc.type = 'sine';
        osc.frequency.setValueAtTime(isCorrect ? 90 : 60, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
      }

      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (err) {
      // Audio fallback catch block
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

    // Dynamic processing profiles for premium performance distribution
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