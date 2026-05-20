// ── Colores por tipo ──────────────────────────────────────
export const TYPE_COLORS = {
  fuego:     "#e25822",
  agua:      "#1a7fc1",
  planta:    "#2e8b57",
  electrico: "#c9a900",
  psiquico:  "#c2185b",
  normal:    "#7a7a7a",
  veneno:    "#7b2d8b",
  tierra:    "#a0784e",
  volador:   "#5b8fc9",
  roca:      "#7d6535",
  lucha:     "#b71c1c",
  hielo:     "#2e8fa8",
  fantasma:  "#4a2f7a",
  dragon:    "#2c3e8f",
  acero:     "#6c7a7a",
  siniestro: "#2c3e50",
  hada:      "#c2508e",
  bicho:     "#6d7c28",
};

// ── Colores por rareza ────────────────────────────────────
export const RAREZA_COLORS = {
  comun:      { bg: "rgba(120,120,120,0.18)", text: "#aaa",    border: "rgba(150,150,150,0.3)" },
  poco_comun: { bg: "rgba(46,139,87,0.18)",   text: "#4caf50", border: "rgba(46,139,87,0.4)"  },
  raro:       { bg: "rgba(26,127,193,0.18)",  text: "#42a5f5", border: "rgba(26,127,193,0.4)" },
  muy_raro:   { bg: "rgba(123,45,139,0.18)",  text: "#ab47bc", border: "rgba(123,45,139,0.4)" },
  legendario: { bg: "rgba(201,169,0,0.18)",   text: "#ffcb05", border: "rgba(201,169,0,0.4)"  },
  mitico:     { bg: "rgba(226,88,34,0.18)",   text: "#ff7043", border: "rgba(226,88,34,0.4)"  },
};

// ── Badge de tipo ─────────────────────────────────────────
export function TipoBadge({ tipo }) {
  const color = TYPE_COLORS[tipo?.toLowerCase()] ?? "#555";
  return (
    <span
      className="inline-block text-[0.38rem] tracking-[0.04em] px-[0.65rem] py-[0.22rem] rounded-full text-white capitalize [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]"
      style={{ background: color }}
    >
      {tipo}
    </span>
  );
}

// ── Badge de rareza ───────────────────────────────────────
export function RarezaBadge({ rareza }) {
  const r = RAREZA_COLORS[rareza?.toLowerCase()] ?? RAREZA_COLORS.comun;
  return (
    <span
      className="inline-block text-[0.32rem] tracking-[0.05em] px-[0.55rem] py-[0.18rem] rounded-full border font-semibold capitalize"
      style={{ background: r.bg, color: r.text, borderColor: r.border }}
    >
      {rareza ?? "común"}
    </span>
  );
}

// ── Pokeball SVG vacía (para slots vacíos) ────────────────
export function PokeballVacia({ size = 56, opacity = 0.2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={{ opacity }}>
      <path d="M3 50 a47 47 0 0 1 94 0 Z" fill="rgba(227,0,11,0.6)" />
      <path d="M3 50 a47 47 0 0 0 94 0 Z" fill="rgba(240,240,240,0.4)" />
      <circle cx="50" cy="50" r="47" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="3" />
      <line x1="3" y1="50" x2="97" y2="50" stroke="rgba(255,255,255,0.4)" strokeWidth="6" />
      <circle cx="50" cy="50" r="14" fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.4)" strokeWidth="5" />
    </svg>
  );
}
