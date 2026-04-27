import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import "../styles/barraSuperior.css";

const DEFAULT_NAV_LINKS = [
  { label: "Equipo", href: "/equipo", icon: "⚔️" },
  { label: "Capturar", href: "/capturar", icon: "🔴" },
  { label: "Inventario", href: "/inventario", icon: "🎒" },
  { label: "Tienda", href: "/tienda", icon: "🏪" },
];

function PokeBallSVG({ size = 58, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={`pk-pokeball ${className}`}
    >
      <path d="M3 50 a47 47 0 0 1 94 0 Z" fill="#e3000b" />
      <path d="M3 50 a47 47 0 0 0 94 0 Z" fill="#f0f0f0" />
      <circle cx="50" cy="50" r="47" fill="none" stroke="#111" strokeWidth="3" />
      <line x1="3" y1="50" x2="97" y2="50" stroke="#111" strokeWidth="6" />
      <circle cx="50" cy="50" r="14" fill="#fff" stroke="#111" strokeWidth="5" />
      <circle cx="50" cy="50" r="7" fill="#e3000b" />
      <ellipse
        cx="38"
        cy="32"
        rx="7"
        ry="4"
        fill="rgba(255,255,255,0.25)"
        transform="rotate(-30 38 32)"
      />
    </svg>
  );
}

export default function BarraSuperior({
  navLinks = DEFAULT_NAV_LINKS,
  userAvatar = null,
  configHref = "/configuracion",
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [animation, setAnimation] = useState("");
  const [userName, setUserName] = useState("Entrenador");

  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === "/login";

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        if (!isLoginPage) navigate("/login", { replace: true });
        return;
      }

      try {
        const res = await fetch("http://127.0.0.1:8000/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("user");
          if (!isLoginPage) navigate("/login", { replace: true });
          return;
        }

        const data = await res.json();
        setUserName(data.nombre ?? data.username ?? data.email ?? "Entrenador");
        localStorage.setItem("user", JSON.stringify(data));
      } catch {
        if (!isLoginPage) navigate("/login", { replace: true });
      }
    }

    if (!isLoginPage) {
      checkAuth();
    }
  }, [isLoginPage, navigate, location.pathname]);

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  }

  function handleLogoClick() {
    setAnimation("spinning");
    setTimeout(() => setAnimation(""), 850);
    if (!isLoginPage) navigate("/equipo");
  }

  function handleLogoHover() {
    if (!animation) {
      setAnimation("bounce");
      setTimeout(() => setAnimation(""), 420);
    }
  }

  const pokeballClass =
    animation === "spinning"
      ? "pk-pokeball-spinning"
      : animation === "bounce"
      ? "pk-pokeball-bounce"
      : "";

  if (isLoginPage) {
    return (
      <nav className="pk-navbar pk-navbar--login" aria-label="Navegación principal">
        <div className="pk-inner pk-inner--login">
          <button
            className="pk-logo-btn"
            onClick={handleLogoClick}
            onMouseEnter={handleLogoHover}
            aria-label="PokéHub"
          >
            <PokeBallSVG size={58} className={pokeballClass} />
          </button>
        </div>
      </nav>
    );
  }

  return (
    <nav className="pk-navbar" aria-label="Navegación principal">
      <div className="pk-inner">
        <ul className="pk-left" role="list" aria-label="Secciones">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;

            return (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className={isActive ? "active" : ""}
                  aria-current={isActive ? "page" : undefined}
                >
                  {link.icon && <span aria-hidden="true">{link.icon}</span>}
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="pk-center">
          <button
            className="pk-logo-btn"
            onClick={handleLogoClick}
            onMouseEnter={handleLogoHover}
            aria-label="PokéHub — inicio"
          >
            <PokeBallSVG size={58} className={pokeballClass} />
          </button>
        </div>

        <div className="pk-right">
          <Link
            to={configHref}
            className="pk-user-btn"
            aria-label={`Configuración de ${userName}`}
          >
            <div className="pk-avatar">
              {userAvatar ? (
                <img src={userAvatar} alt={userName} />
              ) : (
                userName.charAt(0).toUpperCase()
              )}
            </div>
            <span className="pk-user-name">{userName}</span>
          </Link>

          <button
            className="pk-hamburger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="pk-mobile-menu"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <ul
        id="pk-mobile-menu"
        className={`pk-mobile-menu${menuOpen ? " open" : ""}`}
        role="list"
        aria-label="Menú móvil"
      >
        {navLinks.map((link) => {
          const isActive = location.pathname === link.href;

          return (
            <li key={link.href}>
              <Link
                to={link.href}
                className={isActive ? "active" : ""}
                onClick={() => setMenuOpen(false)}
              >
                {link.icon && <span aria-hidden="true">{link.icon}</span>}
                {link.label}
              </Link>
            </li>
          );
        })}

        <li className="pk-mobile-divider" role="separator" />
        <li>
          <Link to={configHref} onClick={() => setMenuOpen(false)}>
            ⚙️ Configuración
          </Link>
        </li>
        <li>
          <button type="button" onClick={handleLogout}>
            🚪 Cerrar sesión
          </button>
        </li>
      </ul>
    </nav>
  );
}