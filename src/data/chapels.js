// The one list of chapels. Order here is the order along the nave: numerals,
// nav, scroll stops, camera path and scene placement are all derived from it.
//
// Camera beats are relative to the chapel: x is absolute, y is height above the
// nave floor at the chapel, z is the offset from the chapel's own z.
// `side` is where the chapel's text sits on screen; a beat can override it.

export const CHAPEL_SPACING = 22;

const CHAPEL_DEFS = [
  {
    id: 'hero',
    name: 'the eye',
    side: 'left',
    beats: [{ cam: [0, 2.67, 9.5], look: [0, 2.27, -2.0] }],
  },
  {
    id: 'about',
    name: 'whoami',
    side: 'left',
    beats: [
      { cam: [-1.8, 2.61, 8.5], look: [0.4, 2.31, 0] },
      // the chronicle: candles along the left wall, text on the right
      { cam: [1.4, 2.3, -1.0], look: [-4.2, 1.85, -10.0], side: 'right' },
    ],
  },
  {
    id: 'works',
    name: 'works',
    side: 'center',
    beats: [{ cam: [0, 2.55, 9.8], look: [0, 2.05, -1.5] }],
  },
  {
    id: 'live',
    name: 'live',
    side: 'left',
    beats: [{ cam: [0.15, 2.9, 9.2], look: [0, 2.5, 0] }],
  },
  {
    id: 'dump',
    name: 'dump',
    side: 'right',
    beats: [{ cam: [1.7, 2.46, 9.5], look: [0, 2.26, 0] }],
  },
  {
    id: 'games',
    name: 'hall of fame',
    side: 'left',
    beats: [{ cam: [-1.5, 2.29, 10.0], look: [0, 2.09, 0] }],
  },
  // Collection shelves. Enable once the photos and the item list exist.
  // {
  //   id: 'vault',
  //   name: 'vault',
  //   side: 'right',
  //   beats: [{ cam: [1.2, 2.4, 9.5], look: [0, 2.2, 0] }],
  // },
  {
    id: 'exit',
    name: 'guestbook',
    side: 'left',
    beats: [
      // the candle field in front of the apse
      { cam: [0.2, 3.3, 15.5], look: [0.6, 0.4, 6.4] },
      // ledger, links and the closing eye
      { cam: [0, 2.16, 9.5], look: [0, 1.96, -4.0], side: 'center' },
    ],
  },
];

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

// Nave slopes down as it goes deeper: +1.6 at z=+6, 4.8 units lower every 166.
export function naveFloorY(z) {
  return 1.6 - ((-z + 6) / 166) * 4.8 - 2.2;
}

const lastIndex = CHAPEL_DEFS.length - 1;
const stopCount = CHAPEL_DEFS.reduce((n, def) => n + def.beats.length, 0);
let stopCursor = 0;

export const CHAPELS = CHAPEL_DEFS.map((def, index) => {
  const z = -index * CHAPEL_SPACING;
  const floorY = naveFloorY(z);
  const beats = def.beats.map((b) => {
    const scrollPos = stopCount > 1 ? stopCursor / (stopCount - 1) : 0;
    stopCursor += 1;
    return {
      scrollPos,
      side: b.side || def.side,
      camPos: [b.cam[0], floorY + b.cam[1], z + b.cam[2]],
      lookAt: [b.look[0], floorY + b.look[1], z + b.look[2]],
    };
  });
  return {
    ...def,
    index,
    roman: ROMAN[index],
    z,
    floorY,
    scrollPos: beats[0].scrollPos,
    beats,
    camPos: beats[0].camPos,
    lookAt: beats[0].lookAt,
  };
});

// Every camera stop in order. Scroll progress maps evenly onto these.
export const CAMERA_STOPS = CHAPELS.flatMap((c) => c.beats.map((b, beat) => ({ ...b, chapel: c.index, beat })));

export const NAVE_END_Z = CHAPELS[lastIndex].z - 14;

export function chapelById(id) {
  return CHAPELS.find((c) => c.id === id);
}

export function chapelIndex(id) {
  return CHAPELS.findIndex((c) => c.id === id);
}
