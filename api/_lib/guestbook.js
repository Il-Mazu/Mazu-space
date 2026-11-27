import { createHash, randomUUID } from 'node:crypto';
import { Redis } from '@upstash/redis';

export const NAME_MAX = 24;
export const MESSAGE_MAX = 140;
export const LIST_MAX = 100;
export const RATE_WINDOW_S = 600;

const INDEX = 'gb:entries';
const entryKey = (id) => `gb:entry:${id}`;
const rateKey = (hash) => `gb:rl:${hash}`;

// The Vercel Marketplace (Upstash) integration sets KV_REST_API_*; a plain
// Upstash database uses UPSTASH_REDIS_REST_*.
export function redis() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? new Redis({ url, token }) : null;
}

export function json(body, status, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

const URLISH = /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|it|io|dev|app|xyz|ru|cn|co|me|gg|tv|ly|link|info|biz|site|online|shop)\b(?:\/\S*)?/gi;

// Plain text only: no markup, no links, no control characters, single spaces.
export function clean(text, max) {
  return String(text ?? '')
    .normalize('NFKC')
    .replace(/<[^>]*>/g, ' ')
    .replace(URLISH, ' ')
    .replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁯]/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

// Slurs and strong insults, Italian and English. Matched on whole words after
// undoing common character swaps, so "f4gg0t" or "n e g r o" don't slip by.
const BLOCKED = [
  // English
  'nigger', 'nigga', 'faggot', 'fag', 'retard', 'retarded', 'tranny', 'kike', 'spic', 'chink', 'gook', 'wetback',
  'dyke', 'coon', 'cunt', 'whore', 'slut', 'rapist', 'kys', 'killyourself',
  // Italian
  'negro', 'negri', 'negra', 'frocio', 'froci', 'finocchio', 'ricchione', 'recchione', 'culattone', 'checca',
  'troia', 'puttana', 'zoccola', 'mignotta', 'baldracca', 'handicappato', 'mongoloide', 'terrone', 'zingaro',
  'stupro', 'ammazzati', 'suicidati', 'vaffanculo', 'fanculo', 'stronzo', 'stronza', 'coglione', 'cazzo', 'bastardo',
];
const SWAPS = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '@': 'a', $: 's', '!': 'i' };

export function isOffensive(...texts) {
  const flat = texts.join(' ').toLowerCase().replace(/[013457@$!]/g, (c) => SWAPS[c]);
  const words = flat.split(/[^a-zà-ù]+/).filter(Boolean);
  const joined = flat.replace(/[^a-zà-ù]/g, '');
  return words.some((w) => BLOCKED.includes(w.replace(/(.)\1{2,}/g, '$1$1')))
    // spaced out, e.g. "n e g r o": only check long entries to avoid hits inside normal words
    || (/\b\w(?:\s+\w){3,}\b/.test(flat) && BLOCKED.some((b) => b.length >= 5 && joined.includes(b)));
}

// Never store the raw address: a salted hash is enough to rate limit.
export function ipHash(request, salt) {
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim()
    || request.headers.get('x-real-ip') || 'unknown';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);
}

export async function listEntries(db) {
  const ids = await db.zrange(INDEX, 0, LIST_MAX - 1, { rev: true });
  if (!ids.length) return [];
  const p = db.pipeline();
  ids.forEach((id) => p.hgetall(entryKey(id)));
  const rows = await p.exec();
  return rows.filter(Boolean).map((r) => ({ id: r.id, name: r.name, message: r.message, createdAt: Number(r.createdAt) }));
}

// Returns null when this IP posted inside the window.
export async function addEntry(db, { name, message, hash }) {
  const allowed = await db.set(rateKey(hash), '1', { nx: true, ex: RATE_WINDOW_S });
  if (allowed !== 'OK') return null;
  const entry = { id: randomUUID(), name, message, createdAt: Date.now() };
  await db.pipeline()
    .hset(entryKey(entry.id), entry)
    .zadd(INDEX, { score: entry.createdAt, member: entry.id })
    .exec();
  return entry;
}

export async function removeEntry(db, id) {
  const [removed] = await db.pipeline().zrem(INDEX, id).del(entryKey(id)).exec();
  return removed > 0;
}
