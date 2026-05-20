import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import BarraSuperior from "../components/barraSuperior.jsx";
import {
  authApi,
  pokemonApi,
  pokemonUsuariosApi,
  chatApi,
  mediaUrl,
} from "../api/api.js";
import { TipoBadge } from "../utils/pokemon.jsx";
import pokedex from "../assets/img/pokedex.png";
import { usePageMusic } from "../hooks/usePageMusic.js";
import temaPrincipalMusic from "../assets/audio/temas/temaPrincipal.mp3";

function StatBox({ label, value }) {
  return (
    <div className="flex flex-col items-center gap-1.5 bg-white/[0.06] border border-white/10 rounded-xl px-2 py-3.5">
      <span className="text-[0.52rem] text-white/45 tracking-[0.05em] text-center">{label}</span>
      <span className="text-[1rem] text-[#ffcb05] text-center">{value}</span>
    </div>
  );
}

function PokemonDia({ pokemon }) {
  if (!pokemon) {
    return (
      <div className="bg-[rgba(10,0,0,0.9)] border-[1.5px] border-[rgba(227,0,11,0.38)] rounded-2xl flex flex-col items-center gap-4 p-[1.2rem_1.5rem_1.4rem] flex-1 min-h-0 shadow-[0_4px_16px_rgba(0,0,0,0.6)] overflow-hidden">
        <div className="flex-shrink-0 w-[200px] h-[200px] bg-[radial-gradient(circle,rgba(227,0,11,0.12)_0%,transparent_70%)] flex items-center justify-center rounded-full border-[1.5px] border-[rgba(227,0,11,0.2)]">
          <div className="skel" style={{ width: 110, height: 110, borderRadius: "50%" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem", alignItems: "center", width: "100%" }}>
          <div className="skel" style={{ width: 90, height: 16 }} />
          <div className="skel" style={{ width: 160, height: 22, marginTop: 4 }} />
          <div style={{ display: "flex", gap: "0.4rem", marginTop: 4 }}>
            <div className="skel" style={{ width: 65, height: 20, borderRadius: 999 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginTop: 10, width: "100%" }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skel" style={{ height: 52 }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const imgSrc = mediaUrl(pokemon.imagen);

  return (
    <div className="bg-[rgba(10,0,0,0.9)] border-[1.5px] border-[rgba(227,0,11,0.38)] rounded-2xl flex flex-col items-center gap-4 p-[1.2rem_1.5rem_1.4rem] flex-1 min-h-0 shadow-[0_4px_16px_rgba(0,0,0,0.6)] overflow-hidden">
      <div className="flex-shrink-0 w-[200px] h-[200px] bg-[radial-gradient(circle,rgba(227,0,11,0.12)_0%,transparent_70%)] flex items-center justify-center rounded-full border-[1.5px] border-[rgba(227,0,11,0.2)]">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={pokemon.nombre}
            className="w-[185px] h-[185px] object-contain image-pixelated drop-shadow-[0_4px_12px_rgba(227,0,11,0.4)] pk-float"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <svg className="w-[185px] h-[185px]" viewBox="0 0 100 100" aria-hidden="true">
            <path d="M3 50 a47 47 0 0 1 94 0 Z" fill="#e3000b" />
            <path d="M3 50 a47 47 0 0 0 94 0 Z" fill="#f0f0f0" />
            <circle cx="50" cy="50" r="47" fill="none" stroke="#333" strokeWidth="3" />
            <line x1="3" y1="50" x2="97" y2="50" stroke="#333" strokeWidth="6" />
            <circle cx="50" cy="50" r="14" fill="#fff" stroke="#333" strokeWidth="5" />
          </svg>
        )}
      </div>

      <div className="flex flex-col items-center gap-2.5 w-full">
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[0.78rem] text-[#ffcb05] tracking-[0.06em] bg-[rgba(255,203,5,0.12)] border border-[rgba(255,203,5,0.35)] rounded-full px-5 py-2 whitespace-nowrap text-center">
            ★ Pokémon del Día
          </span>
          <span className="text-[0.62rem] text-white/35 text-center">
            #{String(pokemon.id).padStart(3, "0")}
          </span>
        </div>
        <h3 className="text-[1.35rem] text-white tracking-[0.05em] capitalize text-center">{pokemon.nombre}</h3>
        <div className="flex gap-2 flex-wrap justify-center">
          {pokemon.tipo1 && <TipoBadge tipo={pokemon.tipo1} />}
          {pokemon.tipo2 && <TipoBadge tipo={pokemon.tipo2} />}
        </div>
        <div className="grid grid-cols-3 gap-2 w-full mt-1">
          <StatBox label="HP"     value={pokemon.hp_base} />
          <StatBox label="ATK"    value={pokemon.ataque_base} />
          <StatBox label="DEF"    value={pokemon.defensa_base} />
          <StatBox label="SP.ATK" value={pokemon.ataque_esp_base} />
          <StatBox label="SP.DEF" value={pokemon.defensa_esp_base} />
          <StatBox label="VEL"    value={pokemon.velocidad_base} />
        </div>
      </div>
    </div>
  );
}

/* ── Avatar compacto ── */
function Avatar({ nombre, avatar, size = 28 }) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 overflow-hidden"
      style={{
        width: size, height: size,
        fontSize: size * 0.42,
        background: avatar ? "transparent" : "linear-gradient(135deg,#e3000b,#7a0000)",
        border: "1.5px solid rgba(255,203,5,0.35)",
      }}
    >
      {avatar
        ? <img src={mediaUrl(avatar)} alt={nombre} className="w-full h-full object-cover" />
        : (nombre?.[0] ?? "?").toUpperCase()
      }
    </div>
  );
}

/* ── Panel de chat embebido (polling cada 3 s) ── */
function PanelChat({ usuario }) {
  const [mensajes,  setMensajes]  = useState([]);
  const [texto,     setTexto]     = useState("");
  const [enviando,  setEnviando]  = useState(false);
  const ultimoIdRef = useRef(0);   // mayor id visto, para polling incremental
  const listaRef    = useRef(null);
  const inputRef    = useRef(null);

  /* Carga inicial + polling cada 3 segundos */
  useEffect(() => {
    async function cargarHistorial() {
      try {
        const historial = await chatApi.getHistorial(50);
        if (historial.length > 0) {
          ultimoIdRef.current = historial[historial.length - 1].id;
        }
        setMensajes(historial);
      } catch { /* silencioso */ }
    }

    async function pollNuevos() {
      try {
        const nuevos = await chatApi.getMensajesNuevos(ultimoIdRef.current);
        if (nuevos.length > 0) {
          ultimoIdRef.current = nuevos[nuevos.length - 1].id;
          setMensajes(prev => [...prev, ...nuevos]);
        }
      } catch { /* silencioso */ }
    }

    cargarHistorial();
    const intervalo = setInterval(pollNuevos, 3000);
    return () => clearInterval(intervalo);
  }, []);

  /* Auto-scroll al último mensaje */
  useEffect(() => {
    if (listaRef.current) listaRef.current.scrollTop = listaRef.current.scrollHeight;
  }, [mensajes]);

  async function enviar(e) {
    e?.preventDefault();
    const msg = texto.trim();
    if (!msg || enviando) return;
    setEnviando(true);
    try {
      const nuevo = await chatApi.enviarMensaje(msg);
      // Añadir el mensaje propio inmediatamente sin esperar al poll
      ultimoIdRef.current = nuevo.id;
      setMensajes(prev => [...prev, nuevo]);
      setTexto("");
      inputRef.current?.focus();
    } catch { /* silencioso */ }
    finally { setEnviando(false); }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); }
  }

  return (
    <>
      {/* Lista de mensajes */}
      <div
        ref={listaRef}
        className="flex-1 overflow-y-auto flex flex-col gap-2 px-3 py-3 min-h-0"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(227,0,11,0.2) transparent" }}
      >
        {mensajes.length === 0 && (
          <p className="text-[0.6rem] text-white/20 text-center mt-4 tracking-[0.05em]">
            Sé el primero en escribir…
          </p>
        )}
        {mensajes.map(msg => {
          const esPropio = msg.id_usuario === usuario?.id;
          const hora = new Date(msg.fecha).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
          return (
            <div key={msg.id} className={`flex items-end gap-1.5 ${esPropio ? "flex-row-reverse" : ""}`}>
              {!esPropio && <Avatar nombre={msg.nombre} avatar={msg.avatar} size={24} />}
              <div className={`flex flex-col gap-0.5 max-w-[80%] ${esPropio ? "items-end" : "items-start"}`}>
                {!esPropio && (
                  <span className="text-[0.52rem] text-white/35 px-1">{msg.nombre}</span>
                )}
                <div
                  className="px-3 py-1.5 rounded-2xl text-[0.72rem] leading-[1.6] break-words"
                  style={esPropio
                    ? { background: "linear-gradient(135deg,#e3000b,#b50009)", color: "#fff", borderBottomRightRadius: 3 }
                    : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.85)", borderBottomLeftRadius: 3, border: "1px solid rgba(255,255,255,0.08)" }
                  }
                >
                  {msg.mensaje}
                </div>
                <span className="text-[0.48rem] text-white/20 px-1">{hora}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <form
        onSubmit={enviar}
        className="flex items-center gap-2 px-3 py-2.5 flex-shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
      >
        <input
          ref={inputRef}
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Mensaje…"
          maxLength={500}
          disabled={enviando}
          className="flex-1 bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2 text-white text-[0.72rem] outline-none placeholder:text-white/20 focus:border-[rgba(227,0,11,0.4)] transition-colors disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={enviando || !texto.trim()}
          className="w-8 h-8 rounded-xl flex items-center justify-center border-none cursor-pointer flex-shrink-0 transition-all disabled:opacity-30"
          style={{ background: "linear-gradient(135deg,#e3000b,#b50009)" }}
          aria-label="Enviar"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </form>
    </>
  );
}

function MenuPrincipal() {
  usePageMusic(temaPrincipalMusic);
  const [capturados,   setCapturados]   = useState(null);
  const [totalPokemon, setTotalPokemon] = useState(null);
  const [pokemonDia,   setPokemonDia]   = useState(null);
  const [usuario,      setUsuario]      = useState(null);

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [todos, usuario] = await Promise.all([
          pokemonApi.getAll(),
          authApi.getUsuarioActual(),
        ]);
        setUsuario(usuario);

        const misPokemon = usuario?.id
          ? await pokemonUsuariosApi.getByUsuario(usuario.id)
          : null;

        if (Array.isArray(todos)) {
          setTotalPokemon(todos.length);

          const hoy    = new Date();
          const semilla =
            hoy.getFullYear() * 10000 +
            (hoy.getMonth() + 1) * 100 +
            hoy.getDate();

          function seededRandom(seed) {
            const x = Math.sin(seed + 1) * 10000;
            return x - Math.floor(x);
          }

          const indice = Math.floor(seededRandom(semilla) * 151);
          setPokemonDia(todos[indice]);
        }

        setCapturados(Array.isArray(misPokemon) ? misPokemon.length : 0);
      } catch {
        setTotalPokemon(0);
        setCapturados(0);
      }
    }

    cargarDatos();
  }, []);

  const pct =
    totalPokemon && capturados != null
      ? Math.min((capturados / totalPokemon) * 100, 100)
      : 0;

  const panelBase =
    "bg-[rgba(10,0,0,0.88)] border-[1.5px] border-[rgba(227,0,11,0.3)] rounded-2xl flex flex-col overflow-hidden relative shadow-[0_4px_16px_rgba(0,0,0,0.6)]";

  return (
    <>
      <BarraSuperior />
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_200px] lg:grid-cols-[320px_1fr_320px] gap-4 p-4 flex-1 isolation-isolate">

        {/* ── Columna izquierda: Eventos ── */}
        <div className={`${panelBase} order-2 md:order-none`}>
          <div className="flex items-center gap-2 px-5 py-4 border-b-[1.5px] border-[rgba(227,0,11,0.2)] flex-shrink-0">
            <span className="text-[1.1rem]">📅</span>
            <h2 className="text-[0.75rem] text-[#ffcb05] tracking-[0.05em]">Eventos</h2>
          </div>
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
              <span className="text-[0.85rem] text-[rgba(255,203,5,0.18)] tracking-[0.04em] -rotate-[30deg] whitespace-nowrap select-none border-[2.5px] border-[rgba(255,203,5,0.1)] px-5 py-2.5 rounded-xl leading-[2.2]">
                Próximamente
              </span>
            </div>
          </div>
        </div>

        {/* ── Columna central ── */}
        <div className="order-1 md:order-none flex flex-col gap-4 min-h-0">

          {/* Pokédex */}
          <div className="bg-[rgba(10,0,0,0.9)] border-[1.5px] border-[rgba(227,0,11,0.38)] rounded-2xl p-[1.3rem_1.8rem_1.4rem] flex items-center gap-7 shadow-[0_4px_16px_rgba(0,0,0,0.6)] flex-shrink-0">
            <Link
              to="/biblioteca"
              className="flex-shrink-0 transition-[filter] duration-[180ms] hover:drop-shadow-[0_0_16px_rgba(227,0,11,0.8)]"
            >
              <img src={pokedex} width={120} alt="Abrir Biblioteca Pokémon" className="image-pixelated" />
            </Link>
            <div className="flex-1 flex flex-col gap-1.5">
              <h2 className="text-[0.9rem] text-[#e3000b] tracking-[0.06em]">Pokédex</h2>
              <p className="text-[0.55rem] text-white/45 tracking-[0.04em]">Pokémon capturados</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-[2rem] text-[#ffcb05] leading-none">{capturados ?? "–"}</span>
                <span className="text-[1.1rem] text-white/30">/</span>
                <span className="text-[1.1rem] text-white/45">{totalPokemon ?? "–"}</span>
              </div>
              <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden mt-1">
                <div className="pokedex-barra-fill" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-[0.5rem] text-white/35 tracking-[0.05em] mt-0.5">
                {pct > 0 ? `${pct.toFixed(1)}% completado` : "¡Empieza a capturar!"}
              </p>
            </div>
          </div>

          {/* Pokémon del Día */}
          <PokemonDia pokemon={pokemonDia} />
        </div>

        {/* ── Columna derecha: Chat global ── */}
        <div className={`${panelBase} order-3 md:order-none`}>
          <div className="flex items-center justify-between px-5 py-4 border-b-[1.5px] border-[rgba(227,0,11,0.2)] flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[1.1rem]">💬</span>
              <h2 className="text-[0.75rem] text-[#ffcb05] tracking-[0.05em]">Chat Global</h2>
            </div>
          </div>
          <PanelChat usuario={usuario} />
        </div>
      </div>
    </>
  );
}

export default MenuPrincipal;
