import { useEffect, useState } from 'react';

const SOUND_KEY = 'hs_timer_sound';

// ── Daily countdown: resets to 24:00:00 every midnight ──
// The countdown always shows the time remaining until the next
// 12:00 AM, then automatically resets for a fresh 24 hours.
function getNextMidnight(from) {
  const d = new Date(from);
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

// ── Shared sound state (all timer instances stay in sync) ──
let soundEnabled = localStorage.getItem(SOUND_KEY) !== 'off';
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

// ── Shared ticking: ONE sound per second no matter how many timers ──
const audio = { ctx: null };

function playTick() {
  let { ctx } = audio;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      audio.ctx = ctx;
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

let sharedNow = Date.now();
const nowListeners = new Set();
let tickTimer = null;

function subscribeNow(fn) {
  nowListeners.add(fn);
  fn(sharedNow);
  if (!tickTimer) {
    tickTimer = setInterval(() => {
      sharedNow = Date.now();
      if (soundEnabled) playTick();
      nowListeners.forEach((listener) => listener(sharedNow));
    }, 1000);
  }
  return () => {
    nowListeners.delete(fn);
    if (nowListeners.size === 0 && tickTimer) {
      clearInterval(tickTimer);
      tickTimer = null;
    }
  };
}

const pad2 = (n) => n.toString().padStart(2, '0');

export default function CountdownTimer({ variant = 'offers' }) {
  const [now, setNow] = useState(sharedNow);
  const [soundOn, setSoundOn] = useState(soundEnabled);
  const [offersVisible, setOffersVisible] = useState(false);

  useEffect(() => subscribeNow(setNow), []);
  useEffect(() => subscribeSound(setSoundOn), []);

  useEffect(() => {
    if (variant !== 'floating') return undefined;
    const el = document.getElementById('offers');
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;

    // Hide the floating timer only while the offers section fills the
    // middle of the screen (the in-section countdown takes over there).
    const observer = new IntersectionObserver(
      (entries) => setOffersVisible(entries[0].isIntersecting),
      { rootMargin: '-35% 0px -35% 0px', threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [variant]);

  const diff = Math.max(0, getNextMidnight(now) - now);
  const totalSeconds = Math.floor(diff / 1000);

  const toggleSound = () => {
    setSharedSound(!soundEnabled);
    if (audio.ctx?.state === 'suspended') audio.ctx.resume();
  };

  // Next midnight is always ahead of `now`, so the timer never disappears —
  // it simply resets to a fresh 24:00:00 every day.
  if (totalSeconds <= 0) return null;

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const time = `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;

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

  if (variant === 'floating') {
    if (offersVisible) return null;
    return (
      <div className="floating-timer" role="timer" aria-live="polite">
        <span className="floating-timer-info">
          <span className="floating-timer-label">⏰ العرض ينتهي خلال</span>
          <span className="floating-timer-time">{time}</span>
        </span>
        {soundBtn}
        <a className="floating-timer-cta" href="#offers">
          اطلب دلوقتي
        </a>
      </div>
    );
  }

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
