import { useState, useEffect, useCallback } from 'react';
import Window from './Window';

const API_KEY = import.meta.env.VITE_RAWG_API_KEY;
const RAWG_URL = 'https://api.rawg.io/api/games';
const CACHE_KEY = 'games_cache';

const GAMES_LIST = [
  { name: 'Cyberpunk 2077', category: 'favorites', vote: 99 },
  { name: 'Celeste', category: 'favorites', vote: 97 },
  { name: 'The Stanley Parable', category: 'favorites', vote: 95 },
  { name: 'Red Dead Redemption 2', category: 'favorites', vote: 98 },
  { name: 'Fire Emblem: Engage', category: 'favorites', vote: 91 },
  { name: 'The Legend of Zelda: Breath of the Wild', category: 'favorites', vote: 96 },
  { name: 'The Legend of Zelda: Tears of the Kingdom', category: 'favorites', vote: 97 },
  { name: "Baldur's Gate 3", category: 'favorites', vote: 94 },
  { name: 'Deltarune', category: 'playing' },
  { name: 'League of Legends', category: 'playing' },
  { name: 'Ultrakill', category: 'playing' },
  { name: 'Pokémon HeartGold / SoulSilver', category: 'played', vote: 86 },
  { name: 'Pokémon FireRed', category: 'played', vote: 60 },
  { name: 'Pokémon Emerald', category: 'played', vote: 75 },
  { name: 'Pokémon Diamond / Platinum', category: 'played', vote: 85 },
  { name: 'Pokémon Black / White', category: 'played', vote: 80 },
  { name: 'Pokémon Black 2 / White 2', category: 'played', vote: 83 },
  { name: 'Pokémon X / Y', category: 'played', vote: 88 },
  { name: 'Pokémon Omega Ruby / Alpha Sapphire', category: 'played', vote: 85 },
  { name: 'Pokémon Sun / Moon', category: 'played', vote: 80 },
  { name: 'Pokémon Ultra Sun / Ultra Moon', category: 'played', vote: 80 },
  { name: 'Pokémon Sword / Shield', category: 'played', vote: 83 },
  { name: "Pokémon: Let's Go, Eevee!", category: 'played', vote: 60 },
  { name: 'Pokémon Legends: Arceus', category: 'played', vote: 80 },
  { name: 'Pokémon Legends: Z-A', category: 'played', vote: 75 },
  { name: 'Pokémon Scarlet / Violet', category: 'played', vote: 15 },
  { name: 'Pokémon Super Mystery Dungeon', category: 'played', vote: 70 },
  { name: 'Pokémon UNITE', category: 'played', vote: 60 },
  { name: 'Pokémon Snap', category: 'played', vote: 70 },
  { name: 'Pokémon Brilliant Diamond', category: 'played', vote: 60 },
  { name: 'Minecraft', category: 'played', vote: 89 },
  { name: 'Sekiro: Shadows Die Twice', category: 'played', vote: 80 },
  { name: 'Hollow Knight', category: 'played', vote: 89 },
  { name: 'Bayonetta', category: 'played', vote: 88 },
  { name: 'Bayonetta 2', category: 'played', vote: 90 },
  { name: 'Bayonetta 3', category: 'played', vote: 87 },
  { name: 'Ace Attorney Trilogy', category: 'played', vote: 80 },
  { name: "The Legend of Zelda: Link's Awakening", category: 'played', vote: 85 },
  { name: 'The Legend of Zelda: Skyward Sword HD', category: 'played', vote: 85 },
  { name: 'Hyrule Warriors: Age of Calamity', category: 'played', vote: 79 },
  { name: 'Super Mario Odyssey', category: 'played', vote: 80 },
  { name: 'Super Mario 3D World', category: 'played', vote: 75 },
  { name: 'Super Mario Bros. Wonder', category: 'played', vote: 77 },
  { name: 'Mario Kart 8 Deluxe', category: 'played', vote: 75 },
  { name: 'Mario Kart DS', category: 'played', vote: 75 },
  { name: 'New Super Mario Bros. 2', category: 'played', vote: 70 },
  { name: 'Super Smash Bros. Ultimate', category: 'played', vote: 80 },
  { name: "Luigi's Mansion 3", category: 'played', vote: 75 },
  { name: 'Animal Crossing: New Horizons', category: 'played', vote: 70 },
  { name: 'Animal Crossing: New Leaf', category: 'played', vote: 78 },
  { name: 'Splatoon 3', category: 'played', vote: 45 },
  { name: 'Metroid Dread', category: 'played', vote: 60 },
  { name: 'Tomodachi Life', category: 'played', vote: 77 },
  { name: 'Kirby: Triple Deluxe', category: 'played', vote: 70 },
  { name: 'Kirby: Planet Robobot', category: 'played', vote: 70 },
  { name: 'Kirby and the Forgotten Land', category: 'played', vote: 80 },
  { name: "Kirby's Epic Yarn", category: 'played', vote: 65 },
  { name: 'Donkey Kong Country Returns', category: 'played', vote: 83 },
  { name: 'Donkey Kong Bananza', category: 'played', vote: 84 },
  { name: "Yoshi's Crafted World", category: 'played', vote: 76 },
  { name: 'Monster Hunter Rise', category: 'played', vote: 88 },
  { name: 'Horizon Zero Dawn', category: 'played', vote: 85 },
  { name: 'Buckshot Roulette', category: 'played', vote: 69 },
  { name: 'Genshin Impact', category: 'played', vote: 60 },
  { name: 'Wuthering Waves', category: 'played', vote: 80 },
  { name: 'Professor Layton and the Curious Village', category: 'played', vote: 78 },
  { name: 'Yo-Kai Watch', category: 'played', vote: 70 },
  { name: 'Yo-Kai Watch 2: Bony Spirits / Fleshy Souls', category: 'played', vote: 70 },
  { name: 'Inazuma Eleven', category: 'played', vote: 78 },
  { name: 'Mario + Rabbids: Sparks of Hope', category: 'played', vote: 76 },
  { name: 'Skylanders: Swap Force', category: 'played', vote: 90 },
  { name: 'Skylanders: Trap Team', category: 'played', vote: 87 },
  { name: 'Skylanders: Imaginators', category: 'played', vote: 88 },
  { name: 'GTA V', category: 'played', vote: 90 },
  { name: "Divinity: Original Sin 2", category: 'played', vote: 50 },
  { name: 'Undertale', category: 'played', vote: 91 },
  { name: 'Cuphead', category: 'played', vote: 80 },
  { name: 'The Binding of Isaac', category: 'played', vote: 70 },
  { name: 'Balatro', category: 'played', vote: 88 },
  { name: 'Doki Doki Literature Club', category: 'played', vote: 65 },
  { name: 'Stardew Valley', category: 'played', vote: 50 },
  { name: 'Terraria', category: 'played', vote: 50 },
  { name: 'Subnautica: Below Zero', category: 'played', vote: 57 },
  { name: 'Rocket League', category: 'played', vote: 40 },
  { name: 'Overwatch', category: 'played', vote: 70 },
  { name: 'Fortnite', category: 'played', vote: 30 },
  { name: 'Apex Legends', category: 'played', vote: 60 },
  { name: 'Fall Guys', category: 'played', vote: 60 },
  { name: 'Among Us', category: 'played', vote: 60 },
  { name: 'Lethal Company', category: 'played', vote: 70 },
  { name: 'Content Warning', category: 'played', vote: 60 },
  { name: 'Getting Over It', category: 'played', vote: 70 },
  { name: 'Palworld', category: 'played', vote: 65 },
  { name: 'Resident Evil 0', category: 'played', vote: 50 },
  { name: 'Resident Evil 4', category: 'played', vote: 70 },
  { name: 'Resident Evil 6', category: 'played', vote: 80 },
  { name: 'Resident Evil 7: Biohazard', category: 'played', vote: 85 },
  { name: 'Resident Evil Village', category: 'played', vote: 89 },
  { name: 'The Last of Us Part I', category: 'played', vote: 80 },
  { name: "Marvel's Spider-Man", category: 'played', vote: 88 },
  { name: "Marvel's Spider-Man 2", search: 'Marvel Spider-Man 2', category: 'played', vote: 89 },
  { name: 'God of War (2018)', category: 'played', vote: 91 },
  { name: "Marvel's Spider-Man: Miles Morales", category: 'played', vote: 88 },
  { name: 'Overcooked!', category: 'played', vote: 60 },
  { name: 'Nintendo Switch Sports', category: 'played', vote: 45 },
  { name: 'Wii Sports', category: 'played', vote: 80 },
  { name: 'Super Mario Party', category: 'played', vote: 80 },
  { name: 'Gang Beasts', category: 'played', vote: 76 },
  { name: "Marvel Rivals", category: 'played', vote: 80 },
];

