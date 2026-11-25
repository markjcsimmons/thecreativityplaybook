const SPOTS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 26], [72, 26], [28, 50], [72, 50], [28, 74], [72, 74]],
};

/** One die face. A null value is a blank die with a question mark, for before the first roll. */
export default function Die({ value, color, size = 72 }: { value: number | null; color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={value === null ? 'Die not rolled yet' : `Die showing ${value}`}>
      <rect x="5" y="5" width="90" height="90" rx="18" fill={color} stroke="var(--line)" stroke-width="6" />
      {value === null ? (
        <text x="50" y="68" text-anchor="middle" font-size="56" font-weight="700" fill="#111">
          ?
        </text>
      ) : (
        SPOTS[value]!.map(([x, y]) => <circle cx={x} cy={y} r="8" fill="#111" />)
      )}
    </svg>
  );
}
