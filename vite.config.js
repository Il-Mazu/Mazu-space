import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { GAMES } from './src/data/games.js';
import { BOOT_LOGO } from './src/bootLogo.js';

function gitInfoPlugin() {
  const VIRTUAL_ID = 'virtual:git-info';
  const RESOLVED_ID = '\0' + VIRTUAL_ID;
  return {
    name: 'git-info',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },
    load(id) {
      if (id === RESOLVED_ID) {
        // Each part may fail independently: Vercel clones without an `origin`
        // remote, which used to blank the whole module (issue #5).
        const run = (cmd) => { try { return execSync(cmd, { encoding: 'utf-8' }).trim(); } catch { return ''; } };
        const { VERCEL_GIT_REPO_OWNER: owner, VERCEL_GIT_REPO_SLUG: slug } = process.env;
        const remote = run('git remote get-url origin') || (owner && slug ? `https://github.com/${owner}/${slug}` : '');
        const commits = run('git log --oneline -5').split('\n').filter(Boolean).map(line => {
          const i = line.indexOf(' ');
          return { hash: line.slice(0, i), message: line.slice(i + 1) };
        });
        const buildDate = new Date().toISOString().split('T')[0];
        return `
          export const commits = ${JSON.stringify(commits)};
          export const remote = ${JSON.stringify(remote)};
          export const buildDate = ${JSON.stringify(buildDate)};
        `;
      }
    },
  };
}

function dumpImagesPlugin() {
  const VIRTUAL_ID = 'virtual:dump-images';
  const RESOLVED_ID = '\0' + VIRTUAL_ID;
  const dumpDir = path.resolve(__dirname, 'public/Dump');
  const exts = ['.jpeg', '.jpg', '.png', '.gif', '.webp'];

  function scanImages() {
    let files = [];
    try {
      files = fs.readdirSync(dumpDir);
    } catch {
      return [];
    }
    return files
      .filter(f => exts.includes(path.extname(f).toLowerCase()))
      .sort()
      .map(f => {
        const parsed = path.parse(f);
        const thumbFile = `${parsed.name}.webp`;
        const hasThumb = fs.existsSync(path.join(dumpDir, 'thumbs', thumbFile));
        return {
          src: `/Dump/${encodeURIComponent(f)}`,
          thumb: hasThumb ? `/Dump/thumbs/${encodeURIComponent(thumbFile)}` : `/Dump/${encodeURIComponent(f)}`,
          label: parsed.name,
        };
      });
  }

  return {
    name: 'dump-images',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },
    load(id) {
      if (id === RESOLVED_ID) {
        const images = scanImages();
        return `export const images = ${JSON.stringify(images)};\nexport const count = ${images.length};`;
      }
    },
    configureServer(server) {
      server.watcher.add(dumpDir);
      const handler = (filePath) => {
        if (filePath.startsWith(dumpDir)) {
          const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
          if (mod) {
            server.moduleGraph.invalidateModule(mod);
          }
          server.ws.send({ type: 'full-reload' });
        }
      };
      server.watcher.on('add', handler);
      server.watcher.on('unlink', handler);
    },
  };
}

