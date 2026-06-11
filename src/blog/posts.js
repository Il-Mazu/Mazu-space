const postFiles = import.meta.glob('/src/blog/*.md', { eager: true, query: '?raw', import: 'default' });

function parseFrontmatter(raw) {
  const fm = { title: '', date: '', tags: [] };
  if (!raw) return fm;
  for (const line of raw.trim().split('\n')) {
    const ci = line.indexOf(':');
    if (ci === -1) continue;
    const key = line.slice(0, ci).trim();
    let val = line.slice(ci + 1).trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
    }
    fm[key] = val;
  }
  return fm;
}

export const posts = Object.entries(postFiles)
  .map(([path, raw]) => {
    const slug = path.split('/').pop().replace('.md', '');
    const parts = raw.split('---');
    const fm = parseFrontmatter(parts[1]);
    const content = parts.slice(2).join('---').trim();
    return { slug, ...fm, content };
  })
  .sort((a, b) => b.date.localeCompare(a.date));
