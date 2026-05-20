import { useEffect, useRef, useState } from "react";
import BarraSuperior from "../components/barraSuperior.jsx";
import { authApi, chatApi, mediaUrl } from "../api/api.js";
import { usePageMusic } from "../hooks/usePageMusic.js";
import temaPrincipalMusic from "../assets/audio/temas/temaPrincipal.mp3";

/* ── Avatar con inicial o imagen ── */
function AvatarUsuario({ nombre, avatar, size = 36 }) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 overflow-hidden"
      style={{
        width: size, height: size,
        background: avatar ? "transparent" : "linear-gradient(135deg,#e3000b,#7a0000)",
        border: "2px solid rgba(255,203,5,0.4)",
        fontSize: size * 0.42,
      }}
    >
      {avatar
        ? <img src={mediaUrl(avatar)} alt={nombre} className="w-full h-full object-cover" />
        : (nombre?.[0] ?? "?").toUpperCase()
      }
    </div>
  );
}

/* ── Burbuja de mensaje ── */
function BurbujaMensaje({ msg, esPropio }) {
  const hora = new Date(msg.fecha).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`flex items-end gap-2.5 max-w-[78%] ${esPropio ? "flex-row-reverse self-end" : "self-start"}`}>
      {!esPropio && <AvatarUsuario nombre={msg.nombre} avatar={msg.avatar} size={34} />}

      <div className={`flex flex-col gap-1 ${esPropio ? "items-end" : "items-start"}`}>
        {!esPropio && (
          <span className="text-[0.6rem] text-white/40 px-1 tracking-[0.04em]">{msg.nombre}</span>
        )}
        <div
          className="px-4 py-2.5 rounded-2xl text-[0.82rem] leading-[1.7] tracking-[0.02em] break-words"
          style={esPropio
            ? { background: "linear-gradient(135deg,#e3000b,#b50009)", color: "#fff", borderBottomRightRadius: 4, boxShadow: "0 3px 12px rgba(227,0,11,0.35)" }
            : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.88)", borderBottomLeftRadius: 4, border: "1px solid rgba(255,255,255,0.1)" }
          }
        >
          {msg.mensaje}
        </div>
        <span className="text-[0.55rem] text-white/25 px-1">{hora}</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL DEL CHAT
══════════════════════════════════════════════════════════ */
export default function Chat() {
  usePageMusic(temaPrincipalMusic);

  const [usuario,    setUsuario]    = useState(null);
  const [mensajes,   setMensajes]   = useState([]);
  const [texto,      setTexto]      = useState("");
  const [conectado,  setConectado]  = useState(false);
  const [error,      setError]      = useState("");

  const wsRef          = useRef(null);   // referencia al WebSocket
  const listaMensajes  = useRef(null);  // ref al contenedor para auto-scroll
  const inputRef       = useRef(null);

  /* ── Cargar usuario e historial, luego abrir WebSocket ── */
  useEffect(() => {
    let ws;

    async function iniciar() {
      try {
        const me = await authApi.getUsuarioActual();
        setUsuario(me);

        // Cargar historial antes de conectar
        const historial = await chatApi.getHistorial(50);
        setMensajes(historial);

        // Abrir WebSocket
        ws = new WebSocket(chatApi.wsUrl());
        wsRef.current = ws;

        ws.onopen  = () => setConectado(true);
        ws.onclose = () => setConectado(false);
        ws.onerror = () => setError("Error de conexión con el chat.");

        ws.onmessage = (evento) => {
          const msg = JSON.parse(evento.data);
          setMensajes(prev => [...prev, msg]);
        };
      } catch {
        setError("No se pudo conectar al chat.");
      }
    }

    iniciar();

    return () => {
      ws?.close();
    };
  }, []);

  /* ── Auto-scroll al llegar nuevo mensaje ── */
  useEffect(() => {
    if (listaMensajes.current) {
      listaMensajes.current.scrollTop = listaMensajes.current.scrollHeight;
    }
  }, [mensajes]);

  /* ── Enviar mensaje ── */
  function enviar(e) {
    e?.preventDefault();
    const textoLimpio = texto.trim();
    if (!textoLimpio || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(textoLimpio);
    setTexto("");
    inputRef.current?.focus();
  }

  /* ── Enviar con Enter (Shift+Enter = salto de línea) ── */
  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  }

  return (
    <>
      <BarraSuperior />
      <div className="flex flex-col w-full bg-black/55" style={{ height: "calc(100vh - 4.5rem - 0.75rem)" }}>

        {/* ── Cabecera ── */}
        <div
          className="flex items-center gap-4 px-6 py-4 flex-shrink-0"
          style={{ borderBottom: "1.5px solid rgba(255,255,255,0.08)", background: "rgba(4,0,8,0.92)" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">💬</span>
            <div>
              <h1 className="text-[1rem] text-white tracking-[0.05em]">Chat Global</h1>
              <p className="text-[0.62rem] text-white/35 tracking-[0.04em] mt-0.5">
                {conectado ? "● Conectado" : "○ Desconectado"}
              </p>
            </div>
          </div>
          <div
            className="ml-auto w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: conectado ? "#22c55e" : "#ef4444", boxShadow: conectado ? "0 0 8px #22c55e" : "none" }}
          />
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="px-6 py-3 text-[0.75rem] text-red-400 bg-red-500/10 border-b border-red-500/20">
            ⚠️ {error}
          </div>
        )}

        {/* ── Lista de mensajes ── */}
        <div
          ref={listaMensajes}
          className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-3"
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(227,0,11,0.3) transparent" }}
        >
          {mensajes.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[0.75rem] text-white/25 tracking-[0.06em]">
                Sé el primero en escribir algo…
              </p>
            </div>
          )}
          {mensajes.map(msg => (
            <BurbujaMensaje
              key={msg.id}
              msg={msg}
              esPropio={msg.id_usuario === usuario?.id}
            />
          ))}
        </div>

        {/* ── Input de mensaje ── */}
        <form
          onSubmit={enviar}
          className="flex items-end gap-3 px-4 py-4 flex-shrink-0"
          style={{ borderTop: "1.5px solid rgba(255,255,255,0.08)", background: "rgba(4,0,8,0.92)" }}
        >
          {usuario && <AvatarUsuario nombre={usuario.nombre} avatar={usuario.avatar} size={38} />}

          <textarea
            ref={inputRef}
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Escribe un mensaje… (Enter para enviar)"
            maxLength={500}
            rows={1}
            disabled={!conectado}
            className="flex-1 resize-none bg-white/[0.06] border-[2px] border-white/15 rounded-2xl px-4 py-3 text-white text-[0.82rem] outline-none placeholder:text-white/25 tracking-[0.02em] leading-[1.6] transition-colors focus:border-[rgba(227,0,11,0.5)] disabled:opacity-40"
            style={{ maxHeight: 120 }}
          />

          <button
            type="submit"
            disabled={!conectado || !texto.trim()}
            className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center border-none cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg,#e3000b,#b50009)", boxShadow: "0 4px 14px rgba(227,0,11,0.4)" }}
            aria-label="Enviar mensaje"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </form>
      </div>
    </>
  );
}
