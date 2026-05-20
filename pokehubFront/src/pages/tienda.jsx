import { useEffect, useState, useMemo, memo, useCallback } from "react";
import BarraSuperior from "../components/barraSuperior.jsx";
import {
  authApi, categoriasApi, productosApi,
  pedidosApi, detallePedidoApi, inventarioApi, mediaUrl,
} from "../api/api.js";
import { usePageMusic } from "../hooks/usePageMusic.js";
import tiendaMusic from "../assets/audio/temas/tienda.mp3";

/* ── Icono emoji por defecto ── */
function ProductoIcon({ nombre }) {
  const mapa = {
    pocion: "🧪", "pocion max": "💊", revivir: "💫", piedra: "🪨",
    pokeball: "🔴", superball: "🔵", ultraball: "⚫", masterball: "🟣",
    repelente: "🌿", incienso: "🕯️", baya: "🍓", agua: "💧",
    fuego: "🔥", roca: "🪨", hierro: "⚙️", oro: "🥇",
  };
  const key = Object.keys(mapa).find(k => nombre?.toLowerCase().includes(k));
  return <span className="text-[3.2rem] leading-none">{mapa[key] ?? "📦"}</span>;
}

/* ── Card de producto (modo compra) ── */
const ProductoCard = memo(function ProductoCard({ producto, onComprar, comprando, saldo, isAdmin, onEdit, onDelete }) {
  const [cantidad, setCantidad] = useState(1);

  const total     = +(producto.precio * cantidad).toFixed(2);
  const sinFondos = saldo !== null && saldo < total;
  const cargando  = comprando === producto.id;
  const maxAfford = saldo !== null ? Math.max(1, Math.floor(saldo / producto.precio)) : 99;

  function dec() { setCantidad(c => Math.max(1, c - 1)); }
  function inc() { setCantidad(c => Math.min(maxAfford, c + 1)); }

  return (
    <div className="bg-[rgba(10,0,0,0.92)] border-[1.5px] border-[rgba(227,0,11,0.28)] rounded-2xl shadow-[0_4px_14px_rgba(0,0,0,0.55)] p-[1.5rem_1.2rem] flex flex-col items-center gap-[0.85rem] relative transition-all duration-[180ms] hover:border-[rgba(227,0,11,0.6)] hover:shadow-[0_6px_22px_rgba(0,0,0,0.7)]">

      {/* Botones admin */}
      {isAdmin && (
        <div className="absolute top-2.5 right-2.5 flex gap-1.5 z-10">
          <button
            onClick={() => onEdit(producto)}
            title="Editar producto"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[0.75rem] bg-[rgba(255,203,5,0.15)] border border-[rgba(255,203,5,0.35)] text-[#ffcb05] hover:bg-[rgba(255,203,5,0.3)] transition-all cursor-pointer"
          >✏️</button>
          <button
            onClick={() => onDelete(producto)}
            title="Eliminar producto"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[0.75rem] bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-all cursor-pointer"
          >🗑️</button>
        </div>
      )}

      <div className="w-[112px] h-[112px] flex items-center justify-center bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden flex-shrink-0">
        {producto.imagen ? (
          <>
            <img
              src={mediaUrl(producto.imagen)}
              alt={producto.nombre}
              className="w-[96px] h-[96px] object-contain"
              onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
            />
            <span style={{ display: "none", alignItems: "center", justifyContent: "center" }}>
              <ProductoIcon nombre={producto.nombre} />
            </span>
          </>
        ) : (
          <ProductoIcon nombre={producto.nombre} />
        )}
      </div>

      <p className="text-[0.78rem] text-white tracking-[0.04em] capitalize text-center leading-[1.6]">{producto.nombre}</p>

      {producto.descripcion && (
        <p
          className="text-[0.62rem] text-white/40 tracking-[0.03em] leading-[1.9] text-center overflow-hidden flex-1"
          style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
        >
          {producto.descripcion}
        </p>
      )}

      <div className="text-[0.75rem] text-[#ffcb05]/70 whitespace-nowrap">
        💰 {Number(producto.precio).toFixed(2)} / ud.
      </div>

      {/* Contador */}
      <div className="flex items-center gap-0 w-full rounded-xl overflow-hidden border-[1.5px] border-white/15">
        <button
          onClick={dec}
          disabled={cantidad <= 1 || cargando}
          className="flex-shrink-0 w-10 flex items-center justify-center text-[1rem] text-white/60 bg-white/[0.05] hover:bg-white/[0.12] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all border-none cursor-pointer py-2.5"
        >−</button>
        <span className="flex-1 text-center text-[0.82rem] text-white tracking-[0.04em] py-2.5 bg-white/[0.03]">
          {cantidad}
        </span>
        <button
          onClick={inc}
          disabled={sinFondos || cantidad >= maxAfford || cargando}
          className="flex-shrink-0 w-10 flex items-center justify-center text-[1rem] text-white/60 bg-white/[0.05] hover:bg-white/[0.12] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all border-none cursor-pointer py-2.5"
        >+</button>
      </div>

      {/* Total */}
      <div className={`text-[0.85rem] font-semibold rounded-xl px-[1rem] py-[0.5rem] whitespace-nowrap border transition-colors ${
        sinFondos
          ? "text-red-400 bg-red-500/10 border-red-500/25"
          : "text-[#ffcb05] bg-[rgba(255,203,5,0.1)] border-[rgba(255,203,5,0.28)]"
      }`}>
        💰 {total.toFixed(2)}{cantidad > 1 && <span className="text-[0.65rem] opacity-60 ml-1">×{cantidad}</span>}
      </div>

      <button
        className="w-full bg-[#e3000b] text-white border-none rounded-xl text-[0.72rem] tracking-[0.04em] py-3.5 cursor-pointer transition-all hover:bg-[#b50009] disabled:opacity-45 disabled:cursor-not-allowed shadow-[0_3px_12px_rgba(227,0,11,0.35)]"
        onClick={() => onComprar(producto, cantidad)}
        disabled={cargando || sinFondos}
        title={sinFondos ? "Saldo insuficiente" : ""}
      >
        {cargando ? "Comprando…" : sinFondos ? "Sin fondos" : cantidad > 1 ? `Comprar ×${cantidad}` : "Comprar"}
      </button>
    </div>
  );
});

/* ── Modal de edición (admin) ── */
function ModalEditar({ producto, onGuardar, onCerrar, guardando }) {
  const [nombre,      setNombre]      = useState(producto.nombre);
  const [descripcion, setDescripcion] = useState(producto.descripcion ?? "");
  const [precio,      setPrecio]      = useState(String(producto.precio));
  const [error,       setError]       = useState("");

  function handleGuardar() {
    const p = parseFloat(precio);
    if (!nombre.trim())      { setError("El nombre no puede estar vacío.");    return; }
    if (isNaN(p) || p < 0)  { setError("El precio debe ser un número válido."); return; }
    setError("");
    onGuardar(producto.id, {
      nombre:      nombre.trim(),
      descripcion: descripcion.trim(),
      precio:      p,
    });
  }

  const inputCls = "w-full bg-white/[0.06] border-[1.5px] border-white/15 rounded-xl px-4 py-3 text-white text-[0.75rem] outline-none focus:border-[rgba(255,203,5,0.5)] transition-colors placeholder:text-white/25";
  const labelCls = "text-[0.6rem] text-white/40 tracking-[0.08em] mb-1.5 block";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 pk-modal-overlay"
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(5px)" }}
      onClick={e => { if (e.target === e.currentTarget) onCerrar(); }}
    >
      <div
        className="w-full max-w-[460px] rounded-3xl overflow-hidden pk-card-in"
        style={{
          background: "rgba(6,0,12,0.98)",
          border: "2px solid rgba(255,203,5,0.35)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.9)",
        }}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.07]">
          <div>
            <h2 className="text-[0.9rem] text-[#ffcb05] tracking-[0.05em]">✏️ Editar producto</h2>
            <p className="text-[0.58rem] text-white/35 mt-1 tracking-[0.04em] capitalize">{producto.nombre}</p>
          </div>
          <button
            onClick={onCerrar}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all cursor-pointer border-none bg-transparent"
          >✕</button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className={labelCls}>NOMBRE</label>
            <input className={inputCls} value={nombre} onChange={e => setNombre(e.target.value)} maxLength={100} />
          </div>

          <div>
            <label className={labelCls}>DESCRIPCIÓN</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              maxLength={255}
              placeholder="Descripción del producto…"
            />
          </div>

          <div>
            <label className={labelCls}>PRECIO (💰)</label>
            <input
              className={inputCls}
              type="number" min="0" step="0.01"
              value={precio}
              onChange={e => setPrecio(e.target.value)}
            />
          </div>

          {error && <p className="text-[0.68rem] text-red-400 leading-[1.7]">{error}</p>}

          <div className="flex gap-3 mt-1">
            <button
              onClick={onCerrar}
              className="flex-1 py-3.5 rounded-xl text-[0.72rem] text-white/50 cursor-pointer border-none transition-all hover:bg-white/[0.06]"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >Cancelar</button>
            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="flex-[2] py-3.5 rounded-xl text-[0.78rem] text-white cursor-pointer border-none transition-all disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,rgba(255,203,5,0.85),rgba(200,155,0,0.9))", color: "#000" }}
            >
              {guardando ? "Guardando…" : "💾 Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Modal confirmación borrado (admin) ── */
function ModalConfirmarBorrado({ producto, onConfirmar, onCerrar, borrando }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 pk-modal-overlay"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(5px)" }}
      onClick={e => { if (e.target === e.currentTarget) onCerrar(); }}
    >
      <div
        className="w-full max-w-[380px] rounded-3xl pk-card-in p-7 flex flex-col items-center gap-5 text-center"
        style={{ background: "rgba(6,0,12,0.98)", border: "2px solid rgba(227,0,11,0.4)", boxShadow: "0 24px 80px rgba(0,0,0,0.9)" }}
      >
        <span className="text-[2.5rem]">🗑️</span>
        <div>
          <p className="text-[0.85rem] text-white tracking-[0.04em] leading-[1.7]">¿Eliminar este producto?</p>
          <p className="text-[0.68rem] text-white/45 mt-2 leading-[1.8] capitalize">{producto.nombre}</p>
        </div>
        <p className="text-[0.62rem] text-red-400/80 leading-[1.8]">Esta acción no se puede deshacer.</p>
        <div className="flex gap-3 w-full">
          <button
            onClick={onCerrar}
            className="flex-1 py-3.5 rounded-xl text-[0.72rem] text-white/50 cursor-pointer border-none transition-all hover:bg-white/[0.06]"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >Cancelar</button>
          <button
            onClick={onConfirmar}
            disabled={borrando}
            className="flex-1 py-3.5 rounded-xl text-[0.72rem] text-white cursor-pointer border-none transition-all bg-[#e3000b] hover:bg-[#b50009] disabled:opacity-40"
          >
            {borrando ? "Borrando…" : "Sí, eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton card ── */
function CardSkeleton() {
  return (
    <div className="bg-[rgba(10,0,0,0.92)] border-[1.5px] border-[rgba(227,0,11,0.28)] rounded-2xl shadow-[0_4px_14px_rgba(0,0,0,0.55)] p-[1.5rem_1.2rem] flex flex-col items-center gap-[0.85rem]">
      <div className="skel" style={{ width: 112, height: 112, borderRadius: "0.85rem" }} />
      <div className="skel" style={{ width: "70%", height: 14, marginTop: "0.4rem" }} />
      <div className="skel" style={{ width: "90%", height: 11 }} />
      <div className="skel" style={{ width: "90%", height: 11 }} />
      <div className="skel" style={{ width: 86, height: 32, borderRadius: "0.6rem", marginTop: "0.3rem" }} />
      <div className="skel" style={{ width: "100%", height: 44, borderRadius: "0.65rem", marginTop: "auto" }} />
    </div>
  );
}

/* ── Página principal ── */
export default function Tienda() {
  usePageMusic(tiendaMusic);
  const [usuario,         setUsuario]         = useState(null);
  const [isAdmin,         setIsAdmin]         = useState(false);
  const [categorias,      setCategorias]      = useState([]);
  const [productos,       setProductos]       = useState([]);
  const [cargando,        setCargando]        = useState(true);
  const [comprando,       setComprando]       = useState(null);
  const [alerta,          setAlerta]          = useState(null);
  const [catActiva,       setCatActiva]       = useState("todas");

  // Estado modal edición
  const [productoEditar,  setProductoEditar]  = useState(null);
  const [guardando,       setGuardando]       = useState(false);

  // Estado modal borrado
  const [productoborrar,  setProductoBorrar]  = useState(null);
  const [borrando,        setBorrando]        = useState(false);

  useEffect(() => {
    async function cargar() {
      try {
        const [user, cats, prods] = await Promise.all([
          authApi.getUsuarioActual(),
          categoriasApi.getAll(),
          productosApi.getAll(),
        ]);
        setUsuario(user);
        setIsAdmin(user.admin === 1);
        setCategorias(cats);
        setProductos(prods);
      } catch (e) {
        setAlerta({ tipo: "error", msg: e.message ?? "Error al cargar la tienda." });
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  const filtrados = useMemo(() => {
    if (catActiva === "todas") return productos;
    return productos.filter(p => String(p.id_categoria) === String(catActiva));
  }, [productos, catActiva]);

  /* ── Compra ── */
  const handleComprar = useCallback(async (producto, cantidad = 1) => {
    if (!usuario?.id) return;
    setComprando(producto.id);
    setAlerta(null);
    const total = +(producto.precio * cantidad).toFixed(2);
    try {
      const pedido = await pedidosApi.create({ id_usuario: usuario.id, total });
      await detallePedidoApi.create({ id_pedido: pedido.id, id_producto: producto.id, cantidad, precio: producto.precio });
      const inv      = await inventarioApi.getByUsuario(usuario.id);
      const existing = inv.find(i => i.id_producto === producto.id);
      let nuevaCantidad;
      if (existing) {
        nuevaCantidad = existing.cantidad + cantidad;
        await inventarioApi.updateCantidad(usuario.id, producto.id, nuevaCantidad);
      } else {
        nuevaCantidad = cantidad;
        await inventarioApi.create({ id_usuario: usuario.id, id_producto: producto.id, cantidad: nuevaCantidad });
      }
      if (producto.nombre.toLowerCase().includes("pokeball")) {
        window.dispatchEvent(new CustomEvent("pokeballs-update", { detail: { cantidad: nuevaCantidad } }));
      }
      const nuevoDinero = +((usuario.dinero ?? 0) - total).toFixed(2);
      await authApi.updateDinero(nuevoDinero);
      setUsuario(prev => ({ ...prev, dinero: nuevoDinero }));
      setAlerta({
        tipo: "exito",
        msg: cantidad > 1
          ? `¡${cantidad}× ${producto.nombre} comprados! −💰${total.toFixed(2)}`
          : `¡${producto.nombre} comprado! −💰${total.toFixed(2)}`,
      });
      setTimeout(() => setAlerta(null), 3500);
    } catch (e) {
      setAlerta({ tipo: "error", msg: e.message ?? "No se pudo completar la compra." });
    } finally {
      setComprando(null);
    }
  }, [usuario]);

  /* ── Edición (admin) ── */
  const handleGuardar = useCallback(async (id, datos) => {
    setGuardando(true);
    try {
      const actualizado = await productosApi.update(id, datos);
      setProductos(prev => prev.map(p => p.id === id ? { ...p, ...actualizado } : p));
      setProductoEditar(null);
      setAlerta({ tipo: "exito", msg: "Producto actualizado correctamente." });
      setTimeout(() => setAlerta(null), 3000);
    } catch (e) {
      setAlerta({ tipo: "error", msg: e.message ?? "Error al guardar." });
    } finally {
      setGuardando(false);
    }
  }, []);

  /* ── Borrado (admin) ── */
  const handleBorrar = useCallback(async () => {
    if (!productoborrar) return;
    setBorrando(true);
    try {
      await productosApi.delete(productoborrar.id);
      setProductos(prev => prev.filter(p => p.id !== productoborrar.id));
      setProductoBorrar(null);
      setAlerta({ tipo: "exito", msg: `"${productoborrar.nombre}" eliminado.` });
      setTimeout(() => setAlerta(null), 3000);
    } catch (e) {
      setAlerta({ tipo: "error", msg: e.message ?? "Error al eliminar." });
    } finally {
      setBorrando(false);
    }
  }, [productoborrar]);

  return (
    <>
      <BarraSuperior />
      <div className="w-full bg-black/55 px-5 pt-5 pb-8 md:px-8">

        {/* Cabecera */}
        <div className="flex items-start md:items-center justify-between gap-4 mb-4 flex-wrap">
          <div>
            <h1 className="text-[1.5rem] text-white tracking-[0.05em] leading-[1.6]">🛒 Tienda</h1>
            {!cargando && (
              <p className="text-[0.68rem] text-white/45 tracking-[0.04em] mt-1.5 leading-[1.8]">
                {productos.length} productos disponibles
                {isAdmin && <span className="ml-2 text-[#ffcb05]/70">· Modo administrador</span>}
              </p>
            )}
          </div>

          {usuario && (
            <div className="flex items-center gap-2.5 bg-[rgba(255,203,5,0.1)] border border-[rgba(255,203,5,0.3)] rounded-xl px-[1.2rem] py-[0.7rem] text-[0.82rem] text-[#ffcb05] flex-shrink-0">
              <span>💰</span>
              {Number(usuario.dinero ?? 0).toFixed(2)} monedas
            </div>
          )}
        </div>

        {alerta && (
          <div className={`px-5 py-4 rounded-xl text-[0.68rem] leading-[1.9] mb-5 border-[1.5px] pk-fade-in${alerta.tipo === "exito" ? " bg-green-600/10 text-green-400 border-green-500/25" : " bg-red-600/10 text-red-400 border-red-500/25"}`}>
            {alerta.msg}
          </div>
        )}

        {!cargando && categorias.length > 0 && (
          <div className="flex gap-2.5 flex-wrap mb-4">
            <button
              className={`bg-transparent border rounded-full text-[0.65rem] tracking-[0.05em] px-5 py-2.5 cursor-pointer transition-all${catActiva === "todas" ? " border-[#e3000b] text-[#e3000b] bg-[rgba(227,0,11,0.1)]" : " border-white/20 text-white/60 hover:text-white hover:border-white/40"}`}
              onClick={() => setCatActiva("todas")}
            >Todas</button>
            {categorias.map(cat => (
              <button
                key={cat.id}
                className={`bg-transparent border rounded-full text-[0.65rem] tracking-[0.05em] px-5 py-2.5 cursor-pointer transition-all${String(catActiva) === String(cat.id) ? " border-[#e3000b] text-[#e3000b] bg-[rgba(227,0,11,0.1)]" : " border-white/20 text-white/60 hover:text-white hover:border-white/40"}`}
                onClick={() => setCatActiva(cat.id)}
              >{cat.nombre}</button>
            ))}
          </div>
        )}

        {/* Grid */}
        <div>
          {cargando ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-4">
              {Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : filtrados.length === 0 ? (
            <div className="bg-[rgba(10,0,0,0.92)] border-[1.5px] border-[rgba(227,0,11,0.3)] rounded-2xl flex flex-col items-center justify-center gap-4 text-center py-16">
              <span style={{ fontSize: "4rem" }}>🛒</span>
              <p className="text-[0.82rem] text-white/60 tracking-[0.05em] leading-[1.8]">Sin productos</p>
              <p className="text-[0.65rem] text-white/35 tracking-[0.04em] leading-[2]">No hay productos en esta categoría.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-4">
              {filtrados.map(prod => (
                <ProductoCard
                  key={prod.id}
                  producto={prod}
                  onComprar={(p, c) => handleComprar(p, c)}
                  comprando={comprando}
                  saldo={usuario?.dinero ?? null}
                  isAdmin={isAdmin}
                  onEdit={setProductoEditar}
                  onDelete={setProductoBorrar}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal edición */}
      {productoEditar && (
        <ModalEditar
          producto={productoEditar}
          onGuardar={handleGuardar}
          onCerrar={() => setProductoEditar(null)}
          guardando={guardando}
        />
      )}

      {/* Modal borrado */}
      {productoborrar && (
        <ModalConfirmarBorrado
          producto={productoborrar}
          onConfirmar={handleBorrar}
          onCerrar={() => setProductoBorrar(null)}
          borrando={borrando}
        />
      )}
    </>
  );
}
