import { useEffect, useRef, useState } from 'react';

const SOUND_KEY = 'hs_timer_sound';

// ── Fixed deadline for EVERYONE ──
// Saturday August 8, 2026 00:00 (local time). After this moment the
// timer disappears for all visitors. To re-run the promo, edit this date.
const DEADLINE = new Date(2026, 7, 8, 0, 0, 0).getTime();

function readSoundEnabled() {
  return localStorage.getItem(SOUND_KEY) !== 'off';
}

// ── Shared sound state across all timer instances ──
let soundEnabled = readSoundEnabled();
const soundListeners = new Set();

function setSharedSound(enabled) {
  soundEnabled = enabled;
  localStorage.setItem(SOUND_KEY, enabled ? 'on' : 'off');
  soundListeners.forEach((fn) => fn(enabled));
}

function subscribeSound(fn) {
  soundListeners.add(fn);
  return () => soundListeners.delete(fn);
}

function playTick(audioRef) {
  let { ctx } = audioRef.current;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioRef.current.ctx = ctx;
    } catch (e) {
      return;
    }
  }
  if (ctx.state === 'suspended') ctx.resume();

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'square';
  osc.frequency.setValueAtTime(1800, now);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.22, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
  osc.start(now);
  osc.stop(now + 0.08);
}

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const toArabic = (n) => n.toString().padStart(2, '0').replace(/\d/g, (d) => ARABIC_DIGITS[d]);

export default function CountdownTimer({ variant = 'offers' }) {
  const [now, setNow] = useState(Date.now);
  const [soundOn, setSoundOn] = useState(soundEnabled);
  const audioRef = useRef({ ctx: null });
  const lastSecondRef = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeSound(setSoundOn);
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      unsubscribe();
      clearInterval(timer);
      audioRef.current.ctx?.close();
    };
  }, []);

  const diff = Math.max(0, DEADLINE - now);
  const totalSeconds = Math.floor(diff / 1000);

  useEffect(() => {
    if (totalSeconds === lastSecondRef.current) return;
    lastSecondRef.current = totalSeconds;
    if (soundOn) playTick(audioRef);
  }, [totalSeconds, soundOn]);

  const toggleSound = () => {
    setSharedSound(!soundEnabled);
    if (audioRef.current.ctx?.state === 'suspended') audioRef.current.ctx.resume();
  };

  // Deadline passed — hide the timer entirely (it only runs for 24 real hours).
  if (totalSeconds <= 0) return null;

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const time = `${toArabic(hours)}:${toArabic(minutes)}:${toArabic(seconds)}`;

  const soundBtn = (
    <button
      type="button"
      className={`timer-sound-btn${soundOn ? ' timer-sound-btn--on' : ''}`}
      onClick={toggleSound}
      aria-label={soundOn ? 'كتم صوت العداد' : 'تشغيل صوت العداد'}
      aria-pressed={soundOn}
    >
      {soundOn ? '🔊' : '🔇'}
    </button>
  );

  if (variant === 'bar') {
    return (
      <span className="countdown-bar" role="timer" aria-live="polite">
        <span className="countdown-bar-label">⏰ العروض تنتهي خلال</span>
        <span className="countdown-bar-time">{time}</span>
        {soundBtn}
      </span>
    );
  }

  return (
    <div className="countdown" role="timer" aria-live="polite">
      <span className="countdown-title">⏰ العروض تنتهي خلال</span>
      <span className="countdown-time">{time}</span>
      {soundBtn}
    </div>
  );
}
