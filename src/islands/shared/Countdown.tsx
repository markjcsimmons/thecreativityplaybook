import { clock } from '../../lib/tool-client';
import { useCountdown } from './useCountdown';

/** A small timer with a start button, for the timed squares in the games. It does not decide anything: the player does. */
export default function Countdown({ seconds, label }: { seconds: number; label: string }) {
  const timer = useCountdown(seconds, () => {});
  const finished = !timer.running && timer.left === 0;
  return (
    <div class="flex flex-wrap items-center gap-3">
      {!timer.running && !finished && timer.left === seconds ? (
        <button type="button" class="btn btn-ghost !min-h-0 !px-3 !py-2 !text-base" onClick={timer.start}>
          {label}
        </button>
      ) : (
        <p class="m-0 font-display text-3xl leading-none" role="timer">
          {finished ? 'Time!' : clock(timer.left)}
        </p>
      )}
    </div>
  );
}
