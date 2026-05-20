import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, configUsuariosApi } from "../api/api.js";

/* ── Toggle switch accesible ── */
function Toggle({ value, onChange, label }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[0.75rem] text-white/70 tracking-[0.03em]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className="relative w-12 h-6 rounded-full border-none cursor-pointer transition-all duration-200 flex-shrink-0"
        style={{
          background: value ? "linear-gradient(135deg,#e3000b,#b50009)" : "rgba(255,255,255,0.12)",
          boxShadow: value ? "0 0 12px rgba(227,0,11,0.4)" : "none",
        }}
      >
        <span
          className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white transition-all duration-200"
          style={{ left: value ? "calc(100% - 21px)" : "3px", boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
        />
      </button>
    </div>
  );
}

/* ── Mensaje de feedback (éxito / error) ── */
function Feedback({ msg, tipo }) {
  if (!msg) return null;
  return (
    <p
      className="text-[0.7rem] leading-[1.7] text-center px-3 py-2 rounded-xl"
      style={{
        color: tipo === "ok" ? "#4ade80" : "#f87171",
        background: tipo === "ok" ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)",
        border: `1px solid ${tipo === "ok" ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)"}`,
      }}
    >
      {msg}
    </p>
  );
}

/* ── Separador ── */
function Sep() {
  return <div className="h-px w-full" style={{ background: "rgba(255,255,255,0.07)" }} />;
}

