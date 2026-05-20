import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import BarraSuperior from "../components/barraSuperior.jsx";
import { authApi } from "../api/api.js";
import { useMonedaFortuna } from "../hooks/useMonedaFortuna.js";
import { usePageMusic } from "../hooks/usePageMusic.js";
import temaPrincipalMusic from "../assets/audio/temas/temaPrincipal.mp3";

const COINS_BASE   = 0.10;
const SAVE_EVERY   = 10;

export default function ClickGame() {
  usePageMusic(temaPrincipalMusic);
  const [saldo,         setSaldo]         = useState(null);
  const [clicksSession, setClicksSession] = useState(0);
  const [ganado,        setGanado]        = useState(0);
  const [pops,          setPops]          = useState([]);
  const [guardando,     setGuardando]     = useState(false);
  const [cargando,      setCargando]      = useState(true);
  const [pendientes,    setPendientes]    = useState(0);

  const { monedaFortuna } = useMonedaFortuna();

  const pendientesRef = useRef(0);
  const saldoRef      = useRef(null);
  const guardandoRef  = useRef(false);
  const popIdRef      = useRef(0);
  const monedaRef     = useRef(false);

  // Sincronizar monedaRef cuando cambie el estado del hook
  useEffect(() => { monedaRef.current = monedaFortuna; }, [monedaFortuna]);

  useEffect(() => {
    authApi.getUsuarioActual()
      .then(u => { const s = Number(u.dinero ?? 0); setSaldo(s); saldoRef.current = s; })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    const h = e => {
      if (e.detail?.dinero !== undefined) {
        const s = Number(e.detail.dinero);
        setSaldo(s);
        saldoRef.current = s;
      }
    };
    window.addEventListener("saldo-update", h);
    return () => window.removeEventListener("saldo-update", h);
  }, []);

  // Guardar saldo pendiente al desmontar
  useEffect(() => {
    return () => {
      if (pendientesRef.current > 0 && saldoRef.current !== null) {
        authApi.updateDinero(saldoRef.current).catch(() => {});
      }
    };
  }, []);

  const guardarSaldo = useCallback(async nuevoSaldo => {
    if (guardandoRef.current) return;
    guardandoRef.current = true;
    setGuardando(true);
    try {
      await authApi.updateDinero(nuevoSaldo);
      pendientesRef.current = 0;
      setPendientes(0);
    } catch (err) { console.log(err); }
    guardandoRef.current = false;
    setGuardando(false);
  }, []);

  function handleClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = ++popIdRef.current;
    setPops(prev => [...prev, { id, x, y }]);
    setTimeout(() => setPops(prev => prev.filter(p => p.id !== id)), 900);

    const coinsPerClick = monedaRef.current ? +(COINS_BASE * 1.5).toFixed(2) : COINS_BASE;
    const nuevoSaldo = +((saldoRef.current ?? 0) + coinsPerClick).toFixed(2);
    pendientesRef.current += 1;
    setPendientes(pendientesRef.current);
    setClicksSession(c => c + 1);
    setGanado(g => +(g + coinsPerClick).toFixed(2));
    setSaldo(nuevoSaldo);
    saldoRef.current = nuevoSaldo;

    if (pendientesRef.current >= SAVE_EVERY) guardarSaldo(nuevoSaldo);
  }

  const coinsPerClick = monedaFortuna ? +(COINS_BASE * 1.5).toFixed(2) : COINS_BASE;

  return (
    <>
      <BarraSuperior />
      <div className="flex flex-col w-full bg-black/55 px-4 py-6">

        {/* Back + Título */}
        <div className="flex items-center justify-between mb-4 max-w-[720px] w-full mx-auto">
          <Link to="/minijuegos" className="text-white/40 text-[0.72rem] tracking-[0.04em] no-underline hover:text-white transition-colors">
            ← Volver
          </Link>
          <div className="text-center">
            <h1 className="text-[1.3rem] text-white tracking-[0.05em]">👆 Clicker Pokémon</h1>
            <p className="text-[0.7rem] text-white/40 mt-1">
              Cada click = {coinsPerClick.toFixed(2)} 💰
              {monedaFortuna && <span className="text-[#ffcb05] ml-1">(×1.5 🪙)</span>}
            </p>
          </div>
          <div className="w-16" />
        </div>

        {/* Banner Moneda Fortuna */}
        {!cargando && monedaFortuna && (
          <div className="w-full max-w-[720px] mx-auto mb-4 flex items-center gap-3 px-4 py-3 rounded-xl border border-[rgba(255,203,5,0.4)] bg-[rgba(255,203,5,0.08)]">
            <span className="text-lg">🪙</span>
            <p className="text-[0.72rem] text-[#ffcb05] leading-[1.6]">
              <b>Moneda Fortuna activa</b> · Cada click vale {coinsPerClick.toFixed(2)} 💰 en lugar de {COINS_BASE.toFixed(2)} 💰
            </p>
            <span className="ml-auto text-[0.75rem] font-bold text-[#ffcb05]">×1.5</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4 max-w-[720px] w-full mx-auto">
          <div className="bg-[rgba(255,203,5,0.08)] border-[2px] border-[rgba(255,203,5,0.3)] rounded-2xl px-3 py-4 text-center">
            <p className="text-[0.62rem] text-white/40 mb-2 tracking-[0.08em]">SALDO</p>
            <p className="text-[1rem] text-[#ffcb05]">{saldo !== null ? Number(saldo).toFixed(2) : "–"} 💰</p>
          </div>
          <div className="bg-green-500/[0.08] border-[2px] border-green-500/25 rounded-2xl px-3 py-4 text-center">
            <p className="text-[0.62rem] text-white/40 mb-2 tracking-[0.08em]">GANADO</p>
            <p className="text-[1rem] text-green-400">+{ganado.toFixed(2)} 💰</p>
          </div>
          <div className="bg-white/[0.05] border-[2px] border-white/10 rounded-2xl px-3 py-4 text-center">
            <p className="text-[0.62rem] text-white/40 mb-2 tracking-[0.08em]">CLICKS</p>
            <p className="text-[1rem] text-white">{clicksSession}</p>
          </div>
        </div>

        {/* Zona de click */}
        <div className="flex flex-col max-w-[720px] w-full mx-auto gap-3">
          <div
            onClick={handleClick}
            role="button"
            aria-label="Click para ganar monedas"
            className="relative bg-[rgba(2,0,5,0.97)] border-[2.5px] border-[rgba(227,0,11,0.35)] rounded-3xl flex flex-col items-center justify-center gap-6 cursor-pointer overflow-hidden select-none transition-all duration-150 active:scale-[0.99] hover:border-[rgba(227,0,11,0.7)] hover:shadow-[0_0_60px_rgba(227,0,11,0.25)] shadow-[0_10px_50px_rgba(0,0,0,0.8)] py-12"
          >
            {/* Fondo radial */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(227,0,11,0.09)_0%,transparent_60%)]" />

            {/* Aura Moneda Fortuna */}
            {monedaFortuna && (
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(255,203,5,0.06)_0%,transparent_60%)]" />
            )}

            {/* Aro pulsante */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-[320px] h-[320px] rounded-full border border-[rgba(227,0,11,0.1)] pk-pulse" />
            </div>
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-[240px] h-[240px] rounded-full border border-[rgba(227,0,11,0.07)] pk-pulse" style={{ animationDelay: "0.6s" }} />
            </div>

            {/* Pokeball */}
            <svg
              width="260" height="260" viewBox="0 0 100 100"
              className="pointer-events-none z-10"
              style={{ filter: monedaFortuna ? "drop-shadow(0 10px 40px rgba(255,203,5,0.35)) drop-shadow(0 10px 40px rgba(227,0,11,0.3))" : "drop-shadow(0 10px 40px rgba(227,0,11,0.4))" }}
            >
              <path d="M3 50 a47 47 0 0 1 94 0 Z" fill="#e3000b" />
              <path d="M3 50 a47 47 0 0 0 94 0 Z" fill="#f0f0f0" />
              <circle cx="50" cy="50" r="47" fill="none" stroke="#2a2a2a" strokeWidth="2.5" />
              <line x1="3" y1="50" x2="97" y2="50" stroke="#2a2a2a" strokeWidth="5" />
              <circle cx="50" cy="50" r="14" fill="#fff" stroke="#2a2a2a" strokeWidth="4.5" />
              <circle cx="50" cy="50" r="7" fill={monedaFortuna ? "#ffcb05" : "#e3000b"} />
              <ellipse cx="38" cy="32" rx="7" ry="4" fill="rgba(255,255,255,0.28)" transform="rotate(-30 38 32)" />
            </svg>

            <p className="text-[0.82rem] text-white/30 tracking-[0.07em] pointer-events-none z-10">
              {monedaFortuna ? `¡Click para ganar ${coinsPerClick.toFixed(2)} 💰!` : "¡Click en cualquier lugar!"}
            </p>

            {/* Coin pops */}
            {pops.map(pop => (
              <span
                key={pop.id}
                className="pk-coin-pop absolute text-[1rem] text-[#ffcb05] font-bold pointer-events-none select-none z-20"
                style={{ left: pop.x, top: pop.y, transform: "translate(-50%, -50%)" }}
              >
                +{coinsPerClick.toFixed(2)} 💰
              </span>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-4 pb-2">
            <p className="text-[0.65rem] text-white/30 leading-[1.8]">
              {pendientes > 0
                ? `${pendientes} click${pendientes > 1 ? "s" : ""} sin guardar · auto-guarda cada ${SAVE_EVERY}`
                : "✓ Todo guardado"}
            </p>
            <button
              onClick={() => guardarSaldo(saldoRef.current)}
              disabled={guardando || cargando || pendientes === 0}
              className="bg-[rgba(255,203,5,0.1)] border-[2px] border-[rgba(255,203,5,0.35)] text-[#ffcb05] text-[0.7rem] tracking-[0.04em] px-5 py-2.5 rounded-full cursor-pointer transition-all hover:bg-[rgba(255,203,5,0.22)] disabled:opacity-35 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {guardando ? "Guardando…" : "💾 Guardar ahora"}
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
