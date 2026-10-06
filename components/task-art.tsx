// Ukepengers egne oppgavebilder. Tegnet som enkel SVG (viewBox 0 0 120 120) i
// samme myke stil som barnas figurer, så de er skarpe i alle størrelser og ikke
// krever bildefiler. Bildet viser selve handlingen («dekke bordet» er en dekket
// kuvert, «rydde av bordet» er en tallerkenstabel som bæres vekk), så barn som
// ikke kan lese kjenner igjen oppgaven. Oppgaver uten eget bilde får emoji.

import type { ReactNode } from "react";

const INK = "#2b2238";
const WOOD = "#d9a066";
const WOOD_DARK = "#b97a45";
const STEEL = "#8f9bab";
const STEEL_LIGHT = "#b9c3cf";

function Sparkle({ x, y, s = 7, color = "#ffd23f" }: { x: number; y: number; s?: number; color?: string }) {
  return <path d={`M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s} Z`} fill={color} />;
}

function Bubble({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <>
      <circle cx={x} cy={y} r={r} fill="#fff" stroke="#9fd0f2" strokeWidth={2} />
      <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.25} fill="#cfeaff" />
    </>
  );
}

function Plate({ cx, cy, rx, ry }: { cx: number; cy: number; rx: number; ry: number }) {
  return (
    <>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#fff" stroke="#d8e2ea" strokeWidth={2.5} />
      <ellipse cx={cx} cy={cy} rx={rx * 0.6} ry={ry * 0.6} fill="#f3f7fa" />
    </>
  );
}

type Art = { bg: string; art: ReactNode };

