import { timingSafeEqual } from 'node:crypto';
import { json, redis, removeEntry } from '../_lib/guestbook.js';

function authorized(request) {
  const expected = process.env.GUESTBOOK_ADMIN_TOKEN || '';
  const given = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!expected || given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

export async function DELETE(request) {
  if (!authorized(request)) return json({ error: 'unauthorized' }, 401);
  const db = redis();
  if (!db) return json({ error: 'not configured' }, 503);
  const id = decodeURIComponent(new URL(request.url).pathname.split('/').pop() || '');
  if (!/^[0-9a-f-]{36}$/.test(id)) return json({ error: 'bad id' }, 400);
  const removed = await removeEntry(db, id);
  return json({ removed }, removed ? 200 : 404);
}
