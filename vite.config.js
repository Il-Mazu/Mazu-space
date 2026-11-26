import { defineConfig, loadEnv } from 'vite';
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

// Fetches game covers from RAWG once per build so the API key never reaches the
// browser. Without a key (e.g. local dev) the cards render without covers.
function gameCoversPlugin(apiKey) {
  const VIRTUAL_ID = 'virtual:game-covers';
  const RESOLVED_ID = '\0' + VIRTUAL_ID;
  let covers;

  async function fetchCover(game) {
    const q = encodeURIComponent(game.search || game.name);
    const res = await fetch(`https://api.rawg.io/api/games?key=${apiKey}&search=${q}&page_size=1`, {
      signal: AbortSignal.timeout(15000),
    });
    const found = res.ok && (await res.json()).results?.[0];
    if (!found) return null;
    return {
      // RAWG serves 1920px originals; its resize path returns a card-sized image.
      background_image: found.background_image?.replace('/media/games/', '/media/resize/420/-/games/') || null,
      released: found.released,
      genres: (found.genres || []).map(g => g.name),
    };
  }

  return {
    name: 'game-covers',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },
    async load(id) {
      if (id !== RESOLVED_ID) return;
      if (!covers) {
        covers = {};
        if (apiKey) {
          const unique = [...new Map(GAMES.map(g => [g.name, g])).values()];
          const results = await Promise.allSettled(unique.map(fetchCover));
          results.forEach((r, i) => { if (r.value) covers[unique[i].name] = r.value; });
          console.log(`[game-covers] fetched ${Object.keys(covers).length}/${unique.length} game covers`);
        } else {
          this.warn('RAWG_API_KEY not set, game covers disabled');
        }
      }
      return `export default ${JSON.stringify(covers)};`;
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
      `<div id="root"><main id="boot" class="boot-screen"><div class="boot-frame"><pre class="boot-logo">${esc(BOOT_LOGO)}</pre><div class="boot-status-row">&gt; loading cathedral...</div></div></main></div>`,
    ),
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      bootShellPlugin(),
      gitInfoPlugin(),
      dumpImagesPlugin(),
      gameCoversPlugin(env.RAWG_API_KEY || env.VITE_RAWG_API_KEY),
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('/three/')) return 'three-core';
            if (id.includes('@react-three/postprocessing') || id.includes('/postprocessing/')) return 'postfx';
            if (id.includes('@react-three/')) return 'r3f';
            if (id.includes('/gsap/') || id.includes('/lenis/')) return 'motion';
          },
        },
      },
    },
  };
});