export const TASK_ART: Record<string, Art> = {
  "dekke-bordet": {
    bg: "#fff1d6",
    art: (
      <>
        <rect x={12} y={26} width={96} height={72} rx={16} fill="#ffb59e" />
        <rect x={12} y={26} width={96} height={72} rx={16} fill="none" stroke="#ff9a7d" strokeWidth={3} strokeDasharray="2 6" />
        <circle cx={60} cy={62} r={24} fill="#fff" stroke="#f0ddd4" strokeWidth={3} />
        <circle cx={60} cy={62} r={14} fill="#fff8f3" stroke="#f3e6de" strokeWidth={2} />
        {/* gaffel */}
        <rect x={25} y={56} width={5} height={30} rx={2.5} fill={STEEL} />
        <rect x={21.5} y={46} width={12} height={12} rx={4} fill={STEEL} />
        <rect x={21.5} y={36} width={2.6} height={13} rx={1.3} fill={STEEL} />
        <rect x={26.2} y={36} width={2.6} height={13} rx={1.3} fill={STEEL} />
        <rect x={30.9} y={36} width={2.6} height={13} rx={1.3} fill={STEEL} />
        {/* kniv */}
        <rect x={90} y={38} width={6} height={48} rx={3} fill={STEEL} />
        <path d="M90 41 q0 -6 6 -6 v26 h-6 z" fill={STEEL_LIGHT} />
        {/* glass */}
        <circle cx={96} cy={24} r={10} fill="#cfeaff" stroke="#8cc8ef" strokeWidth={2.5} />
        <circle cx={93} cy={21} r={2.5} fill="#fff" />
        <Sparkle x={22} y={18} s={8} />
      </>
    ),
  },
  "rydde-bordet": {
    bg: "#e3f1ff",
    art: (
      <>
        <rect x={10} y={90} width={100} height={9} rx={4.5} fill={WOOD} />
        <rect x={18} y={98} width={7} height={16} rx={3} fill={WOOD_DARK} />
        <rect x={95} y={98} width={7} height={16} rx={3} fill={WOOD_DARK} />
        <circle cx={30} cy={88} r={2} fill={WOOD_DARK} />
        <circle cx={38} cy={87} r={1.6} fill={WOOD_DARK} />
        <circle cx={86} cy={88} r={2} fill={WOOD_DARK} />
        <Plate cx={52} cy={70} rx={26} ry={7} />
        <Plate cx={52} cy={61} rx={26} ry={7} />
        <Plate cx={52} cy={52} rx={26} ry={7} />
        <rect x={42} y={26} width={18} height={20} rx={5} fill="#ff8f8f" />
        <path d="M60 31 q9 0 9 7 q0 7 -9 7" stroke="#ff8f8f" strokeWidth={4} fill="none" />
        <path d="M86 70 q16 -20 4 -44" stroke="#3aa76d" strokeWidth={5} fill="none" strokeLinecap="round" />
        <path d="M82 30 l8 -8 l5 11 z" fill="#3aa76d" />
      </>
    ),
  },
  "torke-bord": {
    bg: "#e0f5f1",
    art: (
      <>
        <rect x={10} y={40} width={100} height={60} rx={14} fill="#e8c194" />
        <path d="M24 82 q14 -12 28 0 t28 0 t26 -4" stroke="#fff" strokeWidth={9} fill="none" strokeLinecap="round" opacity={0.75} />
        <g transform="rotate(-18 70 58)">
          <rect x={56} y={44} width={34} height={22} rx={7} fill="#ffd23f" />
          <rect x={56} y={44} width={34} height={8} rx={4} fill="#6cc070" />
        </g>
        <Sparkle x={30} y={56} s={7} color="#fff" />
        <Sparkle x={94} y={30} s={9} />
        <Sparkle x={20} y={28} s={6} />
      </>
    ),
  },
  oppvaskmaskin: {
    bg: "#e0f5f1",
    art: (
      <>
        <rect x={22} y={14} width={76} height={84} rx={12} fill="#d5dde7" />
        <rect x={22} y={14} width={76} height={16} rx={10} fill="#aab7c6" />
        <circle cx={34} cy={22} r={3} fill="#fff" />
        <circle cx={44} cy={22} r={3} fill="#6cc070" />
        <rect x={30} y={36} width={60} height={52} rx={6} fill="#eef3f7" />
        <ellipse cx={42} cy={62} rx={6} ry={16} fill="#fff" stroke="#cfdbe6" strokeWidth={2.5} />
        <ellipse cx={54} cy={62} rx={6} ry={16} fill="#fff" stroke="#cfdbe6" strokeWidth={2.5} />
        <ellipse cx={66} cy={62} rx={6} ry={16} fill="#fff" stroke="#cfdbe6" strokeWidth={2.5} />
        <rect x={74} y={58} width={12} height={16} rx={3} fill="#7cc4ff" />
        <rect x={30} y={78} width={60} height={4} rx={2} fill="#aab7c6" />
        <rect x={16} y={96} width={88} height={14} rx={5} fill="#b8c4d2" />
        <Bubble x={92} y={40} r={6} />
        <Bubble x={100} y={26} r={4} />
      </>
    ),
  },
  oppvask: {
    bg: "#e3f1ff",
    art: (
      <>
        <rect x={56} y={22} width={8} height={30} rx={3} fill={STEEL} />
        <rect x={56} y={18} width={28} height={9} rx={4.5} fill={STEEL} />
        <rect x={78} y={18} width={6} height={14} rx={3} fill={STEEL} />
        <rect x={14} y={56} width={92} height={46} rx={16} fill="#cfd8e3" />
        <rect x={20} y={56} width={80} height={12} rx={6} fill="#9fd0f2" />
        <ellipse cx={48} cy={64} rx={20} ry={11} fill="#fff" stroke="#d8e2ea" strokeWidth={2.5} transform="rotate(-12 48 64)" />
        <g transform="rotate(10 86 70)">
          <rect x={74} y={62} width={24} height={14} rx={4} fill="#ffd23f" />
          <rect x={74} y={62} width={24} height={5} rx={2.5} fill="#6cc070" />
        </g>
        <Bubble x={30} y={48} r={7} />
        <Bubble x={74} y={46} r={5} />
        <Bubble x={92} y={48} r={4} />
        <Bubble x={40} y={36} r={4} />
      </>
    ),
  },
  "lage-mat": {
    bg: "#ffe8d9",
    art: (
      <>
        <path d="M44 32 q-6 -6 0 -12 q6 -6 0 -12" stroke="#c9b8a8" strokeWidth={4} fill="none" strokeLinecap="round" />
        <path d="M60 30 q-6 -6 0 -12 q6 -6 0 -12" stroke="#c9b8a8" strokeWidth={4} fill="none" strokeLinecap="round" />
        <path d="M76 32 q-6 -6 0 -12 q6 -6 0 -12" stroke="#c9b8a8" strokeWidth={4} fill="none" strokeLinecap="round" />
        <rect x={18} y={58} width={14} height={8} rx={4} fill="#c94a4a" />
        <rect x={88} y={58} width={14} height={8} rx={4} fill="#c94a4a" />
        <rect x={28} y={46} width={64} height={46} rx={12} fill="#ff6b6b" />
        <ellipse cx={60} cy={46} rx={36} ry={8} fill="#e05252" />
        <rect x={54} y={34} width={12} height={8} rx={4} fill="#c94a4a" />
        <rect x={34} y={60} width={52} height={6} rx={3} fill="#fff" opacity={0.35} />
        <rect x={20} y={96} width={80} height={8} rx={4} fill="#5b5b6b" />
        <path d="M44 96 q4 -8 8 0 M56 96 q4 -8 8 0 M68 96 q4 -8 8 0" stroke="#ff9f1c" strokeWidth={3} fill="none" strokeLinecap="round" />
      </>
    ),
  },
  matpakke: {
    bg: "#eaf6e1",
    art: (
      <>
        <rect x={22} y={26} width={76} height={22} rx={9} fill="#9fd3ff" transform="rotate(-10 60 48)" />
        <rect x={18} y={52} width={84} height={46} rx={12} fill="#7cc4ff" />
        <rect x={26} y={44} width={40} height={30} rx={8} fill="#f2c27b" stroke="#d49a4a" strokeWidth={3} />
        <path d="M28 58 q5 -5 10 0 t10 0 t10 0 t8 0" stroke="#6cc070" strokeWidth={5} fill="none" strokeLinecap="round" />
        <rect x={28} y={60} width={36} height={6} rx={3} fill="#ff8f8f" />
        <circle cx={82} cy={66} r={12} fill="#ff6b6b" />
        <path d="M82 54 q2 -6 8 -6" stroke="#6b4a2b" strokeWidth={3} fill="none" strokeLinecap="round" />
        <ellipse cx={88} cy={52} rx={5} ry={3} fill="#6cc070" />
        <rect x={18} y={74} width={84} height={6} fill="#5aaef5" />
      </>
    ),
  },
  "rydde-rommet": {
    bg: "#efe9ff",
    art: (
      <>
        <circle cx={42} cy={54} r={14} fill="#ffd23f" />
        <path d="M30 50 q12 6 24 0" stroke="#ff9f1c" strokeWidth={3} fill="none" />
        <circle cx={74} cy={46} r={13} fill="#c98b55" />
        <circle cx={64} cy={36} r={5} fill="#c98b55" />
        <circle cx={84} cy={36} r={5} fill="#c98b55" />
        <circle cx={70} cy={45} r={2.2} fill={INK} />
        <circle cx={78} cy={45} r={2.2} fill={INK} />
        <ellipse cx={74} cy={51} rx={4} ry={3} fill="#f2c9a0" />
        <rect x={20} y={60} width={80} height={42} rx={9} fill="#9b8cf7" />
        <rect x={20} y={60} width={80} height={10} rx={5} fill="#7f6ff0" />
        <rect x={52} y={78} width={16} height={8} rx={4} fill="#fff" opacity={0.6} />
        <Sparkle x={24} y={26} s={8} />
        <Sparkle x={98} y={22} s={6} />
      </>
    ),
  },
  leker: {
    bg: "#fff1d6",
    art: (
      <>
        <rect x={24} y={30} width={30} height={18} rx={3} fill="#ff6b6b" />
        <circle cx={32} cy={28} r={4} fill="#ff6b6b" />
        <circle cx={46} cy={28} r={4} fill="#ff6b6b" />
        <rect x={60} y={20} width={30} height={18} rx={3} fill="#4ecdc4" transform="rotate(14 75 29)" />
        <rect x={46} y={46} width={28} height={16} rx={3} fill="#ffd23f" />
        <circle cx={53} cy={44} r={4} fill="#ffd23f" />
        <circle cx={67} cy={44} r={4} fill="#ffd23f" />
        <path d="M60 62 v8 m-6 -5 l6 6 l6 -6" stroke="#3aa76d" strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 76 h84 l-8 28 a6 6 0 0 1 -6 4 h-56 a6 6 0 0 1 -6 -4 z" fill="#6cc070" />
        <path d="M30 84 h60 M34 94 h52" stroke="#4fa356" strokeWidth={3} strokeLinecap="round" />
      </>
    ),
  },
  seng: {
    bg: "#e3f1ff",
    art: (
      <>
        <rect x={12} y={38} width={12} height={62} rx={5} fill={WOOD} />
        <rect x={12} y={80} width={96} height={14} rx={5} fill={WOOD} />
        <rect x={16} y={92} width={7} height={14} rx={3} fill={WOOD_DARK} />
        <rect x={98} y={92} width={7} height={14} rx={3} fill={WOOD_DARK} />
        <rect x={22} y={64} width={84} height={18} rx={7} fill="#fff" />
        <ellipse cx={38} cy={62} rx={14} ry={9} fill="#fff" stroke="#d8e2ea" strokeWidth={2.5} />
        <rect x={50} y={56} width={58} height={26} rx={9} fill="#7cc4ff" />
        <path d="M50 64 h58" stroke="#5aaef5" strokeWidth={4} />
        <Sparkle x={86} y={36} s={9} />
        <Sparkle x={62} y={30} s={6} />
      </>
    ),
  },
  stovsuger: {
    bg: "#efe9ff",
    art: (
      <>
        <path d="M70 74 C 40 66, 34 40, 46 26" stroke="#5b5b6b" strokeWidth={6} fill="none" strokeLinecap="round" />
        <path d="M46 26 L32 88" stroke={STEEL} strokeWidth={6} strokeLinecap="round" />
        <rect x={16} y={86} width={34} height={11} rx={5} fill="#5b5b6b" />
        <rect x={60} y={66} width={42} height={30} rx={15} fill="#9b8cf7" />
        <rect x={68} y={70} width={20} height={8} rx={4} fill="#fff" opacity={0.45} />
        <circle cx={70} cy={98} r={7} fill={INK} />
        <circle cx={70} cy={98} r={2.5} fill={STEEL_LIGHT} />
        <circle cx={94} cy={98} r={7} fill={INK} />
        <circle cx={94} cy={98} r={2.5} fill={STEEL_LIGHT} />
        <circle cx={14} cy={80} r={2.5} fill="#c9b8a8" />
        <circle cx={22} cy={76} r={2} fill="#c9b8a8" />
        <Sparkle x={96} y={30} s={8} />
      </>
    ),
  },
  soppel: {
    bg: "#e0f5f1",
    art: (
      <>
        <rect x={50} y={18} width={20} height={9} rx={4.5} fill="none" stroke="#4fa356" strokeWidth={4} />
        <rect x={26} y={26} width={68} height={12} rx={6} fill="#4fa356" />
        <path d="M32 40 h56 l-6 56 a7 7 0 0 1 -7 6 h-30 a7 7 0 0 1 -7 -6 z" fill="#6cc070" />
        <path d="M46 50 v40 M60 50 v42 M74 50 v40" stroke="#4fa356" strokeWidth={4} strokeLinecap="round" />
        <path d="M84 36 l10 -10" stroke="#3a3a4a" strokeWidth={4} strokeLinecap="round" opacity={0.5} />
      </>
    ),
  },
  pant: {
    bg: "#e3f1ff",
    art: (
      <>
        <rect x={30} y={14} width={12} height={14} rx={3} fill="#5aaef5" />
        <path d="M28 30 q0 -4 6 -6 h4 q6 2 6 6 l4 10 v58 a6 6 0 0 1 -6 6 h-12 a6 6 0 0 1 -6 -6 v-58 z" fill="#9fd3ff" stroke="#5aaef5" strokeWidth={2.5} />
        <rect x={26} y={56} width={22} height={18} rx={3} fill="#fff" opacity={0.85} />
        <rect x={58} y={46} width={26} height={56} rx={7} fill="#ff6b6b" />
        <ellipse cx={71} cy={46} rx={13} ry={4} fill="#ff9a9a" />
        <rect x={62} y={64} width={18} height={16} rx={3} fill="#fff" opacity={0.6} />
        <circle cx={96} cy={84} r={14} fill="#ffd23f" stroke="#e8b400" strokeWidth={3} />
        <circle cx={96} cy={84} r={8} fill="none" stroke="#e8b400" strokeWidth={2.5} />
      </>
    ),
  },
  klaer: {
    bg: "#ffe8f0",
    art: (
      <>
        <path d="M60 30 q0 -12 8 -12 q7 0 7 7" stroke={STEEL} strokeWidth={4} fill="none" strokeLinecap="round" />
        <path d="M60 30 L28 46 h64 z" stroke={STEEL} strokeWidth={4} fill="none" strokeLinejoin="round" />
        <path d="M30 46 L48 40 Q60 48 72 40 L90 46 L100 64 L86 70 L84 104 H36 L34 70 L20 64 Z" fill="#ff8fa3" />
        <rect x={36} y={72} width={48} height={8} fill="#fff" opacity={0.55} />
        <rect x={35} y={88} width={50} height={6} fill="#fff" opacity={0.35} />
      </>
    ),
  },
  brette: {
    bg: "#fff1d6",
    art: (
      <>
        <rect x={22} y={80} width={76} height={20} rx={6} fill="#7cc4ff" />
        <path d="M30 90 h60" stroke="#5aaef5" strokeWidth={3} />
        <rect x={28} y={60} width={64} height={20} rx={6} fill="#ffd23f" />
        <path d="M36 70 h48" stroke="#e8b400" strokeWidth={3} />
        <rect x={34} y={40} width={52} height={20} rx={6} fill="#ff8fa3" />
        <path d="M42 50 h36" stroke="#f06f8c" strokeWidth={3} />
        <Sparkle x={96} y={30} s={9} />
        <Sparkle x={22} y={34} s={6} />
      </>
    ),
  },
  sko: {
    bg: "#e3f1ff",
    art: (
      <>
        <path d="M14 82 q0 -16 14 -18 l20 -4 q8 -12 20 -6 l16 14 q20 4 22 16 v8 H14 z" fill="#ff6b6b" />
        <rect x={12} y={88} width={96} height={11} rx={5} fill="#fff" stroke="#d8e2ea" strokeWidth={2.5} />
        <path d="M52 62 l8 6 M58 58 l8 6 M64 56 l8 6" stroke="#fff" strokeWidth={3.5} strokeLinecap="round" />
        <circle cx={30} cy={76} r={4} fill="#fff" opacity={0.6} />
      </>
    ),
  },
  hund: {
    bg: "#fff1d6",
    art: (
      <>
        <path d="M14 18 Q30 40 46 66" stroke="#ff6b6b" strokeWidth={4} fill="none" strokeLinecap="round" />
        <circle cx={14} cy={18} r={5} fill="#ff6b6b" />
        <ellipse cx={72} cy={82} rx={28} ry={15} fill={WOOD} />
        <rect x={52} y={88} width={8} height={18} rx={4} fill={WOOD_DARK} />
        <rect x={84} y={88} width={8} height={18} rx={4} fill={WOOD_DARK} />
        <path d="M98 76 q12 -8 8 -20" stroke={WOOD} strokeWidth={6} fill="none" strokeLinecap="round" />
        <circle cx={48} cy={66} r={17} fill={WOOD} />
        <ellipse cx={38} cy={62} rx={6} ry={12} fill={WOOD_DARK} transform="rotate(20 38 62)" />
        <circle cx={52} cy={62} r={2.6} fill={INK} />
        <ellipse cx={60} cy={70} rx={4} ry={3} fill={INK} />
        <rect x={40} y={78} width={18} height={5} rx={2.5} fill="#ff6b6b" />
      </>
    ),
  },
  "mate-dyr": {
    bg: "#e0f5f1",
    art: (
      <>
        <circle cx={44} cy={70} r={6} fill="#a8703f" />
        <circle cx={56} cy={66} r={6} fill="#c98b55" />
        <circle cx={68} cy={69} r={6} fill="#a8703f" />
        <circle cx={78} cy={72} r={5} fill="#c98b55" />
        <circle cx={50} cy={74} r={5} fill="#c98b55" />
        <circle cx={62} cy={74} r={5} fill="#a8703f" />
        <path d="M22 74 h76 l-8 22 a6 6 0 0 1 -6 4 h-48 a6 6 0 0 1 -6 -4 z" fill="#ff6b6b" />
        <rect x={22} y={74} width={76} height={7} rx={3.5} fill="#e05252" />
        <g fill="#c98b55">
          <ellipse cx={86} cy={34} rx={8} ry={7} />
          <circle cx={76} cy={24} r={3.5} />
          <circle cx={84} cy={20} r={3.5} />
          <circle cx={93} cy={21} r={3.5} />
          <circle cx={99} cy={28} r={3.5} />
        </g>
      </>
    ),
  },
  lekser: {
    bg: "#efe9ff",
    art: (
      <>
        <rect x={22} y={18} width={58} height={84} rx={7} fill="#fff" stroke="#cfd8e3" strokeWidth={3} />
        <path d="M32 40 h40 M32 52 h40 M32 64 h40 M32 76 h28" stroke="#c9d6f2" strokeWidth={3} strokeLinecap="round" />
        <circle cx={22} cy={30} r={3} fill="#9b8cf7" />
        <circle cx={22} cy={50} r={3} fill="#9b8cf7" />
        <circle cx={22} cy={70} r={3} fill="#9b8cf7" />
        <circle cx={22} cy={90} r={3} fill="#9b8cf7" />
        <g transform="rotate(32 88 64)">
          <rect x={82} y={26} width={13} height={56} rx={2} fill="#ffd23f" />
          <rect x={82} y={20} width={13} height={9} rx={2} fill="#ff8fa3" />
          <path d="M82 82 h13 l-6.5 14 z" fill="#f2c27b" />
          <path d="M86.5 91 h4 l-2 5 z" fill={INK} />
        </g>
      </>
    ),
  },
  bok: {
    bg: "#e0f5f1",
    art: (
      <>
        <path d="M60 36 C46 28 28 28 14 32 V94 C28 90 46 90 60 98 C74 90 92 90 106 94 V32 C92 28 74 28 60 36 Z" fill="#4ecdc4" />
        <path d="M60 38 C47 31 31 31 19 34 V88 C31 85 47 85 60 92 Z" fill="#fff" />
        <path d="M60 38 C73 31 89 31 101 34 V88 C89 85 73 85 60 92 Z" fill="#fff" />
        <path d="M60 38 V92" stroke="#cfd8e3" strokeWidth={2} />
        <path d="M26 46 h24 M26 56 h24 M26 66 h20 M70 46 h24 M70 56 h24 M70 66 h18" stroke="#c9d6f2" strokeWidth={3} strokeLinecap="round" />
        <Sparkle x={96} y={18} s={8} />
      </>
    ),
  },
  musikk: {
    bg: "#ffe8d9",
    art: (
      <>
        <rect x={44} y={26} width={50} height={10} rx={4} fill={INK} transform="rotate(-8 69 31)" />
        <rect x={44} y={30} width={6} height={56} rx={3} fill={INK} />
        <rect x={88} y={24} width={6} height={56} rx={3} fill={INK} />
        <ellipse cx={38} cy={88} rx={13} ry={10} fill={INK} transform="rotate(-20 38 88)" />
        <ellipse cx={82} cy={82} rx={13} ry={10} fill={INK} transform="rotate(-20 82 82)" />
        <Sparkle x={22} y={40} s={8} color="#ff9f1c" />
        <Sparkle x={104} y={56} s={6} color="#ff6b6b" />
      </>
    ),
  },
  sekk: {
    bg: "#fff1d6",
    art: (
      <>
        <path d="M48 26 q0 -12 12 -12 q12 0 12 12" stroke="#c94a4a" strokeWidth={5} fill="none" />
        <rect x={28} y={24} width={64} height={80} rx={20} fill="#ff6b6b" />
        <path d="M28 50 q32 14 64 0 v-6 q-32 -18 -64 0 z" fill="#e05252" />
        <rect x={38} y={66} width={44} height={28} rx={9} fill="#e05252" />
        <rect x={52} y={64} width={16} height={6} rx={3} fill="#ffd23f" />
      </>
    ),
  },
  tannborste: {
    bg: "#e3f1ff",
    art: (
      <>
        <g transform="rotate(-35 60 60)">
          <rect x={20} y={56} width={64} height={12} rx={6} fill="#7cc4ff" />
          <rect x={80} y={54} width={22} height={16} rx={5} fill="#5aaef5" />
          <rect x={82} y={40} width={4} height={14} rx={2} fill="#fff" stroke="#cfdbe6" strokeWidth={1.2} />
          <rect x={88} y={40} width={4} height={14} rx={2} fill="#fff" stroke="#cfdbe6" strokeWidth={1.2} />
          <rect x={94} y={40} width={4} height={14} rx={2} fill="#fff" stroke="#cfdbe6" strokeWidth={1.2} />
          <path d="M80 38 q6 -8 12 0 q6 -8 10 0" stroke="#fff" strokeWidth={7} fill="none" strokeLinecap="round" />
          <path d="M80 38 q6 -8 12 0" stroke="#7cc4ff" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </g>
        <Sparkle x={28} y={32} s={8} />
        <Bubble x={98} y={92} r={6} />
      </>
    ),
  },
  bad: {
    bg: "#e0f5f1",
    art: (
      <>
        <rect x={16} y={38} width={8} height={22} rx={3} fill={STEEL} />
        <rect x={16} y={36} width={18} height={7} rx={3.5} fill={STEEL} />
        <Bubble x={36} y={54} r={8} />
        <Bubble x={50} y={50} r={6} />
        <Bubble x={92} y={54} r={7} />
        <ellipse cx={74} cy={50} rx={11} ry={8} fill="#ffd23f" />
        <circle cx={66} cy={40} r={7} fill="#ffd23f" />
        <path d="M58 41 l-6 2 l6 2 z" fill="#ff9f1c" />
        <circle cx={64} cy={38} r={1.6} fill={INK} />
        <rect x={12} y={58} width={96} height={30} rx={13} fill="#fff" stroke="#cfd8e3" strokeWidth={3} />
        <rect x={22} y={86} width={8} height={12} rx={3} fill={STEEL} />
        <rect x={90} y={86} width={8} height={12} rx={3} fill={STEEL} />
      </>
    ),
  },
  sno: {
    bg: "#e3f1ff",
    art: (
      <>
        <path d="M0 92 q20 -12 40 -4 q20 -10 40 -2 q20 -8 40 0 V120 H0 z" fill="#fff" />
        <path d="M34 16 L62 78" stroke={WOOD} strokeWidth={7} strokeLinecap="round" />
        <rect x={26} y={10} width={18} height={8} rx={4} fill={WOOD_DARK} transform="rotate(24 35 14)" />
        <path d="M50 74 l28 -10 l10 24 l-30 10 z" fill="#ff6b6b" />
        <circle cx={66} cy={70} r={7} fill="#fff" />
        <circle cx={76} cy={68} r={5} fill="#fff" />
        <Sparkle x={92} y={26} s={6} color="#fff" />
        <Sparkle x={18} y={50} s={5} color="#fff" />
        <Sparkle x={100} y={52} s={4} color="#fff" />
      </>
    ),
  },
  rake: {
    bg: "#ffe8d9",
    art: (
      <>
        <path d="M30 14 L70 84" stroke={WOOD} strokeWidth={6} strokeLinecap="round" />
        <g transform="rotate(-30 70 86)">
          <rect x={50} y={82} width={40} height={7} rx={3} fill={STEEL} />
          <path d="M53 89 v10 M60 89 v10 M67 89 v10 M74 89 v10 M81 89 v10 M88 89 v10" stroke={STEEL} strokeWidth={3} strokeLinecap="round" />
        </g>
        <ellipse cx={26} cy={96} rx={10} ry={6} fill="#ff9f1c" transform="rotate(-20 26 96)" />
        <ellipse cx={44} cy={104} rx={9} ry={5} fill="#ff6b6b" transform="rotate(15 44 104)" />
        <ellipse cx={96} cy={60} rx={10} ry={6} fill="#ffd23f" transform="rotate(30 96 60)" />
        <ellipse cx={98} cy={100} rx={9} ry={5} fill="#ff9f1c" transform="rotate(-10 98 100)" />
        <ellipse cx={18} cy={70} rx={8} ry={5} fill="#e05252" transform="rotate(40 18 70)" />
      </>
    ),
  },
  gressklipper: {
    bg: "#eaf6e1",
    art: (
      <>
        <path d="M70 66 L100 22" stroke="#5b5b6b" strokeWidth={6} strokeLinecap="round" />
        <rect x={90} y={14} width={20} height={8} rx={4} fill={INK} transform="rotate(-56 100 18)" />
        <rect x={20} y={58} width={58} height={26} rx={10} fill="#ff6b6b" />
        <rect x={28} y={52} width={30} height={10} rx={5} fill="#e05252" />
        <circle cx={32} cy={88} r={9} fill={INK} />
        <circle cx={66} cy={88} r={9} fill={INK} />
        <circle cx={32} cy={88} r={3} fill={STEEL_LIGHT} />
        <circle cx={66} cy={88} r={3} fill={STEEL_LIGHT} />
        <path d="M0 102 h120 V120 H0 z" fill="#6cc070" />
        <path d="M8 102 l4 -10 l4 10 M84 102 l4 -12 l4 12 M100 102 l4 -9 l4 9 M44 102 l3 -7 l3 7" fill="#6cc070" stroke="#4fa356" strokeWidth={2} strokeLinejoin="round" />
      </>
    ),
  },
  bil: {
    bg: "#e3f1ff",
    art: (
      <>
        <path d="M30 60 L42 40 h34 l14 20 z" fill="#9fd3ff" />
        <path d="M44 44 h13 v14 h-22 z M62 44 h12 l9 14 h-21 z" fill="#e8f5ff" />
        <rect x={12} y={58} width={96} height={28} rx={12} fill="#7cc4ff" />
        <rect x={12} y={70} width={96} height={5} fill="#5aaef5" />
        <circle cx={34} cy={88} r={11} fill={INK} />
        <circle cx={86} cy={88} r={11} fill={INK} />
        <circle cx={34} cy={88} r={4} fill={STEEL_LIGHT} />
        <circle cx={86} cy={88} r={4} fill={STEEL_LIGHT} />
        <Bubble x={24} y={40} r={7} />
        <Bubble x={98} y={42} r={8} />
        <Bubble x={86} y={26} r={5} />
        <Bubble x={36} y={24} r={4} />
      </>
    ),
  },
  vannkanne: {
    bg: "#eaf6e1",
    art: (
      <>
        <path d="M30 48 q0 -18 18 -18 q18 0 18 18" stroke="#2fa89f" strokeWidth={6} fill="none" />
        <path d="M64 70 L92 44" stroke="#2fa89f" strokeWidth={7} strokeLinecap="round" />
        <rect x={86} y={36} width={14} height={10} rx={3} fill="#2fa89f" transform="rotate(-42 93 41)" />
        <rect x={20} y={50} width={50} height={42} rx={10} fill="#4ecdc4" />
        <rect x={26} y={60} width={38} height={7} rx={3.5} fill="#fff" opacity={0.4} />
        <circle cx={100} cy={56} r={2.6} fill="#5aaef5" />
        <circle cx={104} cy={66} r={2.6} fill="#5aaef5" />
        <circle cx={98} cy={74} r={2.6} fill="#5aaef5" />
        <path d="M88 98 l4 14 h16 l4 -14 z" fill="#e07a4b" />
        <path d="M100 98 v-14" stroke="#4fa356" strokeWidth={3} />
        <ellipse cx={94} cy={90} rx={6} ry={3.5} fill="#6cc070" transform="rotate(-30 94 90)" />
        <circle cx={100} cy={80} r={6} fill="#ff8fa3" />
        <circle cx={100} cy={80} r={2.5} fill="#ffd23f" />
      </>
    ),
  },
  handlepose: {
    bg: "#fff1d6",
    art: (
      <>
        <rect x={40} y={20} width={12} height={36} rx={6} fill="#f2c27b" transform="rotate(-14 46 38)" />
        <path d="M70 34 l6 -14 l6 14 z" fill="#6cc070" />
        <rect x={66} y={32} width={20} height={26} rx={3} fill="#fff" stroke="#cfd8e3" strokeWidth={2} />
        <rect x={66} y={40} width={20} height={8} fill="#7cc4ff" />
        <path d="M42 50 q0 -14 18 -14 q18 0 18 14" stroke={WOOD_DARK} strokeWidth={4} fill="none" />
        <path d="M28 50 h64 l-4 52 a6 6 0 0 1 -6 6 h-44 a6 6 0 0 1 -6 -6 z" fill={WOOD} />
        <path d="M28 50 h64" stroke={WOOD_DARK} strokeWidth={4} />
      </>
    ),
  },
  salg: {
    bg: "#fff1d6",
    art: (
      <>
        {[86, 76, 66, 56].map((y) => (
          <g key={y}>
            <ellipse cx={42} cy={y + 6} rx={20} ry={7} fill="#e8b400" />
            <ellipse cx={42} cy={y} rx={20} ry={7} fill="#ffd23f" />
          </g>
        ))}
        {[86, 76].map((y) => (
          <g key={`b${y}`}>
            <ellipse cx={82} cy={y + 6} rx={20} ry={7} fill="#e8b400" />
            <ellipse cx={82} cy={y} rx={20} ry={7} fill="#ffd23f" />
          </g>
        ))}
        <ellipse cx={42} cy={56} rx={10} ry={3.5} fill="none" stroke="#e8b400" strokeWidth={2} />
        <Sparkle x={86} y={44} s={10} />
        <Sparkle x={20} y={30} s={6} />
      </>
    ),
  },
};

