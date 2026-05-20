import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { authApi, productosApi, inventarioApi } from "../api/api.js";
import ModalConfiguracion from "./modalConfiguracion.jsx";
import ModalAdminPanel from "./modalAdminPanel.jsx";

const DEFAULT_NAV_LINKS = [
  { label: "Equipo",      href: "/equipo",      icon: "⚔️" },
  { label: "Capturar",    href: "/capturar",    icon: "🔴" },
  { label: "Inventario",  href: "/inventario",  icon: "🎒" },
  { label: "Tienda",      href: "/tienda",      icon: "🏪" },
  { label: "Minijuegos",  href: "/minijuegos",  icon: "🎮" },
];

function PokeBallSVG({ size = 58, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className={`block flex-shrink-0 ${className}`}>
      <path d="M3 50 a47 47 0 0 1 94 0 Z" fill="#e3000b" />
      <path d="M3 50 a47 47 0 0 0 94 0 Z" fill="#f0f0f0" />
      <circle cx="50" cy="50" r="47" fill="none" stroke="#111" strokeWidth="3" />
      <line x1="3" y1="50" x2="97" y2="50" stroke="#111" strokeWidth="6" />
      <circle cx="50" cy="50" r="14" fill="#fff" stroke="#111" strokeWidth="5" />
      <circle cx="50" cy="50" r="7" fill="#e3000b" />
      <ellipse cx="38" cy="32" rx="7" ry="4" fill="rgba(255,255,255,0.25)" transform="rotate(-30 38 32)" />
    </svg>
  );
}

