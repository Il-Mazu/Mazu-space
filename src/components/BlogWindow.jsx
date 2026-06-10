export const posts = [
  { date: '2025.06.07', title: 'on machines dreaming', tags: '[#thoughts] [#glitch]' },
  { date: '2025.05.31', title: 'glitch as language', tags: '[#art] [#aesthetics]' },
  { date: '2025.05.18', title: 'bbs nostalgia', tags: '[#retro] [#protocol]' },
  { date: '2025.04.29', title: 'high tech, low life', tags: '[#cyberpunk] [#manifesto]' },
  { date: '2025.04.12', title: 'the city as circuit', tags: '[#urban] [#code]' },
  { date: '2025.03.04', title: 'why i still use winamp', tags: '[#music] [#tools]' },
];

export default function BlogWindow({ onNotif }) {
  return (
    <>
      <span className="c-dim">── latest entries ──────────────</span><br /><br />
      {posts.map((post, i) => (
        <div key={i} className="blog-entry" onClick={() => onNotif('// post not written yet')}>
          <div className="entry-date">{post.date}</div>
          <div className="entry-title"><span className="entry-arrow">»</span> {post.title}</div>
          <div className="entry-tags">{post.tags}</div>
        </div>
      ))}
    </>
  );
}
