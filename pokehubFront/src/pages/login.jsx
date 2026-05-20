import { useState, useEffect } from "react";
import BarraSuperior from "../components/barraSuperior";
import { useNavigate } from "react-router-dom";
import { authApi, usersApi } from "../api/api.js";
import { usePageMusic } from "../hooks/usePageMusic.js";
import loginMusic from "../assets/audio/temas/login.mp3";

// --- Utilidades de seguridad ---
function sanitize(str) {
  return String(str)
    .replace(/['";<>\\]/g, "")
    .replace(/--/g, "")
    .trim();
}

function decodeJWT(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded;
  } catch {
    return null;
  }
}

// --- Iconos ---
const IconEye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconEyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const IconMail = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const PokeballSVG = () => (
  <svg width="72" height="72" viewBox="0 0 52 52" fill="none" className="pk-logo-ball">
    <circle cx="26" cy="26" r="24" fill="white" stroke="#ddd" strokeWidth="1"/>
    <path d="M26 2C13.85 2 4 11.85 4 24h44C48 11.85 38.15 2 26 2Z" fill="#CC0000"/>
    <path d="M4 24c0 12.15 9.85 22 22 22s22-9.85 22-22H4Z" fill="white"/>
    <rect x="4" y="22" width="44" height="4" fill="#1a1a1a"/>
    <circle cx="26" cy="24" r="7.5" fill="#1a1a1a"/>
    <circle cx="26" cy="24" r="4.5" fill="white"/>
    <circle cx="22" cy="16" r="2.2" fill="rgba(255,255,255,0.35)"/>
  </svg>
);

// --- Input de contraseña con toggle de visibilidad ---
function PasswordInput({ id, value, onChange, placeholder, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        className="w-full py-4 pl-5 pr-12 border-2 border-[#e0e0e0] rounded-xl text-[0.82rem] text-[#222] bg-white/[0.92] outline-none tracking-[0.03em] leading-[1.5] transition-all focus:border-[#cc0000] focus:shadow-[0_0_0_3px_rgba(204,0,0,0.12)] focus:bg-white"
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#aaa] bg-transparent border-none cursor-pointer flex items-center p-1 transition-colors hover:text-[#cc0000]"
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? "Ocultar" : "Mostrar"}
      >
        {visible ? <IconEyeOff /> : <IconEye />}
      </button>
    </div>
  );
}

