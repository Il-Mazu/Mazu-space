import {
  MESSAGE_MAX,
  NAME_MAX,
  addEntry,
  clean,
  ipHash,
  isOffensive,
  json,
  listEntries,
  redis,
} from '../_lib/guestbook.js';

export async function GET() {
  const db = redis();
  if (!db) return json({ error: 'not configured' }, 503);
  const entries = await listEntries(db);
  return json({ entries }, 200, { 'cache-control': 's-maxage=10, stale-while-revalidate=30' });
}

export async function POST(request) {
  const db = redis();
  const salt = process.env.IP_HASH_SALT;
  if (!db || !salt) return json({ error: 'not configured' }, 503);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad request' }, 400);
  }

  // Honeypot: people never see this field. Pretend it worked so bots move on.
  if (body.website) return json({ ok: true }, 201);

  const name = clean(body.name, NAME_MAX);
  const message = clean(body.message, MESSAGE_MAX);
  if (!name || !message) return json({ error: 'a name and a few words, please' }, 422);
  if (isOffensive(name, message)) return json({ error: 'not in this nave' }, 422);

  const entry = await addEntry(db, { name, message, hash: ipHash(request, salt) });
  if (!entry) return json({ error: 'one candle every ten minutes' }, 429);
  return json({ entry }, 201);
}
