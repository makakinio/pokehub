import { useEffect, useState, useMemo } from "react";
import BarraSuperior from "../components/barraSuperior.jsx";
import { TipoBadge, TYPE_COLORS, PokeballVacia } from "../utils/pokemon.jsx";
import { authApi, pokemonApi, pokemonUsuariosApi, mediaUrl } from "../api/api.js";
import { usePageMusic } from "../hooks/usePageMusic.js";
import bibliotecaMusic from "../assets/audio/temas/biblioteca.mp3";

/* ── Card de Pokémon capturado ────────────────────────── */
function CardCapturado({ pokemon }) {
  const tipoColor = TYPE_COLORS[pokemon.tipo1?.toLowerCase()] ?? "#e3000b";

  return (
    <div
      className="bg-[rgba(10,0,0,0.92)] border-[1.5px] rounded-2xl shadow-[0_4px_14px_rgba(0,0,0,0.6)] p-[1.4rem_1rem_1.5rem] flex flex-col items-center gap-[0.8rem] transition-all duration-[180ms] hover:shadow-[0_6px_22px_rgba(0,0,0,0.75)] hover:scale-[1.01]"
      style={{
        borderColor: `${tipoColor}66`,
        background: `linear-gradient(145deg, rgba(10,0,0,0.94) 55%, ${tipoColor}12)`,
      }}
    >
      <span className="text-[0.6rem] text-white/30 tracking-[0.06em] self-start">
        #{String(pokemon.id).padStart(3, "0")}
      </span>

      <div
        className="w-[120px] h-[120px] flex items-center justify-center rounded-full flex-shrink-0"
        style={{ background: `radial-gradient(circle, ${tipoColor}18 0%, transparent 70%)` }}
      >
        {pokemon.imagen ? (
          <img
            src={mediaUrl(pokemon.imagen)}
            alt={pokemon.nombre}
            className="w-[108px] h-[108px] object-contain image-pixelated drop-shadow-[0_3px_8px_rgba(0,0,0,0.5)]"
            onError={e => { e.target.style.display = "none"; }}
          />
        ) : (
          <PokeballVacia size={96} opacity={0.25} />
        )}
      </div>

      <p className="text-[0.75rem] text-white tracking-[0.04em] capitalize text-center leading-[1.5]">
        {pokemon.nombre}
      </p>

      <div className="flex gap-1.5 flex-wrap justify-center">
        <TipoBadge tipo={pokemon.tipo1} />
        {pokemon.tipo2 && <TipoBadge tipo={pokemon.tipo2} />}
      </div>

      {pokemon.descripcion && (
        <p
          className="text-[0.58rem] text-white/45 tracking-[0.03em] leading-[1.9] text-center overflow-hidden w-full border-t border-white/[0.07] pt-3 mt-0.5"
          style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}
        >
          {pokemon.descripcion}
        </p>
      )}
    </div>
  );
}

/* ── Card de Pokémon no capturado ─────────────────────── */
function CardDesconocido({ id }) {
  return (
    <div className="bg-[rgba(10,0,0,0.88)] border-[1.5px] border-[rgba(255,255,255,0.06)] rounded-2xl shadow-[0_4px_14px_rgba(0,0,0,0.5)] p-[1.4rem_1rem_1.5rem] flex flex-col items-center gap-[0.8rem] opacity-50">
      <span className="text-[0.6rem] text-white/20 tracking-[0.06em] self-start">
        #{String(id).padStart(3, "0")}
      </span>

      <div className="w-[120px] h-[120px] flex items-center justify-center rounded-full flex-shrink-0 bg-white/[0.03]">
        <PokeballVacia size={96} opacity={0.1} />
      </div>

      <p className="text-[0.75rem] text-white/25 tracking-[0.06em] text-center">???</p>

      <div className="flex gap-1">
        <span className="inline-block text-[0.55rem] tracking-[0.04em] px-[0.85rem] py-[0.38rem] rounded-full bg-white/[0.06] text-white/20">
          ???
        </span>
      </div>

      <p className="text-[0.52rem] text-white/15 tracking-[0.03em] leading-[1.8] text-center w-full border-t border-white/[0.05] pt-3 mt-0.5">
        No capturado
      </p>
    </div>
  );
}

/* ── Skeleton ─────────────────────────────────────────── */
function CardSkeleton() {
  return (
    <div className="bg-[rgba(10,0,0,0.92)] border-[1.5px] border-[rgba(227,0,11,0.2)] rounded-2xl p-[1.4rem_1rem_1.5rem] flex flex-col items-center gap-[0.8rem]">
      <div className="skel" style={{ width: 120, height: 120, borderRadius: "50%", margin: "0.3rem auto" }} />
      <div className="skel" style={{ width: "65%", height: 14, margin: "0.4rem auto 0" }} />
      <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", marginTop: "0.4rem" }}>
        <div className="skel" style={{ width: 60, height: 20, borderRadius: 999 }} />
      </div>
      <div className="skel" style={{ width: "90%", height: 11, marginTop: "0.6rem" }} />
      <div className="skel" style={{ width: "75%", height: 11 }} />
    </div>
  );
}

