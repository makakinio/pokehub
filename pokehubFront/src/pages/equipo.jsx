import { useEffect, useState, useCallback } from "react";
import BarraSuperior from "../components/barraSuperior.jsx";
import { TipoBadge, PokeballVacia } from "../utils/pokemon.jsx";
import { authApi, equiposApi, pokemonUsuariosApi, pokemonApi, mediaUrl } from "../api/api.js";
import { usePageMusic } from "../hooks/usePageMusic.js";
import temaPrincipalMusic from "../assets/audio/temas/temaPrincipal.mp3";

/* ── Slot vacío ──────────────────────────────────────── */
function SlotVacio({ numero }) {
  return (
    <div className="bg-[rgba(10,0,0,0.92)] border-[1.5px] border-dashed border-[rgba(227,0,11,0.2)] rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.55)] p-[1.8rem_1.2rem_1.6rem] flex flex-col items-center justify-center gap-3 min-h-[380px] relative transition-all duration-200 opacity-70">
      <PokeballVacia size={65} opacity={0.18} />
      <p className="text-[0.55rem] text-white/30 tracking-[0.04em]">Slot {numero}</p>
      <p className="text-[0.5rem] text-white/20 tracking-[0.04em]">vacío</p>
    </div>
  );
}

/* ── Slot skeleton ───────────────────────────────────── */
function SlotSkeleton() {
  return (
    <div className="bg-[rgba(10,0,0,0.92)] border-[1.5px] border-[rgba(227,0,11,0.35)] rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.55)] p-[1.8rem_1.2rem_1.6rem] flex flex-col items-center gap-3 min-h-[380px] relative transition-all duration-200">
      <div className="skel" style={{ width: 100, height: 100, borderRadius: "50%", margin: "0 auto" }} />
      <div className="skel" style={{ width: "55%", height: 13, margin: "0.8rem auto 0" }} />
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginTop: "0.5rem" }}>
        <div className="skel" style={{ width: 56, height: 18, borderRadius: 999 }} />
        <div className="skel" style={{ width: 56, height: 18, borderRadius: 999 }} />
      </div>
      <div className="skel" style={{ width: "85%", height: 9, margin: "1rem auto 0", borderRadius: 999 }} />
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginTop: "0.7rem" }}>
        {[0,1,2].map(i => <div key={i} className="skel" style={{ width: 54, height: 44, borderRadius: "0.5rem" }} />)}
      </div>
    </div>
  );
}

