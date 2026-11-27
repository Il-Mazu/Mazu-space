import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import projects from 'virtual:projects';
import { getProceduralTextures } from '../scenes/proceduralTextures.js';
import { createRelicScreenMaterial } from '../shaders/relicScreenMaterial.js';
import { sceneBus } from '../state/sceneBus.js';
import { playClickHit, playHoverTick } from '../audio/AudioEngine.js';
import { DISPLAY, MONO, useFontsReady } from '../utils/fonts.js';
import { worksLayout } from './worksLayout.js';

const SCREEN_W = 1.6;
const SCREEN_H = 0.9;

// Lancet niche: pointed arch outline with a rectangular screen recess.
function nicheGeometry() {
  const w = 1.05;
  const bottom = -1.35;
  const spring = 0.75;
  const apex = 1.75;
  const s = new THREE.Shape();
  s.moveTo(-w, bottom);
  s.lineTo(-w, spring);
  s.quadraticCurveTo(-w * 0.9, apex - 0.35, 0, apex);
  s.quadraticCurveTo(w * 0.9, apex - 0.35, w, spring);
  s.lineTo(w, bottom);
  s.closePath();
  const hole = new THREE.Path();
  const hw = SCREEN_W / 2 + 0.02;
  const hh = SCREEN_H / 2 + 0.02;
  hole.moveTo(-hw, -hh);
  hole.lineTo(hw, -hh);
  hole.lineTo(hw, hh);
  hole.lineTo(-hw, hh);
  hole.closePath();
  s.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.22, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 });
  geo.translate(0, 0, -0.22);
  return geo;
}

// Pointed arch traced as a line, lit red on hover.
function archLine() {
  const w = 0.92;
  const curve = new THREE.CurvePath();
  curve.add(new THREE.LineCurve3(new THREE.Vector3(-w, -1.25, 0), new THREE.Vector3(-w, 0.72, 0)));
  curve.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-w, 0.72, 0), new THREE.Vector3(-w * 0.9, 1.3, 0), new THREE.Vector3(0, 1.58, 0)));
  curve.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 1.58, 0), new THREE.Vector3(w * 0.9, 1.3, 0), new THREE.Vector3(w, 0.72, 0)));
  curve.add(new THREE.LineCurve3(new THREE.Vector3(w, 0.72, 0), new THREE.Vector3(w, -1.25, 0)));
  return new THREE.TubeGeometry(curve, 64, 0.012, 6, false);
}

function plaqueTexture(project) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 220;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#101013';
  ctx.fillRect(0, 0, 768, 220);
  ctx.strokeStyle = '#3a0a10';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 748, 200);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e9e4da';
  ctx.font = `82px ${DISPLAY}`;
  ctx.fillText(project.name, 384, 112, 700);
  ctx.fillStyle = '#ff3352';
  ctx.font = `26px ${MONO}`;
  const stack = (project.stack?.length ? project.stack : [project.language].filter(Boolean)).join('  ♰  ');
  ctx.fillText(stack.toLowerCase(), 384, 172, 700);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Video when the project has one (paused while the chapel is out of reach),
// otherwise the still image. Reduced motion always gets the still.
function useMedia(media, near) {
  const [tex, setTex] = useState(null);
  const videoRef = useRef(null);
  const still = media.image || media.poster;
  const wantsVideo = Boolean(media.video) && !sceneBus.reducedMotion;

  useEffect(() => {
    let alive = true;
    let made = null;
    if (wantsVideo) {
      const v = document.createElement('video');
      v.src = media.video;
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.preload = 'auto';
      videoRef.current = v;
      made = new THREE.VideoTexture(v);
      made.colorSpace = THREE.SRGBColorSpace;
      setTex(made);
    } else if (still) {
      new THREE.TextureLoader().load(still, (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        if (!alive) return t.dispose();
        made = t;
        setTex(t);
      });
    }
    return () => {
      alive = false;
      made?.dispose();
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
        videoRef.current = null;
      }
    };
  }, [media.video, still, wantsVideo]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (near) v.play().catch(() => {});
    else v.pause();
  }, [near, tex]);

  return tex;
}

