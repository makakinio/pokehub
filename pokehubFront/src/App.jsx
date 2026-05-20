import { lazy, Suspense } from "react";
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

function App() {
  // Efecto de sonido global: suena en cada click sobre botones/controles interactivos
  useEfectoClick();

  return (
    <div className="fondo">
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
            <Route path="*"                    element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </div>
  );
}

export default App;
