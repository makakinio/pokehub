// AuthPanel.jsx
import { useState } from "react";
import "../styles/login.css"
import BarraSuperior from "../components/barraSuperior"
import { useNavigate } from "react-router-dom";

//Iconos
const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconEyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const PokeballSVG = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none" className="pk-logo-ball">
    <circle cx="26" cy="26" r="24" fill="white" stroke="#ddd" strokeWidth="1"/>
    <path d="M26 2C13.85 2 4 11.85 4 24h44C48 11.85 38.15 2 26 2Z" fill="#CC0000"/>
    <path d="M4 24c0 12.15 9.85 22 22 22s22-9.85 22-22H4Z" fill="white"/>
    <rect x="4" y="22" width="44" height="4" fill="#1a1a1a"/>
    <circle cx="26" cy="24" r="7.5" fill="#1a1a1a"/>
    <circle cx="26" cy="24" r="4.5" fill="white"/>
    <circle cx="22" cy="16" r="2.2" fill="rgba(255,255,255,0.35)"/>
  </svg>
);

function PasswordInput({ id, value, onChange, placeholder, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="pk-input-wrap">
      <input
        className="pk-input"
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="pk-input-icon"
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? "Ocultar" : "Mostrar"}
      >
        {visible ? <IconEyeOff /> : <IconEye />}
      </button>
    </div>
  );
}

function StrengthBar({ password }) {
  const score = !password ? 0 : [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const cls = score <= 1 ? "pk-s-weak" : score === 2 ? "pk-s-medium" : "pk-s-strong";
  const labels = ["", "DEBIL", "NORMAL", "FUERTE", "EXPERTO"];

  return (
    <>
      <div className="pk-strength-bar">
        {[0,1,2,3].map(i => (
          <div key={i} className={`pk-strength-seg${i < score ? " " + cls : ""}`} />
        ))}
      </div>
      {password && <p className="pk-strength-label">{labels[score]}</p>}
    </>
  );
}

//Funciones login y registro
function LoginPanel({ onSwitch }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Completa todos los campos.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Email no valido.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          username: email,
          password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail ?? "Credenciales incorrectas.");
        setLoading(false);
        return;
      }

      // Guardar token y redirigir
      localStorage.setItem("access_token", data.access_token);
      navigate("/");

    } catch {
      setError("Error de conexión con el servidor.");
      setLoading(false);
    }
  }

  return (
    <div className="pk-panel-enter">
      {error && <div className="pk-alert pk-alert-error">{error}</div>}
      <form onSubmit={handleSubmit} noValidate>
        <div className="pk-group">
          <label className="pk-label" htmlFor="l-email">EMAIL</label>
          <div className="pk-input-wrap">
            <input className="pk-input" id="l-email" type="email"
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com" autoComplete="email" />
            <span className="pk-input-icon"><IconMail /></span>
          </div>
        </div>
        <div className="pk-group">
          <label className="pk-label" htmlFor="l-pass">CONTRASENA</label>
          <PasswordInput id="l-pass" value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" autoComplete="current-password" />
        </div>
        <button type="submit" className="pk-btn" disabled={loading}>
          {loading ? <><span className="pk-spinner" /> CARGANDO...</> : "INICIAR SESION"}
        </button>
      </form>
      <button type="button" className="pk-link-btn" onClick={onSwitch}>
        NUEVA CUENTA &gt;
      </button>
    </div>
  );
}