// Fetches game covers, release years, and genres from Wikipedia at build time
// with no API key required, caching results in node_modules/.cache.
function gameCoversPlugin() {
  const VIRTUAL_ID = 'virtual:game-covers';
  const RESOLVED_ID = '\0' + VIRTUAL_ID;
  const WIKI_API = 'https://en.wikipedia.org/w/api.php';
  const WIKI_HEADERS = { 'User-Agent': 'mazu-space/3.0 (https://mazu.is-a.dev)' };
  const CACHE_PATH = path.resolve(__dirname, 'node_modules/.cache/mazu-game-covers.json');
  const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
  const ROMAN = { ii: '2', iii: '3', iv: '4', v: '5', vi: '6', vii: '7', viii: '8' };
  let covers;
  let inFlight = null;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const wikiGet = async (params) => {
    const url = `${WIKI_API}?${new URLSearchParams({ format: 'json', ...params })}`;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(url, {
          headers: WIKI_HEADERS,
          signal: AbortSignal.timeout(15000),
        });
        if (res.ok) return await res.json();
        if (attempt === 0 && (res.status === 429 || res.status >= 500)) {
          const ra = Number(res.headers.get('retry-after'));
          await sleep(Number.isFinite(ra) && ra > 0 ? Math.min(ra * 1000, 5000) : 400);
          continue;
        }
        return null;
      } catch {
        if (attempt === 0) await sleep(400);
      }
    }
    return null;
  };

  const norm = (s) => s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\b(ii|iii|iv|v|vi|vii|viii)\b/g, (m) => ROMAN[m]);

  const stripParens = (s) => s.replace(/\s*\([^)]*\)$/, '');
  const cleanMarkup = (s) => s
    .replace(/<ref[\s\S]*?<\/ref>/gi, '')
    .replace(/<ref[^>]*\/>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  function parseYear(raw) {
    const text = cleanMarkup(raw);
    const rel = text.match(
      /^[ \t]*\|\s*(?:released?|first_release(?:_date)?)\s*=\s*([\s\S]*?)(?=\n[ \t]*\|\s*(?:genre|modes?|platforms?|publisher|developer|designer|director|producer|engine|series|composer|writer|artist|programmer|arcade|latest_release)\s*=|\n[ \t]*\}\})/mi,
    );
    const m = (rel ? rel[1] : text).match(/\b(19[789]\d|20[0-2]\d)\b/);
    return m ? m[1] : null;
  }

  function parseGenres(raw) {
    const text = cleanMarkup(raw);
    const m = text.match(/^[ \t]*\|\s*genres?\s*=\s*([\s\S]*?)(?=\n[ \t]*\|\s*[a-z_]+\s*=|\n[ \t]*\}\})/mi);
    if (!m) return [];
    const cleaned = m[1]
      .replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, '$1')
      .replace(/\{\{\s*(?:efn|cite|sfn|note)[^}]*\}\}/gi, '')
      .replace(/\{\{\s*(?:flatlist|plainlist|unbulleted list|ubl|hlist|nowrap|vgrelease)\s*\|?/gi, '\n')
      .replace(/\{\{[^}]*\}\}/g, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/[{}]/g, '');
    const out = [];
    const seen = new Set();
    for (const part of cleaned.split(/[\n,*•;|/]+/)) {
      const item = part.replace(/^[\s\-–—]+|[\s\-–—.()]+$/g, '').replace(/\s+/g, ' ');
      if (!item || item.length > 30 || /^\d+$/.test(item)) continue;
      const key = item.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(item[0].toUpperCase() + item.slice(1));
      }
      if (out.length === 3) break;
    }
    return out;
  }

  async function runPool(items, concurrency, fn) {
    let idx = 0;
    await Promise.all(Array.from({ length: concurrency }, async () => {
      while (idx < items.length) {
        const i = idx++;
        await fn(items[i], i);
      }
    }));
  }

  async function fetchAllCovers(unique) {
    const titleByGame = new Map();
    const notMedia = (t) => !/\((?:film|tv series|television|soundtrack|novel|comic|episode|song|album)\)$/i.test(t);

    await runPool(unique, 6, async (game) => {
      const q = game.search || game.name;
      const data = await wikiGet({ action: 'query', list: 'search', srsearch: `${q} video game`, srlimit: '5' });
      const hits = data?.query?.search || [];
      const want = norm(q);
      const pick =
        hits.find((h) => notMedia(h.title) && norm(stripParens(h.title)) === want) ||
        hits.find((h) => notMedia(h.title) && norm(stripParens(h.title)).startsWith(want)) ||
        hits.find((h) => notMedia(h.title)) ||
        hits[0];
      if (pick) titleByGame.set(game.name, pick.title);
    });

    const uniqueTitles = [...new Set(titleByGame.values())];
    const pagesByTitle = new Map();
    for (let i = 0; i < uniqueTitles.length; i += 40) {
      const batch = uniqueTitles.slice(i, i + 40);
      const data = await wikiGet({
        action: 'query',
        titles: batch.join('|'),
        prop: 'pageimages|revisions',
        pilicense: 'any',
        pithumbsize: '420',
        rvprop: 'content',
        rvslots: 'main',
        rvsection: '0',
        redirects: '1',
      });
      const normMap = new Map((data?.query?.normalized || []).map((x) => [x.from, x.to]));
      const redirMap = new Map((data?.query?.redirects || []).map((x) => [x.from, x.to]));
      const byTitle = new Map(Object.values(data?.query?.pages || {}).map((p) => [p.title, p]));
      for (const t of batch) {
        const mapped = normMap.get(t) || t;
        const finalTitle = redirMap.get(mapped) || mapped;
        if (byTitle.has(finalTitle)) pagesByTitle.set(t, byTitle.get(finalTitle));
      }
    }

    const result = {};
    const missingCoverGames = [];
    for (const game of unique) {
      const pageTitle = titleByGame.get(game.name);
      const page = pageTitle ? pagesByTitle.get(pageTitle) : null;
      if (!page) continue;
      const wt = page.revisions?.[0]?.slots?.main?.['*'] || '';
      const background_image = page.thumbnail?.source?.replace(/\?.*$/, '') || null;
      result[game.name] = {
        background_image,
        released: parseYear(wt),
        genres: parseGenres(wt),
      };
      if (!background_image) missingCoverGames.push({ game, pageTitle });
    }

    if (missingCoverGames.length) {
      const fileForGame = new Map();
      await runPool(missingCoverGames, 5, async ({ game, pageTitle }) => {
        const cleanTitle = stripParens(pageTitle);
        const data = await wikiGet({
          action: 'query',
          list: 'search',
          srnamespace: '6',
          srsearch: `"${cleanTitle}" cover`,
          srlimit: '5',
        });
        const re = new RegExp(`^${norm(cleanTitle)} (?:cover|box|key|save the world)`);
        const hit = (data?.query?.search || []).find((h) => {
          if (!/\.(?:jpe?g|png|webp)$/i.test(h.title)) return false;
          const base = h.title.replace(/^File:/i, '').replace(/\.[^.]+$/, '');
          return re.test(norm(base));
        });
        if (hit) fileForGame.set(game.name, hit.title);
      });

      const fileTitles = [...new Set(fileForGame.values())];
      const urlByFile = new Map();
      for (let i = 0; i < fileTitles.length; i += 40) {
        const batch = fileTitles.slice(i, i + 40);
        const data = await wikiGet({
          action: 'query',
          titles: batch.join('|'),
          prop: 'imageinfo',
          iiprop: 'url',
          iiurlwidth: '420',
        });
        for (const p of Object.values(data?.query?.pages || {})) {
          const info = p.imageinfo?.[0];
          const url = (info?.thumburl || info?.url)?.replace(/\?.*$/, '');
          if (url) urlByFile.set(p.title, url);
        }
      }

      const stillMissing = [];
      for (const { game } of missingCoverGames) {
        const url = urlByFile.get(fileForGame.get(game.name));
        if (url) result[game.name].background_image = url;
        else stillMissing.push(game);
      }

      await runPool(stillMissing, 4, async (game) => {
        try {
          const q = game.search || game.name;
          const res = await fetch(
            `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=software&limit=3`,
            { signal: AbortSignal.timeout(10000) },
          );
          if (!res.ok) return;
          const json = await res.json();
          const want = norm(q);
          const hit = (json.results || []).find((x) => norm(x.trackName).startsWith(want));
          const art = hit?.artworkUrl512 || hit?.artworkUrl100;
          if (art) result[game.name].background_image = art;
        } catch {
          // Optional fallback; keep entry with null cover on timeout.
        }
      });
    }

    return result;
  }

  return {
    name: 'game-covers',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },
    async load(id) {
      if (id !== RESOLVED_ID) return;
      if (covers && Object.keys(covers).length > 0) {
        return `export default ${JSON.stringify(covers)};`;
      }
      if (!inFlight) {
        inFlight = (async () => {
          const unique = [...new Map(GAMES.map((g) => [g.name, g])).values()];
          const cacheKey = unique.map((g) => `${g.name}\t${g.search || ''}`).join('\n');
          let staleCovers = null;

          try {
            const cached = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
            if (cached?.key === cacheKey && Object.keys(cached.covers || {}).length > 0) {
              staleCovers = cached.covers;
              if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
                covers = cached.covers;
                console.log(`[game-covers] loaded ${Object.keys(covers).length}/${unique.length} game covers from cache`);
                return covers;
              }
            }
          } catch {
            // No valid cache yet.
          }

          try {
            const fetched = await fetchAllCovers(unique);
            const entries = Object.values(fetched);
            if (entries.length > 0) {
              covers = fetched;
              const imgCount = entries.filter((e) => e.background_image).length;
              const yearCount = entries.filter((e) => e.released).length;
              const genreCount = entries.filter((e) => e.genres?.length).length;
              console.log(`[game-covers] fetched ${imgCount}/${unique.length} covers (${yearCount} years, ${genreCount} genres)`);
              fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
              fs.writeFileSync(CACHE_PATH, JSON.stringify({ key: cacheKey, fetchedAt: Date.now(), covers }));
              return covers;
            }
            this.warn(`fetched 0/${unique.length} game covers; using ${staleCovers ? 'stale cache' : 'empty covers'}`);
            return staleCovers || {};
          } catch (err) {
            this.warn(`failed to fetch game covers (${err?.message || err}); using ${staleCovers ? 'stale cache' : 'empty covers'}`);
            return staleCovers || {};
          }
        })().finally(() => {
          inFlight = null;
        });
      }
      const data = await inFlight;
      return `export default ${JSON.stringify(data)};`;
    },
  };
}

// Static copy of the boot screen's logo; React replaces it once the bundle
// runs, keeping the initial ASCII paint as early LCP.
function bootShellPlugin() {
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return {
    name: 'boot-shell',
    transformIndexHtml: (html) => html.replace(
      '<div id="root"></div>',
      `<div id="root"><main id="boot" class="boot-screen"><div class="boot-frame" style="min-height:360px;display:flex;flex-direction:column;justify-content:space-between"><pre class="boot-logo">${esc(BOOT_LOGO)}</pre><div class="boot-status-row">&gt; loading cathedral...</div></div></main></div>`,
    ),
  };
}

export default defineConfig(() => ({
  plugins: [
    react(),
    bootShellPlugin(),
    gitInfoPlugin(),
    dumpImagesPlugin(),
    gameCoversPlugin(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('/three/') || id.includes('three-stdlib')) return 'three-core';
          if (id.includes('@react-three/postprocessing') || id.includes('/postprocessing/')) return 'postfx';
          if (id.includes('@react-three/')) return 'r3f';
          if (id.includes('/gsap/') || id.includes('/lenis/')) return 'motion';
        },
      },
    },
  },
}));
