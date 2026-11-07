import { useEffect, useRef, useState } from 'preact/hooks';

/**
 * A wall-clock countdown for the timed games. `start()` begins it, `stop()` ends it early, and
 * `onEnd` runs once when it reaches zero. It uses Date.now(), so it stays right if the tab sleeps.
 */
export function useCountdown(seconds: number, onEnd: () => void) {
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(false);
  const endsAt = useRef(0);
  const latest = useRef(onEnd);
  latest.current = onEnd;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const next = Math.max(0, Math.round((endsAt.current - Date.now()) / 1000));
      setLeft(next);
      if (next === 0) {
        clearInterval(id);
        setRunning(false);
        latest.current();
      }
    }, 250);
    return () => clearInterval(id);
  }, [running]);

  return {
    left,
    running,
    start: () => {
      endsAt.current = Date.now() + seconds * 1000;
      setLeft(seconds);
      setRunning(true);
    },
    stop: () => setRunning(false),
  };
}