export default function ModalConfiguracion({ isOpen, onClose, userName, userEmail, userId }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("perfil");

  /* Perfil */
  const [nombre,          setNombre]          = useState("");
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [msgPerfil,       setMsgPerfil]       = useState(null); // { text, tipo }

  /* Seguridad */
  const [passActual,      setPassActual]      = useState("");
  const [passNuevo,       setPassNuevo]       = useState("");
  const [passConfirm,     setPassConfirm]     = useState("");
  const [guardandoPass,   setGuardandoPass]   = useState(false);
  const [msgPass,         setMsgPass]         = useState(null);
  const [showPassActual,  setShowPassActual]  = useState(false);
  const [showPassNuevo,   setShowPassNuevo]   = useState(false);

  /* Accesibilidad */
  const [config,          setConfig]          = useState(null);
  const [guardandoConf,   setGuardandoConf]   = useState(false);
  const [msgConf,         setMsgConf]         = useState(null);

  /* Resetear al abrir */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isOpen) return;
    setTab("perfil");
    setNombre(userName || "");
    setMsgPerfil(null);
    setPassActual(""); setPassNuevo(""); setPassConfirm("");
    setMsgPass(null);
    setMsgConf(null);
    if (userId) {
      configUsuariosApi.getByUsuario(userId)
        .then(c => {
          setConfig(c);
          // Sincronizar preferencia de música con localStorage al abrir ajustes
          localStorage.setItem("musica_activa", String(c.musica));
          localStorage.setItem("sonido_activo", String(c.sonido));
        })
        .catch(async () => {
          // No existe config → crearla con valores por defecto vía upsert
          const defaults = { idioma: "esp", musica: true, sonido: true };
          try {
            const creada = await configUsuariosApi.update(userId, defaults);
            setConfig(creada);
            localStorage.setItem("musica_activa", String(creada.musica));
            localStorage.setItem("sonido_activo", String(creada.sonido));
          } catch {
            // Servidor no disponible: usar defaults solo en memoria
            setConfig(defaults);
          }
        });
    }
  }, [isOpen, userId, userName]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!isOpen) return null;

  /* ── Acciones ── */
  async function guardarPerfil(e) {
    e.preventDefault();
    if (!nombre.trim()) { setMsgPerfil({ text: "El nombre no puede estar vacío.", tipo: "err" }); return; }
    setGuardandoPerfil(true); setMsgPerfil(null);
    try {
      await authApi.updatePerfil(nombre.trim());
      setMsgPerfil({ text: "✓ Nombre actualizado correctamente.", tipo: "ok" });
    } catch (err) {
      setMsgPerfil({ text: err.message ?? "Error al guardar.", tipo: "err" });
    } finally {
      setGuardandoPerfil(false);
    }
  }

  async function cambiarPassword(e) {
    e.preventDefault();
    if (!passActual)          { setMsgPass({ text: "Introduce tu contraseña actual.", tipo: "err" }); return; }
    if (passNuevo.length < 6) { setMsgPass({ text: "La nueva contraseña debe tener al menos 6 caracteres.", tipo: "err" }); return; }
    if (passNuevo !== passConfirm) { setMsgPass({ text: "Las contraseñas nuevas no coinciden.", tipo: "err" }); return; }
    setGuardandoPass(true); setMsgPass(null);
    try {
      await authApi.updatePassword(passActual, passNuevo);
      setMsgPass({ text: "✓ Contraseña actualizada. Vuelve a iniciar sesión.", tipo: "ok" });
      setPassActual(""); setPassNuevo(""); setPassConfirm("");
    } catch (err) {
      setMsgPass({ text: err.message ?? "Error al cambiar contraseña.", tipo: "err" });
    } finally {
      setGuardandoPass(false);
    }
  }

  async function guardarConfig(e) {
    e.preventDefault();
    if (!config || !userId) return;
    setGuardandoConf(true); setMsgConf(null);
    try {
      const updated = await configUsuariosApi.update(userId, {
        idioma: config.idioma,
        musica: config.musica,
        sonido: config.sonido,
      });
      setConfig(updated);
      // Persistir preferencia y notificar al hook de música en tiempo real
      localStorage.setItem("musica_activa",  String(updated.musica));
      localStorage.setItem("sonido_activo", String(updated.sonido));
      window.dispatchEvent(new CustomEvent("musica-update", { detail: { musica: updated.musica } }));
      setMsgConf({ text: "✓ Configuración guardada.", tipo: "ok" });
    } catch (err) {
      setMsgConf({ text: err.message ?? "Error al guardar.", tipo: "err" });
    } finally {
      setGuardandoConf(false);
    }
  }

  function cerrarSesion() {
    localStorage.removeItem("access_token");
    onClose();
    navigate("/login", { replace: true });
  }

  /* ── Tabs ── */
  const TABS = [
    { id: "perfil",         label: "👤 Perfil" },
    { id: "seguridad",      label: "🔒 Seguridad" },
    { id: "accesibilidad",  label: "♿ Accesibilidad" },
  ];

  const inputCls = "w-full bg-white/[0.06] border-[2px] border-white/15 rounded-2xl px-5 py-3.5 text-white text-[0.82rem] outline-none focus:border-[rgba(255,203,5,0.5)] transition-colors placeholder:text-white/25 tracking-[0.03em]";
  const btnPrimary = "w-full py-4 rounded-2xl text-[0.82rem] tracking-[0.05em] border-none cursor-pointer transition-all disabled:opacity-35 disabled:cursor-not-allowed";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-[520px] max-h-[90vh] flex flex-col rounded-3xl overflow-hidden pk-card-in"
        style={{
          background: "rgba(6,0,12,0.98)",
          border: "2.5px solid rgba(227,0,11,0.35)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.9), 0 0 60px rgba(227,0,11,0.07)",
        }}
      >
        {/* ── Cabecera ── */}
        <div
          className="flex items-center justify-between px-7 pt-7 pb-5 shrink-0"
          style={{ borderBottom: "1.5px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-[1.4rem] font-bold text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#e3000b,#7a0000)", border: "2px solid rgba(255,203,5,0.5)" }}
            >
              {(userName || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-[0.95rem] text-white tracking-[0.04em] leading-[1.4]">{userName || "Entrenador"}</p>
              {userEmail && (
                <p className="text-[0.6rem] text-white/35 tracking-[0.03em] mt-0.5">{userEmail}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all text-[1.1rem] cursor-pointer border-none bg-transparent flex-shrink-0"
          >
            ✕
          </button>
        </div>

        {/* ── Tabs ── */}
        <div
          className="flex shrink-0 px-5 pt-4 gap-1"
          style={{ borderBottom: "1.5px solid rgba(255,255,255,0.07)" }}
        >
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 pb-3.5 text-[0.65rem] tracking-[0.05em] border-none bg-transparent cursor-pointer transition-all relative whitespace-nowrap"
              style={{ color: tab === t.id ? "#ffcb05" : "rgba(255,255,255,0.4)" }}
            >
              {t.label}
              {tab === t.id && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full" style={{ background: "#ffcb05" }} />
              )}
            </button>
          ))}
        </div>

        {/* ── Contenido scrollable ── */}
        <div className="flex-1 overflow-y-auto px-7 py-6">

          {/* ──── PERFIL ──── */}
          {tab === "perfil" && (
            <form onSubmit={guardarPerfil} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[0.65rem] text-white/45 tracking-[0.07em]">NOMBRE</label>
                <input
                  type="text"
                  value={nombre}
                  maxLength={40}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Tu nombre de entrenador"
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[0.65rem] text-white/45 tracking-[0.07em]">EMAIL</label>
                <input
                  type="email"
                  value={userEmail || ""}
                  readOnly
                  className={`${inputCls} opacity-45 cursor-not-allowed`}
                  title="El email no se puede cambiar"
                />
              </div>
              <Feedback msg={msgPerfil?.text} tipo={msgPerfil?.tipo} />
              <button
                type="submit"
                disabled={guardandoPerfil}
                className={btnPrimary}
                style={{ background: "linear-gradient(135deg,#e3000b,#b50009)", color: "#fff", boxShadow: "0 4px 16px rgba(227,0,11,0.35)" }}
              >
                {guardandoPerfil ? <span className="flex items-center justify-center gap-2"><span className="pk-spinner" />Guardando…</span> : "Guardar cambios"}
              </button>
            </form>
          )}

          {/* ──── SEGURIDAD ──── */}
          {tab === "seguridad" && (
            <form onSubmit={cambiarPassword} className="flex flex-col gap-5">
              <p className="text-[0.7rem] text-white/40 leading-[1.8] text-center">
                Cambia tu contraseña de acceso
              </p>
              <Sep />
              {[
                { label: "CONTRASEÑA ACTUAL", val: passActual, set: setPassActual, show: showPassActual, setShow: setShowPassActual },
                { label: "NUEVA CONTRASEÑA",  val: passNuevo,  set: setPassNuevo,  show: showPassNuevo,  setShow: setShowPassNuevo },
                { label: "CONFIRMAR NUEVA",   val: passConfirm, set: setPassConfirm, show: showPassNuevo, setShow: () => {} },
              ].map(({ label, val, set, show, setShow }, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <label className="text-[0.65rem] text-white/45 tracking-[0.07em]">{label}</label>
                  <div className="relative">
                    <input
                      type={show ? "text" : "password"}
                      value={val}
                      onChange={e => set(e.target.value)}
                      placeholder="••••••••"
                      className={`${inputCls} pr-12`}
                    />
                    {i < 2 && (
                      <button
                        type="button"
                        onClick={() => setShow(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/70 bg-transparent border-none cursor-pointer text-[0.9rem]"
                      >
                        {show ? "🙈" : "👁️"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <Feedback msg={msgPass?.text} tipo={msgPass?.tipo} />
              <button
                type="submit"
                disabled={guardandoPass}
                className={btnPrimary}
                style={{ background: "linear-gradient(135deg,#e3000b,#b50009)", color: "#fff", boxShadow: "0 4px 16px rgba(227,0,11,0.35)" }}
              >
                {guardandoPass ? <span className="flex items-center justify-center gap-2"><span className="pk-spinner" />Cambiando…</span> : "🔒 Cambiar contraseña"}
              </button>
            </form>
          )}

          {/* ──── ACCESIBILIDAD ──── */}
          {tab === "accesibilidad" && (
            <form onSubmit={guardarConfig} className="flex flex-col gap-6">
              {!config ? (
                <div className="flex flex-col gap-4">
                  {[0,1,2].map(i => <div key={i} className="skel" style={{ height: 44, borderRadius: 12 }} />)}
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-[0.65rem] text-white/45 tracking-[0.07em]">IDIOMA</label>
                    <div className="flex items-center justify-between w-full bg-white/[0.04] border-[2px] border-white/10 rounded-2xl px-5 py-3.5">
                      <span className="text-[0.82rem] text-white/40 tracking-[0.03em]">🌐 Selección de idioma</span>
                      <span className="text-[0.6rem] tracking-[0.08em] px-2.5 py-1 rounded-full" style={{ background: "rgba(255,203,5,0.1)", color: "#ffcb05", border: "1px solid rgba(255,203,5,0.3)" }}>
                        PRÓXIMAMENTE
                      </span>
                    </div>
                  </div>

                  <Sep />

                  <div className="flex flex-col gap-5">
                    <Toggle
                      label="🎵 Música de fondo"
                      value={config.musica}
                      onChange={v => setConfig(c => ({ ...c, musica: v }))}
                    />
                    <Toggle
                      label="🔊 Efectos de sonido"
                      value={config.sonido}
                      onChange={v => setConfig(c => ({ ...c, sonido: v }))}
                    />
                  </div>

                  <Feedback msg={msgConf?.text} tipo={msgConf?.tipo} />
                  <button
                    type="submit"
                    disabled={guardandoConf}
                    className={btnPrimary}
                    style={{ background: "linear-gradient(135deg,#e3000b,#b50009)", color: "#fff", boxShadow: "0 4px 16px rgba(227,0,11,0.35)" }}
                  >
                    {guardandoConf ? <span className="flex items-center justify-center gap-2"><span className="pk-spinner" />Guardando…</span> : "Guardar configuración"}
                  </button>
                </>
              )}
            </form>
          )}
        </div>

        {/* ── Footer: cerrar sesión ── */}
        <div
          className="px-7 py-5 shrink-0"
          style={{ borderTop: "1.5px solid rgba(255,255,255,0.07)" }}
        >
          <button
            onClick={cerrarSesion}
            className="w-full py-4 rounded-2xl text-[0.85rem] tracking-[0.05em] border-[2px] cursor-pointer transition-all"
            style={{
              background: "rgba(227,0,11,0.08)",
              borderColor: "rgba(227,0,11,0.4)",
              color: "#ff4444",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(227,0,11,0.2)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(227,0,11,0.08)"; }}
          >
            🚪 Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