export const gamesCount = GAMES_LIST.length;

export async function preloadGamesCache() {
  let cache = {};
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (stored) cache = JSON.parse(stored);
  } catch {}

  const allEntries = [...new Map(GAMES_LIST.map(g => [g.name, g])).values()];
  const toFetch = allEntries.filter(g => !cache[g.name]);
  if (toFetch.length === 0) return;

  const fetches = toFetch.map(async (g) => {
    try {
      const searchTerm = g.search || g.name;
      const res = await fetch(
        `${RAWG_URL}?key=${API_KEY}&search=${encodeURIComponent(searchTerm)}&page_size=1`
      );
      if (!res.ok) return;
      const data = await res.json();
      const found = data.results?.[0];
      if (found) cache[g.name] = found;
    } catch {}
  });

  await Promise.allSettled(fetches);

  try {
    const toStore = {};
    for (const [k, v] of Object.entries(cache)) {
      if (v) toStore[k] = v;
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(toStore));
  } catch {}
}

const CATEGORIES = [
  { key: 'favorites', label: 'FAVORITES', icon: '★' },
  { key: 'playing', label: 'PLAYING', icon: '▶' },
  { key: 'played', label: 'PLAYED', icon: '✓' },
];

function GameCard({ name, data, vote }) {
  if (!data || data.loading) {
    return (
      <div className="game-card game-card-loading">
        <div className="game-card-spinner" />
      </div>
    );
  }

  const { background_image, released, genres } = data;
  const year = released ? released.slice(0, 4) : '—';

  return (
    <div className="game-card">
      {background_image && (
        <div className="game-card-cover">
          <img src={background_image} alt={name} draggable={false} loading="lazy" />
        </div>
      )}
      <div className="game-card-info">
        <div className="game-card-title">{name}</div>
        <div className="game-card-meta">
          <span className="game-card-year c-dim">{year}</span>
          <span className="game-card-vote">
            <span className="vote-value">{vote !== undefined && vote !== null ? vote : '--'}</span>
            <span className="vote-max c-dim">/100</span>
          </span>
        </div>
        {genres && genres.length > 0 && (
          <div className="game-card-genres c-dim">
            {genres.map(g => g.name).join(' · ')}
          </div>
        )}
      </div>
    </div>
  );
}

