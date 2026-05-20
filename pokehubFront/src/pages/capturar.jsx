import { useEffect, useState, useMemo, useCallback } from "react";
import BarraSuperior from "../components/barraSuperior.jsx";
import { TipoBadge, RarezaBadge, RAREZA_COLORS, PokeballVacia } from "../utils/pokemon.jsx";
import { authApi, pokemonApi, pokemonUsuariosApi, productosApi, inventarioApi, mediaUrl } from "../api/api.js";
import { usePageMusic } from "../hooks/usePageMusic.js";
import musicaCaptura   from "../assets/audio/temas/captura.mp3";
import sonidoCapturado from "../assets/audio/sonidos/capturado.mp3";

/* ─────────────────────────────────────────────────────────────
   PROBABILIDADES BASE DE RAREZA
   Cada entrada define el % de aparición sin ningún item activo.
   La suma total es 100.
───────────────────────────────────────────────────────────── */
const PROBABILIDADES_BASE = [
  { key: "comun",      label: "Común",      pct: 63.5, color: "#aaa"    },
  { key: "poco_comun", label: "Poco Común", pct: 20,   color: "#4caf50" },
  { key: "raro",       label: "Raro",       pct: 10,   color: "#42a5f5" },
  { key: "epico",      label: "Épico",      pct: 5,    color: "#ce93d8" },
  { key: "legendario", label: "Legendario", pct: 1,    color: "#ffcb05" },
  { key: "mitico",     label: "Mítico",     pct: 0.5,  color: "#ff7043" },
];

// Monedas que recibe el usuario si captura un Pokémon que ya tiene
const MONEDAS_COMPENSACION = 15;

/* Items que funcionan por rondas — fuente única de verdad para lógica y UI */
const ITEMS_RONDAS = [
  { clave: "tokenIV",    campo: "tokenIVRondas",    rondasMax: 3, icon: "🔮", label: "Token de IV",       color: "66,165,245"  },
  { clave: "charmRaro",  campo: "charmRaroRondas",  rondasMax: 5, icon: "⚡", label: "Charm Raro",        color: "66,165,245"  },
  { clave: "charmEpico", campo: "charmEpicoRondas", rondasMax: 5, icon: "💎", label: "Charm Épico",       color: "206,147,216" },
  { clave: "charmLeg",   campo: "charmLegRondas",   rondasMax: 5, icon: "🌟", label: "Charm Legendario",  color: "255,203,5"   },
];

/* ─────────────────────────────────────────────────────────────
   DETECTORES DE TIPO DE PRODUCTO
   Cada función devuelve true si el nombre del producto coincide
   con el tipo de item que representa.
───────────────────────────────────────────────────────────── */
const esProductoDeTipo = {
  pokeball:   p => p.nombre.toLowerCase().includes("pokeball"),
  amuleto:    p => p.nombre.toLowerCase().includes("amuleto"),
  tokenIV:    p => p.nombre.toLowerCase().includes("token"),
  charmRaro:  p => p.nombre.toLowerCase().includes("charm r"),
  charmEpico: p => p.nombre.toLowerCase().includes("charm ep") || p.nombre.toLowerCase().includes("charm ép"),
  charmLeg:   p => p.nombre.toLowerCase().includes("charm leg") || p.nombre.toLowerCase().includes("charm lég"),
  ticket:     p => p.nombre.toLowerCase().includes("ticket"),
};

/* Normaliza el campo rareza de la BD al formato interno */
function normalizarRareza(rareza) {
  if (!rareza) return "comun";
  const valor = rareza.toLowerCase();
  if (valor === "muy_raro" || valor === "muy raro") return "epico";
  if (valor === "poco comun") return "poco_comun";
  return valor;
}

/* ─────────────────────────────────────────────────────────────
   CÁLCULO DE PROBABILIDADES CON ITEMS ACTIVOS
   Recibe el estado actual de bonificaciones y devuelve una copia
   de PROBABILIDADES_BASE modificada según los items equipados.
   Al final normaliza para que la suma siga siendo 100%.
───────────────────────────────────────────────────────────── */
function calcularProbabilidades(bonificaciones) {
  // Ticket de Invocación: anula todas las rareza y garantiza Leg/Mítico
  if (bonificaciones.usarTicket) {
    return PROBABILIDADES_BASE.map(r => ({
      ...r,
      pct: r.key === "legendario" ? 70 : r.key === "mitico" ? 30 : 0,
    }));
  }

  let probs = PROBABILIDADES_BASE.map(r => ({ ...r }));

  // Amuleto de Suerte: redistribuye con valores fijos más equilibrados
  if (bonificaciones.amuleto) {
    probs = [
      { ...probs[0], pct: 48 },
      { ...probs[1], pct: 20 },
      { ...probs[2], pct: 18 },
      { ...probs[3], pct: 9  },
      { ...probs[4], pct: 3  },
      { ...probs[5], pct: 2  },
    ];
  }

  // Charm Raro: roba 12% de común y lo da a raro
  if (bonificaciones.charmRaroRondas > 0) {
    probs = probs.map(r => {
      if (r.key === "comun") return { ...r, pct: Math.max(r.pct - 12, 5) };
      if (r.key === "raro")  return { ...r, pct: r.pct + 12 };
      return r;
    });
  }

  // Charm Épico: roba 8% de común y lo da a épico
  if (bonificaciones.charmEpicoRondas > 0) {
    probs = probs.map(r => {
      if (r.key === "comun") return { ...r, pct: Math.max(r.pct - 8, 5) };
      if (r.key === "epico") return { ...r, pct: r.pct + 8 };
      return r;
    });
  }

  // Charm Legendario: roba 5% de común y reparte entre legendario (+3.5%) y mítico (+1.5%)
  if (bonificaciones.charmLegRondas > 0) {
    probs = probs.map(r => {
      if (r.key === "comun")      return { ...r, pct: Math.max(r.pct - 5, 5) };
      if (r.key === "legendario") return { ...r, pct: r.pct + 3.5 };
      if (r.key === "mitico")     return { ...r, pct: r.pct + 1.5 };
      return r;
    });
  }

  /* Token de IV: elimina común y poco común y redistribuye su %
     de forma proporcional entre las rareza superiores:
       raro       ← 55% del peso eliminado
       épico      ← 28%
       legendario ← 12%
       mítico     ← 5%                                           */
  if (bonificaciones.tokenIVRondas > 0) {
    const pesoEliminado = probs.reduce(
      (suma, r) => (r.key === "comun" || r.key === "poco_comun" ? suma + r.pct : suma), 0
    );
    probs = probs.map(r => {
      if (r.key === "comun" || r.key === "poco_comun") return { ...r, pct: 0 };
      if (r.key === "raro")       return { ...r, pct: r.pct + pesoEliminado * 0.55 };
      if (r.key === "epico")      return { ...r, pct: r.pct + pesoEliminado * 0.28 };
      if (r.key === "legendario") return { ...r, pct: r.pct + pesoEliminado * 0.12 };
      if (r.key === "mitico")     return { ...r, pct: r.pct + pesoEliminado * 0.05 };
      return r;
    });
  }

  // Normalizar a 100% para que los valores siempre sumen exactamente 100
  const sumaPcts = probs.reduce((s, r) => s + r.pct, 0);
  return probs.map(r => ({ ...r, pct: +((r.pct / sumaPcts) * 100).toFixed(2) }));
}