// Hvilket bilde passer oppgaven? Rekkefølgen betyr noe (det mest spesifikke først).
const RULES: Array<[RegExp, string]> = [
  [/dekke|dekk på/i, "dekke-bordet"],
  [/oppvaskmaskin/i, "oppvaskmaskin"],
  [/rydde av bord|av bordet|rydde bord|rydd(e)? (opp )?bordet/i, "rydde-bordet"],
  [/tørke av|tørk(e)? (av )?(bord|benk)/i, "torke-bord"],
  [/oppvask|vaske opp|tørke oppvask/i, "oppvask"],
  [/matpakk/i, "matpakke"],
  [/lage mat|middag|frokost|bake|matlag|salat|kokk|grønnsak|poteter/i, "lage-mat"],
  [/leke|lego|bamse|tegnesak/i, "leker"],
  [/rydde rom|rydd(e)? (på )?rommet|rydde i skap|rydde skap/i, "rydde-rommet"],
  [/seng/i, "seng"],
  [/støvsug|stovsug/i, "stovsuger"],
  [/pant|flaske/i, "pant"],
  [/søppel|søppl|søpla|soppel|avfall|ta ut (papir|plast|glass)/i, "soppel"],
  [/brett/i, "brette"],
  [/sko/i, "sko"],
  [/klær|klaer|klesvask|skittentøy|jakk|kles/i, "klaer"],
  [/hund/i, "hund"],
  [/katt|mate |mate$|dyr|fisk|fugl|bur\b/i, "mate-dyr"],
  [/lekse|gangetabell|skrive/i, "lekser"],
  [/\bles(e|ing)?\b|bok/i, "bok"],
  [/instrument|øve|piano|gitar|fiolin/i, "musikk"],
  [/sekk|treningsbag/i, "sekk"],
  [/tann|pusse tenn/i, "tannborste"],
  [/\bbad(et)?\b|\bdo\b|dusj|toalett|vasken\b|håndkl|dopapir/i, "bad"],
  [/snø|sno\b/i, "sno"],
  [/løv|rake/i, "rake"],
  [/plen|gress/i, "gressklipper"],
  [/bil\b|bilen/i, "bil"],
  [/blomst|vanne|plante|hage|luke/i, "vannkanne"],
  [/handle|pose/i, "handlepose"],
  [/salg|selge/i, "salg"],
];

export function taskArtKey(title: string): string | null {
  return RULES.find(([re]) => re.test(title))?.[1] ?? null;
}
