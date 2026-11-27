export const SITE = {
  title: 'Mazu-space',
  wordmark: 'MAZU',
  version: '3.0.0',
  motto: 'Never fade away',
  subtitle: 'digital reliquary // code, art & noise',
  scrollCue: '♰ DESCEND',
};

export const ABOUT = {
  prompt: 'C:\\mazu-space> whoami',
  greeting: [
    'hi, my name is Marco!',
    'here i write, draw, and code stuff.',
    'feel free to look around',
  ],
  facts: [
    { key: 'name', value: 'Marco' },
    { key: 'handle', value: 'mazu' },
    { key: 'age', value: '20' },
    { key: 'role', value: 'full stack dev student' },
    { key: 'tags', value: 'code, art, music' },
  ],
  motto: 'Never fade away',
};

// Oldest first. `start`/`end` (YYYY-MM) decide which candles still burn.
export const CHRONICLE = [
  {
    when: 'superiori',
    title: 'Informatica e Telecomunicazioni',
    detail: 'high school, Puglia',
  },
  {
    when: '2021 → 2024',
    start: '2021-01',
    end: '2024-12',
    title: 'freelance web developer',
    detail: 'sites for private clients',
  },
  {
    when: 'nov 2025 → jun 2027',
    start: '2025-11',
    end: '2027-06',
    title: 'ITS Academy Olivetti',
    detail: 'Full Stack Development',
  },
  {
    when: 'from jun 2026',
    start: '2026-06',
    title: 'stage at ENGIM srl',
    detail: 'Modena · Ruby on Rails, PostgreSQL, Docker',
  },
];

export function isOngoing(entry, now = new Date()) {
  const month = now.toISOString().slice(0, 7);
  return Boolean(entry.start && entry.start <= month && (!entry.end || entry.end >= month));
}

export const PRESENCE = {
  userId: '864941785666813992',
  statusColors: {
    online: '#2bb57f',
    idle: '#d68d1f',
    dnd: '#e5484d',
    offline: '#8a8a94',
  },
};

export const LINKS = [
  { label: 'github', href: 'https://github.com/Il-Mazu' },
  { label: 'instagram', href: 'https://www.instagram.com/ilmazu_' },
  { label: 'spotify', href: 'https://open.spotify.com/user/tudoxdeeiu9fvtotla7tl1scj' },
  { label: 'linkedin', href: 'https://www.linkedin.com/in/marco-mazurek-54508b3b3/' },
  { label: 'email', href: 'mailto:mazurekmarco06@gmail.com' },
];