export function GamesContent({ sort, setSort, statusText, setStatusText, cache, setCache }) {
  const fetchGames = useCallback(async () => {
    const allEntries = [...new Map(GAMES_LIST.map(g => [g.name, g])).values()];
    const toFetch = allEntries.filter(g => !cache[g.name] && !cache[`${g.name}_loading`]);
    const toFetchNames = toFetch.map(g => g.name);
    if (toFetch.length === 0) return;

    setStatusText(`fetching ${toFetch.length} games...`);

    setCache(prev => {
      const loadingMarkers = {};
      for (const { name } of toFetch) {
        loadingMarkers[`${name}_loading`] = true;
      }
      return { ...prev, ...loadingMarkers };
    });

    const results = {};
    const fetches = toFetch.map(async (g) => {
      try {
        const searchTerm = g.search || g.name;
        const res = await fetch(
          `${RAWG_URL}?key=${API_KEY}&search=${encodeURIComponent(searchTerm)}&page_size=1`
        );
        if (!res.ok) return;
        const data = await res.json();
        const found = data.results?.[0];
        results[g.name] = found || null;
      } catch {
        results[g.name] = null;
      }
    });

    await Promise.all(fetches);

    setCache(prev => {
      const next = { ...prev };
      for (const name of toFetchNames) {
        delete next[`${name}_loading`];
      }
      for (const name of toFetchNames) {
        if (results[name] !== undefined) {
          next[name] = results[name];
        }
      }
      try {
        const toStore = {};
        for (const [k, v] of Object.entries(next)) {
          if (!k.endsWith('_loading') && v) toStore[k] = v;
        }
        localStorage.setItem(CACHE_KEY, JSON.stringify(toStore));
      } catch {}
      return next;
    });

    const loaded = Object.values(cache).filter(v => v && !v.loading).length + toFetch.length;
    setStatusText(`${loaded} games loaded`);
  }, [cache, setCache, setStatusText]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const getSortedGames = (category) => {
    const catGames = GAMES_LIST.filter(g => g.category === category);
    const withData = catGames
      .map(g => ({ ...g, data: cache[g.name] }));

    switch (sort) {
      case 'name':
        withData.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'year':
        withData.sort((a, b) => {
          const ay = a.data?.released || '0';
          const by = b.data?.released || '0';
          return by.localeCompare(ay);
        });
        break;
    }
    return withData;
  };

  const hasDataForCategory = (key) => {
    return GAMES_LIST.some(g => g.category === key);
  };

  return (
    <div className="games-win">
      <pre className="games-ascii">{`⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⠀⠀⠀⠀⠀⠀⠀⢀⣀⠀⣄⣼⣠⣤⣤⣀⣤⣤⣤⣴⣦⣤⣦⣤⣦⣼⣶⣤⣤⣤⣀⣤⣀⣀⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⡆⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡅⢀⣀⣠⣤⣴⣶⣶⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣷⣶⣷⣶⣤⣀⡈⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣤⠴⠞⠋⠉⠉⠻⠛⠿⠿⠿⠿⠟⠿⠿⠿⠛⠛⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣦⣄
⠀⠀⠀⠀⠀⠀⣠⡴⡶⠏⠉⠀⠉⠀⠀⠀⢀⣀⣀⣀⠤⠤⠤⠤⠤⠤⠔⠢⠤⠤⠤⠴⠒⠒⠲⠤⠤⢤⣄⣀⣀⠀⠉⠉⠉⠉⠉⠙⠻⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⠀⠀⠀⣠⣴⠟⢉⣀⣀⠠⠤⠔⠒⠊⠉⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⠁⠀⠀⠀⠈⠉⠓⠲⠤⠤⢀⣀⣀⢹⣿⣿⣿⠟⠛⠟⣿⣿⣿⡿⠁
⠀⢀⣼⣟⣥⠔⠊⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡔⠒⠀⠐⠲⣤⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠻⡟⠁⠀⣀⣼⣿⣿⠏⠀⠀
⣠⠿⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⡗⢄⠀⠀⠀⠀⢀⠴⠚⠉⠉⠒⢤⡀⠀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣲⢦⣯⣛⣿⡿⠁⠀⠄⠀
⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢢⠑⣄⠀⢠⠋⠀⠀⠀⠀⠀⠑⢱⠀⠱⠄⠀⠀⠀⠀⣀⣀⠀⡎⣏⢂⠀⣠⣾⣿⡿⠓⠻⣄⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢌⠢⣸⡀⠀⠀⠀⠀⠀⠀⢸⠀⣦⠧⣴⡿⠛⠁⠀⠉⠙⠻⣾⡘⣶⣿⣿⠏⣀⡀⣀⠈⣄⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠑⢬⣳⣄⠀⠀⣀⠤⠖⢋⡩⠔⣺⠁⣠⡶⠛⠛⠓⠢⠭⣍⣉⣛⡿⠏⠀⣀⣠⠿⠐⣿⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⠛⠶⠶⠛⠉⠀⠀⠀⠃⣾⠟⠀⠀⠀⠀⠀⣠⣿⣿⣿⢦⣧⠀⠀⠀⠀⢠⣿⡀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣏⠀⠰⢤⠀⣴⣰⣿⡿⣿⡇⠀⠙⠳⠦⠴⠾⠛⠙⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⢇⡀⠀⣈⣽⣿⣿⣿⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀`}</pre>
      <div className="games-disclaimer c-dim">
        // This section lists every game I've ever played, each with a personal grade
        I decided to give. Obviously, it's just my opinion and shouldn't be taken
        too seriously.
      </div>
      {CATEGORIES.map(cat => (
        hasDataForCategory(cat.key) && (
          <div key={cat.key} className="games-section">
            <div className="games-section-title">
              <span className="games-section-icon">{cat.icon}</span>
              <span>{cat.label}</span>
              <span className="games-section-line" />
            </div>
            <div className="games-grid">
              {getSortedGames(cat.key).map(game => (
                <GameCard key={game.name} name={game.name} data={game.data} vote={game.vote} />
              ))}
            </div>
          </div>
        )
      ))}

      {Object.keys(cache).length === 0 && (
        <div className="games-loading">
          <div className="games-loading-spinner" />
          <div className="c-dim">fetching game data...</div>
        </div>
      )}

      <div className="games-attribution c-dim">
        Game data sourced from <a href="https://rawg.io/" target="_blank" rel="noopener noreferrer">RAWG</a>
      </div>
    </div>
  );
}

const sortMenus = [
  { label: 'Sort', onClick: () => {} },
];

export default function GamesWindow({
  id, x, y, width, height,
  visible, focused, zIndex,
  onFocus, onClose, onMinimize, onMove, onResize,
}) {
  const [cache, setCache] = useState(() => {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [sort, setSort] = useState('default');
  const [statusText, setStatusText] = useState('');

  return (
    <Window
      id={id} title="games.exe — GAME LIBRARY"
      x={x} y={y} width={width} height={height}
      visible={visible} focused={focused} zIndex={zIndex}
      onFocus={onFocus} onClose={onClose} onMinimize={onMinimize}
      onMove={onMove} onResize={onResize}
      menubar={[
        { label: 'Sort', onClick: () => {} },
        { label: 'Name', onClick: () => setSort(s => s === 'name' ? 'default' : 'name') },
        { label: 'Year', onClick: () => setSort(s => s === 'year' ? 'default' : 'year') },
        { label: 'Refresh', onClick: () => { localStorage.removeItem(CACHE_KEY); setCache({}); } },
      ]}
      statusbar={[
        { text: statusText, className: 'status-seg' },
        { text: `sort: ${sort}`, className: 'status-seg' },
        { text: 'personal vote', className: '' },
      ]}
    >
      <GamesContent
        sort={sort}
        setSort={setSort}
        statusText={statusText}
        setStatusText={setStatusText}
        cache={cache}
        setCache={setCache}
      />
    </Window>
  );
}