/* ── Slot con Pokémon ────────────────────────────────── */
function SlotPokemon({ pu, pk }) {
  const tipoColor = pk?.tipo1
    ? ({ fuego:"#e25822",agua:"#1a7fc1",planta:"#2e8b57",electrico:"#c9a900",
          psiquico:"#c2185b",normal:"#7a7a7a",veneno:"#7b2d8b",tierra:"#a0784e",
          volador:"#5b8fc9",roca:"#7d6535",lucha:"#b71c1c",hielo:"#2e8fa8",
          fantasma:"#4a2f7a",dragon:"#2c3e8f",acero:"#6c7a7a",siniestro:"#2c3e50",
          hada:"#c2508e",bicho:"#6d7c28" }[pk.tipo1.toLowerCase()] ?? "#e3000b")
    : "#e3000b";

  const hpMax  = pk?.hp_base ?? 1;
  const hpAct  = pu?.hp ?? 0;
  const hpPct  = Math.min(Math.round((hpAct / hpMax) * 100), 100);
  const hpColor = hpPct > 50 ? "#22c55e" : hpPct > 25 ? "#f59e0b" : "#ef4444";

  return (
    <div
      className="bg-[rgba(10,0,0,0.92)] border-[1.5px] rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.55)] p-[1.8rem_1.2rem_1.6rem] flex flex-col items-center gap-2.5 min-h-[380px] relative transition-all duration-200"
      style={{
        borderColor: `${tipoColor}66`,
        background: `linear-gradient(145deg, rgba(10,0,0,0.94) 55%, ${tipoColor}1a)`,
      }}
    >
      {pu.shiny && <span className="absolute top-2 right-3 text-lg" title="¡Shiny!">✨</span>}
      <span className="text-[0.5rem] text-white/30 tracking-[0.06em] self-start">#{String(pk.id).padStart(3, "0")}</span>

      <div className="w-[130px] h-[130px] flex items-center justify-center">
        {pk.imagen ? (
          <img
            src={mediaUrl(pk.imagen)}
            alt={pk.nombre}
            className="w-full h-full object-contain image-pixelated drop-shadow-[0_3px_8px_rgba(0,0,0,0.5)]"
            onError={e => { e.target.style.display = "none"; }}
          />
        ) : (
          <PokeballVacia size={90} opacity={0.25} />
        )}
      </div>

      <p className="text-[0.68rem] text-white tracking-[0.04em] capitalize text-center mt-0.5">{pu.apodo || pk.nombre}</p>

      <div className="flex gap-1.5 flex-wrap justify-center">
        <TipoBadge tipo={pk.tipo1} />
        {pk.tipo2 && <TipoBadge tipo={pk.tipo2} />}
      </div>

      <div className="text-[0.55rem] text-[#ffcb05] bg-[rgba(255,203,5,0.1)] border border-[rgba(255,203,5,0.25)] rounded-full px-[0.65rem] py-[0.22rem]">
        Nv.&nbsp;{pu.nivel}
      </div>

      <div className="w-full mt-1">
        <div className="flex justify-between text-[0.46rem] text-white/45 mb-1">
          <span>HP</span>
          <span>{hpAct} / {hpMax}</span>
        </div>
        <div className="w-full h-[7px] bg-white/10 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-[width] duration-[800ms]" style={{ width: `${hpPct}%`, background: hpColor }} />
        </div>
      </div>

      <div className="flex gap-2 w-full mt-1">
        {[["ATK", pu.ataque], ["DEF", pu.defensa], ["VEL", pu.velocidad]].map(([lbl, val]) => (
          <div key={lbl} className="flex-1 flex flex-col items-center gap-1 bg-white/5 border border-white/[0.08] rounded-lg py-[0.4rem] px-1">
            <span className="text-[0.44rem] text-white/40">{lbl}</span>
            <span className="text-[0.62rem] text-[#ffcb05]">{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Tarjeta seleccionable en el modal ───────────────── */
function PokemonSeleccionable({ pu, pk, slotNum, onClick }) {
  const seleccionado = slotNum !== null;
  const tipoColor = pk?.tipo1
    ? ({ fuego:"#e25822",agua:"#1a7fc1",planta:"#2e8b57",electrico:"#c9a900",
          psiquico:"#c2185b",normal:"#7a7a7a",veneno:"#7b2d8b",tierra:"#a0784e",
          volador:"#5b8fc9",roca:"#7d6535",lucha:"#b71c1c",hielo:"#2e8fa8",
          fantasma:"#4a2f7a",dragon:"#2c3e8f",acero:"#6c7a7a",siniestro:"#2c3e50",
          hada:"#c2508e",bicho:"#6d7c28" }[pk.tipo1.toLowerCase()] ?? "#e3000b")
    : "#e3000b";

  return (
    <div
      onClick={onClick}
      className="relative cursor-pointer rounded-2xl p-3 flex flex-col items-center gap-2 transition-all duration-150 select-none"
      style={{
        background: seleccionado
          ? `linear-gradient(145deg, rgba(255,203,5,0.14), rgba(255,203,5,0.06))`
          : `linear-gradient(145deg, rgba(10,0,0,0.94) 55%, ${tipoColor}18)`,
        border: seleccionado
          ? "2px solid rgba(255,203,5,0.7)"
          : `2px solid ${tipoColor}44`,
        boxShadow: seleccionado
          ? "0 0 18px rgba(255,203,5,0.25)"
          : "0 2px 8px rgba(0,0,0,0.5)",
        transform: seleccionado ? "scale(1.03)" : "scale(1)",
      }}
    >
      {/* Número de slot */}
      {seleccionado && (
        <span
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[0.55rem] font-bold z-10"
          style={{ background: "#ffcb05", color: "#000" }}
        >
          {slotNum}
        </span>
      )}

      <div className="w-[72px] h-[72px] flex items-center justify-center">
        {pk?.imagen ? (
          <img
            src={mediaUrl(pk.imagen)}
            alt={pk.nombre}
            className="w-full h-full object-contain image-pixelated drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
            onError={e => { e.target.style.display = "none"; }}
          />
        ) : (
          <PokeballVacia size={60} opacity={0.25} />
        )}
      </div>

      <p className="text-[0.58rem] text-white tracking-[0.03em] capitalize text-center leading-[1.4]">
        {pu.apodo || pk?.nombre}
      </p>

      <div className="flex gap-1 flex-wrap justify-center">
        {pk?.tipo1 && <TipoBadge tipo={pk.tipo1} />}
        {pk?.tipo2 && <TipoBadge tipo={pk.tipo2} />}
      </div>

      <span className="text-[0.48rem] text-[#ffcb05]/70">Nv.{pu.nivel}</span>
    </div>
  );
}

/* ── Modal de creación de equipo ─────────────────────── */
function ModalCrearEquipo({ userId, onClose, onCreado }) {
  const [nombre,       setNombre]       = useState("");
  const [biblioteca,   setBiblioteca]   = useState([]);   // [{ pu, pk }]
  const [seleccionados, setSeleccionados] = useState([]);  // array de pu.id (máx 6, en orden)
  const [cargando,     setCargando]     = useState(true);
  const [guardando,    setGuardando]    = useState(false);
  const [errorModal,   setErrorModal]   = useState("");

  useEffect(() => {
    async function cargarBiblioteca() {
      try {
        const puList = await pokemonUsuariosApi.getByUsuario(userId);
        if (!puList || puList.length === 0) { setBiblioteca([]); setCargando(false); return; }
        const pkList = await Promise.all(puList.map(pu => pokemonApi.getById(pu.id_pokemon)));
        setBiblioteca(puList.map((pu, i) => ({ pu, pk: pkList[i] })));
      } catch {
        setErrorModal("No se pudo cargar tu biblioteca de Pokémon.");
      } finally {
        setCargando(false);
      }
    }
    cargarBiblioteca();
  }, [userId]);

  function togglePokemon(puId) {
    setSeleccionados(prev => {
      if (prev.includes(puId)) return prev.filter(id => id !== puId);
      if (prev.length >= 6) return prev;
      return [...prev, puId];
    });
  }

  async function guardar() {
    if (!nombre.trim()) { setErrorModal("Ponle un nombre a tu equipo."); return; }
    if (seleccionados.length === 0) { setErrorModal("Selecciona al menos 1 Pokémon."); return; }
    setErrorModal("");
    setGuardando(true);
    try {
      const hoy = new Date().toISOString().split("T")[0];
      const payload = {
        id_usuario: userId,
        nombre: nombre.trim(),
        fecha_creacion: hoy,
        id_pokemon_usuario_01: seleccionados[0] ?? null,
        id_pokemon_usuario_02: seleccionados[1] ?? null,
        id_pokemon_usuario_03: seleccionados[2] ?? null,
        id_pokemon_usuario_04: seleccionados[3] ?? null,
        id_pokemon_usuario_05: seleccionados[4] ?? null,
        id_pokemon_usuario_06: seleccionados[5] ?? null,
      };
      const nuevoEquipo = await equiposApi.create(payload);
      onCreado(nuevoEquipo);
    } catch (e) {
      setErrorModal(e.message ?? "Error al guardar el equipo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-[760px] max-h-[90vh] flex flex-col rounded-3xl overflow-hidden pk-card-in"
        style={{
          background: "rgba(6,0,12,0.98)",
          border: "2.5px solid rgba(227,0,11,0.4)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.9), 0 0 60px rgba(227,0,11,0.08)",
        }}
      >
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between px-7 pt-7 pb-5 shrink-0" style={{ borderBottom: "1.5px solid rgba(255,255,255,0.07)" }}>
          <div>
            <h2 className="text-[1.1rem] text-white tracking-[0.05em]">➕ Crear Equipo</h2>
            <p className="text-[0.65rem] text-white/40 mt-1.5 tracking-[0.04em]">
              Selecciona hasta 6 Pokémon de tu biblioteca
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all text-[1.1rem] cursor-pointer border-none bg-transparent"
          >
            ✕
          </button>
        </div>

        {/* Nombre del equipo */}
        <div className="px-7 pt-6 pb-4 shrink-0">
          <input
            type="text"
            maxLength={40}
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Nombre del equipo…"
            className="w-full bg-white/[0.06] border-[2px] border-white/15 rounded-2xl px-5 py-3.5 text-white text-[0.85rem] outline-none focus:border-[rgba(255,203,5,0.5)] transition-colors placeholder:text-white/25 tracking-[0.03em]"
          />
        </div>

        {/* Slots seleccionados */}
        <div className="px-7 pb-4 shrink-0">
          <p className="text-[0.6rem] text-white/35 tracking-[0.08em] mb-3">
            SLOTS SELECCIONADOS ({seleccionados.length}/6)
          </p>
          <div className="flex gap-2">
            {Array.from({ length: 6 }, (_, i) => {
              const puId = seleccionados[i];
              const entry = puId ? biblioteca.find(b => b.pu.id === puId) : null;
              return (
                <div
                  key={i}
                  className="flex-1 h-[52px] rounded-xl flex items-center justify-center relative overflow-hidden"
                  style={{
                    background: entry ? "rgba(255,203,5,0.1)" : "rgba(255,255,255,0.04)",
                    border: entry ? "1.5px solid rgba(255,203,5,0.45)" : "1.5px dashed rgba(255,255,255,0.12)",
                  }}
                >
                  {entry ? (
                    <>
                      {entry.pk?.imagen && (
                        <img
                          src={mediaUrl(entry.pk.imagen)}
                          alt={entry.pk.nombre}
                          className="w-10 h-10 object-contain image-pixelated"
                        />
                      )}
                      <span
                        className="absolute bottom-0.5 right-1 text-[0.42rem] text-[#ffcb05]"
                      >{i + 1}</span>
                    </>
                  ) : (
                    <span className="text-[0.5rem] text-white/20">{i + 1}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Grid de Pokémon */}
        <div className="flex-1 overflow-y-auto px-7 pb-2">
          {cargando ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pb-2">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="rounded-2xl p-3 flex flex-col items-center gap-2" style={{ background: "rgba(10,0,0,0.8)", border: "2px solid rgba(255,255,255,0.07)" }}>
                  <div className="skel" style={{ width: 72, height: 72, borderRadius: "50%" }} />
                  <div className="skel" style={{ width: "70%", height: 10, borderRadius: 999 }} />
                  <div className="skel" style={{ width: "50%", height: 10, borderRadius: 999 }} />
                </div>
              ))}
            </div>
          ) : biblioteca.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <PokeballVacia size={70} opacity={0.2} />
              <p className="text-[0.72rem] text-white/40 leading-[1.8]">No tienes Pokémon capturados aún.</p>
              <p className="text-[0.6rem] text-white/25 leading-[1.8]">¡Ve a Capturar para conseguir tu primer Pokémon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pb-2">
              {biblioteca.map(({ pu, pk }) => (
                <PokemonSeleccionable
                  key={pu.id}
                  pu={pu}
                  pk={pk}
                  slotNum={seleccionados.includes(pu.id) ? seleccionados.indexOf(pu.id) + 1 : null}
                  onClick={() => togglePokemon(pu.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer del modal */}
        <div
          className="px-7 py-5 shrink-0 flex flex-col gap-3"
          style={{ borderTop: "1.5px solid rgba(255,255,255,0.07)" }}
        >
          {errorModal && (
            <p className="text-[0.7rem] text-red-400 text-center leading-[1.7]">{errorModal}</p>
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl text-[0.82rem] tracking-[0.04em] cursor-pointer transition-all border-none"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}
            >
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={guardando || seleccionados.length === 0 || !nombre.trim()}
              className="flex-[2] py-4 rounded-2xl text-[0.88rem] tracking-[0.05em] cursor-pointer transition-all border-none disabled:opacity-35 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #e3000b, #b50009)",
                color: "#fff",
                boxShadow: guardando ? "none" : "0 4px 20px rgba(227,0,11,0.4)",
              }}
            >
              {guardando ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="pk-spinner" />
                  Guardando…
                </span>
              ) : (
                `💾 Guardar Equipo (${seleccionados.length} Pokémon)`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Página principal ────────────────────────────────── */
export default function Equipo() {
  usePageMusic(temaPrincipalMusic);
  const [equipos,        setEquipos]        = useState(null);
  const [equipo,         setEquipo]         = useState(null);
  const [slots,          setSlots]          = useState([]);
  const [cargandoSlots,  setCargandoSlots]  = useState(false);
  const [error,          setError]          = useState("");
  const [userId,         setUserId]         = useState(null);
  const [modalAbierto,   setModalAbierto]   = useState(false);

  const seleccionarEquipo = useCallback(async (eq) => {
    setEquipo(eq);
    setCargandoSlots(true);
    setSlots([]);

    const slotIds = [
      eq.id_pokemon_usuario_01, eq.id_pokemon_usuario_02,
      eq.id_pokemon_usuario_03, eq.id_pokemon_usuario_04,
      eq.id_pokemon_usuario_05, eq.id_pokemon_usuario_06,
    ];

    try {
      const puList = await Promise.all(
        slotIds.map(id => id ? pokemonUsuariosApi.getById(id) : Promise.resolve(null))
      );
      const pkList = await Promise.all(
        puList.map(pu => pu ? pokemonApi.getById(pu.id_pokemon) : Promise.resolve(null))
      );
      setSlots(slotIds.map((_, i) => ({ pu: puList[i], pk: pkList[i] })));
    } catch (err) {
      setError(err.message ?? "Error al cargar los Pokémon del equipo.");
    } finally {
      setCargandoSlots(false);
    }
  }, []);

  useEffect(() => {
    async function cargar() {
      try {
        const usuario = await authApi.getUsuarioActual();
        setUserId(usuario.id);
        const lista   = await equiposApi.getByUsuario(usuario.id);
        setEquipos(lista);
        if (lista.length > 0) seleccionarEquipo(lista[0]);
      } catch (err) {
        setError(err.message ?? "Error al cargar el equipo.");
        setEquipos([]);
      }
    }
    cargar();
  }, [seleccionarEquipo]);

  async function onEquipoCreado(nuevoEquipo) {
    setModalAbierto(false);
    // Refrescar lista de equipos y seleccionar el nuevo
    try {
      const lista = await equiposApi.getByUsuario(userId);
      setEquipos(lista);
      const eq = lista.find(e => e.id === nuevoEquipo.id) ?? nuevoEquipo;
      seleccionarEquipo(eq);
    } catch {
      // Si falla el refresco, al menos mostramos el nuevo equipo directamente
      setEquipos(prev => prev ? [...prev, nuevoEquipo] : [nuevoEquipo]);
      seleccionarEquipo(nuevoEquipo);
    }
  }

  const cargandoInicial = equipos === null;

  return (
    <>
      <BarraSuperior />
      <div className="w-full bg-black/55 px-5 pt-5 pb-8 md:px-8">

        {/* Cabecera */}
        <div className="flex items-start md:items-center justify-between gap-4 mb-4 flex-wrap">
          <div>
            <h1 className="text-[1.6rem] text-white tracking-[0.05em] leading-[1.6]">⚔️ Mi Equipo</h1>
            {equipo && (
              <p className="text-[0.72rem] text-white/45 tracking-[0.04em] mt-1.5 leading-[1.8]">
                {equipo.nombre} · {equipo.fecha_creacion}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Selector de equipos si hay más de uno */}
            {equipos && equipos.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {equipos.map(eq => (
                  <button
                    key={eq.id}
                    className={`bg-transparent border rounded-full text-[0.54rem] tracking-[0.05em] px-4 py-2 cursor-pointer transition-all hover:text-white${equipo?.id === eq.id ? " border-[#ffcb05] text-[#ffcb05] bg-[rgba(255,203,5,0.1)]" : " border-white/20 text-white/60 hover:border-white/40"}`}
                    onClick={() => seleccionarEquipo(eq)}
                  >
                    {eq.nombre}
                  </button>
                ))}
              </div>
            )}

            {/* Botón crear equipo */}
            {!cargandoInicial && (
              <button
                onClick={() => setModalAbierto(true)}
                className="inline-flex items-center gap-2 border-none rounded-full text-[0.62rem] tracking-[0.06em] px-5 py-2.5 cursor-pointer transition-all whitespace-nowrap"
                style={{
                  background: "linear-gradient(135deg, rgba(227,0,11,0.85), rgba(181,0,9,0.9))",
                  color: "#fff",
                  boxShadow: "0 4px 16px rgba(227,0,11,0.35)",
                }}
              >
                ➕ Crear Equipo
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl text-[0.6rem] leading-[1.9] mb-4 bg-red-600/10 text-red-400 border-[1.5px] border-red-500/25">
            {error}
          </div>
        )}

        {!cargandoInicial && equipos?.length === 0 && (
          <div className="bg-[rgba(10,0,0,0.92)] border-[1.5px] border-[rgba(227,0,11,0.3)] rounded-2xl flex flex-col items-center justify-center gap-5 text-center" style={{ padding: "3rem 1.5rem" }}>
            <PokeballVacia size={90} opacity={0.25} />
            <p className="text-[0.72rem] text-white/60 tracking-[0.05em] leading-[1.8]">Sin equipo</p>
            <p className="text-[0.55rem] text-white/35 tracking-[0.04em] leading-[2]">
              Aún no tienes ningún equipo creado.
            </p>
            <button
              onClick={() => setModalAbierto(true)}
              className="inline-flex items-center gap-2 border-none rounded-full text-[0.65rem] tracking-[0.06em] px-6 py-3 cursor-pointer transition-all mt-1"
              style={{
                background: "linear-gradient(135deg, rgba(227,0,11,0.85), rgba(181,0,9,0.9))",
                color: "#fff",
                boxShadow: "0 4px 18px rgba(227,0,11,0.35)",
              }}
            >
              ➕ Crear mi primer equipo
            </button>
          </div>
        )}

        {(cargandoInicial || (equipos?.length ?? 0) > 0) && (
          <div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
            {cargandoInicial || cargandoSlots
              ? Array.from({ length: 6 }, (_, i) => <SlotSkeleton key={i} />)
              : slots.map(({ pu, pk }, i) =>
                  pu && pk
                    ? <SlotPokemon key={i} pu={pu} pk={pk} />
                    : <SlotVacio key={i} numero={i + 1} />
                )
            }
          </div>
          </div>
        )}

      </div>

      {/* Modal */}
      {modalAbierto && userId && (
        <ModalCrearEquipo
          userId={userId}
          onClose={() => setModalAbierto(false)}
          onCreado={onEquipoCreado}
        />
      )}
    </>
  );
}