export default function BarraSuperior({ navLinks = DEFAULT_NAV_LINKS, userAvatar = null }) {
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [animation,   setAnimation]   = useState("");
  const [userName,    setUserName]    = useState("Entrenador");
  const [userEmail,   setUserEmail]   = useState("");
  const [userId,      setUserId]      = useState(null);
  const [isAdmin,     setIsAdmin]     = useState(false);
  const [saldo,       setSaldo]       = useState(null);
  const [pokeballs,   setPokeballs]   = useState(null);
  const [modalConfig, setModalConfig] = useState(false);
  const [modalAdmin,  setModalAdmin]  = useState(false);

  const location    = useLocation();
  const navigate    = useNavigate();
  const isLoginPage = location.pathname === "/login";

  /* Cargar usuario al montar y al cambiar de ruta */
  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem("access_token");
      if (!token) { if (!isLoginPage) navigate("/login", { replace: true }); return; }
      try {
        const data = await authApi.getUsuarioActual();
        if (data) {
          setUserName(data.nombre ?? data.username ?? data.email ?? "Entrenador");
          setUserEmail(data.email ?? "");
          setUserId(data.id ?? null);
          setIsAdmin(data.admin === 1);
          setSaldo(data.dinero ?? 0);

          // Cargar pokeballs del inventario
          try {
            const [productos, inv] = await Promise.all([
              productosApi.getAll(),
              inventarioApi.getByUsuario(data.id),
            ]);
            const pb = productos.find(p => p.nombre.toLowerCase().includes("pokeball"));
            if (pb) {
              const item = inv.find(i => i.id_producto === pb.id);
              setPokeballs(item ? item.cantidad : 0);
            }
          } catch { /* silencioso */ }
        }
      } catch {
        localStorage.removeItem("access_token");
        if (!isLoginPage) navigate("/login", { replace: true });
      }
    }
    if (!isLoginPage) checkAuth();
  }, [isLoginPage, navigate, location.pathname]);

  /* Escuchar evento global cuando un minijuego actualiza el saldo */
  useEffect(() => {
    function onSaldoUpdate(e) {
      if (e.detail?.dinero !== undefined) setSaldo(e.detail.dinero);
    }
    window.addEventListener("saldo-update", onSaldoUpdate);
    return () => window.removeEventListener("saldo-update", onSaldoUpdate);
  }, []);

  /* Escuchar evento global de pokeballs */
  useEffect(() => {
    function onPokeballsUpdate(e) {
      if (e.detail?.cantidad !== undefined) setPokeballs(e.detail.cantidad);
    }
    window.addEventListener("pokeballs-update", onPokeballsUpdate);
    return () => window.removeEventListener("pokeballs-update", onPokeballsUpdate);
  }, []);

  function handleLogout() {
    localStorage.removeItem("access_token");
    navigate("/login", { replace: true });
  }

  function handleLogoClick() {
    setAnimation("spinning");
    setTimeout(() => setAnimation(""), 850);
    if (!isLoginPage) navigate("/");
  }

  function handleLogoHover() {
    if (!animation) { setAnimation("bounce"); setTimeout(() => setAnimation(""), 420); }
  }

  const pokeballClass = animation === "spinning" ? "pk-pokeball-spinning" : animation === "bounce" ? "pk-pokeball-bounce" : "";
  const navBase = "bg-[#1a0000] border-2 border-[#e3000b] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.55),0_0_0_1px_rgba(227,0,11,0.15),inset_0_1px_0_rgba(255,255,255,0.05)]";

  const linkClass = (href) => {
    const isActive = location.pathname === href;
    return `flex items-center gap-1.5 px-4 py-2 rounded-full text-[0.88rem] font-semibold whitespace-nowrap border-[1.5px] transition-all duration-[180ms] no-underline ${
      isActive
        ? "text-[#ffcb05] bg-[rgba(255,203,5,0.12)] border-[rgba(255,203,5,0.5)]"
        : "text-white/60 border-transparent hover:text-white hover:bg-[rgba(227,0,11,0.22)] hover:border-[rgba(227,0,11,0.5)]"
    }`;
  };

  if (isLoginPage) {
    return (
      <div className="sticky top-0 z-50 px-4 pt-3">
        <nav className={`${navBase} rounded-full`} aria-label="Navegación principal">
          <div className="h-16 flex items-center justify-center">
            <button
              className="bg-transparent border-none cursor-pointer p-0 flex items-center justify-center rounded-full transition-[filter] duration-180 hover:drop-shadow-[0_0_12px_rgba(227,0,11,0.8)]"
              onClick={handleLogoClick} onMouseEnter={handleLogoHover} aria-label="PokéHub"
            >
              <PokeBallSVG size={58} className={pokeballClass} />
            </button>
          </div>
        </nav>
      </div>
    );
  }

  return (
    <>
      <div className="sticky top-0 z-50 px-4 pt-3">
        <nav className={`${navBase} rounded-3xl md:rounded-full`} aria-label="Navegación principal">
          {/* Inner */}
          <div className="h-[4.5rem] px-3 grid grid-cols-[auto_1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center gap-2">

            {/* Izquierda — links de navegación */}
            <ul className="hidden md:flex items-center justify-center gap-0.5 list-none">
              {navLinks.map(link => (
                <li key={link.href}>
                  <Link to={link.href} aria-current={location.pathname === link.href ? "page" : undefined} className={linkClass(link.href)}>
                    {link.icon && <span aria-hidden="true">{link.icon}</span>}
                    {link.label}
                  </Link>
                </li>
              ))}
              {isAdmin && (
                <li>
                  <button
                    type="button"
                    onClick={() => setModalAdmin(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.65rem] tracking-[0.06em] whitespace-nowrap border-[1.5px] border-[rgba(255,203,5,0.45)] bg-[rgba(255,203,5,0.1)] text-[#ffcb05] cursor-pointer transition-all duration-[180ms] hover:bg-[rgba(255,203,5,0.2)] hover:border-[rgba(255,203,5,0.7)] hover:shadow-[0_0_10px_rgba(255,203,5,0.25)]"
                    aria-label="Abrir panel de administración"
                  >
                    🛡️ Admin
                  </button>
                </li>
              )}
            </ul>

            {/* Centro — pokeball */}
            <div className="flex items-center justify-center px-4">
              <button
                className="bg-transparent border-none cursor-pointer p-0 flex items-center justify-center rounded-full transition-[filter] duration-[180ms] hover:drop-shadow-[0_0_12px_rgba(227,0,11,0.8)] focus-visible:outline-2 focus-visible:outline-[#ffcb05] focus-visible:outline-offset-[5px]"
                onClick={handleLogoClick} onMouseEnter={handleLogoHover} aria-label="PokéHub — inicio"
              >
                <PokeBallSVG size={58} className={pokeballClass} />
              </button>
            </div>

            {/* Derecha — saldo + usuario + hamburger */}
            <div className="flex items-center justify-center gap-2.5">

              {/* Saldo */}
              {saldo !== null && (
                <div className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-full border-[1.5px] border-[rgba(255,203,5,0.35)] bg-[rgba(255,203,5,0.08)] text-[#ffcb05] text-[0.82rem] font-semibold whitespace-nowrap flex-shrink-0">
                  💰 {Number(saldo).toFixed(2)}
                </div>
              )}

              {/* Pokéballs */}
              {pokeballs !== null && (
                <div className={`hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-full border-[1.5px] text-[0.82rem] font-semibold whitespace-nowrap flex-shrink-0 transition-colors ${
                  pokeballs === 0
                    ? "border-red-500/40 bg-red-500/10 text-red-400"
                    : "border-white/20 bg-white/[0.06] text-white/70"
                }`}>
                  <svg width="14" height="14" viewBox="0 0 100 100" className="flex-shrink-0">
                    <path d="M3 50 a47 47 0 0 1 94 0 Z" fill="#e3000b" />
                    <path d="M3 50 a47 47 0 0 0 94 0 Z" fill="#f0f0f0" />
                    <circle cx="50" cy="50" r="47" fill="none" stroke="#555" strokeWidth="6" />
                    <line x1="3" y1="50" x2="97" y2="50" stroke="#555" strokeWidth="9" />
                    <circle cx="50" cy="50" r="13" fill="#fff" stroke="#555" strokeWidth="6" />
                    <circle cx="50" cy="50" r="6" fill="#e3000b" />
                  </svg>
                  {pokeballs}
                </div>
              )}

              {/* Botón usuario — abre modal */}
              <button
                type="button"
                onClick={() => setModalConfig(true)}
                aria-label={`Configuración de ${userName}`}
                className="flex items-center gap-2.5 py-[0.5rem] pl-[0.5rem] pr-[1.1rem] rounded-full border-[1.5px] border-[rgba(227,0,11,0.45)] bg-[rgba(80,0,0,0.6)] text-[#f0f0f0] text-[0.9rem] font-semibold cursor-pointer whitespace-nowrap transition-all duration-[180ms] hover:border-[#ffcb05] hover:bg-[rgba(110,0,0,0.8)] hover:shadow-[0_0_14px_rgba(255,203,5,0.3)]"
              >
                <div className="w-[44px] h-[44px] rounded-full bg-gradient-to-br from-[#e3000b] to-[#7a0000] border-2 border-[rgba(255,203,5,0.55)] flex items-center justify-center text-[18px] font-bold text-white overflow-hidden flex-shrink-0">
                  {userAvatar ? <img src={userAvatar} alt={userName} className="w-full h-full object-cover" /> : userName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline">{userName}</span>
              </button>

              {/* Hamburger */}
              <button
                className="flex md:hidden flex-col gap-[5px] bg-transparent border-none cursor-pointer p-[0.4rem] rounded-lg"
                onClick={() => setMenuOpen(v => !v)}
                aria-expanded={menuOpen}
                aria-controls="pk-mobile-menu"
                aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              >
                <span className="block w-[22px] h-[2px] bg-[#e3000b] rounded-full" />
                <span className="block w-[22px] h-[2px] bg-[#e3000b] rounded-full" />
                <span className="block w-[22px] h-[2px] bg-[#e3000b] rounded-full" />
              </button>
            </div>
          </div>

          {/* Menú móvil */}
          {menuOpen && (
            <ul id="pk-mobile-menu" className="flex flex-col gap-1 bg-[#1a0000] border-t border-[rgba(227,0,11,0.3)] py-3 px-5 pb-4 list-none rounded-b-3xl" role="list">
              {/* Saldo + pokeballs móvil */}
              {(saldo !== null || pokeballs !== null) && (
                <li className="flex items-center gap-4 px-3.5 py-2.5">
                  {saldo !== null && (
                    <span className="text-[#ffcb05] text-[0.9rem]">💰 {Number(saldo).toFixed(2)}</span>
                  )}
                  {pokeballs !== null && (
                    <span className={`flex items-center gap-1.5 text-[0.9rem] ${pokeballs === 0 ? "text-red-400" : "text-white/70"}`}>
                      <svg width="14" height="14" viewBox="0 0 100 100" className="flex-shrink-0">
                        <path d="M3 50 a47 47 0 0 1 94 0 Z" fill="#e3000b" />
                        <path d="M3 50 a47 47 0 0 0 94 0 Z" fill="#f0f0f0" />
                        <circle cx="50" cy="50" r="47" fill="none" stroke="#555" strokeWidth="6" />
                        <line x1="3" y1="50" x2="97" y2="50" stroke="#555" strokeWidth="9" />
                        <circle cx="50" cy="50" r="13" fill="#fff" stroke="#555" strokeWidth="6" />
                        <circle cx="50" cy="50" r="6" fill="#e3000b" />
                      </svg>
                      {pokeballs}
                    </span>
                  )}
                </li>
              )}
              {navLinks.map(link => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full text-[1rem] font-semibold no-underline transition-all duration-[180ms] ${location.pathname === link.href ? "text-[#ffcb05] bg-[rgba(227,0,11,0.15)]" : "text-white/65 hover:text-[#ffcb05] hover:bg-[rgba(227,0,11,0.15)]"}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.icon && <span aria-hidden="true">{link.icon}</span>}
                    {link.label}
                  </Link>
                </li>
              ))}
              {isAdmin && (
                <li>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); setModalAdmin(true); }}
                    className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-full text-[1rem] font-semibold text-[#ffcb05] bg-transparent border-none cursor-pointer hover:bg-[rgba(255,203,5,0.1)] transition-all"
                  >
                    🛡️ Panel Admin
                  </button>
                </li>
              )}
              <li className="h-px bg-[rgba(227,0,11,0.2)] my-1" role="separator" />
              <li>
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-full text-[1rem] font-semibold text-white/65 bg-transparent border-none cursor-pointer hover:text-[#ffcb05] hover:bg-[rgba(227,0,11,0.15)] transition-all"
                  onClick={() => { setMenuOpen(false); setModalConfig(true); }}
                >
                  ⚙️ Configuración
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-full text-[1rem] font-semibold text-white/65 bg-transparent border-none cursor-pointer hover:text-[#ffcb05] hover:bg-[rgba(227,0,11,0.15)] transition-all"
                  onClick={handleLogout}
                >
                  🚪 Cerrar sesión
                </button>
              </li>
            </ul>
          )}
        </nav>
      </div>

      {/* Modal de configuración */}
      <ModalConfiguracion
        isOpen={modalConfig}
        onClose={() => setModalConfig(false)}
        userName={userName}
        userEmail={userEmail}
        userId={userId}
      />

      {/* Modal panel admin */}
      {isAdmin && (
        <ModalAdminPanel
          isOpen={modalAdmin}
          onClose={() => setModalAdmin(false)}
          userId={userId}
          userName={userName}
        />
      )}
    </>
  );
}
