// Ukepengers egne figurer. Tegnet som enkel SVG (viewBox 0 0 120 120), så de
// er skarpe i alle størrelser og ikke krever bildefiler. Halvparten er søte og
// myke, halvparten er tøffere. Alle er egne figurer, ikke kopier av kjente
// merkevarer.

import type { ReactNode } from "react";

export type FigureGroup = "cute" | "cool";
export type Figure = { key: string; label: string; group: FigureGroup; bg: string; art: ReactNode };

const INK = "#2b2238";

function Eye({ x, y, r = 5.5, color = INK }: { x: number; y: number; r?: number; color?: string }) {
  return (
    <>
      <circle cx={x} cy={y} r={r} fill={color} />
      <circle cx={x + r * 0.35} cy={y - r * 0.38} r={r * 0.38} fill="#fff" />
    </>
  );
}

function Blush({ x, y, color = "#ff8fa3" }: { x: number; y: number; color?: string }) {
  return <ellipse cx={x} cy={y} rx={7} ry={4} fill={color} opacity={0.55} />;
}

function Smile({ x, y, w = 9, color = INK }: { x: number; y: number; w?: number; color?: string }) {
  return <path d={`M${x - w / 2} ${y} q${w / 2} ${w * 0.55} ${w} 0`} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" />;
}

function CatMouth({ x, y }: { x: number; y: number }) {
  return <path d={`M${x - 6} ${y} q3 4 6 0 q3 4 6 0`} stroke={INK} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
}

function HappyEye({ x, y }: { x: number; y: number }) {
  return <path d={`M${x - 5} ${y + 2} q5 -7 10 0`} stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />;
}

function AngryEye({ x, y, flip = false, iris = "#ffd23f" }: { x: number; y: number; flip?: boolean; iris?: string }) {
  const s = flip ? -1 : 1;
  return (
    <>
      <ellipse cx={x} cy={y} rx={6.5} ry={5.5} fill={iris} />
      <ellipse cx={x} cy={y} rx={1.8} ry={4.5} fill={INK} />
      <path d={`M${x - 8 * s} ${y - 9} L${x + 7 * s} ${y - 4}`} stroke={INK} strokeWidth={3.2} strokeLinecap="round" />
    </>
  );
}

