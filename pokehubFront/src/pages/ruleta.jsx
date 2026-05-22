import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import BarraSuperior from "../components/barraSuperior.jsx";
import { authApi } from "../api/api.js";
import { useMonedaFortuna } from "../hooks/useMonedaFortuna.js";
import { usePageMusic } from "../hooks/usePageMusic.js";
import temaPrincipalMusic from "../assets/audio/temas/temaPrincipal.mp3";

/* ─────────────────────────────────────────────────────────────
   SEGMENTOS DE LA RULETA
   8 segmentos de 45° cada uno. El orden en este array determina
   la posición visual (segmento 0 arriba, sentido horario).
───────────────────────────────────────────────────────────── */
const SEGMENTOS = [
  { monedas: 50,   label: "50",    color: "#1e3a8a", textColor: "#93c5fd" },
  { monedas: 10,   label: "10",    color: "#7f1d1d", textColor: "#fca5a5" },
  { monedas: 200,  label: "200",   color: "#3b0764", textColor: "#d8b4fe" },
  { monedas: 25,   label: "25",    color: "#78350f", textColor: "#fde68a" },
  { monedas: 100,  label: "100",   color: "#14532d", textColor: "#86efac" },
  { monedas: 0,    label: "Oh…",  color: "#1f2937", textColor: "#6b7280" },
  { monedas: 500,  label: "500",   color: "#134e4a", textColor: "#5eead4" },
  { monedas: 1000, label: "1000",  color: "#7c2d12", textColor: "#fbbf24" },
];

const N       = SEGMENTOS.length;   // 8
const SEG_DEG = 360 / N;            // 45° por segmento
const CX = 200, CY = 200;           // centro SVG
const R  = 185;                     // radio exterior
const R_LABEL = 130;                // radio donde va el texto

/* ── Helpers de geometría ── */
const toRad = d => (d * Math.PI) / 180;

function buildSegPath(i) {
  const a0 = toRad(i * SEG_DEG - 90);
  const a1 = toRad((i + 1) * SEG_DEG - 90);
  const x0 = +(CX + R * Math.cos(a0)).toFixed(2);
  const y0 = +(CY + R * Math.sin(a0)).toFixed(2);
  const x1 = +(CX + R * Math.cos(a1)).toFixed(2);
  const y1 = +(CY + R * Math.sin(a1)).toFixed(2);
  return `M ${CX} ${CY} L ${x0} ${y0} A ${R} ${R} 0 0 1 ${x1} ${y1} Z`;
}

function buildLabelPos(i) {
  const midDeg = (i + 0.5) * SEG_DEG - 90;   // ángulo SVG del centro del segmento
  const x = +(CX + R_LABEL * Math.cos(toRad(midDeg))).toFixed(2);
  const y = +(CY + R_LABEL * Math.sin(toRad(midDeg))).toFixed(2);
  const rot = (i + 0.5) * SEG_DEG;            // rotación del texto (apuntando hacia fuera)
  return { x, y, rot };
}

/* Paths calculados una sola vez fuera del componente (estáticos) */
const PATHS  = SEGMENTOS.map((_, i) => buildSegPath(i));
const LABELS = SEGMENTOS.map((_, i) => buildLabelPos(i));

/* ── Clave de localStorage para el límite diario ── */
const HOY = () => new Date().toLocaleDateString("sv-SE"); // "YYYY-MM-DD" estable

