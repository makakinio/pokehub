import { useNavigate } from "react-router-dom";
import BarraSuperior from "../components/barraSuperior.jsx";
import { useMonedaFortuna } from "../hooks/useMonedaFortuna.js";
import { usePageMusic } from "../hooks/usePageMusic.js";
import temaPrincipalMusic from "../assets/audio/temas/temaPrincipal.mp3";

const JUEGOS = [
  {
    key: "alto-bajo",
    emoji: "🎲",
    titulo: "Alto o Bajo",
    desc: "Apuesta monedas y adivina si el siguiente número es mayor o menor. ¡Si aciertas, ganas lo apostado! Sin límite de partidas.",
    href: "/minijuegos/alto-bajo",
    disponible: true,
    color: "#e3000b",
    tag: "💰 Gana monedas",
    ganaCoin: true,
  },
  {
    key: "clicks",
    emoji: "👆",
    titulo: "Clicker Pokémon",
    desc: "Clickea la Pokéball lo más rápido que puedas. Cada click te da monedas sin límite de partidas ni de ganancias.",
    href: "/minijuegos/clicks",
    disponible: true,
    color: "#ffcb05",
    tag: "💰 Gana monedas",
    ganaCoin: true,
  },
  {
    key: "ruleta",
    emoji: "🎡",
    titulo: "Ruleta Diaria",
    desc: "Gira la ruleta una vez al día y gana hasta 1000 monedas. Ocho premios posibles, todos con la misma probabilidad.",
    href: "/minijuegos/ruleta",
    disponible: true,
    color: "#8b5cf6",
    tag: "🎁 1 tirada gratis/día",
    ganaCoin: true,
    diario: true,
  },
];

export default function Minijuegos() {
  usePageMusic(temaPrincipalMusic);
  const navigate = useNavigate();
  const { monedaFortuna, cargandoMoneda: cargando } = useMonedaFortuna();

  return (
    <>
      <BarraSuperior />
      <div className="w-full bg-black/55 px-6 py-6 flex flex-col items-center">

        {/* Cabecera */}
        <div className="text-center mb-6 w-full max-w-[1000px]">
          <h1 className="text-[2.2rem] text-white tracking-[0.06em] leading-[1.6]">🎮 Minijuegos</h1>
          <p className="text-[1rem] text-white/45 tracking-[0.04em] mt-4 leading-[1.8]">
            Pon a prueba tus habilidades y gana monedas
          </p>
        </div>

        {/* Banner Moneda Fortuna */}
        {!cargando && monedaFortuna && (
          <div className="w-full max-w-[1000px] mb-5 flex items-center gap-4 px-5 py-3.5 rounded-2xl border-[2px] border-[rgba(255,203,5,0.4)] bg-[rgba(255,203,5,0.08)]">
            <span className="text-2xl flex-shrink-0">🪙</span>
            <div>
              <p className="text-[0.82rem] text-[#ffcb05] tracking-[0.03em]">Moneda Fortuna activa</p>
              <p className="text-[0.65rem] text-white/45 mt-0.5 leading-[1.6]">
                ×1.5 en todas las ganancias de monedas mientras juegues
              </p>
            </div>
            <span className="ml-auto text-[1.1rem] font-bold text-[#ffcb05] bg-[rgba(255,203,5,0.15)] border border-[rgba(255,203,5,0.4)] px-3 py-1.5 rounded-xl whitespace-nowrap">
              ×1.5 💰
            </span>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-[1000px]">
          {JUEGOS.map(juego => (
            <div
              key={juego.key}
              onClick={() => juego.disponible && juego.href && navigate(juego.href)}
              className={`group relative bg-[rgba(6,0,12,0.95)] border-[2.5px] rounded-3xl overflow-hidden transition-all duration-250 flex flex-col ${
                juego.disponible
                  ? "cursor-pointer hover:scale-[1.02] hover:shadow-[0_20px_60px_rgba(0,0,0,0.85)]"
                  : "opacity-55 cursor-not-allowed"
              }`}
              style={{
                borderColor: juego.disponible ? `${juego.color}60` : "rgba(255,255,255,0.08)",
                boxShadow: juego.disponible ? `0 8px 30px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.04)` : "none",
              }}
            >
              {/* Barra de color superior */}
              {juego.disponible && (
                <div className="h-1.5 w-full" style={{ background: juego.color }} />
              )}

              {/* Badge Moneda Fortuna en la tarjeta */}
              {!cargando && monedaFortuna && juego.ganaCoin && juego.disponible && (
                <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.6rem] text-[#ffcb05] bg-[rgba(255,203,5,0.15)] border border-[rgba(255,203,5,0.4)]">
                  🪙 ×1.5
                </div>
              )}

              {/* Badge "1/día" para la ruleta */}
              {juego.diario && juego.disponible && (
                <div
                  className="absolute top-4 left-4 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.58rem]"
                  style={{
                    color: juego.color,
                    background: `${juego.color}18`,
                    border: `1px solid ${juego.color}50`,
                  }}
                >
                  📅 1/día
                </div>
              )}

              {/* Watermark no disponible */}
              {!juego.disponible && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10">
                  <span className="text-[0.9rem] text-white/10 -rotate-[20deg] tracking-[0.08em] whitespace-nowrap border-[2px] border-white/10 px-8 py-3 rounded-2xl">
                    Próximamente
                  </span>
                </div>
              )}

              {/* Contenido */}
              <div className="flex flex-col items-center gap-7 p-12 flex-1">
                <div
                  className="w-36 h-36 rounded-3xl flex items-center justify-center text-[5.5rem] flex-shrink-0"
                  style={{ background: `${juego.color}18`, border: `2.5px solid ${juego.color}35` }}
                >
                  {juego.emoji}
                </div>

                <div className="flex flex-col items-center gap-5 text-center flex-1">
                  <h2 className="text-[1.25rem] text-white tracking-[0.04em] leading-[1.5]">{juego.titulo}</h2>
                  <p className="text-[0.85rem] text-white/50 tracking-[0.03em] leading-[2]">{juego.desc}</p>
                </div>

                <span
                  className="text-[0.8rem] tracking-[0.05em] px-6 py-3 rounded-full border-[1.5px]"
                  style={juego.disponible
                    ? { color: juego.color, borderColor: `${juego.color}55`, background: `${juego.color}12` }
                    : { color: "rgba(255,255,255,0.25)", borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)" }
                  }
                >
                  {juego.tag}
                  {!cargando && monedaFortuna && juego.ganaCoin && juego.disponible && " · ×1.5"}
                </span>

                <button
                  disabled={!juego.disponible}
                  onClick={e => { e.stopPropagation(); if (juego.disponible && juego.href) navigate(juego.href); }}
                  className="w-full py-5 rounded-2xl text-[0.9rem] tracking-[0.06em] font-semibold transition-all duration-200 border-none cursor-pointer disabled:cursor-not-allowed"
                  style={juego.disponible
                    ? { background: juego.color, color: "#fff", boxShadow: `0 5px 22px ${juego.color}55` }
                    : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.2)" }
                  }
                >
                  {juego.disponible ? "▶  Jugar ahora" : "Próximamente"}
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}