/* ─────────────────────────────────────────────────────────────
   SELECCIÓN ALEATORIA PONDERADA DE RAREZA
   Recorre las rareza acumulando el peso hasta superar un número
   aleatorio entre 0 y la suma total. Equivale a un "ruleta".
───────────────────────────────────────────────────────────── */
function elegirRareza(probabilidades) {
  const sumaPesos = probabilidades.reduce((s, r) => s + r.pct, 0);
  let numAleatorio = Math.random() * sumaPesos;
  for (const r of probabilidades) {
    numAleatorio -= r.pct;
    if (numAleatorio <= 0) return r.key;
  }
  return probabilidades.find(r => r.pct > 0)?.key ?? "comun";
}

/* Reproduce el efecto de sonido indicado si los sonidos están activos */
function reproducirEfecto(rutaSonido) {
  if (localStorage.getItem("sonido_activo") === "false") return;
  const audio = new Audio(rutaSonido);
  audio.volume = 0.7;
  audio.play().catch(() => {});
}

/* ─────────────────────────────────────────────────────────────
   BADGE DE ITEM ACTIVO
   Muestra el nombre, icono y barra de rondas restantes de un item.
   Si recibe onClick se convierte en botón (Ticket de Invocación).
───────────────────────────────────────────────────────────── */
function BadgeItem({ icon, label, rondasRestantes, rondasMax, color, children, onClick, activo }) {
  const Etiqueta = onClick ? "button" : "div";
  return (
    <Etiqueta
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${onClick ? "cursor-pointer" : ""}`}
      style={{
        background:   activo ? `rgba(${color},0.22)` : `rgba(${color},0.1)`,
        borderColor:  activo ? `rgba(${color},0.7)`  : `rgba(${color},0.35)`,
        outline: "none",
      }}
    >
      <span className="text-sm leading-none">{icon}</span>
      <span className="text-[0.65rem]" style={{ color: `rgb(${color})` }}>{label}</span>
      {rondasRestantes !== undefined && rondasMax && (
        <div className="flex items-center gap-1">
          <span
            className="text-[0.65rem] rounded-full px-1.5 py-0.5"
            style={{ color: `rgb(${color})`, background: `rgba(${color},0.2)` }}
          >
            {rondasRestantes}/{rondasMax}
          </span>
          <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(rondasRestantes / rondasMax) * 100}%`, background: `rgb(${color})` }}
            />
          </div>
        </div>
      )}
      {children}
    </Etiqueta>
  );
}