// --- Barra de fortaleza de contraseña ---
function StrengthBar({ password }) {
  const score = !password ? 0 : [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const segColor = score <= 1 ? "!bg-red-500" : score === 2 ? "!bg-amber-400" : "!bg-green-500";
  const labels   = ["", "DÉBIL", "NORMAL", "FUERTE", "EXPERTO"];

  return (
    <>
      <div className="flex gap-1.5 mt-2 h-[5px]">
        {[0,1,2,3].map(i => (
          <div key={i} className={`flex-1 rounded-full bg-[#e5e5e5] transition-colors duration-300${i < score ? " " + segColor : ""}`} />
        ))}
      </div>
      {password && <p className="text-[0.6rem] text-[#888] mt-1.5 leading-[1.6] tracking-[0.06em]">{labels[score]}</p>}
    </>
  );
}

// --- Clases compartidas ---
const inputCls = "w-full py-4 pl-5 pr-12 border-2 border-[#e0e0e0] rounded-xl text-[0.82rem] text-[#222] bg-white/[0.92] outline-none tracking-[0.03em] leading-[1.5] transition-all focus:border-[#cc0000] focus:shadow-[0_0_0_3px_rgba(204,0,0,0.12)] focus:bg-white";
const labelCls = "block text-[0.68rem] tracking-[0.09em] text-[#444] mb-2 leading-[1.6]";

// --- Panel de Login ---
function LoginPanel({ onSwitch }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const cleanEmail    = sanitize(email);
    const cleanPassword = sanitize(password);

    if (!cleanEmail || !cleanPassword) { setError("Completa todos los campos."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) { setError("Email no válido."); return; }
    if (cleanPassword.length > 128) { setError("Contraseña demasiado larga."); return; }

    setLoading(true);
    try {
      const data = await authApi.login(cleanEmail, cleanPassword);
      localStorage.setItem("access_token", data.access_token);
      navigate("/");
    } catch (err) {
      setError(err.message ?? "Error de conexión con el servidor.");
      setLoading(false);
    }
  }

  return (
    <div className="pk-slide-in">
      {error && (
        <div className="p-[12px_16px] rounded-xl text-[0.7rem] leading-[1.9] mb-5 whitespace-pre-line pk-fade-in bg-red-600/10 text-red-700 border-[1.5px] border-red-500/25">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-5">
          <label className={labelCls} htmlFor="l-email">EMAIL</label>
          <div className="relative">
            <input
              className={inputCls}
              id="l-email" type="email"
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com" autoComplete="email"
              maxLength={254}
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#aaa] flex items-center p-1"><IconMail /></span>
          </div>
        </div>
        <div className="mb-5">
          <label className={labelCls} htmlFor="l-pass">CONTRASEÑA</label>
          <PasswordInput
            id="l-pass" value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" autoComplete="current-password"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-5 px-5 bg-[#cc0000] text-white border-none rounded-xl text-[0.78rem] tracking-[0.07em] cursor-pointer leading-[1.6] mt-2 shadow-[0_4px_18px_rgba(204,0,0,0.4),0_2px_0_#8b0000] transition-all duration-[200ms] hover:bg-[#aa0000] hover:shadow-[0_6px_24px_rgba(204,0,0,0.5),0_2px_0_#8b0000] hover:-translate-y-px active:translate-y-px disabled:opacity-65 disabled:cursor-not-allowed disabled:translate-y-0"
        >
          {loading ? <><span className="pk-spinner" />CARGANDO...</> : "INICIAR SESIÓN"}
        </button>
      </form>
      <button
        type="button"
        className="bg-transparent border-none cursor-pointer text-[0.65rem] text-[#cc0000] tracking-[0.06em] leading-[1.8] block text-center w-full mt-5 transition-colors duration-[200ms] hover:text-[#8b0000] hover:underline"
        onClick={onSwitch}
      >
        NUEVA CUENTA &gt;
      </button>
    </div>
  );
}

// --- Panel de Registro ---
function RegisterPanel({ onSwitch }) {
  const [username, setUsername] = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);
  const [loading,  setLoading]  = useState(false);

  async function comprobarUsuario(emailToCheck) {
    try {
      const data = await usersApi.getAll();
      return data.some(u => u.email === emailToCheck);
    } catch (err) {
      setError("Error al verificar el email." + err);
      return false;
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanUsername = sanitize(username);
    const cleanEmail    = sanitize(email);
    const cleanPassword = password.trim();
    const cleanConfirm  = confirm.trim();

    if (!cleanUsername || !cleanEmail || !cleanPassword || !cleanConfirm) { setError("Completa todos los campos."); return; }
    if (cleanUsername.length < 3 || cleanUsername.length > 30) { setError("Usuario: entre 3 y 30 caracteres."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) { setError("Email no válido."); return; }
    if (await comprobarUsuario(cleanEmail)) { setError("Email ya en uso."); return; }
    if (cleanPassword.length < 8 || cleanPassword.length > 128) { setError("Contraseña: entre 8 y 128 caracteres."); return; }
    if (cleanPassword !== cleanConfirm) { setError("Las contraseñas no coinciden."); return; }

    setLoading(true);
    await authApi.register({ nombre: cleanUsername, email: cleanEmail, avatar: null, clave: cleanPassword });
    await new Promise(r => setTimeout(r, 1400));
    setLoading(false);
    setSuccess(true);
    setTimeout(() => { setSuccess(false); onSwitch(); }, 2000);
  };

  if (success) {
    return (
      <div className="pk-slide-in">
        <div className="p-[12px_16px] rounded-xl text-[0.7rem] leading-[1.9] whitespace-pre-line pk-fade-in bg-green-600/10 text-green-700 border-[1.5px] border-green-600/25">
          ¡CUENTA CREADA! ¡BIENVENIDO, ENTRENADOR!
        </div>
      </div>
    );
  }

  return (
    <div className="pk-slide-in">
      {error && (
        <div className="p-[12px_16px] rounded-xl text-[0.7rem] leading-[1.9] mb-5 whitespace-pre-line pk-fade-in bg-red-600/10 text-red-700 border-[1.5px] border-red-500/25">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-5">
          <label className={labelCls} htmlFor="r-user">USUARIO</label>
          <div className="relative">
            <input
              className={inputCls}
              id="r-user" type="text"
              value={username} onChange={e => setUsername(e.target.value)}
              placeholder="AshKetchum99" autoComplete="username"
              maxLength={30}
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#aaa] flex items-center p-1"><IconUser /></span>
          </div>
        </div>
        <div className="mb-5">
          <label className={labelCls} htmlFor="r-email">EMAIL</label>
          <div className="relative">
            <input
              className={inputCls}
              id="r-email" type="email"
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com" autoComplete="email"
              maxLength={254}
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#aaa] flex items-center p-1"><IconMail /></span>
          </div>
        </div>
        <div className="mb-5">
          <label className={labelCls} htmlFor="r-pass">CONTRASEÑA</label>
          <PasswordInput
            id="r-pass" value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres" autoComplete="new-password"
          />
          <StrengthBar password={password} />
        </div>
        <div className="mb-5">
          <label className={labelCls} htmlFor="r-confirm">CONFIRMAR</label>
          <PasswordInput
            id="r-confirm" value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Repite la contraseña" autoComplete="new-password"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-5 px-5 bg-[#cc0000] text-white border-none rounded-xl text-[0.78rem] tracking-[0.07em] cursor-pointer leading-[1.6] mt-2 shadow-[0_4px_18px_rgba(204,0,0,0.4),0_2px_0_#8b0000] transition-all duration-[200ms] hover:bg-[#aa0000] hover:shadow-[0_6px_24px_rgba(204,0,0,0.5),0_2px_0_#8b0000] hover:-translate-y-px active:translate-y-px disabled:opacity-65 disabled:cursor-not-allowed disabled:translate-y-0"
        >
          {loading ? <><span className="pk-spinner" />REGISTRANDO...</> : "REGISTRARSE"}
        </button>
      </form>
      <button
        type="button"
        className="bg-transparent border-none cursor-pointer text-[0.65rem] text-[#cc0000] tracking-[0.06em] leading-[1.8] block text-center w-full mt-5 transition-colors duration-[200ms] hover:text-[#8b0000] hover:underline"
        onClick={onSwitch}
      >
        &lt; YA TENGO CUENTA
      </button>
    </div>
  );
}

// --- Página principal ---
export default function AuthPanel() {
  usePageMusic(loginMusic);
  const [tab, setTab] = useState("login");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      const payload = decodeJWT(token);
      if (payload?.exp && payload.exp > Math.floor(Date.now() / 1000)) {
        navigate("/");
        return;
      }
      localStorage.removeItem("access_token");
    }
  }, [navigate]);

  const tabCls = (t) =>
    `py-5 px-2 text-center text-[0.68rem] tracking-[0.05em] leading-[1.7] bg-transparent border-none cursor-pointer relative whitespace-nowrap transition-all duration-[200ms] hover:text-[#cc0000] hover:bg-[rgba(204,0,0,0.04)]${
      tab === t ? " pk-tab-active text-[#cc0000]" : " text-[#888]"
    }`;

  return (
    <>
      <BarraSuperior />
      <div className="flex-1 min-h-0 flex items-center justify-center py-4 overflow-hidden">
        <div className="w-full max-w-[540px] mx-4 bg-white/90 rounded-3xl border-2 border-white/50 shadow-[0_8px_40px_rgba(0,0,0,0.3),0_2px_8px_rgba(0,0,0,0.18)] overflow-hidden pk-card-in">

          {/* Tabs */}
          <div className="grid grid-cols-2 border-b-[3px] border-black/10" role="tablist">
            <button className={tabCls("login")}    role="tab" aria-selected={tab === "login"}    onClick={() => setTab("login")}>INICIAR SESIÓN</button>
            <button className={tabCls("register")} role="tab" aria-selected={tab === "register"} onClick={() => setTab("register")}>REGISTRO</button>
          </div>

          {/* Cuerpo */}
          <div className="px-10 pt-10 pb-12">
            {/* Logo */}
            <div className="flex flex-col items-center gap-3 mb-9">
              <PokeballSVG />
              <span className="text-[1.4rem] tracking-[0.08em] text-[#cc0000] [text-shadow:2px_2px_0_rgba(0,0,0,0.12)]">POKEHUB</span>
              <span className="text-[0.62rem] text-[#888] tracking-[0.1em] leading-[1.8]">ENCICLOPEDIA POKÉMON</span>
            </div>

            {tab === "login"
              ? <LoginPanel    key="login"    onSwitch={() => setTab("register")} />
              : <RegisterPanel key="register" onSwitch={() => setTab("login")} />
            }
          </div>
        </div>
      </div>
    </>
  );
}
