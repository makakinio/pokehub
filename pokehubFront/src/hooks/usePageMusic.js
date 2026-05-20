import { useEffect, useRef } from "react";

/**
 * Hook de música de fondo por página.
 * - Lee la preferencia "musica_activa" de localStorage al montar.
 * - Escucha el evento global "musica-update" para activar/desactivar en tiempo real.
 * - Intenta autoplay; si el navegador lo bloquea espera la primera interacción.
 * - Limpia el audio al desmontar (al navegar a otra página).
 *
 * @param {string} rutaAudio  URL del archivo de audio (importado con Vite)
 * @returns {{ pause: Function, resume: Function }}
 */
export function usePageMusic(rutaAudio) {
  // Referencia al elemento Audio para poder pausar/reanudar desde fuera del efecto
  const refAudio = useRef(null);

  useEffect(() => {
    // Leer preferencia guardada (default: true si no existe la clave)
    const musicaEstaActiva = () => localStorage.getItem("musica_activa") !== "false";

    const elementoAudio = new Audio(rutaAudio);
    elementoAudio.loop   = true;
    elementoAudio.volume = 0.1;
    refAudio.current = elementoAudio;

    if (musicaEstaActiva()) {
      // Intentar reproducir directamente; si el navegador bloquea el autoplay
      // esperamos a la primera interacción del usuario para iniciarlo
      elementoAudio.play().catch(() => {
        const alInteractuar = () => {
          if (musicaEstaActiva()) elementoAudio.play().catch(() => {});
          document.removeEventListener("click",   alInteractuar);
          document.removeEventListener("keydown", alInteractuar);
        };
        document.addEventListener("click",   alInteractuar);
        document.addEventListener("keydown", alInteractuar);
      });
    }

    // Escuchar el evento que dispara el modal de ajustes al guardar la config
    function alCambiarMusica(evento) {
      if (evento.detail?.musica) {
        elementoAudio.play().catch(() => {});
      } else {
        elementoAudio.pause();
      }
    }
    window.addEventListener("musica-update", alCambiarMusica);

    return () => {
      elementoAudio.pause();
      elementoAudio.src = "";
      window.removeEventListener("musica-update", alCambiarMusica);
    };
  }, [rutaAudio]);

  return {
    /** Pausa la música (p. ej. al abrir el modal de captura) */
    pause: () => refAudio.current?.pause(),

    /** Reanuda la música solo si el usuario no la tiene desactivada en ajustes */
    resume: () => {
      if (localStorage.getItem("musica_activa") !== "false") {
        refAudio.current?.play().catch(() => {});
      }
    },
  };
}
