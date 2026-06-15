# 🖥️ mazu-space

> Un portfolio che finge di essere un desktop anni '90 — finestre draggabili, CRT scanlines, oscilloscopio audio e tutto il resto.

**[→ ilmazu-space.vercel.app](https://ilmazu-space.vercel.app/)**

---

<img width="1920" height="1080" alt="immagine" src="https://github.com/user-attachments/assets/3b05e423-59d6-4343-b34e-61f2ba9b7786" />

---

## Di che si tratta

Un desktop simulator fatto in React dove ogni sezione è una finestra che puoi spostare, ridimensionare e minimizzare.

**Features**

- CRT scanline overlay + noise overlay sempre attivi
- Glitch/shake periodici
- Audio ambientale (hum da console computer)
- Suono di avvio stile Mac al boot
- Discord presence in tempo reale via Lanyard API

---

## Stack

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-vanilla-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2024-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Vercel](https://img.shields.io/badge/Vercel-deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)

---

## Avvia in locale

```bash
npm install
npm run dev       # dev server → http://localhost:5173
npm run build     # build di produzione → dist/
npm run preview   # preview della build
```

---

## Struttura del progetto

```
mazu-space/
├── src/
│   ├── App.jsx               # app principale, gestione finestre, logica music
│   ├── main.jsx              # entry point
│   ├── index.css             # stili globali
│   ├── components/           # finestre, taskbar, boot screen, ecc.
│   ├── hooks/                # useLanyard, useScreenMode
│   ├── blog/                 # post markdown + loader
│   └── utils/                # audio helpers (fade in/out)
├── assets/                   # tracce musicali, cover art, wallpaper, ambient
├── public/                   # file statici (favicon)
├── index.html
├── vite.config.js
└── package.json
```

---

## Analytics

Vercel Analytics + Speed Insights integrati — tanto per vedere se qualcuno ci capita davvero.

---

*Fatto da [Il-Mazu](https://github.com/Il-Mazu)*
