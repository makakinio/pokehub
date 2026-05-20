import { useEffect } from "react";
import sonidoClick from "../assets/audio/sonidos/click.mp3";

/**
 * Hook global de efecto de click.
 * Añade un listener en el documento que reproduce el sonido cada vez
 * que el usuario hace click en un elemento interactivo (button, [role="button"],
 * select, input tipo checkbox/radio).
 * Respeta la preferencia "sonido_activo" de localStorage.
 */
export function useEfectoClick() {
  useEffect(() => {
    function manejarClick(evento) {
      // Sólo reproducir si los efectos de sonido están activos
      if (localStorage.getItem("sonido_activo") === "false") return;

      // Comprobar si el elemento clickado (o algún ancestro) es interactivo
      const objetivo = evento.target.closest(
        'button, [role="button"], select, input[type="checkbox"], input[type="radio"]'
      );
      if (!objetivo || objetivo.disabled) return;

      // Crear nueva instancia cada vez para permitir solapamiento de sonidos
      const audio = new Audio(sonidoClick);
      audio.volume = 0.4;
      audio.play().catch(() => {});
    }

    document.addEventListener("click", manejarClick);
    return () => document.removeEventListener("click", manejarClick);
  }, []);
}