function RegisterPanel({ onSwitch }) {
    const [username, setUsername] = useState("");
    const [email, setEmail]       = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm]   = useState("");
    const [error, setError]       = useState("");
    const [success, setSuccess]   = useState(false);
    const [loading, setLoading]   = useState(false);

    async function comprobarUsuario() {
        try{
            //Obtención de los usuarios
            const response = await fetch ("http://127.0.0.1:8000/users");
            const data = await response.json();

            //Comprobar si existe el mail
            let mailEncontrado = false;

            data.map(function(usuario){
                
                if(usuario.email == email){
                   mailEncontrado = true;
                }
            })

            return mailEncontrado;

        } catch (error){
            setError(error);
        }
    }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !email || !password || !confirm) { 
        setError("Completa todos los campos.");        
        return; 
    }

    if (username.length < 3){ 
        setError("Usuario: minimo 3 caracteres.");    
        return; 
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ 
        setError("Email no valido.");                  
        return; 
    }

    if(await comprobarUsuario()){
        setError("Email ya en uso");
        return;
    }

    if (password.length < 8){ 
        setError("Contrasena: minimo 8 caracteres."); 
        return; 
    }

    if (password !== confirm){ 
        setError("Las contrasenas no coinciden.");     
        return; 
    }

    setLoading(true);

    await fetch("http://127.0.0.1:8000/auth/register", { 
        method:"POST", 
        headers:{"Content-Type":"application/json"}, 
        body: JSON.stringify({ 
            "nombre": username, 
            "email": email,
            "avatar": null,
            "rol": "usuario",
            "dinero": 0,
            "estado": "activo",
            "clave": password }) 
    });

    await new Promise(r => setTimeout(r, 1400));
    setLoading(false);
    setSuccess(true);
    setTimeout(() => { setSuccess(false); onSwitch(); }, 2000);
  };

  if (success) {
    return (
      <div className="pk-panel-enter">
        <div className="pk-alert pk-alert-success">CUENTA CREADA!{"\n"}BIENVENIDO, ENTRENADOR!</div>
      </div>
    );
  }

  return (
    <div className="pk-panel-enter">
      {error && <div className="pk-alert pk-alert-error">{error}</div>}
      <form onSubmit={handleSubmit} noValidate>
        <div className="pk-group">
          <label className="pk-label" htmlFor="r-user">USUARIO</label>
          <div className="pk-input-wrap">
            <input className="pk-input" id="r-user" type="text"
              value={username} onChange={e => setUsername(e.target.value)}
              placeholder="AshKetchum99" autoComplete="username" />
            <span className="pk-input-icon"><IconUser /></span>
          </div>
        </div>
        <div className="pk-group">
          <label className="pk-label" htmlFor="r-email">EMAIL</label>
          <div className="pk-input-wrap">
            <input className="pk-input" id="r-email" type="email"
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com" autoComplete="email" />
            <span className="pk-input-icon"><IconMail /></span>
          </div>
        </div>
        <div className="pk-group">
          <label className="pk-label" htmlFor="r-pass">CONTRASEÑA</label>
          <PasswordInput id="r-pass" value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Minimo 8 caracteres" autoComplete="new-password" />
          <StrengthBar password={password} />
        </div>
        <div className="pk-group">
          <label className="pk-label" htmlFor="r-confirm">CONFIRMAR</label>
          <PasswordInput id="r-confirm" value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Repite la contrasena" autoComplete="new-password" />
        </div>
        <button type="submit" className="pk-btn" disabled={loading}>
          {loading ? <><span className="pk-spinner" /> REGISTRANDO...</> : "REGISTRARSE"}
        </button>
      </form>
      <button type="button" className="pk-link-btn" onClick={onSwitch}>
        &lt; YA TENGO CUENTA
      </button>
    </div>
  );
}

export default function AuthPanel() {
  const [tab, setTab] = useState("login");
  return (
    <>
        <BarraSuperior></BarraSuperior>
    <div className="pk-page">
      <div className="pk-card">
        <div className="pk-tabs" role="tablist">
          <button className={`pk-tab${tab === "login" ? " active" : ""}`}
            role="tab" aria-selected={tab === "login"} onClick={() => setTab("login")}>
            {"INICIAR\nSESION"}
          </button>
          <button className={`pk-tab${tab === "register" ? " active" : ""}`}
            role="tab" aria-selected={tab === "register"} onClick={() => setTab("register")}>
            REGISTRO
          </button>
        </div>
        <div className="pk-body">
          <div className="pk-logo">
            <PokeballSVG />
            <span className="pk-logo-title">POKEHUB</span>
            <span className="pk-logo-sub">ENCICLOPEDIA POKEMON</span>
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