/* ═══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════════════════════════ */
export default function RuletaDiaria() {
  usePageMusic(temaPrincipalMusic);

  const [usuario,   setUsuario]   = useState(null);
  const [saldo,     setSaldo]     = useState(null);
  const [cargando,  setCargando]  = useState(true);
  const [rotacion,  setRotacion]  = useState(0);
  const [girando,   setGirando]   = useState(false);
  const [segIdx,    setSegIdx]    = useState(null);   // índice del segmento ganador
  const [resultado, setResultado] = useState(null);   // objeto del resultado final
  const [yaGiro,    setYaGiro]    = useState(false);

  const { monedaFortuna, cargandoMoneda } = useMonedaFortuna();

  // Ref para evitar stale closures en el setTimeout
  const saldoRef = useRef(null);
  useEffect(() => { saldoRef.current = saldo; }, [saldo]);

  useEffect(() => {
    authApi.getUsuarioActual()
      .then(u => {
        setUsuario(u);
        const s = Number(u.dinero ?? 0);
        setSaldo(s);
        saldoRef.current = s;
        setYaGiro(localStorage.getItem(`ruleta_${u.id}`) === HOY());
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  /* ── Lógica de giro ── */
  async function girar() {
    if (girando || yaGiro || cargando || !usuario) return;

    // Elegir segmento ganador aleatoriamente (todos igual probabilidad = 12.5%)
    const idx = Math.floor(Math.random() * N);

    // Calcular rotación final: el centro del segmento idx debe quedar arriba (bajo el puntero)
    // El seg idx tiene su centro SVG en (idx+0.5)*SEG_DEG - 90° (eje X positivo = este).
    // Para que ese ángulo quede en la cima tras rotar R grados: R = 360 - (idx+0.5)*SEG_DEG
    const targetR = (360 - (idx + 0.5) * SEG_DEG + 360) % 360;
    let delta = (targetR - rotacion % 360 + 360) % 360;
    if (delta < SEG_DEG) delta += 360;                   // garantizar al menos 45° de giro
    const nuevaRotacion = rotacion + delta + 5 * 360;    // mínimo 5 vueltas completas

    setGirando(true);
    setResultado(null);
    setSegIdx(null);
    setRotacion(nuevaRotacion);

    // Esperar que la animación CSS termine (5 segundos, igual que la transition)
    setTimeout(async () => {
      const seg     = SEGMENTOS[idx];
      const mult    = monedaFortuna ? 1.5 : 1;
      const premio  = seg.monedas > 0 ? Math.round(seg.monedas * mult) : 0;

      setSegIdx(idx);
      setResultado({ ...seg, premioFinal: premio, conMulti: monedaFortuna && seg.monedas > 0 });
      setGirando(false);
      setYaGiro(true);

      // Guardar límite diario en localStorage
      localStorage.setItem(`ruleta_${usuario.id}`, HOY());

      // Actualizar saldo si hay premio
      if (premio > 0) {
        const nuevoSaldo = +((saldoRef.current ?? 0) + premio).toFixed(2);
        setSaldo(nuevoSaldo);
        saldoRef.current = nuevoSaldo;
        window.dispatchEvent(new CustomEvent("saldo-update", { detail: { dinero: nuevoSaldo } }));
        try { await authApi.updateDinero(nuevoSaldo); } catch { /* silencioso */ }
      }
    }, 5000);
  }

  /* ── Colores del resultado para el panel ── */
  const segGanador = segIdx !== null ? SEGMENTOS[segIdx] : null;

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <>
      <BarraSuperior />
      <div className="flex flex-col items-center w-full bg-black/55 px-4 py-6 pb-12">

        {/* ── Cabecera ── */}
        <div className="flex items-center justify-between w-full max-w-[680px] mb-5">
          <Link
            to="/minijuegos"
            className="text-white/40 text-[0.72rem] tracking-[0.04em] no-underline hover:text-white transition-colors"
          >
            ← Volver
          </Link>
          <div className="text-center">
            <h1 className="text-[1.35rem] text-white tracking-[0.05em]">🎡 Ruleta Diaria</h1>
            <p className="text-[0.65rem] text-white/35 mt-1 tracking-[0.04em]">Una tirada gratis cada día</p>
          </div>
          <div className="w-16" />
        </div>

        {/* ── Saldo + Moneda Fortuna ── */}
        <div className="flex flex-col items-center gap-3 mb-5 w-full max-w-[680px]">
          {saldo !== null && (
            <div className="flex items-center gap-2 bg-[rgba(255,203,5,0.08)] border border-[rgba(255,203,5,0.28)] px-6 py-2.5 rounded-2xl">
              <span className="text-[0.68rem] text-white/40 tracking-[0.06em]">SALDO</span>
              <span className="text-[1rem] text-[#ffcb05] ml-2">💰 {Number(saldo).toFixed(2)}</span>
            </div>
          )}
          {!cargandoMoneda && monedaFortuna && (
            <div className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-[rgba(255,203,5,0.4)] bg-[rgba(255,203,5,0.08)]">
              <span className="text-base">🪙</span>
              <p className="text-[0.7rem] text-[#ffcb05] leading-[1.6]">
                <b>Moneda Fortuna activa</b> · Tus ganancias se multiplican ×1.5
              </p>
              <span className="ml-auto text-[0.72rem] font-bold text-[#ffcb05]">×1.5</span>
            </div>
          )}
        </div>

        {/* ── Ruleta ── */}
        <div className="flex flex-col items-center gap-0">

          {/* Puntero triangular (apunta hacia abajo, sobre el borde de la ruleta) */}
          <div style={{ marginBottom: "-14px", zIndex: 10, position: "relative" }}>
            <svg width="30" height="26" viewBox="0 0 30 26">
              <polygon
                points="15,24 1,1 29,1"
                fill="#e3000b"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Rueda SVG */}
          <div
            style={{
              transform: `rotate(${rotacion}deg)`,
              transition: girando
                ? "transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)"
                : "none",
              borderRadius: "50%",
              boxShadow:
                "0 0 0 4px rgba(255,255,255,0.12), 0 0 50px rgba(0,0,0,0.85), 0 0 0 8px rgba(0,0,0,0.5)",
              willChange: "transform",
            }}
          >
            <svg
              viewBox="0 0 400 400"
              style={{ display: "block", width: "min(380px, 90vw)", height: "min(380px, 90vw)" }}
            >
              {/* Segmentos de la ruleta */}
              {SEGMENTOS.map((seg, i) => {
                const { x, y, rot } = LABELS[i];
                return (
                  <g key={i}>
                    {/* Sector del segmento */}
                    <path
                      d={PATHS[i]}
                      fill={seg.color}
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="1.5"
                    />
                    {/* Emoji moneda */}
                    <text
                      x={x} y={y - 10}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="14"
                      transform={`rotate(${rot}, ${x}, ${y})`}
                    >
                      💰
                    </text>
                    {/* Cantidad */}
                    <text
                      x={x} y={y + 11}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={seg.monedas === 1000 ? "13" : "14"}
                      fontWeight="bold"
                      fill={seg.textColor ?? "#fff"}
                      transform={`rotate(${rot}, ${x}, ${y})`}
                      style={{ fontFamily: "monospace" }}
                    >
                      {seg.label}
                    </text>
                  </g>
                );
              })}

              {/* Aro exterior decorativo */}
              <circle
                cx={CX} cy={CY} r={R}
                fill="none"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="3"
              />

              {/* Centro tipo Pokéball */}
              <circle cx={CX} cy={CY} r="32" fill="#0a0010" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
              <circle cx={CX} cy={CY} r="16" fill="#e3000b" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
              <circle cx={CX} cy={CY} r="7"  fill="#fff" />
            </svg>
          </div>

          {/* ── Botón de giro ── */}
          <button
            onClick={girar}
            disabled={girando || yaGiro || cargando}
            className="mt-8 px-14 py-5 rounded-2xl text-[1rem] tracking-[0.06em] border-none transition-all"
            style={
              cargando || girando || yaGiro
                ? {
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.22)",
                    cursor: "not-allowed",
                    boxShadow: "none",
                  }
                : {
                    background: "linear-gradient(135deg,#e3000b,#b50009)",
                    color: "#fff",
                    cursor: "pointer",
                    boxShadow: "0 6px 28px rgba(227,0,11,0.55)",
                  }
            }
          >
            {cargando
              ? "Cargando…"
              : girando
              ? "🎡 Girando…"
              : yaGiro
              ? "✓ Ya has girado hoy"
              : "🎡 ¡Girar!"}
          </button>

          {/* Mensaje "vuelve mañana" */}
          {yaGiro && !girando && (
            <p className="text-[0.65rem] text-white/30 tracking-[0.04em] mt-3">
              Vuelve mañana para tu próxima tirada gratis
            </p>
          )}
        </div>

        {/* ── Panel de resultado ── */}
        {resultado && !girando && (
          <div
            className="mt-8 w-full max-w-[420px] rounded-3xl p-8 flex flex-col items-center gap-4 pk-card-in"
            style={{
              background: "rgba(6,0,12,0.97)",
              border: `2.5px solid ${segGanador?.color ?? "#333"}`,
              boxShadow: `0 0 70px ${segGanador?.color ?? "#333"}60, 0 16px 50px rgba(0,0,0,0.9)`,
            }}
          >
            {resultado.premioFinal > 0 ? (
              <>
                <p className="text-[0.72rem] text-white/45 tracking-[0.12em]">¡HAS GANADO!</p>
                <p
                  className="text-[3.5rem] leading-none font-bold"
                  style={{ color: segGanador?.textColor ?? "#ffcb05" }}
                >
                  +{resultado.premioFinal}
                </p>
                <p className="text-[1.1rem]" style={{ color: segGanador?.textColor ?? "#ffcb05" }}>
                  💰 monedas
                </p>
                {resultado.conMulti && resultado.monedas !== resultado.premioFinal && (
                  <p className="text-[0.62rem] text-[#ffcb05]/55 tracking-[0.04em]">
                    {resultado.monedas} × 1.5 = {resultado.premioFinal} con Moneda Fortuna 🪙
                  </p>
                )}
                <div className="w-full h-px bg-white/10 mt-1" />
                <p className="text-[0.68rem] text-white/30">Añadido a tu saldo ✓</p>
              </>
            ) : (
              <>
                <span className="text-[2.5rem]">😔</span>
                <p className="text-[0.88rem] text-white/55 tracking-[0.04em]">¡Sin premio esta vez!</p>
                <p className="text-[0.68rem] text-white/28">Mejor suerte mañana</p>
              </>
            )}
          </div>
        )}

        {/* ── Tabla de premios posibles ── */}
        <div className="mt-10 w-full max-w-[480px]">
          <p className="text-[0.62rem] text-white/28 tracking-[0.08em] text-center mb-4">
            PREMIOS POSIBLES · PROBABILIDAD IGUAL (12.5% cada uno)
          </p>
          <div className="grid grid-cols-4 gap-2.5">
            {SEGMENTOS.map((seg, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1.5 py-3.5 px-1 rounded-xl"
                style={{
                  background: `${seg.color}22`,
                  border: `1.5px solid ${seg.color}55`,
                }}
              >
                <span className="text-[1.1rem]">💰</span>
                <span
                  className="text-[0.65rem] font-bold leading-none"
                  style={{ color: seg.textColor ?? "#fff" }}
                >
                  {seg.monedas === 0 ? "Oh…" : seg.monedas}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
