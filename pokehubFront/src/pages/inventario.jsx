import { useEffect, useState, memo } from "react";
import BarraSuperior from "../components/barraSuperior.jsx";
import { authApi, inventarioApi, productosApi, mediaUrl } from "../api/api.js";
import { usePageMusic } from "../hooks/usePageMusic.js";
import temaPrincipalMusic from "../assets/audio/temas/temaPrincipal.mp3";

/* ── Icono por defecto si no hay imagen ── */
function ItemIconDefault({ nombre }) {
  const iconos = {
    pocion: "🧪", "pocion max": "💊", "revivir": "💫", "piedra": "🪨",
    "pokeball": "🔴", "superball": "🔵", "ultraball": "⚫", "masterball": "🟣",
    "repelente": "🌿", "incienso": "🕯️", "baya": "🍓",
  };
  const key = Object.keys(iconos).find(k => nombre?.toLowerCase().includes(k));
  return (
    <span className="text-[2.8rem] leading-none">
      {iconos[key] ?? "📦"}
    </span>
  );
}

/* ── Card de item ── */
const ItemCard = memo(function ItemCard({ item, producto }) {
  return (
    <div className="bg-[rgba(10,0,0,0.92)] border-[1.5px] border-[rgba(227,0,11,0.3)] rounded-2xl shadow-[0_4px_14px_rgba(0,0,0,0.55)] p-[1.5rem_1.4rem] flex items-center gap-[1.3rem] transition-[border-color] duration-[160ms] hover:border-[rgba(227,0,11,0.6)]">
      <div className="w-[96px] h-[96px] flex-shrink-0 flex items-center justify-center bg-white/5 border border-white/[0.08] rounded-2xl overflow-hidden relative">
        {producto.imagen ? (
          <img
            src={mediaUrl(producto.imagen)}
            alt={producto.nombre}
            className="w-[82px] h-[82px] object-contain"
            onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
          />
        ) : null}
        <ItemIconDefault nombre={producto.nombre} />
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-[0.55rem]">
        <p className="text-[0.82rem] text-white tracking-[0.04em] capitalize whitespace-nowrap overflow-hidden text-ellipsis">{producto.nombre}</p>
        {producto.descripcion && (
          <p
            className="text-[0.62rem] text-white/40 tracking-[0.03em] leading-[1.9] overflow-hidden"
            style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
          >
            {producto.descripcion}
          </p>
        )}
      </div>

      <div className="text-[0.9rem] text-[#ffcb05] bg-[rgba(255,203,5,0.1)] border border-[rgba(255,203,5,0.25)] rounded-xl px-[0.9rem] py-[0.5rem] flex-shrink-0 whitespace-nowrap">
        ×{item.cantidad}
      </div>
    </div>
  );
});

/* ── Skeleton ── */
function ItemSkeleton() {
  return (
    <div className="bg-[rgba(10,0,0,0.92)] border-[1.5px] border-[rgba(227,0,11,0.3)] rounded-2xl shadow-[0_4px_14px_rgba(0,0,0,0.55)] p-[1.5rem_1.4rem] flex items-center gap-[1.3rem]">
      <div className="skel" style={{ width: 96, height: 96, borderRadius: "0.85rem", flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.55rem" }}>
        <div className="skel" style={{ width: "60%", height: 14 }} />
        <div className="skel" style={{ width: "80%", height: 11 }} />
      </div>
      <div className="skel" style={{ width: 52, height: 36, borderRadius: "0.6rem", flexShrink: 0 }} />
    </div>
  );
}

/* ── Página principal ── */
export default function Inventario() {
  usePageMusic(temaPrincipalMusic);
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargar() {
      try {
        const [usuario, productos] = await Promise.all([
          authApi.getUsuarioActual(),
          productosApi.getAll(),
        ]);

        const inventario = await inventarioApi.getByUsuario(usuario.id);

        const productoMap = Object.fromEntries(productos.map(p => [p.id, p]));
        const itemsConInfo = inventario
          .filter(it => productoMap[it.id_producto])
          .map(it => ({ item: it, producto: productoMap[it.id_producto] }));

        setItems(itemsConInfo);
      } catch (e) {
        setError(e.message ?? "Error al cargar el inventario.");
        setItems([]);
      }
    }
    cargar();
  }, []);

  const cargando = items === null;

  return (
    <>
      <BarraSuperior />
      <div className="w-full bg-black/55 px-5 pt-5 pb-8 md:px-8">

        {/* Cabecera */}
        <div className="flex items-start md:items-center justify-between gap-4 mb-4 flex-wrap">
          <div>
            <h1 className="text-[1.5rem] text-white tracking-[0.05em] leading-[1.6]">🎒 Inventario</h1>
            {!cargando && (
              <p className="text-[0.68rem] text-white/45 tracking-[0.04em] mt-1.5 leading-[1.8]">
                {items.length} {items.length === 1 ? "tipo de item" : "tipos de items"}
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="px-5 py-4 rounded-xl text-[0.68rem] leading-[1.9] mb-5 bg-red-600/10 text-red-400 border-[1.5px] border-red-500/25">
            {error}
          </div>
        )}

        {/* Lista */}
        <div>
          {cargando && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
              {Array.from({ length: 6 }, (_, i) => <ItemSkeleton key={i} />)}
            </div>
          )}

          {!cargando && items.length === 0 && (
            <div className="bg-[rgba(10,0,0,0.92)] border-[1.5px] border-[rgba(227,0,11,0.3)] rounded-2xl flex flex-col items-center justify-center gap-4 text-center py-16">
              <span style={{ fontSize: "4rem" }}>🎒</span>
              <p className="text-[0.82rem] text-white/60 tracking-[0.05em] leading-[1.8]">Mochila vacía</p>
              <p className="text-[0.65rem] text-white/35 tracking-[0.04em] leading-[2]">
                Visita la tienda para comprar items.
              </p>
            </div>
          )}

          {!cargando && items.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
              {items.map(({ item, producto }) => (
                <ItemCard key={`${item.id_usuario}-${item.id_producto}`} item={item} producto={producto} />
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
}
