import track0 from '../../assets/Musica/akiba-kagami.mp3';
import track1 from '../../assets/Musica/goreshit-fine-night.mp3';
import track2 from '../../assets/Musica/machine-girl-ghost.mp3';
import track3 from '../../assets/Musica/machine-girl-uzumaki.mp3';
import track4 from '../../assets/Musica/sewerslvt-mr-kill-myself.mp3';
import cover0 from '../../assets/covers/akiba-kagami.webp';
import cover1 from '../../assets/covers/goreshit-fine-night.webp';
import cover2 from '../../assets/covers/machine-girl-ghost.webp';
import cover3 from '../../assets/covers/machine-girl-uzumaki.webp';
import cover4 from '../../assets/covers/sewerslvt-mr-kill-myself.webp';
import bootSoundUrl from '../../assets/boot-sound.mp3';
import ambientSoundUrl from '../../assets/ambient-sound.mp3';

export const TRACKS = [
  { title: 'カガミ', artist: 'AKIBA', src: track0, cover: cover0, duration: 138 },
  { title: 'Fine Night', artist: 'Goreshit', src: track1, cover: cover1, duration: 316 },
  { title: 'Ghost', artist: 'Machine Girl', src: track2, cover: cover2, duration: 185 },
  { title: 'うずまき', artist: 'Machine Girl', src: track3, cover: cover3, duration: 232 },
  { title: 'Mr. Kill Myself', artist: 'Sewerslvt', src: track4, cover: cover4, duration: 471 },
];

export const BOOT_SOUND = bootSoundUrl;
export const AMBIENT_SOUND = ambientSoundUrl;
export const LOOP_LABELS = ['Repeat: off', 'Repeat: all', 'Repeat: one'];