/* ── Página ───────────────────────────────────────────── */
export default function Biblioteca() {
  usePageMusic(bibliotecaMusic);
  const [todosPokemon,  setTodosPokemon]  = useState([]);
  const [capturadosIds, setCapturadosIds] = useState(new Set());
  const [cargando,      setCargando]      = useState(true);
  const [busqueda,      setBusqueda]      = useState("");
  const [filtro,        setFiltro]        = useState("todos");

  useEffect(() => {
    async function cargar() {
      try {
        const [todos, usuario] = await Promise.all([
          pokemonApi.getAll(),
          authApi.getUsuarioActual(),
        ]);
        setTodosPokemon(todos);

        if (usuario?.id) {
          const misPk = await pokemonUsuariosApi.getByUsuario(usuario.id);
          setCapturadosIds(new Set(misPk.map(p => p.id_pokemon)));
        }
      } catch {
        /* silencioso */
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  const lista = useMemo(() => {
    return todosPokemon.filter(pk => {
      const matchBusqueda =
        pk.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        String(pk.id).includes(busqueda);
      const esCap = capturadosIds.has(pk.id);
      const matchFiltro =
        filtro === "todos"      ? true :
        filtro === "capturados" ? esCap : !esCap;
      return matchBusqueda && matchFiltro;
    });
  }, [todosPokemon, busqueda, filtro, capturadosIds]);

  const totalCap = capturadosIds.size;
  const totalPk  = todosPokemon.length;
  const pct      = totalPk > 0 ? Math.min((totalCap / totalPk) * 100, 100) : 0;

  return (
    <>
      <BarraSuperior />
      <div className="w-full bg-black/55 px-5 pt-5 pb-8 md:px-8">

        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 flex-wrap">
          <div>
            <h1 className="text-[1.5rem] text-white tracking-[0.05em] leading-[1.6]">📖 Biblioteca</h1>
            <p className="text-[0.68rem] text-white/45 tracking-[0.04em] mt-1.5 leading-[1.8]">
              {cargando ? "Cargando..." : `${totalCap} / ${totalPk} capturados · ${pct.toFixed(1)}%`}
            </p>
          </div>

          {/* Buscador */}
          <div className="flex items-center gap-2.5 bg-white/5 border border-white/12 rounded-full px-5 py-3 min-w-[220px]">
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "1rem" }}>🔍</span>
            <input
              className="bg-transparent border-none outline-none text-white text-[0.7rem] w-full placeholder:text-white/35"
              type="text"
              placeholder="Nombre o número..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>

          {/* Filtros */}
          <div className="flex gap-2 flex-wrap">
            {[
              { id: "todos",      label: "Todos" },
              { id: "capturados", label: "✓ Capturados" },
              { id: "falta",      label: "??? Sin capturar" },
            ].map(f => (
              <button
                key={f.id}
                className={`bg-transparent border rounded-full text-[0.62rem] tracking-[0.04em] px-5 py-2.5 cursor-pointer transition-all whitespace-nowrap${
                  filtro === f.id
                    ? " border-[rgba(255,203,5,0.6)] text-[#ffcb05] bg-[rgba(255,203,5,0.1)]"
                    : " border-white/20 text-white/55 hover:text-white hover:border-white/40"
                }`}
                onClick={() => setFiltro(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Barra de progreso */}
        {!cargando && totalPk > 0 && (
          <div className="w-full h-[8px] bg-white/10 rounded-full overflow-hidden mb-4">
            <div
              className="h-full rounded-full transition-[width] duration-[1000ms]"
              style={{ width: `${pct}%`, background: "linear-gradient(90deg, #e3000b, #ffcb05)" }}
            />
          </div>
        )}

        {/* Grid */}
        <div>
          {cargando ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4">
              {Array.from({ length: 12 }, (_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : lista.length === 0 ? (
            <div className="bg-[rgba(10,0,0,0.92)] border-[1.5px] border-[rgba(227,0,11,0.3)] rounded-2xl flex flex-col items-center justify-center gap-4 text-center py-16">
              <PokeballVacia size={80} opacity={0.2} />
              <p className="text-[0.82rem] text-white/60 tracking-[0.05em] leading-[1.8]">Sin resultados</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4">
              {lista.map(pk =>
                capturadosIds.has(pk.id)
                  ? <CardCapturado key={pk.id} pokemon={pk} />
                  : <CardDesconocido key={pk.id} id={pk.id} />
              )}
            </div>
          )}
        </div>

      </div>
    </>
  );
}