/* ─────────────────────────────────────────────────────────────
   MODAL DE RESULTADO DE CAPTURA
   Se muestra cuando el Pokémon queda revelado. Informa si es
   nuevo, duplicado, shiny o si se usó un ticket.
───────────────────────────────────────────────────────────── */
function ModalCaptura({ pokemon, duplicado, compensacionRecibida, ticketUsado, onClose }) {
  const colorRareza = RAREZA_COLORS[normalizarRareza(pokemon.rareza)] ?? RAREZA_COLORS.comun;
  // Las rareza "épico", "legendario" y "mítico" tienen efecto de brillo extra
  const esRarezaAlta = ["legendario", "mitico", "epico"].includes(normalizarRareza(pokemon.rareza));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 pk-modal-overlay"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Halo de color de rareza detrás del card */}
      <div
        className="absolute rounded-full pk-modal-glow pointer-events-none"
        style={{
          width: 500, height: 500,
          background: `radial-gradient(circle, ${colorRareza.border}35 0%, transparent 70%)`,
          filter: "blur(40px)",
        }}
      />

      <div
        className="relative w-full max-w-[480px] rounded-3xl overflow-hidden pk-modal-card"
        style={{
          background: `linear-gradient(160deg, rgba(6,0,12,0.99) 40%, ${colorRareza.border}22)`,
          border: `2.5px solid ${colorRareza.border}`,
          boxShadow: `0 0 80px ${colorRareza.border}55, 0 24px 60px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.05)`,
        }}
      >
        {/* Línea decorativa superior del color de rareza */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ background: `linear-gradient(90deg, transparent, ${colorRareza.border}, transparent)` }}
        />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all cursor-pointer border-none bg-transparent text-[1.1rem]"
        >✕</button>

        <div className="p-7 flex flex-col items-center gap-5">

          {ticketUsado && (
            <div className="w-full bg-orange-500/12 border-[1.5px] border-orange-500/40 rounded-2xl px-5 py-2.5 text-center">
              <p className="text-[0.7rem] text-orange-400 tracking-[0.03em]">🎟️ Ticket de Invocación usado</p>
            </div>
          )}

          {duplicado ? (
            <div className="w-full flex flex-col gap-2.5">
              <div className="w-full bg-amber-400/12 border-[1.5px] border-amber-400/45 rounded-2xl px-5 py-3.5 text-center">
                <p className="text-[0.78rem] text-amber-300 tracking-[0.03em] leading-[1.7]">⚠️ ¡Ya tienes este Pokémon!</p>
                <p className="text-[0.62rem] text-amber-200/60 mt-1 leading-[1.8]">No se ha añadido a tu colección</p>
              </div>
              {compensacionRecibida && (
                <div className="w-full bg-yellow-400/12 border-[1.5px] border-yellow-400/45 rounded-2xl px-5 py-3 text-center pk-fade-in">
                  <p className="text-[0.82rem] text-[#ffcb05] tracking-[0.03em]">💰 +{MONEDAS_COMPENSACION} monedas de compensación</p>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full bg-green-500/12 border-[1.5px] border-green-500/45 rounded-2xl px-5 py-3.5 text-center">
              <p className="text-[0.82rem] text-green-400 tracking-[0.03em] leading-[1.7]">✅ ¡Pokémon capturado!</p>
              <p className="text-[0.62rem] text-green-300/55 mt-1 leading-[1.8]">Añadido a tu Pokédex</p>
            </div>
          )}

          {pokemon.shiny && (
            <span className="text-[0.72rem] text-yellow-300 bg-yellow-300/12 border border-yellow-300/40 rounded-full px-5 py-2 tracking-[0.04em]">
              ✨ ¡SHINY!
            </span>
          )}

          <span className="text-[0.72rem] text-white/30 tracking-[0.12em]">
            #{String(pokemon.id).padStart(3, "0")}
          </span>

          {/* Imagen con halo de rareza */}
          <div
            className="relative w-[200px] h-[200px] flex items-center justify-center rounded-full"
            style={{ background: `radial-gradient(circle, ${colorRareza.border}35 0%, transparent 70%)` }}
          >
            {esRarezaAlta && (
              <div
                className="absolute inset-[-20px] rounded-full pk-modal-glow"
                style={{ background: `radial-gradient(circle, ${colorRareza.border}25 0%, transparent 65%)`, filter: "blur(12px)" }}
              />
            )}
            {pokemon.imagen ? (
              <img
                src={mediaUrl(pokemon.imagen)}
                alt={pokemon.nombre}
                className="w-[185px] h-[185px] object-contain image-pixelated drop-shadow-[0_6px_24px_rgba(0,0,0,0.6)] z-10 relative"
                style={{ filter: pokemon.shiny ? "drop-shadow(0 0 18px #ffe066)" : undefined }}
              />
            ) : (
              <PokeballVacia size={160} opacity={0.3} />
            )}
          </div>

          <h2 className="text-[1.5rem] text-white tracking-[0.05em] capitalize text-center leading-[1.4]">
            {pokemon.nombre}
          </h2>

          <div className="flex flex-col items-center gap-2.5">
            <div className="flex gap-2.5 flex-wrap justify-center">
              <TipoBadge tipo={pokemon.tipo1} />
              {pokemon.tipo2 && <TipoBadge tipo={pokemon.tipo2} />}
            </div>
            <RarezaBadge rareza={pokemon.rareza} />
          </div>

          {pokemon.descripcion && (
            <p className="text-[0.62rem] text-white/50 tracking-[0.03em] leading-[2.1] text-center border-t border-white/10 pt-4 w-full">
              {pokemon.descripcion}
            </p>
          )}

          <button
            onClick={onClose}
            className="w-full mt-1 py-4 rounded-2xl text-[0.82rem] tracking-[0.06em] cursor-pointer transition-all border-[2px] border-[rgba(227,0,11,0.5)] text-white hover:bg-[rgba(227,0,11,0.2)] hover:border-[rgba(227,0,11,0.8)]"
            style={{ background: "rgba(227,0,11,0.12)" }}
          >
            🔴 Capturar otro
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL DE CAPTURA
═══════════════════════════════════════════════════════════ */
export default function Capturar() {
  // Música de fondo específica de la pantalla de captura
  const { pause: pausarMusica, resume: reanudarMusica } = usePageMusic(musicaCaptura);

  // Lista completa de Pokémon y agrupados por rareza para el sorteo
  const [listaPokemon,      setListaPokemon]      = useState([]);
  const [pokemonPorRareza,  setPokemonPorRareza]  = useState({});

  // IDs de los Pokémon que ya posee el usuario (para detectar duplicados)
  const [idsCapturados,     setIdsCapturados]     = useState(new Set());

  // Datos del usuario autenticado y su saldo local (se actualiza sin recargar)
  const [usuario,           setUsuario]           = useState(null);
  const [saldoActual,       setSaldoActual]       = useState(null);

  // Control de carga inicial y estado de la animación de captura
  const [cargando,          setCargando]          = useState(true);
  const [estadoCaptura,     setEstadoCaptura]     = useState("idle"); // "idle" | "girando" | "destello" | "revelando"

  // Pokémon que se muestra en el modal tras la animación
  const [pokemonRevelado,   setPokemonRevelado]   = useState(null);

  // Flags del resultado de la última captura
  const [esDuplicado,       setEsDuplicado]       = useState(false);
  const [compensacionRecibida, setCompensacionRecibida] = useState(false);
  const [ticketUsado,       setTicketUsado]       = useState(false);

  // Mensaje de error o éxito en pantalla
  const [alerta,            setAlerta]            = useState(null);

  // Cantidad de Pokéballs disponibles y referencia al producto en BD
  const [cantidadPokeballs, setCantidadPokeballs] = useState(null);
  const [productoPokeball,  setProductoPokeball]  = useState(null);

  /* ─────────────────────────────────────────────────────────
     ITEMS DEL INVENTARIO
     Cada entrada guarda la referencia al producto (prod) y
     al registro de inventario del usuario (inv), con su cantidad.
  ───────────────────────────────────────────────────────── */
  const [itemsInventario, setItemsInventario] = useState({
    amuleto:    { prod: null, inv: null },
    tokenIV:    { prod: null, inv: null },
    charmRaro:  { prod: null, inv: null },
    charmEpico: { prod: null, inv: null },
    charmLeg:   { prod: null, inv: null },
    ticket:     { prod: null, inv: null },
  });

  /* ─────────────────────────────────────────────────────────
     BONIFICACIONES ACTIVAS (sesión local)
     Controlan cómo se modifican las probabilidades de captura.
     Las rondas se decrementan con cada captura; al llegar a 0
     se consume automáticamente 1 unidad del inventario.
  ───────────────────────────────────────────────────────── */
  const [bonificaciones, setBonificaciones] = useState({
    amuleto:         false, // permanente mientras haya en inventario
    tokenIVRondas:   0,     // 3 rondas por unidad consumida
    charmRaroRondas: 0,     // 5 rondas por unidad
    charmEpicoRondas:0,
    charmLegRondas:  0,
    usarTicket:      false, // el usuario activa/desactiva manualmente
  });

  /* Escuchar saldo actualizado desde otro componente (p.ej. minijuegos) */
  useEffect(() => {
    const alActualizarSaldo = e => {
      if (e.detail?.dinero !== undefined) setSaldoActual(Number(e.detail.dinero));
    };
    window.addEventListener("saldo-update", alActualizarSaldo);
    return () => window.removeEventListener("saldo-update", alActualizarSaldo);
  }, []);

  /* ─────────────────────────────────────────────────────────
     CARGA INICIAL
     Obtiene en paralelo: usuario, todos los Pokémon y productos.
     Luego carga el inventario del usuario para inicializar
     la cantidad de Pokéballs y los items de captura.
  ───────────────────────────────────────────────────────── */
  useEffect(() => {
    async function cargarDatos() {
      try {
        const [usuario, todosPokemon, todosProductos] = await Promise.all([
          authApi.getUsuarioActual(),
          pokemonApi.getAll(),
          productosApi.getAll(),
        ]);
        setUsuario(usuario);
        setSaldoActual(Number(usuario.dinero ?? 0));
        setListaPokemon(todosPokemon);

        // Agrupar Pokémon por rareza para el sistema de sorteo
        const agrupadosPorRareza = {};
        for (const pokemon of todosPokemon) {
          const rareza = normalizarRareza(pokemon.rareza);
          (agrupadosPorRareza[rareza] ??= []).push(pokemon);
        }
        setPokemonPorRareza(agrupadosPorRareza);

        // Cargar IDs de Pokémon ya capturados para detectar duplicados
        if (usuario?.id) {
          const pokemonDelUsuario = await pokemonUsuariosApi.getByUsuario(usuario.id);
          setIdsCapturados(new Set(pokemonDelUsuario.map(p => p.id_pokemon)));
        }

        // Inventario completo del usuario
        const inventario = await inventarioApi.getByUsuario(usuario.id);

        // Helpers para buscar producto e inventario por tipo
        const buscarProducto  = fn   => todosProductos.find(fn) ?? null;
        const buscarInventario = prod => prod ? (inventario.find(i => i.id_producto === prod.id) ?? null) : null;

        // Pokéball: separado porque controla el contador visible en pantalla
        const prodPokeball = buscarProducto(esProductoDeTipo.pokeball);
        const invPokeball  = buscarInventario(prodPokeball);
        setProductoPokeball(prodPokeball);
        setCantidadPokeballs(invPokeball ? invPokeball.cantidad : 0);

        // Construir objeto { prod, inv } para cada item de captura
        const construirItem = clave => {
          const prod = buscarProducto(esProductoDeTipo[clave]);
          return { prod, inv: buscarInventario(prod) };
        };
        const itemsCargados = {
          amuleto:    construirItem("amuleto"),
          tokenIV:    construirItem("tokenIV"),
          charmRaro:  construirItem("charmRaro"),
          charmEpico: construirItem("charmEpico"),
          charmLeg:   construirItem("charmLeg"),
          ticket:     construirItem("ticket"),
        };
        setItemsInventario(itemsCargados);

        // Inicializar bonificaciones según inventario (rondas via ITEMS_RONDAS)
        const cantidadDe = clave => itemsCargados[clave]?.inv?.cantidad ?? 0;
        const rondasIniciales = Object.fromEntries(
          ITEMS_RONDAS.map(({ clave, campo, rondasMax }) => [campo, cantidadDe(clave) > 0 ? rondasMax : 0])
        );
        setBonificaciones({ amuleto: cantidadDe("amuleto") > 0, ...rondasIniciales, usarTicket: false });
      } catch (error) {
        setAlerta({ tipo: "error", msg: error.message ?? "Error al cargar." });
      } finally {
        setCargando(false);
      }
    }
    cargarDatos();
  }, []);

  /* ─────────────────────────────────────────────────────────
     ACTUALIZAR BONIFICACIONES TRAS CADA CAPTURA
     Decrementa las rondas de los items temporales. Cuando llegan
     a 0 consume 1 unidad del inventario en el backend; si quedan
     más unidades reinicia las rondas automáticamente.

     Recibe COPIAS de los estados para evitar
     stale closures dentro de la función async handleCapturar.
  ───────────────────────────────────────────────────────── */
  function actualizarBonificacionesTrasCaptura(seUsoTicket, bonificacionesActuales, itemsActuales, idUsuario) {
    const nuevasBonif = { ...bonificacionesActuales };
    const nuevoItems  = { ...itemsActuales };

    /* Consume 1 unidad del inventario del item indicado.
       Actualiza el backend de forma asíncrona (fire & forget).
       Devuelve la cantidad restante. */
    function consumirItem(clave) {
      const item = itemsActuales[clave];
      const cantidadRestante = Math.max((item?.inv?.cantidad ?? 1) - 1, 0);
      nuevoItems[clave] = { ...item, inv: { ...(item?.inv ?? {}), cantidad: cantidadRestante } };
      if (item?.prod && idUsuario) {
        inventarioApi.updateCantidad(idUsuario, item.prod.id, cantidadRestante).catch(() => {});
      }
      return cantidadRestante;
    }

    // Items con rondas: decrementar y consumir unidad al agotarse
    for (const { clave, campo, rondasMax } of ITEMS_RONDAS) {
      if (nuevasBonif[campo] > 0) {
        nuevasBonif[campo]--;
        if (nuevasBonif[campo] === 0) {
          const restante = consumirItem(clave);
          if (restante > 0) nuevasBonif[campo] = rondasMax;
        }
      }
    }
    // Ticket de Invocación: se consume siempre (1 uso por captura)
    if (seUsoTicket) {
      consumirItem("ticket");
      nuevasBonif.usarTicket = false;
    }

    setBonificaciones(nuevasBonif);
    setItemsInventario(nuevoItems);
  }

  /* ─────────────────────────────────────────────────────────
     LÓGICA PRINCIPAL DE CAPTURA
     1. Descuenta 1 Pokéball (optimista, revierte si falla)
     2. Anima la Pokéball (girando → destello)
     3. Sortea rareza con probabilidades activas
     4. Elige Pokémon aleatorio del grupo de esa rareza
     5. Guarda en BD si es nuevo / da monedas si es duplicado
     6. Actualiza bonificaciones e items
     7. Reproduce efecto de sonido y muestra el modal
  ───────────────────────────────────────────────────────── */
  async function handleCapturar() {
    if (!usuario?.id || estadoCaptura !== "idle") return;
    if (cantidadPokeballs === null || cantidadPokeballs <= 0) return;

    // Pausar música para que suene el efecto de captura
    pausarMusica();

    /* Snapshots: copias del estado actual para evitar que la función
       async lea valores stale si los estados cambian durante la espera */
    const copiaBonificaciones = { ...bonificaciones };
    const copiaItems          = { ...itemsInventario };
    const idUsuario           = usuario.id;
    const seUsaTicket         = copiaBonificaciones.usarTicket &&
                                (copiaItems.ticket?.inv?.cantidad ?? 0) > 0;

    // Descontar Pokéball de forma optimista (se revierte si falla la API)
    const pokebollasRestantes = cantidadPokeballs - 1;
    setCantidadPokeballs(pokebollasRestantes);
    window.dispatchEvent(new CustomEvent("pokeballs-update", { detail: { cantidad: pokebollasRestantes } }));

    setEstadoCaptura("girando");
    setPokemonRevelado(null);
    setCompensacionRecibida(false);
    setTicketUsado(false);

    // Persistir la nueva cantidad en el backend (asíncrono, revertir si falla)
    if (productoPokeball) {
      inventarioApi.updateCantidad(idUsuario, productoPokeball.id, pokebollasRestantes).catch(() => {
        setCantidadPokeballs(cantidadPokeballs);
        window.dispatchEvent(new CustomEvent("pokeballs-update", { detail: { cantidad: cantidadPokeballs } }));
      });
    }

    // Esperar animación de giro
    await new Promise(r => setTimeout(r, 1200));

    // Sortear rareza y elegir Pokémon de ese grupo
    const probabilidadesActuales = calcularProbabilidades(copiaBonificaciones);
    const rarezaObtenida         = elegirRareza(probabilidadesActuales);

    let grupoPokemon = pokemonPorRareza[rarezaObtenida] ?? [];
    if (grupoPokemon.length === 0) {
      // Fallback: si no hay Pokémon de esa rareza, usar todos
      const todos = Object.values(pokemonPorRareza).flat();
      grupoPokemon = todos.length > 0 ? todos : listaPokemon;
    }
    const pokemonSeleccionado = grupoPokemon[Math.floor(Math.random() * grupoPokemon.length)];

    // Destello blanco antes de revelar
    setEstadoCaptura("destello");
    await new Promise(r => setTimeout(r, 650));

    const esShiny      = Math.random() < 0.05;
    const esDupl       = idsCapturados.has(pokemonSeleccionado.id);
    setEsDuplicado(esDupl);
    setTicketUsado(seUsaTicket);
    setPokemonRevelado({ ...pokemonSeleccionado, shiny: esShiny });
    setEstadoCaptura("revelando");

    // Reproducir efecto de sonido al mostrar el modal
    reproducirEfecto(sonidoCapturado);

    if (!esDupl) {
      // Pokémon nuevo: guardar en el inventario del usuario
      try {
        await pokemonUsuariosApi.create({
          id_usuario:        idUsuario,
          id_pokemon:        pokemonSeleccionado.id,
          nivel:             1,
          experiencia:       0,
          hp:                pokemonSeleccionado.hp_base,
          ataque:            pokemonSeleccionado.ataque_base,
          defensa:           pokemonSeleccionado.defensa_base,
          ataque_especial:   pokemonSeleccionado.ataque_esp_base,
          defensa_especial:  pokemonSeleccionado.defensa_esp_base,
          velocidad:         pokemonSeleccionado.velocidad_base,
          shiny:             esShiny,
        });
        setIdsCapturados(prev => new Set([...prev, pokemonSeleccionado.id]));
      } catch (error) {
        setAlerta({ tipo: "error", msg: error.message ?? "Error al guardar la captura." });
      }
    } else {
      // Pokémon duplicado: compensar con monedas
      try {
        const saldoActualizado = +((saldoActual ?? 0) + MONEDAS_COMPENSACION).toFixed(2);
        await authApi.updateDinero(saldoActualizado);
        setSaldoActual(saldoActualizado);
        setCompensacionRecibida(true);
      } catch { /* silencioso */ }
    }

    // Actualizar bonificaciones e inventario para la siguiente captura
    actualizarBonificacionesTrasCaptura(seUsaTicket, copiaBonificaciones, copiaItems, idUsuario);
  }

  /* Cierra el modal y reanuda la música (solo si está activada en ajustes) */
  const cerrarModal = useCallback(() => {
    setEstadoCaptura("idle");
    setPokemonRevelado(null);
    reanudarMusica();
  }, [reanudarMusica]);

  /* ── Valores derivados ── */
  const probabilidadesActivas  = useMemo(() => calcularProbabilidades(bonificaciones), [bonificaciones]);
  const totalCapturados        = idsCapturados.size;
  const totalPokemon           = listaPokemon.length;
  const enReposo               = estadoCaptura === "idle";
  const sinPokeballs           = cantidadPokeballs !== null && cantidadPokeballs <= 0;
  const puedeCapturar          = enReposo && !cargando && !sinPokeballs && cantidadPokeballs !== null;
  const tieneTickets           = (itemsInventario.ticket?.inv?.cantidad ?? 0) > 0;
  const tieneItemsActivos      = bonificaciones.amuleto        ||
                                  bonificaciones.tokenIVRondas   > 0 ||
                                  bonificaciones.charmRaroRondas > 0 ||
                                  bonificaciones.charmEpicoRondas > 0 ||
                                  bonificaciones.charmLegRondas  > 0 ||
                                  tieneTickets;
  // Color de borde y fondo cambian cuando el Ticket está activo
  const colorBorde     = bonificaciones.usarTicket ? "rgba(255,112,67,0.55)" : "rgba(227,0,11,0.3)";
  const degradadoFondo = bonificaciones.usarTicket
    ? "radial-gradient(ellipse at center, rgba(255,112,67,0.12) 0%, transparent 65%)"
    : "radial-gradient(ellipse at center, rgba(227,0,11,0.08) 0%, transparent 65%)";

  /* ══════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════ */
  return (
    <>
      <BarraSuperior />
      <div className="flex flex-col lg:flex-row w-full bg-black/55">

        {/* ── Zona principal ── */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-10">

          <div className="text-center mb-8">
            <h1 className="text-[2rem] text-white tracking-[0.05em] leading-[1.6]">🔴 Captura Aleatoria</h1>
            <p className="text-[1rem] text-white/45 tracking-[0.04em] mt-3 leading-[1.8]">
              {cargando ? "Cargando Pokédex…" : `${totalCapturados} / ${totalPokemon} capturados`}
            </p>
          </div>

          {/* Contador de Pokéballs */}
          <div className="mb-4">
            {cargando || cantidadPokeballs === null ? (
              <div className="skel" style={{ width: 200, height: 44, borderRadius: "1rem" }} />
            ) : (
              <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-[2px] transition-all ${sinPokeballs ? "bg-red-500/10 border-red-500/40" : "bg-white/[0.06] border-white/15"}`}>
                <svg width="22" height="22" viewBox="0 0 100 100" className="flex-shrink-0">
                  <path d="M3 50 a47 47 0 0 1 94 0 Z" fill="#e3000b" />
                  <path d="M3 50 a47 47 0 0 0 94 0 Z" fill="#f0f0f0" />
                  <circle cx="50" cy="50" r="47" fill="none" stroke="#555" strokeWidth="5" />
                  <line x1="3" y1="50" x2="97" y2="50" stroke="#555" strokeWidth="8" />
                  <circle cx="50" cy="50" r="14" fill="#fff" stroke="#555" strokeWidth="6" />
                  <circle cx="50" cy="50" r="7" fill="#e3000b" />
                </svg>
                <span className="text-[0.82rem] text-white/70 tracking-[0.04em]">Pokéballs:</span>
                <span className="text-[1rem] tracking-[0.06em]" style={{ color: sinPokeballs ? "#ef4444" : cantidadPokeballs <= 3 ? "#f59e0b" : "#ffcb05" }}>
                  {cantidadPokeballs}
                </span>
                {sinPokeballs && <span className="text-[0.62rem] text-red-400">¡Sin Pokéballs!</span>}
              </div>
            )}
          </div>

          {/* Panel de items activos */}
          {!cargando && tieneItemsActivos && (
            <div className="mb-5 w-full max-w-[580px] bg-[rgba(4,0,8,0.9)] border-[2px] border-[rgba(255,203,5,0.2)] rounded-2xl p-4">
              <p className="text-[0.6rem] text-[#ffcb05]/60 tracking-[0.12em] mb-3 px-1">🎒 ITEMS ACTIVOS</p>
              <div className="flex flex-wrap gap-2">

                {bonificaciones.amuleto && (
                  <BadgeItem icon="🍀" label="Amuleto de Suerte" color="255,203,5">
                    <span className="text-[0.55rem] text-[#ffcb05]/50 ml-1">∞</span>
                  </BadgeItem>
                )}
                {ITEMS_RONDAS.map(({ campo, icon, label, color, rondasMax }) =>
                  bonificaciones[campo] > 0 && (
                    <BadgeItem key={campo} icon={icon} label={label} color={color}
                      rondasRestantes={bonificaciones[campo]} rondasMax={rondasMax}
                    />
                  )
                )}
                {tieneTickets && (
                  <BadgeItem
                    icon="🎟️"
                    label={`Ticket de Invocación ×${itemsInventario.ticket.inv.cantidad}`}
                    color="255,112,67"
                    activo={bonificaciones.usarTicket}
                    onClick={() => setBonificaciones(p => ({ ...p, usarTicket: !p.usarTicket }))}
                  >
                    {bonificaciones.usarTicket && (
                      <span className="text-[0.55rem] text-[#ff7043] font-bold ml-1 animate-pulse">● ON</span>
                    )}
                  </BadgeItem>
                )}
              </div>

              {bonificaciones.usarTicket && (
                <p className="text-[0.6rem] text-[#ff7043]/65 mt-3 px-1 leading-[1.7]">
                  🎟️ Siguiente captura garantiza Pokémon <b>Legendario o Mítico</b>. Se consumirá 1 ticket.
                </p>
              )}
            </div>
          )}

          {alerta && (
            <div className={`px-6 py-4 rounded-2xl text-[0.9rem] leading-[1.9] mb-6 border-[2px] pk-fade-in max-w-[580px] w-full text-center ${alerta.tipo === "exito" ? "bg-green-600/10 text-green-400 border-green-500/30" : "bg-red-600/10 text-red-400 border-red-500/30"}`}>
              {alerta.msg}
            </div>
          )}

          {/* Caja central con la Pokéball interactiva */}
          <div
            className="w-full max-w-[580px] bg-[rgba(4,0,8,0.94)] rounded-3xl p-10 lg:p-14 flex flex-col items-center gap-8 relative overflow-hidden shadow-[0_16px_60px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.04)] border-[2.5px] transition-colors duration-500"
            style={{ borderColor: colorBorde }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{ background: degradadoFondo }} />

            {/* Flash blanco durante la fase "destello" */}
            {estadoCaptura === "destello" && (
              <div className="absolute inset-0 bg-white/88 rounded-3xl pk-flash z-20 pointer-events-none" />
            )}

            <button
              onClick={puedeCapturar ? handleCapturar : undefined}
              disabled={!puedeCapturar}
              className={`relative bg-transparent border-none p-0 z-10 transition-all duration-300 ${
                puedeCapturar
                  ? "cursor-pointer hover:drop-shadow-[0_0_60px_rgba(227,0,11,0.95)] hover:scale-105 pk-pulse"
                  : "cursor-not-allowed opacity-40"
              } ${estadoCaptura === "girando" ? "pk-shake" : ""}`}
              style={{ outline: "none" }}
              aria-label="Capturar Pokémon"
            >
              <svg width="280" height="280" viewBox="0 0 100 100">
                <path d="M3 50 a47 47 0 0 1 94 0 Z" fill="#e3000b" />
                <path d="M3 50 a47 47 0 0 0 94 0 Z" fill="#f0f0f0" />
                <circle cx="50" cy="50" r="47" fill="none" stroke="#333" strokeWidth="2.5" />
                <line x1="3" y1="50" x2="97" y2="50" stroke="#333" strokeWidth="5" />
                <circle cx="50" cy="50" r="14" fill="#fff" stroke="#333" strokeWidth="4.5" />
                <circle cx="50" cy="50" r="7" fill="#e3000b" />
                <ellipse cx="38" cy="32" rx="7" ry="4" fill="rgba(255,255,255,0.28)" transform="rotate(-30 38 32)" />
                {puedeCapturar && (
                  <circle cx="50" cy="50" r="47" fill="none" stroke="rgba(227,0,11,0.3)" strokeWidth="3" strokeDasharray="8 6">
                    <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="10s" repeatCount="indefinite" />
                  </circle>
                )}
              </svg>
            </button>

            <p
              className="text-[0.9rem] z-10 tracking-[0.05em] text-center leading-[1.8]"
              style={{
                color: sinPokeballs          ? "#ef4444"
                  : bonificaciones.usarTicket  ? "#ff7043"
                  : estadoCaptura === "girando" || estadoCaptura === "destello" ? "rgba(255,255,255,0.75)"
                  : "rgba(255,255,255,0.35)"
              }}
            >
              {cargando                      ? "Cargando…"
               : sinPokeballs               ? "Ve a la tienda a comprar más Pokéballs"
               : bonificaciones.usarTicket   ? "🎟️ Ticket activo · Legendario garantizado"
               : estadoCaptura === "girando" || estadoCaptura === "destello" ? "¡Capturando…!"
               : "Click para capturar · Gasta 1 Pokéball"}
            </p>
          </div>
        </div>

        {/* ── Sidebar de probabilidades ── */}
        <div className="w-full lg:w-[420px] flex-shrink-0 p-4 lg:p-6 flex flex-col gap-4">
          <div className="bg-[rgba(4,0,8,0.94)] border-[2px] border-[rgba(255,255,255,0.1)] rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.6)]">

            <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
              <span className="text-2xl">📊</span>
              <div>
                <h3 className="text-[0.9rem] text-[#ffcb05] tracking-[0.05em]">Probabilidades</h3>
                {(bonificaciones.amuleto || bonificaciones.tokenIVRondas > 0 ||
                  bonificaciones.charmRaroRondas > 0 || bonificaciones.charmEpicoRondas > 0 ||
                  bonificaciones.charmLegRondas  > 0 || bonificaciones.usarTicket) && (
                  <p className="text-[0.58rem] text-green-400/70 mt-0.5 tracking-[0.04em]">✨ Modificadas por items</p>
                )}
              </div>
            </div>

            <div className="flex flex-col divide-y divide-white/[0.05]">
              {probabilidadesActivas.map((rareza, indice) => {
                const base    = PROBABILIDADES_BASE[indice];
                const diferencia = +(rareza.pct - base.pct).toFixed(2);
                const cambio  = Math.abs(diferencia) > 0.05 && rareza.pct > 0;
                return (
                  <div key={rareza.key} className="flex items-center justify-between px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: rareza.color }} />
                      <span className="text-[0.72rem] text-white/80 whitespace-nowrap">{rareza.label}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(rareza.pct, 100)}%`, background: rareza.color }} />
                      </div>
                      <span className="text-[0.72rem] font-bold w-12 text-right whitespace-nowrap" style={{ color: rareza.pct === 0 ? "rgba(255,255,255,0.15)" : rareza.color }}>
                        {rareza.pct}%
                      </span>
                      {cambio && (
                        <span className="text-[0.6rem] w-4" style={{ color: diferencia > 0 ? "#22c55e" : "#ef4444" }}>
                          {diferencia > 0 ? "▲" : "▼"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Explicación de la compensación por duplicados */}
            <div className="px-6 py-5 border-t border-white/10 bg-yellow-400/[0.05]">
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">💰</span>
                <div>
                  <p className="text-[0.72rem] text-[#ffcb05] leading-[1.6] tracking-[0.03em]">¡Pokémon duplicado!</p>
                  <p className="text-[0.65rem] text-white/45 leading-[2] mt-1.5">
                    Si ya lo tienes recibirás <span className="text-[#ffcb05]">{MONEDAS_COMPENSACION} monedas</span> de compensación.
                  </p>
                </div>
              </div>
            </div>

            {/* Lista de items con cantidad en inventario */}
            {!cargando && (
              <div className="px-6 py-5 border-t border-white/10">
                <p className="text-[0.65rem] text-white/35 tracking-[0.04em] mb-4">Items de captura</p>
                <div className="flex flex-col gap-3">
                  {[
                    { clave: "amuleto",    icon: "🍀", label: "Amuleto de Suerte",    cantidad: itemsInventario.amuleto?.inv?.cantidad    ?? 0, activo: bonificaciones.amuleto,           desc: "Boost permanente de rareza" },
                    { clave: "tokenIV",    icon: "🔮", label: "Token de IV",           cantidad: itemsInventario.tokenIV?.inv?.cantidad    ?? 0, activo: bonificaciones.tokenIVRondas   > 0, desc: "Mín. Raro · 3 tiradas/ud." },
                    { clave: "charmRaro",  icon: "⚡", label: "Charm Raro",           cantidad: itemsInventario.charmRaro?.inv?.cantidad  ?? 0, activo: bonificaciones.charmRaroRondas > 0, desc: "+12% Raro · 5 rondas/ud." },
                    { clave: "charmEpico", icon: "💎", label: "Charm Épico",          cantidad: itemsInventario.charmEpico?.inv?.cantidad ?? 0, activo: bonificaciones.charmEpicoRondas> 0, desc: "+8% Épico · 5 rondas/ud." },
                    { clave: "charmLeg",   icon: "🌟", label: "Charm Legendario",     cantidad: itemsInventario.charmLeg?.inv?.cantidad   ?? 0, activo: bonificaciones.charmLegRondas  > 0, desc: "+5% Leg/Mítico · 5 ron/ud." },
                    { clave: "ticket",     icon: "🎟️", label: "Ticket de Invocación", cantidad: itemsInventario.ticket?.inv?.cantidad     ?? 0, activo: bonificaciones.usarTicket,         desc: "Leg/Mítico garantizado" },
                  ].map(item => (
                    <div key={item.clave} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[0.8rem]">{item.icon}</span>
                        <div>
                          <p className="text-[0.65rem] text-white/70">{item.label}</p>
                          <p className="text-[0.55rem] text-white/30 leading-[1.5]">{item.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {item.activo && (
                          <span className="text-[0.55rem] text-green-400 bg-green-400/12 px-2 py-0.5 rounded-full border border-green-400/30">
                            ACTIVO
                          </span>
                        )}
                        <span
                          className="text-[0.72rem] font-bold w-6 text-center"
                          style={{ color: item.cantidad > 0 ? "#ffcb05" : "rgba(255,255,255,0.2)" }}
                        >
                          {item.cantidad}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pool de Pokémon disponibles por rareza */}
            {!cargando && (
              <div className="px-6 py-5 border-t border-white/10">
                <p className="text-[0.65rem] text-white/35 tracking-[0.04em] mb-3">Pokémon en pool</p>
                <div className="flex flex-col gap-2">
                  {PROBABILIDADES_BASE.map(rareza => {
                    const cantidad = (pokemonPorRareza[rareza.key] ?? []).length;
                    return (
                      <div key={rareza.key} className="flex items-center justify-between">
                        <span className="text-[0.65rem] text-white/45 whitespace-nowrap">{rareza.label}</span>
                        <span className="text-[0.72rem] font-bold whitespace-nowrap" style={{ color: cantidad > 0 ? rareza.color : "rgba(255,255,255,0.2)" }}>
                          {cantidad}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Modal de resultado (solo cuando hay Pokémon revelado) */}
      {pokemonRevelado && estadoCaptura === "revelando" && (
        <ModalCaptura
          pokemon={pokemonRevelado}
          duplicado={esDuplicado}
          compensacionRecibida={compensacionRecibida}
          ticketUsado={ticketUsado}
          onClose={cerrarModal}
        />
      )}
    </>
  );
}
