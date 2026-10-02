import { useState } from 'react';
import Window from './Window';
import { GAMES } from '../data/games';
import covers from 'virtual:game-covers';
import './GamesWindow.css';

export const gamesCount = GAMES.length;

const CATEGORIES = [
  { key: 'favorites', label: 'FAVORITES', icon: '★' },
  { key: 'playing', label: 'PLAYING', icon: '▶' },
  { key: 'played', label: 'PLAYED', icon: '✓' },
];

function GameCard({ name, data, vote }) {
  const { background_image, released, genres } = data || {};
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
            {genres.join(' · ')}
          </div>
        )}
      </div>
    </div>
  );
}

export function GamesContent({ sort = 'default' }) {
  const getSortedGames = (category) => {
    const catGames = GAMES.filter(g => g.category === category);
    const withData = catGames
      .map(g => ({ ...g, data: covers[g.name] }));

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
        GAMES.some(g => g.category === cat.key) && (
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


      <div className="games-attribution c-dim">
        Game data sourced from <a href="https://rawg.io/" target="_blank" rel="noopener noreferrer">RAWG</a>
      </div>
    </div>
  );
}

export default function GamesWindow(win) {
  const [sort, setSort] = useState('default');
  const toggle = (key) => () => setSort(s => s === key ? 'default' : key);

  return (
    <Window
      {...win}
      menubar={[
        { label: 'Name', onClick: toggle('name'), active: sort === 'name' },
        { label: 'Year', onClick: toggle('year'), active: sort === 'year' },
      ]}
      statusbar={[
        { text: `${GAMES.length} games`, className: 'status-seg' },
        { text: `sort: ${sort}`, className: 'status-seg' },
        { text: 'personal vote', className: '' },
      ]}
    >
      <GamesContent sort={sort} />
    </Window>
  );
}
