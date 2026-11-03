/** BRIEF §2.3. Checked against body text by scripts/check-content.ts. */
export const BANNED_PHRASES: { label: string; pattern: RegExp }[] = [
  { label: "in today's fast-paced world", pattern: /in today[’']s fast[- ]paced world/i },
  { label: 'unlock your potential', pattern: /unlock your (full |creative )?potential/i },
  { label: 'delve', pattern: /\bdelv(e|es|ed|ing)\b/i },
  { label: 'game-changer', pattern: /\bgame[- ]chang(er|ers|ing)\b/i },
  { label: "whether you're a … or a …", pattern: /whether you(?:[’']re| are) an? [^.]{1,60}? or an? /i },
  { label: 'look no further', pattern: /look no further/i },
  { label: 'in conclusion', pattern: /\bin conclusion\b/i },
  { label: 'the power of', pattern: /\bthe power of\b/i },
];
