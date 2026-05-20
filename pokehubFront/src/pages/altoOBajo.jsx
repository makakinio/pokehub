import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import BarraSuperior from "../components/barraSuperior.jsx";
import { authApi } from "../api/api.js";
import { useMonedaFortuna } from "../hooks/useMonedaFortuna.js";
import { usePageMusic } from "../hooks/usePageMusic.js";
import temaPrincipalMusic from "../assets/audio/temas/temaPrincipal.mp3";

function numAleatorio() { return Math.floor(Math.random() * 10) + 1; }

export default function AltoOBajo() {
  usePageMusic(temaPrincipalMusic);
  const [saldo,        setSaldo]        = useState(null);
  const [apuesta,      setApuesta]      = useState("");
  const [numActual,    setNumActual]    = useState(null);
  const [numSiguiente, setNumSiguiente] = useState(null);
  const [estado,       setEstado]       = useState("idle");
  const [resultado,    setResultado]    = useState(null);
  const [guardando,    setGuardando]    = useState(false);
  const [error,        setError]        = useState("");
  const [racha,        setRacha]        = useState(0);

  const { monedaFortuna, cargandoMoneda: cargandoItems } = useMonedaFortuna();

  useEffect(() => {
    authApi.getUsuarioActual()
      .then(u => setSaldo(Number(u.dinero ?? 0)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const h = e => { if (e.detail?.dinero !== undefined) setSaldo(Number(e.detail.dinero)); };
    window.addEventListener("saldo-update", h);
    return () => window.removeEventListener("saldo-update", h);
  }, []);

  function iniciarRonda() {
    const bet = parseFloat(apuesta);
    if (!bet || bet <= 0)   { setError("Introduce una apuesta válida."); return; }
    if (bet > (saldo ?? 0)) { setError("No tienes suficiente saldo."); return; }
    if (bet < 0.1)          { setError("Apuesta mínima: 0.10 monedas."); return; }
    setError("");
    setNumActual(numAleatorio());
    setNumSiguiente(null);
    setResultado(null);
    setEstado("esperando");
  }

  async function elegir(eleccion) {
    if (estado !== "esperando") return;
    const siguiente = numAleatorio();
    setNumSiguiente(siguiente);
    const bet = parseFloat(apuesta);
    const mult = monedaFortuna ? 1.5 : 1;

    let res;
    if (siguiente > numActual) res = eleccion === "alto" ? "gano" : "perdio";
    else if (siguiente < numActual) res = eleccion === "bajo" ? "gano" : "perdio";
    else res = "empate";

    setResultado(res);
    setEstado("resultado");

    let nuevoSaldo = saldo ?? 0;
    if (res === "gano")   nuevoSaldo = +(nuevoSaldo + bet * mult).toFixed(2);
    if (res === "perdio") nuevoSaldo = Math.max(+(nuevoSaldo - bet).toFixed(2), 0);
    setSaldo(nuevoSaldo);
    setRacha(res === "gano" ? racha + 1 : 0);

    setGuardando(true);
    try { await authApi.updateDinero(nuevoSaldo); } catch (err) { console.log(err); }
    setGuardando(false);
  }

  function nuevaRonda() {
    setEstado("esperando");
    setNumActual(numSiguiente);
    setNumSiguiente(null);
    setResultado(null);
  }

  function reiniciar() {
    setEstado("idle"); setNumActual(null);
    setNumSiguiente(null); setResultado(null); setRacha(0);
  }

  const bet      = parseFloat(apuesta) || 0;
  const mult     = monedaFortuna ? 1.5 : 1;
  const ganancia = +(bet * mult).toFixed(2);
  const resColor = resultado === "gano" ? "#22c55e" : resultado === "perdio" ? "#ef4444" : "#ffcb05";
  const resLabel = resultado === "gano"
    ? `¡CORRECTO! +${ganancia.toFixed(2)}${monedaFortuna ? " ×1.5" : ""} 💰`
    : resultado === "perdio" ? `¡INCORRECTO! -${bet.toFixed(2)} 💸`
    : resultado === "empate" ? "¡EMPATE! Sin cambios ⚖️" : "";

  return (
    <>
      <BarraSuperior />
      <div className="flex flex-col items-center w-full bg-black/55 px-4 py-6">

        {/* Back + Título */}
        <div className="flex items-center justify-between w-full max-w-[680px] mb-4">
          <Link to="/minijuegos" className="text-white/40 text-[0.72rem] tracking-[0.04em] no-underline hover:text-white transition-colors">
            ← Volver
          </Link>
          <div className="text-center">
            <h1 className="text-[1.3rem] text-white tracking-[0.05em]">🎲 Alto o Bajo</h1>
            <p className="text-[0.7rem] text-white/40 mt-1">Adivina si el número es mayor o menor</p>
          </div>
          <div className="w-16" />
        </div>

        {/* Banner Moneda Fortuna */}
        {!cargandoItems && monedaFortuna && (
          <div className="w-full max-w-[680px] mb-4 flex items-center gap-3 px-4 py-3 rounded-xl border border-[rgba(255,203,5,0.4)] bg-[rgba(255,203,5,0.08)]">
            <span className="text-lg">🪙</span>
            <p className="text-[0.72rem] text-[#ffcb05] leading-[1.6]">
              <b>Moneda Fortuna activa</b> · Ganas ×1.5 en cada acierto
            </p>
            <span className="ml-auto text-[0.75rem] font-bold text-[#ffcb05]">×1.5</span>
          </div>
        )}

        {/* Saldo + racha */}
        <div className="flex gap-4 mb-5 w-full max-w-[680px]">
          <div className="flex-1 bg-[rgba(255,203,5,0.08)] border-[2px] border-[rgba(255,203,5,0.3)] rounded-2xl px-4 py-4 text-center">
            <p className="text-[0.65rem] text-white/40 mb-2 tracking-[0.08em]">SALDO</p>
            <p className="text-[1.2rem] text-[#ffcb05]">💰 {saldo !== null ? Number(saldo).toFixed(2) : "–"}</p>
          </div>
          <div className={`flex-1 rounded-2xl px-4 py-4 text-center border-[2px] transition-all ${racha > 0 ? "bg-green-500/10 border-green-500/30" : "bg-white/[0.04] border-white/10"}`}>
            <p className="text-[0.65rem] text-white/40 mb-2 tracking-[0.08em]">RACHA</p>
            <p className="text-[1.2rem]" style={{ color: racha > 0 ? "#22c55e" : "rgba(255,255,255,0.2)" }}>
              {racha > 0 ? `🔥 ${racha}` : "–"}
            </p>
          </div>
        </div>

        {/* Panel del juego */}
        <div className="w-full max-w-[680px]">

          {/* ── IDLE ── */}
          {estado === "idle" && (
            <div className="bg-[rgba(6,0,12,0.94)] border-[2.5px] border-[rgba(227,0,11,0.35)] rounded-3xl p-8 flex flex-col gap-6 shadow-[0_8px_50px_rgba(0,0,0,0.75)]">
              <p className="text-[0.9rem] text-white/70 tracking-[0.04em] text-center">¿Cuánto quieres apostar?</p>

              {monedaFortuna && bet > 0 && (
                <div className="text-center text-[0.72rem] text-[#ffcb05] bg-[rgba(255,203,5,0.08)] border border-[rgba(255,203,5,0.3)] rounded-xl px-4 py-2">
                  Si aciertas ganarás <b>{ganancia.toFixed(2)} 💰</b> (×1.5)
                </div>
              )}

              <div className="flex gap-2.5 flex-wrap justify-center">
                {[0.5, 1, 2, 5, 10].map(v => (
                  <button
                    key={v}
                    onClick={() => setApuesta(String(v))}
                    className={`border-[2px] rounded-2xl text-[0.82rem] px-6 py-3 cursor-pointer transition-all ${
                      parseFloat(apuesta) === v
                        ? "border-[#ffcb05] text-[#ffcb05] bg-[rgba(255,203,5,0.12)]"
                        : "border-white/20 text-white/55 bg-transparent hover:border-white/45 hover:text-white"
                    }`}
                  >
                    {v} 💰
                  </button>
                ))}
              </div>

              <div className="flex gap-4 items-center">
                <input
                  type="number" min="0.1" step="0.1"
                  value={apuesta}
                  onChange={e => setApuesta(e.target.value)}
                  placeholder="Cantidad personalizada"
                  className="flex-1 bg-white/[0.06] border-[2px] border-white/15 rounded-2xl px-5 py-3.5 text-white text-[0.82rem] outline-none focus:border-[rgba(255,203,5,0.5)] transition-colors placeholder:text-white/25"
                />
                <button
                  onClick={iniciarRonda}
                  disabled={!apuesta || bet <= 0 || bet > (saldo ?? 0)}
                  className="bg-[#e3000b] text-white border-none rounded-2xl text-[0.88rem] tracking-[0.05em] px-8 py-3.5 cursor-pointer transition-all hover:bg-[#b50009] shadow-[0_4px_20px_rgba(227,0,11,0.45)] disabled:opacity-35 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  ¡Jugar!
                </button>
              </div>

              {error && <p className="text-[0.78rem] text-red-400 text-center">{error}</p>}
            </div>
          )}

          {/* ── ESPERANDO ── */}
          {estado === "esperando" && (
            <div className="bg-[rgba(6,0,12,0.94)] border-[2.5px] border-[rgba(227,0,11,0.35)] rounded-3xl p-8 flex flex-col items-center gap-7 shadow-[0_8px_50px_rgba(0,0,0,0.75)]">
              <p className="text-[0.78rem] text-white/40 tracking-[0.1em]">NÚMERO ACTUAL</p>

              <div
                className="w-[180px] h-[180px] flex items-center justify-center rounded-3xl border-[3px] border-[rgba(227,0,11,0.55)] shadow-[0_0_50px_rgba(227,0,11,0.3)]"
                style={{ background: "rgba(227,0,11,0.12)", fontSize: "7rem", color: "#fff", lineHeight: 1 }}
              >
                {numActual}
              </div>

              <div className="flex flex-col items-center gap-1">
                <p className="text-[0.85rem] text-white/60">
                  Apuesta: <span className="text-[#ffcb05]">{bet.toFixed(2)} 💰</span>
                </p>
                {monedaFortuna && (
                  <p className="text-[0.7rem] text-[#ffcb05]/60">
                    Si aciertas → +{ganancia.toFixed(2)} 💰 (×1.5)
                  </p>
                )}
              </div>

              <p className="text-[0.9rem] text-white tracking-[0.04em]">¿El siguiente número será…?</p>

              <div className="flex gap-5 w-full">
                <button
                  onClick={() => elegir("alto")}
                  className="flex-1 py-6 bg-green-500/15 border-[2.5px] border-green-500/50 text-green-400 text-[1rem] tracking-[0.06em] rounded-2xl cursor-pointer transition-all hover:bg-green-500/28 hover:border-green-500"
                >
                  ▲  MÁS ALTO
                </button>
                <button
                  onClick={() => elegir("bajo")}
                  className="flex-1 py-6 bg-red-500/15 border-[2.5px] border-red-500/50 text-red-400 text-[1rem] tracking-[0.06em] rounded-2xl cursor-pointer transition-all hover:bg-red-500/28 hover:border-red-500"
                >
                  ▼  MÁS BAJO
                </button>
              </div>
            </div>
          )}

          {/* ── RESULTADO ── */}
          {estado === "resultado" && (
            <div
              className="bg-[rgba(6,0,12,0.94)] border-[2.5px] rounded-3xl p-8 flex flex-col items-center gap-6 shadow-[0_8px_50px_rgba(0,0,0,0.75)] pk-card-in"
              style={{ borderColor: `${resColor}55` }}
            >
              <div className="flex items-center gap-6 justify-center">
                <div className="flex flex-col items-center gap-3">
                  <p className="text-[0.65rem] text-white/35 tracking-[0.1em]">ANTERIOR</p>
                  <div className="w-[130px] h-[130px] flex items-center justify-center rounded-2xl border-2 border-white/15"
                    style={{ fontSize: "4.5rem", color: "rgba(255,255,255,0.55)", lineHeight: 1 }}>
                    {numActual}
                  </div>
                </div>
                <span className="text-[2rem] text-white/20 mt-6">→</span>
                <div className="flex flex-col items-center gap-3">
                  <p className="text-[0.65rem] text-white/35 tracking-[0.1em]">SIGUIENTE</p>
                  <div className="w-[130px] h-[130px] flex items-center justify-center rounded-2xl border-[3px]"
                    style={{ borderColor: `${resColor}88`, fontSize: "4.5rem", color: resColor, background: `${resColor}12`, lineHeight: 1 }}>
                    {numSiguiente}
                  </div>
                </div>
              </div>

              <p className="text-[1.1rem] tracking-[0.04em] text-center" style={{ color: resColor }}>
                {resLabel}
              </p>

              {guardando && <p className="text-[0.68rem] text-white/30">Guardando saldo…</p>}

              <p className="text-[0.82rem] text-white/50">
                Saldo: <span className="text-[#ffcb05]">{Number(saldo ?? 0).toFixed(2)} 💰</span>
              </p>

              <div className="flex gap-4 w-full flex-wrap">
                {(saldo ?? 0) > 0 && (
                  <button onClick={nuevaRonda}
                    className="flex-1 py-4 bg-[rgba(227,0,11,0.15)] border-[2.5px] border-[rgba(227,0,11,0.5)] text-white text-[0.82rem] tracking-[0.05em] rounded-2xl cursor-pointer transition-all hover:bg-[rgba(227,0,11,0.3)]">
                    🎲 Continuar ({bet.toFixed(2)} 💰{monedaFortuna ? " → ×1.5" : ""})
                  </button>
                )}
                <button onClick={reiniciar}
                  className="flex-1 py-4 bg-white/[0.05] border-[2px] border-white/15 text-white/55 text-[0.82rem] rounded-2xl cursor-pointer transition-all hover:bg-white/10 hover:text-white">
                  Cambiar apuesta
                </button>
              </div>

              {(saldo ?? 0) <= 0 && (
                <p className="text-[0.78rem] text-red-400 text-center leading-[1.8]">
                  Sin saldo. ¡Juega al Clicker para ganar monedas!
                </p>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