function Reliquary({ project, index, slot, selected, onOpen, near }) {
  const fontsReady = useFontsReady();
  const { stoneBump, ashSprite } = useMemo(() => getProceduralTextures(), []);
  const nicheGeo = useMemo(() => nicheGeometry(), []);
  const lineGeo = useMemo(() => archLine(), []);
  const plaque = useMemo(() => plaqueTexture(project), [project, fontsReady]);
  const screenMat = useMemo(() => createRelicScreenMaterial(), []);
  const lineMatRef = useRef(null);
  const glowRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const tex = useMedia(project.media, near);

  useEffect(() => {
    screenMat.uniforms.map.value = tex;
    screenMat.uniforms.uHasMap.value = tex ? 1 : 0;
  }, [screenMat, tex]);
  useEffect(() => () => plaque.dispose(), [plaque]);
  useEffect(() => () => {
    screenMat.dispose();
    nicheGeo.dispose();
    lineGeo.dispose();
  }, [screenMat, nicheGeo, lineGeo]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const lit = hovered || selected;
    const u = screenMat.uniforms;
    u.uReveal.value = THREE.MathUtils.damp(u.uReveal.value, lit ? 1 : 0, 6, dt);
    u.uGlow.value = THREE.MathUtils.damp(u.uGlow.value, lit ? 1 : 0, 6, dt);
    const k = 0.35 + u.uGlow.value * 1.9;
    lineMatRef.current?.color.setRGB(1.6 * k, 0.12 * k, 0.24 * k);
    if (glowRef.current) glowRef.current.material.opacity = 0.05 + u.uGlow.value * 0.3;
  });

  const handlers = {
    onPointerOver: (e) => {
      e.stopPropagation();
      setHovered(true);
      playHoverTick();
      document.body.style.cursor = 'pointer';
    },
    onPointerOut: () => {
      setHovered(false);
      document.body.style.cursor = '';
    },
    onClick: (e) => {
      e.stopPropagation();
      playClickHit();
      onOpen(index);
    },
  };

  return (
    <group position={slot.pos} rotation={[0, slot.rotY, 0]}>
      {/* red light spilling out of the niche */}
      <mesh ref={glowRef} position={[0, 0.1, -0.35]}>
        <planeGeometry args={[3.4, 4.2]} />
        <meshBasicMaterial map={ashSprite} color={[1.2, 0.08, 0.16]} transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh geometry={nicheGeo} {...handlers}>
        <meshStandardMaterial color="#1b1b21" metalness={0.3} roughness={0.75} bumpMap={stoneBump} bumpScale={0.06} />
      </mesh>
      <mesh position={[0, 0, -0.2]}>
        <planeGeometry args={[SCREEN_W + 0.06, SCREEN_H + 0.06]} />
        <meshBasicMaterial color="#020203" />
      </mesh>
      <mesh position={[0, 0, -0.17]} material={screenMat} {...handlers}>
        <planeGeometry args={[SCREEN_W, SCREEN_H]} />
      </mesh>
      <mesh geometry={lineGeo} position={[0, 0, 0.04]}>
        <meshBasicMaterial ref={lineMatRef} color={[0.5, 0.04, 0.08]} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.92, 0.03]} {...handlers}>
        <planeGeometry args={[1.5, 0.43]} />
        <meshStandardMaterial map={plaque} roughness={0.85} metalness={0.15} />
      </mesh>
      {/* plinth */}
      <mesh position={[0, -1.62, -0.1]}>
        <boxGeometry args={[2.3, 0.5, 0.55]} />
        <meshStandardMaterial color="#141418" metalness={0.3} roughness={0.8} bumpMap={stoneBump} bumpScale={0.05} />
      </mesh>
    </group>
  );
}

export default function WorksChapel({ chapel, isMobile, selected, onOpenWork }) {
  const layout = useMemo(() => worksLayout(chapel, projects.length, isMobile), [chapel, isMobile]);
  const [near, setNear] = useState(false);

  useFrame(({ camera }) => {
    const d = camera.position.z - chapel.z;
    const isNear = d > -8 && d < 22;
    if (isNear !== near) setNear(isNear);
  });

  useEffect(() => () => {
    document.body.style.cursor = '';
  }, []);

  return (
    <group>
      {projects.map((p, i) => (
        <Reliquary
          key={p.repo}
          project={p}
          index={i}
          slot={layout[i]}
          selected={selected === i}
          onOpen={onOpenWork}
          near={near}
        />
      ))}
    </group>
  );
}
