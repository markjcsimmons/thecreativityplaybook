/** Browser helpers shared by the tool islands: saved lists, export and the clock. */

// localStorage can be missing or throw (private windows, blocked storage). Tools work without it.
export const readList = (key: string): string[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
};

export const writeList = (key: string, items: string[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    /* keep going without storage */
  }
};

export const csvCell = (s: string) => `"${s.replaceAll('"', '""')}"`;

export const download = (name: string, type: string, body: string) => {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};

export const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
