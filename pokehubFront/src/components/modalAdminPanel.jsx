import { useState, useEffect, useCallback } from "react";
import {
  authApi, usersApi, productosApi, pokemonApi,
  inventarioApi, pokemonUsuariosApi,
} from "../api/api.js";

/* ── Helpers ── */
function Feedback({ msg, tipo }) {
  if (!msg) return null;
  return (
    <p className="text-[0.7rem] leading-[1.7] text-center px-3 py-2 rounded-xl"
      style={{
        color: tipo === "ok" ? "#4ade80" : "#f87171",
        background: tipo === "ok" ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)",
        border: `1px solid ${tipo === "ok" ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)"}`,
      }}
    >{msg}</p>
  );
}

function Sep() {
  return <div className="h-px w-full bg-white/[0.07]" />;
}

function StatCard({ icon, value, label, color = "#ffcb05" }) {
  return (
    <div className="flex-1 min-w-[100px] bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-4 flex flex-col items-center gap-1.5">
      <span className="text-2xl">{icon}</span>
      <p className="text-[1.3rem] font-bold" style={{ color }}>{value ?? "–"}</p>
      <p className="text-[0.6rem] text-white/40 tracking-[0.06em] text-center">{label}</p>
    </div>
  );
}

/* ── Tab: Usuarios ── */
function TabUsuarios({ meId }) {
  const [usuarios,  setUsuarios]  = useState(null);
  const [busqueda,  setBusqueda]  = useState("");
  const [cargando,  setCargando]  = useState(true);
  const [pendiente, setPendiente] = useState(null); // id del usuario en proceso
  const [msg,       setMsg]       = useState(null);

  useEffect(() => {
    usersApi.getAll()
      .then(setUsuarios)
      .catch(() => setMsg({ text: "No se pudieron cargar los usuarios.", tipo: "err" }))
      .finally(() => setCargando(false));
  }, []);

  function flash(text, tipo = "ok") {
    setMsg({ text, tipo });
    setTimeout(() => setMsg(null), 3000);
  }

  async function toggleBan(usuario) {
    const nuevoEstado = usuario.estado === "baneado" ? "activo" : "baneado";
    setPendiente(usuario.id);
    try {
      const actualizado = await usersApi.update(usuario.id, { estado: nuevoEstado });
      setUsuarios(prev => prev.map(u => u.id === usuario.id ? { ...u, estado: actualizado.estado } : u));
      flash(nuevoEstado === "baneado"
        ? `${usuario.nombre} ha sido baneado.`
        : `${usuario.nombre} ha sido desbaneado.`);
    } catch (e) {
      flash(e.message ?? "Error al cambiar estado.", "err");
    } finally {
      setPendiente(null);
    }
  }

  async function toggleAdmin(usuario) {
    const nuevoAdmin = usuario.admin === 1 ? 0 : 1;
    setPendiente(`admin-${usuario.id}`);
    try {
      const actualizado = await usersApi.update(usuario.id, { admin: nuevoAdmin });
      setUsuarios(prev => prev.map(u => u.id === usuario.id ? { ...u, admin: actualizado.admin } : u));
      flash(nuevoAdmin === 1
        ? `${usuario.nombre} ahora es Admin.`
        : `${usuario.nombre} ya no es Admin.`);
    } catch (e) {
      flash(e.message ?? "Error al cambiar rol.", "err");
    } finally {
      setPendiente(null);
    }
  }

  const filtrados = (usuarios ?? []).filter(u =>
    u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Buscador */}
      <input
        type="text"
        placeholder="🔍 Buscar por nombre o email…"
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        className="w-full bg-white/[0.06] border border-white/15 rounded-2xl px-4 py-3 text-white text-[0.78rem] outline-none focus:border-[rgba(255,203,5,0.5)] transition-colors placeholder:text-white/25"
      />

      <Feedback msg={msg?.text} tipo={msg?.tipo} />

      {/* Lista */}
      {cargando ? (
        <div className="flex flex-col gap-2">
          {[0,1,2].map(i => (
            <div key={i} className="skel" style={{ height: 72, borderRadius: "0.85rem" }} />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <p className="text-center text-white/30 text-[0.78rem] py-6">Sin resultados.</p>
      ) : (
        <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
          {filtrados.map(u => {
            const esBaneado = u.estado === "baneado";
            const esAdmin   = u.admin === 1;
            const eSoyYo    = u.id === meId;
            return (
              <div
                key={u.id}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors"
                style={{
                  background: esBaneado ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.03)",
                  borderColor: esBaneado ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.08)",
                }}
              >
                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[0.9rem] font-bold text-white flex-shrink-0"
                  style={{ background: esBaneado ? "rgba(239,68,68,0.3)" : "linear-gradient(135deg,#e3000b,#7a0000)" }}
                >
                  {(u.nombre || "?").charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[0.78rem] text-white truncate">{u.nombre}</span>
                    {eSoyYo && (
                      <span className="text-[0.52rem] text-[#ffcb05] bg-[rgba(255,203,5,0.12)] border border-[rgba(255,203,5,0.3)] px-1.5 py-0.5 rounded-full">TÚ</span>
                    )}
                    {esAdmin && (
                      <span className="text-[0.52rem] text-[#ffcb05] bg-[rgba(255,203,5,0.1)] border border-[rgba(255,203,5,0.25)] px-1.5 py-0.5 rounded-full">🛡️</span>
                    )}
                    {esBaneado && (
                      <span className="text-[0.52rem] text-red-400 bg-red-400/10 border border-red-400/25 px-1.5 py-0.5 rounded-full">BANEADO</span>
                    )}
                  </div>
                  <p className="text-[0.6rem] text-white/35 truncate">{u.email}</p>
                  <p className="text-[0.6rem] text-[#ffcb05]/60">💰 {Number(u.dinero ?? 0).toFixed(2)}</p>
                </div>

                {/* Acciones */}
                {!eSoyYo && (
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {/* Ban / Unban */}
                    <button
                      onClick={() => toggleBan(u)}
                      disabled={pendiente === u.id}
                      className="text-[0.6rem] px-2.5 py-1.5 rounded-xl border cursor-pointer transition-all disabled:opacity-40 whitespace-nowrap"
                      style={esBaneado
                        ? { background: "rgba(74,222,128,0.1)", borderColor: "rgba(74,222,128,0.35)", color: "#4ade80" }
                        : { background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.35)", color: "#f87171" }
                      }
                    >
                      {pendiente === u.id ? "…" : esBaneado ? "✅ Desbanear" : "🚫 Banear"}
                    </button>

                    {/* Admin toggle */}
                    <button
                      onClick={() => toggleAdmin(u)}
                      disabled={pendiente === `admin-${u.id}`}
                      className="text-[0.6rem] px-2.5 py-1.5 rounded-xl border cursor-pointer transition-all disabled:opacity-40 whitespace-nowrap"
                      style={esAdmin
                        ? { background: "rgba(255,203,5,0.08)", borderColor: "rgba(255,203,5,0.25)", color: "rgba(255,203,5,0.5)" }
                        : { background: "rgba(255,203,5,0.06)", borderColor: "rgba(255,203,5,0.2)", color: "rgba(255,203,5,0.4)" }
                      }
                    >
                      {pendiente === `admin-${u.id}` ? "…" : esAdmin ? "🛡️ Quitar Admin" : "🛡️ Dar Admin"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[0.58rem] text-white/20 text-center">
        {(usuarios ?? []).length} usuarios en total
      </p>
    </div>
  );
}

/* ── Tab: Recursos (pruebas) ── */
function TabRecursos({ userId, onSaldoUpdate }) {
  const [productos,    setProductos]    = useState([]);
  const [saldoActual,  setSaldoActual]  = useState(null);
  const [monedas,      setMonedas]      = useState("");
  const [prodSelec,    setProdSelec]    = useState("");
  const [cantItem,     setCantItem]     = useState(1);
  const [cargando,     setCargando]     = useState(true);
  const [pendiente,    setPendiente]    = useState(null);
  const [msg,          setMsg]          = useState(null);

  function flash(text, tipo = "ok") {
    setMsg({ text, tipo });
    setTimeout(() => setMsg(null), 3500);
  }

  useEffect(() => {
    async function cargar() {
      try {
        const [user, prods] = await Promise.all([
          authApi.getUsuarioActual(),
          productosApi.getAll(),
        ]);
        setSaldoActual(Number(user.dinero ?? 0));
        setProductos(prods);
        if (prods.length > 0) setProdSelec(String(prods[0].id));
      } catch { /* silencioso */ }
      finally { setCargando(false); }
    }
    cargar();
  }, [userId]);

  async function añadirMonedas() {
    const cantidad = parseFloat(monedas);
    if (!cantidad || cantidad <= 0) { flash("Introduce una cantidad válida.", "err"); return; }
    setPendiente("monedas");
    try {
      const nuevoSaldo = +(( saldoActual ?? 0) + cantidad).toFixed(2);
      await authApi.updateDinero(nuevoSaldo);
      setSaldoActual(nuevoSaldo);
      onSaldoUpdate?.(nuevoSaldo);
      setMonedas("");
      flash(`+💰 ${cantidad.toFixed(2)} añadidas. Saldo: ${nuevoSaldo.toFixed(2)}`);
    } catch (e) {
      flash(e.message ?? "Error al añadir monedas.", "err");
    } finally { setPendiente(null); }
  }

  async function añadirObjeto() {
    if (!prodSelec) return;
    setPendiente("item");
    try {
      const inv      = await inventarioApi.getByUsuario(userId);
      const existing = inv.find(i => i.id_producto === parseInt(prodSelec));
      const prod     = productos.find(p => p.id === parseInt(prodSelec));
      if (existing) {
        await inventarioApi.updateCantidad(userId, parseInt(prodSelec), existing.cantidad + cantItem);
      } else {
        await inventarioApi.create({ id_usuario: userId, id_producto: parseInt(prodSelec), cantidad: cantItem });
      }
      // Disparar evento si es pokeball
      if (prod?.nombre.toLowerCase().includes("pokeball")) {
        const newCant = (existing?.cantidad ?? 0) + cantItem;
        window.dispatchEvent(new CustomEvent("pokeballs-update", { detail: { cantidad: newCant } }));
      }
      flash(`${cantItem}× ${prod?.nombre ?? "objeto"} añadido al inventario.`);
    } catch (e) {
      flash(e.message ?? "Error al añadir objeto.", "err");
    } finally { setPendiente(null); }
  }

  async function resetPokeballs(cantidad) {
    setPendiente(`pb-${cantidad}`);
    try {
      const prods = productos.length > 0 ? productos : await productosApi.getAll();
      const pb    = prods.find(p => p.nombre.toLowerCase().includes("pokeball"));
      if (!pb) { flash("No se encontró el producto Pokéball.", "err"); return; }
      const inv  = await inventarioApi.getByUsuario(userId);
      const item = inv.find(i => i.id_producto === pb.id);
      if (item) {
        await inventarioApi.updateCantidad(userId, pb.id, cantidad);
      } else {
        await inventarioApi.create({ id_usuario: userId, id_producto: pb.id, cantidad });
      }
      window.dispatchEvent(new CustomEvent("pokeballs-update", { detail: { cantidad } }));
      flash(`Pokéballs establecidas a ${cantidad}.`);
    } catch (e) {
      flash(e.message ?? "Error.", "err");
    } finally { setPendiente(null); }
  }

  async function capturarTodos() {
    if (!window.confirm("¿Añadir TODOS los Pokémon a tu Pokédex? Esto puede tardar unos segundos.")) return;
    setPendiente("captAll");
    try {
      const [pks, misPks] = await Promise.all([
        pokemonApi.getAll(),
        pokemonUsuariosApi.getByUsuario(userId),
      ]);
      const tengo = new Set(misPks.map(p => p.id_pokemon));
      const faltan = pks.filter(p => !tengo.has(p.id));
      for (const pk of faltan) {
        await pokemonUsuariosApi.create({
          id_usuario: userId, id_pokemon: pk.id, nivel: 1, experiencia: 0,
          hp: pk.hp_base, ataque: pk.ataque_base, defensa: pk.defensa_base,
          ataque_especial: pk.ataque_esp_base, defensa_especial: pk.defensa_esp_base,
          velocidad: pk.velocidad_base, shiny: false,
        });
      }
      flash(`${faltan.length} Pokémon añadidos a tu Pokédex.`);
    } catch (e) {
      flash(e.message ?? "Error al capturar.", "err");
    } finally { setPendiente(null); }
  }

  const selectCls = "w-full bg-white/[0.06] border border-white/15 rounded-2xl px-4 py-3 text-white text-[0.78rem] outline-none focus:border-[rgba(255,203,5,0.5)] transition-colors cursor-pointer";

  return (
    <div className="flex flex-col gap-5">
      {cargando ? (
        <div className="flex flex-col gap-3">
          {[0,1,2].map(i => <div key={i} className="skel" style={{ height: 52, borderRadius: "1rem" }} />)}
        </div>
      ) : (
        <>
          {/* Saldo actual */}
          <div className="flex items-center justify-between px-4 py-3 bg-[rgba(255,203,5,0.07)] border border-[rgba(255,203,5,0.25)] rounded-2xl">
            <span className="text-[0.72rem] text-white/55">Saldo actual</span>
            <span className="text-[1rem] text-[#ffcb05] font-bold">💰 {(saldoActual ?? 0).toFixed(2)}</span>
          </div>

          <Feedback msg={msg?.text} tipo={msg?.tipo} />
          <Sep />

          {/* Añadir monedas */}
          <div className="flex flex-col gap-2">
            <p className="text-[0.65rem] text-white/40 tracking-[0.07em]">💰 AÑADIR MONEDAS</p>
            <div className="flex gap-2">
              <input
                type="number" min="1" step="1" placeholder="Cantidad…"
                value={monedas}
                onChange={e => setMonedas(e.target.value)}
                className="flex-1 bg-white/[0.06] border border-white/15 rounded-2xl px-4 py-3 text-white text-[0.78rem] outline-none focus:border-[rgba(255,203,5,0.5)] transition-colors placeholder:text-white/25"
              />
              {[100, 500, 1000].map(v => (
                <button
                  key={v}
                  onClick={() => setMonedas(String(v))}
                  className="text-[0.65rem] px-3 py-2 rounded-xl border border-[rgba(255,203,5,0.25)] text-[#ffcb05]/60 bg-[rgba(255,203,5,0.06)] cursor-pointer hover:bg-[rgba(255,203,5,0.15)] transition-all whitespace-nowrap"
                >
                  +{v}
                </button>
              ))}
            </div>
            <button
              onClick={añadirMonedas}
              disabled={pendiente === "monedas"}
              className="w-full py-3 rounded-2xl text-[0.78rem] tracking-[0.05em] border-none cursor-pointer transition-all disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#b8860b,#ffcb05)", color: "#000", fontWeight: 700 }}
            >
              {pendiente === "monedas" ? "Añadiendo…" : "💰 Añadir monedas"}
            </button>
          </div>

          <Sep />

          {/* Añadir objeto */}
          <div className="flex flex-col gap-2">
            <p className="text-[0.65rem] text-white/40 tracking-[0.07em]">📦 AÑADIR OBJETO AL INVENTARIO</p>
            <select
              value={prodSelec}
              onChange={e => setProdSelec(e.target.value)}
              className={selectCls}
              style={{ appearance: "none" }}
            >
              {productos.map(p => (
                <option key={p.id} value={p.id} style={{ background: "#1a0000" }}>
                  {p.nombre} — 💰{Number(p.precio).toFixed(2)}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-3">
              <span className="text-[0.65rem] text-white/40">Cantidad:</span>
              <div className="flex items-center gap-2 bg-white/[0.06] border border-white/15 rounded-xl px-3 py-2">
                <button onClick={() => setCantItem(c => Math.max(1, c - 1))} className="text-white/60 hover:text-white bg-transparent border-none cursor-pointer text-sm">−</button>
                <span className="text-white text-[0.82rem] w-8 text-center">{cantItem}</span>
                <button onClick={() => setCantItem(c => Math.min(999, c + 1))} className="text-white/60 hover:text-white bg-transparent border-none cursor-pointer text-sm">+</button>
              </div>
            </div>
            <button
              onClick={añadirObjeto}
              disabled={pendiente === "item"}
              className="w-full py-3 rounded-2xl text-[0.78rem] tracking-[0.05em] border-none cursor-pointer transition-all disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#e3000b,#b50009)", color: "#fff", fontWeight: 600 }}
            >
              {pendiente === "item" ? "Añadiendo…" : "📦 Añadir al inventario"}
            </button>
          </div>

          <Sep />

          {/* Pokéballs rápido */}
          <div className="flex flex-col gap-2">
            <p className="text-[0.65rem] text-white/40 tracking-[0.07em]">🔴 POKÉBALLS RÁPIDO</p>
            <div className="flex gap-2">
              {[10, 50, 100, 999].map(n => (
                <button
                  key={n}
                  onClick={() => resetPokeballs(n)}
                  disabled={!!pendiente}
                  className="flex-1 py-3 rounded-xl text-[0.7rem] tracking-[0.04em] border border-[rgba(227,0,11,0.3)] text-white/70 bg-[rgba(227,0,11,0.08)] cursor-pointer hover:bg-[rgba(227,0,11,0.2)] transition-all disabled:opacity-35 whitespace-nowrap"
                >
                  {pendiente === `pb-${n}` ? "…" : `×${n}`}
                </button>
              ))}
            </div>
          </div>

          <Sep />

          {/* Capturar todos */}
          <div className="flex flex-col gap-2">
            <p className="text-[0.65rem] text-white/40 tracking-[0.07em]">🔴 POKÉDEX</p>
            <button
              onClick={capturarTodos}
              disabled={pendiente === "captAll"}
              className="w-full py-3 rounded-2xl text-[0.78rem] tracking-[0.05em] border border-[rgba(66,165,245,0.35)] text-[#42a5f5] bg-[rgba(66,165,245,0.08)] cursor-pointer hover:bg-[rgba(66,165,245,0.18)] transition-all disabled:opacity-40"
            >
              {pendiente === "captAll" ? "Capturando… (puede tardar)" : "⚡ Añadir todos los Pokémon a mi Pokédex"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Tab: Estadísticas ── */
function TabStats() {
  const [stats,    setStats]    = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        const [usuarios, pokemon, productos] = await Promise.all([
          usersApi.getAll(),
          pokemonApi.getAll(),
          productosApi.getAll(),
        ]);
        const activos  = usuarios.filter(u => u.estado === "activo").length;
        const baneados = usuarios.filter(u => u.estado === "baneado").length;
        const admins   = usuarios.filter(u => u.admin === 1).length;
        const masRico  = usuarios.reduce((a, b) => Number(a.dinero) > Number(b.dinero) ? a : b, usuarios[0] ?? {});
        setStats({ totalUsers: usuarios.length, activos, baneados, admins, totalPokemon: pokemon.length, totalProductos: productos.length, masRico });
      } catch { /* silencioso */ }
      finally { setCargando(false); }
    }
    cargar();
  }, []);

  if (cargando) {
    return (
      <div className="flex flex-wrap gap-3">
        {[0,1,2,3,4,5].map(i => (
          <div key={i} className="skel flex-1 min-w-[90px]" style={{ height: 90, borderRadius: "1rem" }} />
        ))}
      </div>
    );
  }

  if (!stats) {
    return <p className="text-center text-white/30 text-sm py-8">No se pudieron cargar las estadísticas.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Cards numéricas */}
      <div className="flex flex-wrap gap-3">
        <StatCard icon="👥" value={stats.totalUsers}    label="Usuarios totales" />
        <StatCard icon="✅" value={stats.activos}       label="Activos"          color="#4ade80" />
        <StatCard icon="🚫" value={stats.baneados}      label="Baneados"         color="#f87171" />
        <StatCard icon="🛡️" value={stats.admins}        label="Admins"           color="#a78bfa" />
        <StatCard icon="🔴" value={stats.totalPokemon}  label="Pokémon en BD"    color="#f87171" />
        <StatCard icon="🏪" value={stats.totalProductos} label="Productos"       color="#34d399" />
      </div>

      <Sep />

      {/* Usuario más rico */}
      {stats.masRico?.nombre && (
        <div className="flex items-center gap-4 px-5 py-4 bg-[rgba(255,203,5,0.06)] border border-[rgba(255,203,5,0.2)] rounded-2xl">
          <span className="text-3xl">👑</span>
          <div>
            <p className="text-[0.65rem] text-white/35 tracking-[0.07em] mb-1">USUARIO MÁS RICO</p>
            <p className="text-[0.88rem] text-white">{stats.masRico.nombre}</p>
            <p className="text-[0.72rem] text-[#ffcb05]">💰 {Number(stats.masRico.dinero ?? 0).toFixed(2)}</p>
          </div>
        </div>
      )}

      <div className="px-4 py-3 bg-white/[0.03] border border-white/[0.07] rounded-2xl">
        <p className="text-[0.6rem] text-white/30 text-center leading-[1.8]">
          Las estadísticas se actualizan al abrir esta pestaña.
        </p>
      </div>
    </div>
  );
}

/* ── Modal principal ─────────────────────────────── */
const TABS = [
  { id: "usuarios",   label: "👥 Usuarios"     },
  { id: "recursos",   label: "🔧 Pruebas"      },
  { id: "stats",      label: "📊 Estadísticas" },
];

export default function ModalAdminPanel({ isOpen, onClose, userId, userName }) {
  const [tab, setTab] = useState("usuarios");

  const handleSaldoUpdate = useCallback((nuevoSaldo) => {
    window.dispatchEvent(new CustomEvent("saldo-update", { detail: { dinero: nuevoSaldo } }));
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 pk-modal-overlay"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(7px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-[600px] max-h-[92vh] flex flex-col rounded-3xl overflow-hidden pk-card-in"
        style={{
          background: "rgba(4,0,8,0.99)",
          border: "2.5px solid rgba(255,203,5,0.4)",
          boxShadow: "0 0 80px rgba(255,203,5,0.08), 0 24px 80px rgba(0,0,0,0.95)",
        }}
      >
        {/* ── Cabecera ── */}
        <div
          className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0"
          style={{ borderBottom: "1.5px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: "rgba(255,203,5,0.12)", border: "1.5px solid rgba(255,203,5,0.35)" }}
            >
              🛡️
            </div>
            <div>
              <p className="text-[0.95rem] text-[#ffcb05] tracking-[0.04em]">Panel de Administración</p>
              <p className="text-[0.6rem] text-white/30 mt-0.5">Sesión: {userName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all cursor-pointer border-none bg-transparent text-[1.1rem] flex-shrink-0"
          >
            ✕
          </button>
        </div>

        {/* ── Tabs ── */}
        <div
          className="flex shrink-0 px-5 pt-3 gap-1"
          style={{ borderBottom: "1.5px solid rgba(255,255,255,0.07)" }}
        >
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 pb-3 text-[0.65rem] tracking-[0.05em] border-none bg-transparent cursor-pointer transition-all relative whitespace-nowrap"
              style={{ color: tab === t.id ? "#ffcb05" : "rgba(255,255,255,0.35)" }}
            >
              {t.label}
              {tab === t.id && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full"
                  style={{ background: "#ffcb05" }}
                />
              )}
            </button>
          ))}
        </div>

        {/* ── Contenido ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === "usuarios" && <TabUsuarios meId={userId} />}
          {tab === "recursos" && <TabRecursos userId={userId} onSaldoUpdate={handleSaldoUpdate} />}
          {tab === "stats"    && <TabStats />}
        </div>
      </div>
    </div>
  );
}
