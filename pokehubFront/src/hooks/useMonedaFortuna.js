import { useState, useEffect } from "react";
import { authApi, productosApi, inventarioApi } from "../api/api.js";

/**
 * Devuelve si el usuario tiene la Moneda Fortuna activa en su inventario.
 * Usado en los minijuegos para aplicar el multiplicador ×1.5 de ganancias.
 */
export function useMonedaFortuna() {
  const [activa,   setActiva]   = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      try {
        const user = await authApi.getUsuarioActual();
        const [productos, inv] = await Promise.all([
          productosApi.getAll(),
          inventarioApi.getByUsuario(user.id),
        ]);
        if (cancelado) return;
        const mf = productos.find(p => p.nombre.toLowerCase().includes("moneda"));
        if (mf) {
          const item = inv.find(i => i.id_producto === mf.id);
          setActiva((item?.cantidad ?? 0) > 0);
        }
      } catch { /* silencioso */ }
      finally { if (!cancelado) setCargando(false); }
    }

    cargar();
    return () => { cancelado = true; };
  }, []);

  return { monedaFortuna: activa, cargandoMoneda: cargando };
}
