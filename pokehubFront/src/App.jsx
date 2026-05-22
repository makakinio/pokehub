import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEfectoClick } from "./hooks/useEfectoClick.js";

/* ── Lazy imports — cada ruta se carga sólo cuando se visita ── */
const MenuPrincipal = lazy(() => import("./pages/menuPrincipal"));
const Login         = lazy(() => import("./pages/login"));
const Equipo        = lazy(() => import("./pages/equipo"));
const Capturar      = lazy(() => import("./pages/capturar"));
const Inventario    = lazy(() => import("./pages/inventario"));
const Tienda        = lazy(() => import("./pages/tienda"));
const Biblioteca    = lazy(() => import("./pages/biblioteca"));
const Minijuegos    = lazy(() => import("./pages/minijuegos"));
const AltoOBajo     = lazy(() => import("./pages/altoOBajo"));
const ClickGame     = lazy(() => import("./pages/clickGame"));
const Ruleta        = lazy(() => import("./pages/ruleta"));
const NotFound      = lazy(() => import("./pages/notFound"));

/* ── Loader mostrado mientras se descarga el chunk de la ruta ── */
function PageLoader() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.55)" }}
    >
      <div className="flex flex-col items-center gap-5">
        <svg
          width="72" height="72" viewBox="0 0 100 100"
          className="pk-pulse"
          style={{ filter: "drop-shadow(0 0 22px rgba(227,0,11,0.55))" }}
        >
          <path d="M3 50 a47 47 0 0 1 94 0 Z" fill="#e3000b" />
          <path d="M3 50 a47 47 0 0 0 94 0 Z" fill="#f0f0f0" />
          <circle cx="50" cy="50" r="47" fill="none" stroke="#333" strokeWidth="2.5" />
          <line x1="3" y1="50" x2="97" y2="50" stroke="#333" strokeWidth="5" />
          <circle cx="50" cy="50" r="14" fill="#fff" stroke="#333" strokeWidth="4.5" />
          <circle cx="50" cy="50" r="7" fill="#e3000b" />
          <ellipse cx="38" cy="32" rx="7" ry="4" fill="rgba(255,255,255,0.28)" transform="rotate(-30 38 32)" />
        </svg>
        <p className="text-white/35 text-[0.75rem] tracking-[0.14em]">CARGANDO…</p>
      </div>
    </div>
  );
}

/**
 * Badge flotante que informa al usuario de que el audio espera su primera interacción.
 * Desaparece en cuanto el navegador detecta un gesto del usuario (click / tecla).
 * Solo se muestra si el autoplay fue bloqueado por la política del navegador.
 */
function AudioUnlockHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Intentar reproducir audio silencioso para detectar si autoplay está bloqueado
    const sonda = new Audio();
    sonda.volume = 0;
    sonda.src =
      "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

    sonda.play().then(() => {
      // Autoplay permitido → no hace falta badge
      sonda.src = "";
    }).catch(() => {
      // Autoplay bloqueado → mostrar badge
      setVisible(true);

      const ocultar = () => setVisible(false);
      document.addEventListener("click",   ocultar, { once: true });
      document.addEventListener("keydown", ocultar, { once: true });
    });

    return () => { sonda.src = ""; };
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position:     "fixed",
        bottom:       "1.25rem",
        left:         "50%",
        transform:    "translateX(-50%)",
        zIndex:       9999,
        display:      "flex",
        alignItems:   "center",
        gap:          "0.5rem",
        background:   "rgba(0,0,0,0.82)",
        border:       "1.5px solid rgba(255,203,5,0.35)",
        borderRadius: "999px",
        padding:      "0.45rem 1.1rem",
        color:        "rgba(255,203,5,0.9)",
        fontSize:     "0.72rem",
        letterSpacing:"0.05em",
        backdropFilter: "blur(6px)",
        pointerEvents: "none",        // no bloquea clicks
        animation:    "pkBadgePulse 1.8s ease-in-out infinite",
      }}
    >
      <span style={{ fontSize: "1rem" }}>🎵</span>
      Pulsa en cualquier lugar para activar el audio
    </div>
  );
}

function App() {
  // Efecto de sonido global: suena en cada click sobre botones/controles interactivos
  useEfectoClick();

  return (
    <div className="fondo">
      <AudioUnlockHint />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/"                    element={<MenuPrincipal />} />
            <Route path="/login"               element={<Login />} />
            <Route path="/equipo"              element={<Equipo />} />
            <Route path="/capturar"            element={<Capturar />} />
            <Route path="/inventario"          element={<Inventario />} />
            <Route path="/tienda"              element={<Tienda />} />
            <Route path="/biblioteca"          element={<Biblioteca />} />
            <Route path="/minijuegos"          element={<Minijuegos />} />
            <Route path="/minijuegos/alto-bajo" element={<AltoOBajo />} />
            <Route path="/minijuegos/clicks"   element={<ClickGame />} />
            <Route path="/minijuegos/ruleta"   element={<Ruleta />} />
            <Route path="*"                    element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </div>
  );
}

export default App;