export const FIGURES: Figure[] = [
  /* ---------- Søte ---------- */
  {
    key: "skyvalp",
    label: "Skyvalp",
    group: "cute",
    bg: "#cfe6ff",
    art: (
      <>
        <ellipse cx={26} cy={68} rx={11} ry={27} transform="rotate(18 26 68)" fill="#fff" stroke="#bcd7f5" strokeWidth={2} />
        <ellipse cx={94} cy={68} rx={11} ry={27} transform="rotate(-18 94 68)" fill="#fff" stroke="#bcd7f5" strokeWidth={2} />
        <ellipse cx={60} cy={64} rx={33} ry={29} fill="#fff" />
        <path d="M58 36 q-6 -10 4 -12 q8 2 2 10" fill="#fff" stroke="#bcd7f5" strokeWidth={2} />
        <Eye x={48} y={62} r={5.5} />
        <Eye x={72} y={62} r={5.5} />
        <path d="M36 84 q24 12 48 0 l-2 8 q-22 8 -44 0 z" fill="#7cc4ff" />
        <path d="M70 88 l6 12 l6 -10 z" fill="#5aaef5" />
        <Blush x={40} y={74} />
        <Blush x={80} y={74} />
        <Smile x={60} y={74} w={8} />
      </>
    ),
  },
  {
    key: "gnist",
    label: "Gnist",
    group: "cute",
    bg: "#fff0b3",
    art: (
      <>
        <ellipse cx={36} cy={38} rx={9} ry={14} transform="rotate(-28 36 38)" fill="#ffc94d" />
        <ellipse cx={84} cy={38} rx={9} ry={14} transform="rotate(28 84 38)" fill="#ffc94d" />
        <ellipse cx={36} cy={40} rx={4.5} ry={8} transform="rotate(-28 36 40)" fill="#ff9f6b" />
        <ellipse cx={84} cy={40} rx={4.5} ry={8} transform="rotate(28 84 40)" fill="#ff9f6b" />
        <circle cx={60} cy={68} r={33} fill="#ffc94d" />
        <path d="M60 33 q-10 -6 -4 -14 q2 8 10 6 q-2 6 -6 8 z" fill="#ff8a3d" />
        <ellipse cx={60} cy={82} rx={18} ry={12} fill="#ffe39a" />
        <Eye x={47} y={64} />
        <Eye x={73} y={64} />
        <Blush x={37} y={76} />
        <Blush x={83} y={76} />
        <Smile x={60} y={76} w={9} />
      </>
    ),
  },
  {
    key: "kvakk",
    label: "Kvakk",
    group: "cute",
    bg: "#d8f3cf",
    art: (
      <>
        <circle cx={42} cy={46} r={14} fill="#8fd16a" />
        <circle cx={78} cy={46} r={14} fill="#8fd16a" />
        <ellipse cx={60} cy={72} rx={38} ry={28} fill="#8fd16a" />
        <ellipse cx={60} cy={82} rx={24} ry={14} fill="#c6eba8" />
        <circle cx={42} cy={46} r={9} fill="#fff" />
        <circle cx={78} cy={46} r={9} fill="#fff" />
        <Eye x={43} y={47} r={4.5} />
        <Eye x={77} y={47} r={4.5} />
        <Blush x={34} y={70} />
        <Blush x={86} y={70} />
        <path d="M46 70 q14 10 28 0" stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />
      </>
    ),
  },
  {
    key: "pusi",
    label: "Pusi",
    group: "cute",
    bg: "#ffe0ec",
    art: (
      <>
        <path d="M30 50 L32 22 L54 40 Z" fill="#ffb3cf" />
        <path d="M34 44 L35 30 L46 39 Z" fill="#ff8fb6" />
        <path d="M90 50 L88 22 L66 40 Z" fill="#ffb3cf" />
        <path d="M86 44 L85 30 L74 39 Z" fill="#ff8fb6" />
        <ellipse cx={60} cy={68} rx={36} ry={30} fill="#ffb3cf" />
        <Eye x={47} y={64} />
        <Eye x={73} y={64} />
        <path d="M57 71 h6 l-3 3 z" fill="#e0567f" />
        <CatMouth x={60} y={75} />
        <path d="M24 70 h12 M24 77 h12 M84 70 h12 M84 77 h12" stroke={INK} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
      </>
    ),
  },
  {
    key: "bobble",
    label: "Bobble",
    group: "cute",
    bg: "#e4dcff",
    art: (
      <>
        {[46, 58, 70].map((y, i) => (
          <g key={y}>
            <ellipse cx={22 - i * 1} cy={y} rx={11} ry={5} transform={`rotate(${-20 + i * 20} ${22 - i} ${y})`} fill="#ff7fa8" />
            <ellipse cx={98 + i * 1} cy={y} rx={11} ry={5} transform={`rotate(${20 - i * 20} ${98 + i} ${y})`} fill="#ff7fa8" />
          </g>
        ))}
        <ellipse cx={60} cy={66} rx={36} ry={29} fill="#ffc1d6" />
        <Eye x={44} y={62} r={5} />
        <Eye x={76} y={62} r={5} />
        <Blush x={38} y={73} color="#ff6f9c" />
        <Blush x={82} y={73} color="#ff6f9c" />
        <path d="M50 72 q10 9 20 0" stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />
      </>
    ),
  },
  {
    key: "fersken",
    label: "Fersken",
    group: "cute",
    bg: "#ffe6cf",
    art: (
      <>
        <ellipse cx={45} cy={30} rx={9} ry={22} transform="rotate(-10 45 30)" fill="#ffc9a3" />
        <ellipse cx={45} cy={32} rx={4.5} ry={15} transform="rotate(-10 45 32)" fill="#ff9e8a" />
        <ellipse cx={75} cy={30} rx={9} ry={22} transform="rotate(10 75 30)" fill="#ffc9a3" />
        <ellipse cx={75} cy={32} rx={4.5} ry={15} transform="rotate(10 75 32)" fill="#ff9e8a" />
        <circle cx={60} cy={72} r={31} fill="#ffc9a3" />
        <Eye x={49} y={68} />
        <Eye x={71} y={68} />
        <ellipse cx={60} cy={76} rx={3.5} ry={2.5} fill="#e0567f" />
        <Blush x={41} y={80} />
        <Blush x={79} y={80} />
        <Smile x={60} y={81} w={7} />
      </>
    ),
  },
  {
    key: "mochi",
    label: "Mochi",
    group: "cute",
    bg: "#dff3ee",
    art: (
      <>
        <ellipse cx={26} cy={86} rx={10} ry={6} transform="rotate(-25 26 86)" fill="#eef2f2" />
        <ellipse cx={94} cy={86} rx={10} ry={6} transform="rotate(25 94 86)" fill="#eef2f2" />
        <ellipse cx={60} cy={70} rx={38} ry={30} fill="#fff" stroke="#d5e3e0" strokeWidth={2} />
        <HappyEye x={46} y={64} />
        <HappyEye x={74} y={64} />
        <Blush x={38} y={74} />
        <Blush x={82} y={74} />
        <ellipse cx={60} cy={72} rx={4} ry={3} fill={INK} />
        <path d="M54 78 q6 5 12 0" stroke={INK} strokeWidth={2.6} fill="none" strokeLinecap="round" />
        <circle cx={48} cy={76} r={1.3} fill={INK} opacity={0.5} />
        <circle cx={72} cy={76} r={1.3} fill={INK} opacity={0.5} />
      </>
    ),
  },
  {
    key: "hubro",
    label: "Hubro",
    group: "cute",
    bg: "#f4e3c6",
    art: (
      <>
        <path d="M30 40 L34 18 L48 34 Z" fill="#9b6b43" />
        <path d="M90 40 L86 18 L72 34 Z" fill="#9b6b43" />
        <ellipse cx={60} cy={66} rx={34} ry={36} fill="#b9875a" />
        <ellipse cx={60} cy={86} rx={20} ry={14} fill="#e9cfa6" />
        <circle cx={45} cy={56} r={14} fill="#f3dfbf" />
        <circle cx={75} cy={56} r={14} fill="#f3dfbf" />
        <circle cx={45} cy={56} r={8} fill="#ffb347" />
        <circle cx={75} cy={56} r={8} fill="#ffb347" />
        <Eye x={45} y={56} r={5} />
        <Eye x={75} y={56} r={5} />
        <path d="M55 66 L65 66 L60 75 Z" fill="#ff9f1c" />
        <path d="M52 84 q4 3 8 0 q4 3 8 0" stroke="#b9875a" strokeWidth={2} fill="none" />
      </>
    ),
  },
  {
    key: "baerbjorn",
    label: "Bærbjørn",
    group: "cute",
    bg: "#efdcff",
    art: (
      <>
        <circle cx={34} cy={42} r={12} fill="#b48ae8" />
        <circle cx={34} cy={42} r={6} fill="#d7bdf7" />
        <circle cx={86} cy={42} r={12} fill="#b48ae8" />
        <circle cx={86} cy={42} r={6} fill="#d7bdf7" />
        <circle cx={60} cy={68} r={33} fill="#b48ae8" />
        <ellipse cx={60} cy={78} rx={15} ry={11} fill="#e6d6fb" />
        <path d="M60 42 l2.4 5 5.4 .6 -4 3.7 1.1 5.3 -4.9 -2.8 -4.9 2.8 1.1 -5.3 -4 -3.7 5.4 -.6 z" fill="#ffe066" />
        <Eye x={47} y={64} />
        <Eye x={73} y={64} />
        <ellipse cx={60} cy={74} rx={4.5} ry={3.2} fill={INK} />
        <Smile x={60} y={80} w={8} />
        <Blush x={38} y={76} />
        <Blush x={82} y={76} />
      </>
    ),
  },
  {
    key: "spokis",
    label: "Spøkis",
    group: "cute",
    bg: "#dcefff",
    art: (
      <>
        <path d="M28 96 V60 a32 32 0 0 1 64 0 V96 l-8 -7 -8 7 -8 -7 -8 7 -8 -7 -8 7 -8 -7 z" fill="#fff" stroke="#c6dcf0" strokeWidth={2} />
        <ellipse cx={48} cy={60} rx={5} ry={7} fill={INK} />
        <ellipse cx={72} cy={60} rx={5} ry={7} fill={INK} />
        <circle cx={49.5} cy={57} r={2} fill="#fff" />
        <circle cx={73.5} cy={57} r={2} fill="#fff" />
        <Blush x={40} y={72} />
        <Blush x={80} y={72} />
        <ellipse cx={60} cy={74} rx={4} ry={5} fill={INK} />
        <ellipse cx={60} cy={76} rx={2.5} ry={2.2} fill="#ff7f9c" />
      </>
    ),
  },

  /* ---------- Tøffe ---------- */
  {
    key: "raptor",
    label: "Raptor",
    group: "cool",
    bg: "#cdeadb",
    art: (
      <>
        <path d="M18 74 Q16 40 52 36 Q76 34 100 50 Q108 56 100 64 L62 72 Q50 92 30 92 Q20 88 18 74 Z" fill="#3fa565" />
        <path d="M62 72 L100 64 Q100 70 94 72 L64 80 Z" fill="#2d7d4b" />
        {[70, 78, 86, 94].map((x) => (
          <path key={x} d={`M${x} ${66 + (100 - x) * 0.04} l3 6 l3 -7 z`} fill="#fff" />
        ))}
        <path d="M30 50 q8 -4 14 0 M26 62 q8 -4 14 0" stroke="#2d7d4b" strokeWidth={4} strokeLinecap="round" fill="none" />
        <AngryEye x={56} y={50} />
        <circle cx={94} cy={54} r={1.8} fill={INK} />
      </>
    ),
  },
  {
    key: "ninja",
    label: "Ninja",
    group: "cool",
    bg: "#c9d3ea",
    art: (
      <>
        <path d="M86 46 q16 -4 22 6 q-12 -2 -20 4 M86 50 q14 6 16 18 q-8 -10 -18 -12" fill="#e63946" />
        <circle cx={60} cy={64} r={34} fill="#2d3047" />
        <rect x={30} y={52} width={60} height={22} rx={11} fill="#f2c9a0" />
        <rect x={27} y={42} width={66} height={7} rx={3.5} fill="#e63946" />
        <AngryEye x={47} y={63} iris="#fff" />
        <AngryEye x={73} y={63} flip iris="#fff" />
      </>
    ),
  },
  {
    key: "drage",
    label: "Drage",
    group: "cool",
    bg: "#ffd8cc",
    art: (
      <>
        <path d="M38 44 Q30 24 18 20 Q32 34 32 48 Z" fill="#fff1d6" />
        <path d="M82 44 Q90 24 102 20 Q88 34 88 48 Z" fill="#fff1d6" />
        <path d="M50 34 l5 -10 5 10 5 -10 5 10" fill="#ff9f1c" />
        <ellipse cx={60} cy={62} rx={33} ry={30} fill="#e8553d" />
        <ellipse cx={60} cy={82} rx={22} ry={13} fill="#ff8f6b" />
        <circle cx={53} cy={80} r={2.5} fill={INK} />
        <circle cx={67} cy={80} r={2.5} fill={INK} />
        <AngryEye x={46} y={58} />
        <AngryEye x={74} y={58} flip />
        <path d="M54 90 l3 4 3 -4 3 4 3 -4" stroke="#fff" strokeWidth={2.4} fill="none" strokeLinejoin="round" />
      </>
    ),
  },
  {
    key: "robot",
    label: "Robot",
    group: "cool",
    bg: "#d3e3ea",
    art: (
      <>
        <line x1={60} y1={22} x2={60} y2={36} stroke="#5d7488" strokeWidth={4} />
        <circle cx={60} cy={20} r={6} fill="#ff4d6d" />
        <rect x={18} y={56} width={8} height={18} rx={3} fill="#5d7488" />
        <rect x={94} y={56} width={8} height={18} rx={3} fill="#5d7488" />
        <rect x={24} y={36} width={72} height={58} rx={16} fill="#8aa4b8" />
        <rect x={32} y={46} width={56} height={26} rx={10} fill="#1f2a44" />
        <rect x={40} y={54} width={12} height={10} rx={3} fill="#4ef0ff" />
        <rect x={68} y={54} width={12} height={10} rx={3} fill="#4ef0ff" />
        <path d="M44 82 h32 M44 87 h32" stroke="#5d7488" strokeWidth={3} strokeLinecap="round" />
        <circle cx={30} cy={42} r={2} fill="#5d7488" />
        <circle cx={90} cy={42} r={2} fill="#5d7488" />
      </>
    ),
  },
  {
    key: "hai",
    label: "Hai",
    group: "cool",
    bg: "#cbe8f7",
    art: (
      <>
        <path d="M60 18 L74 42 L50 42 Z" fill="#4f7fa3" />
        <ellipse cx={60} cy={66} rx={38} ry={30} fill="#5f8fb4" />
        <path d="M24 72 Q60 104 96 72 Q60 86 24 72 Z" fill="#f2f6fa" />
        <path d="M36 74 Q60 92 84 74" stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />
        <path d="M40 76 l3 5 3 -5 M50 79 l3 5 3 -5 M64 79 l3 5 3 -5 M74 76 l3 5 3 -5" stroke="#fff" strokeWidth={2.2} fill="none" strokeLinejoin="round" />
        <AngryEye x={44} y={58} iris="#fff" />
        <AngryEye x={76} y={58} flip iris="#fff" />
        <path d="M26 60 q-4 4 0 8 M94 60 q4 4 0 8" stroke="#4f7fa3" strokeWidth={2.4} fill="none" />
      </>
    ),
  },
  {
    key: "ulv",
    label: "Ulv",
    group: "cool",
    bg: "#dde2ec",
    art: (
      <>
        <path d="M28 54 L30 16 L54 40 Z" fill="#6c7487" />
        <path d="M33 46 L34 26 L46 39 Z" fill="#c9ced9" />
        <path d="M92 54 L90 16 L66 40 Z" fill="#6c7487" />
        <path d="M87 46 L86 26 L74 39 Z" fill="#c9ced9" />
        <path d="M24 60 Q26 36 60 34 Q94 36 96 60 Q94 82 76 90 L60 100 L44 90 Q26 82 24 60 Z" fill="#7d8597" />
        <path d="M44 74 Q60 64 76 74 L66 96 L60 100 L54 96 Z" fill="#e3e6ee" />
        <ellipse cx={60} cy={78} rx={6} ry={4.5} fill={INK} />
        <AngryEye x={45} y={60} iris="#ffcf3f" />
        <AngryEye x={75} y={60} flip iris="#ffcf3f" />
      </>
    ),
  },
  {
    key: "astronaut",
    label: "Astronaut",
    group: "cool",
    bg: "#24305e",
    art: (
      <>
        <circle cx={20} cy={22} r={1.8} fill="#fff" />
        <circle cx={100} cy={30} r={1.4} fill="#fff" />
        <circle cx={92} cy={100} r={1.6} fill="#fff" />
        <circle cx={16} cy={92} r={1.2} fill="#fff" />
        <path d="M98 14 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5 z" fill="#ffe066" />
        <rect x={22} y={56} width={10} height={20} rx={4} fill="#d8dde6" />
        <rect x={88} y={56} width={10} height={20} rx={4} fill="#d8dde6" />
        <circle cx={60} cy={64} r={36} fill="#f4f6fa" />
        <ellipse cx={60} cy={64} rx={27} ry={24} fill="#1d3a6e" />
        <ellipse cx={60} cy={64} rx={27} ry={24} fill="none" stroke="#ffb347" strokeWidth={3} />
        <path d="M44 52 q8 -8 18 -6" stroke="#9cc7ff" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.8} />
        <circle cx={76} cy={72} r={4} fill="#9cc7ff" opacity={0.5} />
      </>
    ),
  },
  {
    key: "ridder",
    label: "Ridder",
    group: "cool",
    bg: "#e8e2d4",
    art: (
      <>
        <path d="M60 26 Q70 8 86 14 Q72 16 68 30 Z" fill="#e63946" />
        <path d="M26 64 Q26 30 60 28 Q94 30 94 64 V92 Q94 98 88 98 H32 Q26 98 26 92 Z" fill="#b8c0cc" />
        <path d="M60 28 V98" stroke="#9aa3b1" strokeWidth={3} />
        <rect x={32} y={56} width={56} height={9} rx={4.5} fill="#2b2f3a" />
        <path d="M40 74 h10 M40 80 h10 M40 86 h10 M70 74 h10 M70 80 h10 M70 86 h10" stroke="#2b2f3a" strokeWidth={3} strokeLinecap="round" />
        <circle cx={32} cy={46} r={2.4} fill="#7c8696" />
        <circle cx={88} cy={46} r={2.4} fill="#7c8696" />
        <circle cx={52} cy={60.5} r={2} fill="#ffcf3f" />
        <circle cx={68} cy={60.5} r={2} fill="#ffcf3f" />
      </>
    ),
  },
  {
    key: "pirat",
    label: "Pirat",
    group: "cool",
    bg: "#cfe3f2",
    art: (
      <>
        <circle cx={60} cy={66} r={32} fill="#f2c9a0" />
        <path d="M27 56 Q30 28 60 28 Q90 28 93 56 Z" fill="#e63946" />
        <path d="M90 50 q14 2 16 14 q-8 -6 -16 -6" fill="#e63946" />
        {[[44, 40], [60, 36], [76, 42], [52, 48], [70, 50]].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={2.6} fill="#fff" />
        ))}
        <path d="M30 58 L90 74" stroke={INK} strokeWidth={2.4} />
        <ellipse cx={72} cy={66} rx={9} ry={8} fill={INK} />
        <Eye x={47} y={66} r={5} />
        <path d="M46 59 l9 2" stroke={INK} strokeWidth={3} strokeLinecap="round" />
        <path d="M46 82 q14 8 28 -2" stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />
        <rect x={60} y={82} width={5} height={5} rx={1} fill="#ffcf3f" />
        <path d="M40 88 q20 12 40 0" stroke="#c99a74" strokeWidth={2} strokeDasharray="2 3" fill="none" />
      </>
    ),
  },
  {
    key: "kulpanda",
    label: "Kul panda",
    group: "cool",
    bg: "#d6f0df",
    art: (
      <>
        <circle cx={33} cy={40} r={12} fill={INK} />
        <circle cx={87} cy={40} r={12} fill={INK} />
        <circle cx={60} cy={66} r={34} fill="#fff" />
        <path d="M30 58 h60 v4 q-2 12 -14 12 q-10 0 -12 -10 h-8 q-2 10 -12 10 q-12 0 -14 -12 z" fill={INK} />
        <path d="M38 62 l8 -2 M70 62 l8 -2" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" opacity={0.8} />
        <ellipse cx={60} cy={82} rx={5} ry={3.6} fill={INK} />
        <path d="M54 89 q8 4 14 -3" stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />
      </>
    ),
  },
];

const BY_KEY: Record<string, Figure> = Object.fromEntries(FIGURES.map((f) => [f.key, f]));

export function getFigure(key?: string | null) {
  return key ? BY_KEY[key] : undefined;
}
