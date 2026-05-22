//Central API

export const BASE_URL = "http://127.0.0.1:8000";

/** Construye la URL completa de un archivo de media del servidor */
export const mediaUrl = (path) => (path ? `${BASE_URL}${path}` : null);

function getHeaders(extra = {}) {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: getHeaders(options.headers),
  });

  if (res.status === 401) {
    localStorage.removeItem("access_token");
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Error ${res.status}`);
  }

  if (res.status === 204) return null;

  return res.json();
}

// ──────────────────────────────────────────────────────────
// API genérica (métodos HTTP básicos)
// Útil cuando ninguna función semántica se ajusta al caso.
// ──────────────────────────────────────────────────────────

export const api = {
  get:    (path)       => request(path, { method: "GET" }),
  post:   (path, body) => request(path, { method: "POST",  body: JSON.stringify(body) }),
  put:    (path, body) => request(path, { method: "PUT",   body: JSON.stringify(body) }),
  patch:  (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (path)       => request(path, { method: "DELETE" }),

  /** Login especial: usa form-urlencoded en vez de JSON */
  loginForm: (email, password) =>
    fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username: email, password }),
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? "Credenciales incorrectas.");
      }
      return res.json();
    }),
};

// Endpoints por recurso

// ── /auth ─────────────────────────────────────────────────
export const authApi = {
  /** POST /auth/register — Registra un nuevo usuario */
  register: (data) => api.post("/auth/register", data),

  /** POST /auth/login — Login con email y contraseña */
  login: (email, password) => api.loginForm(email, password),

  /** GET /auth/me — Devuelve el usuario autenticado actual */
  me: () => api.get("/auth/me"),

  /**
   * GET /auth/me — Obtiene el usuario autenticado a partir del token
   * almacenado en localStorage. No guarda nada: cada llamada consulta
   * al servidor para garantizar datos siempre actualizados y evitar
   * exponer datos de usuario en localStorage.
   */
  getUsuarioActual: () => api.get("/auth/me"),

  /**
   * PATCH /auth/me/dinero — Actualiza el saldo del usuario autenticado.
   * Emite un evento global 'saldo-update' para que la navbar refresque.
   */
  updateDinero: async (dinero) => {
    const result = await api.patch("/auth/me/dinero", { dinero });
    window.dispatchEvent(new CustomEvent("saldo-update", { detail: { dinero: result.dinero } }));
    return result;
  },

  /** PATCH /auth/me/perfil — Actualiza el nombre del usuario autenticado */
  updatePerfil: (nombre) => api.patch("/auth/me/perfil", { nombre }),

  /** PATCH /auth/me/password — Cambia la contraseña del usuario autenticado */
  updatePassword: (password_actual, password_nuevo) =>
    api.patch("/auth/me/password", { password_actual, password_nuevo }),

  /** POST /auth/enviar-verificacion — Envía OTP al email para verificar la cuenta */
  enviarVerificacion: () => api.post("/auth/enviar-verificacion", {}),

  /** POST /auth/verificar-email — Confirma el código OTP y marca la cuenta como verificada */
  verificarEmail: (codigo) => api.post("/auth/verificar-email", { codigo }),

  /** POST /auth/enviar-reset — Envía OTP al email para restablecer la contraseña */
  enviarReset: () => api.post("/auth/enviar-reset", {}),

  /** POST /auth/reset-password-otp — Verifica el OTP y establece la nueva contraseña */
  resetPasswordOtp: (codigo, password_nuevo) =>
    api.post("/auth/reset-password-otp", { codigo, password_nuevo }),

  /** POST /auth/enviar-reset-publico — Envía OTP sin necesitar token (desde login) */
  enviarResetPublico: (email) =>
    api.post("/auth/enviar-reset-publico", { email }),

  /** POST /auth/reset-password-publico — Restablece contraseña sin token */
  resetPasswordPublico: (email, codigo, password_nuevo) =>
    api.post("/auth/reset-password-publico", { email, codigo, password_nuevo }),
};

// ── /users ────────────────────────────────────────────────
export const usersApi = {
  /** GET /users/ — Lista todos los usuarios */
  getAll: () => api.get("/users/"),

  /** GET /users/{id} — Obtiene un usuario por su id */
  getById: (id) => api.get(`/users/${id}`),

  /** POST /users/ — Crea un usuario (sin hash de clave, usa /auth/register en su lugar) */
  create: (data) => api.post("/users/", data),

  /** PATCH /users/{id} — Actualiza estado (ban/unban), admin o dinero */
  update: (id, data) => api.patch(`/users/${id}`, data),
};

// ── /pokemon ──────────────────────────────────────────────
export const pokemonApi = {
  /** GET /pokemon/ — Lista todos los Pokémon */
  getAll: () => api.get("/pokemon/"),

  /** GET /pokemon/{id} — Obtiene un Pokémon por su id */
  getById: (id) => api.get(`/pokemon/${id}`),

  /** POST /pokemon/ — Crea un Pokémon */
  create: (data) => api.post("/pokemon/", data),
};

// ── /pokemon-usuarios ─────────────────────────────────────
export const pokemonUsuariosApi = {
  /** GET /pokemon-usuarios/ — Lista todas las relaciones pokémon-usuario */
  getAll: () => api.get("/pokemon-usuarios/"),

  /** GET /pokemon-usuarios/{id} — Obtiene una relación por su id */
  getById: (id) => api.get(`/pokemon-usuarios/${id}`),

  /** GET /pokemon-usuarios/usuario/{userId} — Pokémon capturados por un usuario */
  getByUsuario: (userId) => api.get(`/pokemon-usuarios/usuario/${userId}`),

  /** POST /pokemon-usuarios/ — Asigna un Pokémon a un usuario (captura) */
  create: (data) => api.post("/pokemon-usuarios/", data),
};

// ── /movimientos ──────────────────────────────────────────
export const movimientosApi = {
  /** GET /movimientos/ — Lista todos los movimientos */
  getAll: () => api.get("/movimientos/"),

  /** GET /movimientos/{id} — Obtiene un movimiento por su id */
  getById: (id) => api.get(`/movimientos/${id}`),

  /** POST /movimientos/ — Crea un movimiento */
  create: (data) => api.post("/movimientos/", data),
};

// ── /pokemon-movimientos ──────────────────────────────────
export const pokemonMovimientosApi = {
  /** GET /pokemon-movimientos/ — Lista todas las relaciones pokémon-movimiento */
  getAll: () => api.get("/pokemon-movimientos/"),

  /** GET /pokemon-movimientos/pokemon/{pokemonId} — Movimientos de un Pokémon concreto */
  getByPokemon: (pokemonId) => api.get(`/pokemon-movimientos/pokemon/${pokemonId}`),

  /** POST /pokemon-movimientos/ — Asocia un movimiento a un Pokémon */
  create: (data) => api.post("/pokemon-movimientos/", data),
};

// ── /movimientos-pokemon-usuario ──────────────────────────
export const movesetApi = {
  /** GET /movimientos-pokemon-usuario/ — Lista todos los movesets */
  getAll: () => api.get("/movimientos-pokemon-usuario/"),

  /** GET /movimientos-pokemon-usuario/{pokemonUsuarioId} — Moveset de un pokémon de usuario */
  getByPokemonUsuario: (pokemonUsuarioId) =>
    api.get(`/movimientos-pokemon-usuario/${pokemonUsuarioId}`),

  /** POST /movimientos-pokemon-usuario/ — Crea el moveset de un pokémon de usuario */
  create: (data) => api.post("/movimientos-pokemon-usuario/", data),
};

// ── /equipos ──────────────────────────────────────────────
export const equiposApi = {
  /** GET /equipos/ — Lista todos los equipos */
  getAll: () => api.get("/equipos/"),

  /** GET /equipos/{id} — Obtiene un equipo por su id */
  getById: (id) => api.get(`/equipos/${id}`),

  /** GET /equipos/usuario/{userId} — Equipo(s) de un usuario */
  getByUsuario: (userId) => api.get(`/equipos/usuario/${userId}`),

  /** POST /equipos/ — Crea un equipo */
  create: (data) => api.post("/equipos/", data),
};

// ── /categorias ───────────────────────────────────────────
export const categoriasApi = {
  /** GET /categorias/ — Lista todas las categorías */
  getAll: () => api.get("/categorias/"),

  /** GET /categorias/{id} — Obtiene una categoría por su id */
  getById: (id) => api.get(`/categorias/${id}`),

  /** POST /categorias/ — Crea una categoría */
  create: (data) => api.post("/categorias/", data),
};

// ── /productos ────────────────────────────────────────────
export const productosApi = {
  /** GET /productos/ — Lista todos los productos */
  getAll: () => api.get("/productos/"),

  /** GET /productos/{id} — Obtiene un producto por su id */
  getById: (id) => api.get(`/productos/${id}`),

  /** GET /productos/categoria/{categoriaId} — Productos de una categoría */
  getByCategoria: (categoriaId) => api.get(`/productos/categoria/${categoriaId}`),

  /** POST /productos/ — Crea un producto */
  create: (data) => api.post("/productos/", data),

  /** PATCH /productos/{id} — Actualiza nombre, descripcion o precio */
  update: (id, data) => api.patch(`/productos/${id}`, data),

  /** DELETE /productos/{id} — Elimina un producto */
  delete: (id) => api.delete(`/productos/${id}`),
};

// ── /inventario-usuario ───────────────────────────────────
export const inventarioApi = {
  /** GET /inventario-usuario/ — Lista todo el inventario */
  getAll: () => api.get("/inventario-usuario/"),

  /** GET /inventario-usuario/usuario/{userId} — Inventario de un usuario */
  getByUsuario: (userId) => api.get(`/inventario-usuario/usuario/${userId}`),

  /** POST /inventario-usuario/ — Añade un producto al inventario de un usuario */
  create: (data) => api.post("/inventario-usuario/", data),

  /** PATCH /inventario-usuario/{userId}/{productId} — Actualiza la cantidad de un item */
  updateCantidad: (userId, productId, cantidad) =>
    api.patch(`/inventario-usuario/${userId}/${productId}`, { cantidad }),
};

// ── /pedidos-tienda ───────────────────────────────────────
export const pedidosApi = {
  /** GET /pedidos-tienda/ — Lista todos los pedidos */
  getAll: () => api.get("/pedidos-tienda/"),

  /** GET /pedidos-tienda/{id} — Obtiene un pedido por su id */
  getById: (id) => api.get(`/pedidos-tienda/${id}`),

  /** GET /pedidos-tienda/usuario/{userId} — Pedidos de un usuario */
  getByUsuario: (userId) => api.get(`/pedidos-tienda/usuario/${userId}`),

  /** POST /pedidos-tienda/ — Crea un pedido */
  create: (data) => api.post("/pedidos-tienda/", data),
};

// ── /detalle-pedido ───────────────────────────────────────
export const detallePedidoApi = {
  /** GET /detalle-pedido/ — Lista todos los detalles de pedido */
  getAll: () => api.get("/detalle-pedido/"),

  /** GET /detalle-pedido/pedido/{pedidoId} — Detalles de un pedido concreto */
  getByPedido: (pedidoId) => api.get(`/detalle-pedido/pedido/${pedidoId}`),

  /** POST /detalle-pedido/ — Añade una línea al detalle de un pedido */
  create: (data) => api.post("/detalle-pedido/", data),
};

// ── /config-usuarios ──────────────────────────────────────
export const configUsuariosApi = {
  /** GET /config-usuarios/ — Lista toda la configuración de usuarios */
  getAll: () => api.get("/config-usuarios/"),

  /** GET /config-usuarios/{userId} — Configuración de un usuario concreto */
  getByUsuario: (userId) => api.get(`/config-usuarios/${userId}`),

  /** POST /config-usuarios/ — Crea la configuración de un usuario */
  create: (data) => api.post("/config-usuarios/", data),

  /** PATCH /config-usuarios/{userId} — Actualiza idioma/musica/sonido */
  update: (userId, data) => api.patch(`/config-usuarios/${userId}`, data),
};

// ── /chat ─────────────────────────────────────────────────
export const chatApi = {
  /** GET /chat/historial — Últimos N mensajes */
  getHistorial: (limite = 50) => api.get(`/chat/historial?limite=${limite}`),

  /** GET /chat/historial?desde_id=X — Solo mensajes nuevos (polling incremental) */
  getMensajesNuevos: (desdeId) => api.get(`/chat/historial?limite=50&desde_id=${desdeId}`),

  /** POST /chat/mensaje — Envía un mensaje */
  enviarMensaje: (mensaje) => api.post("/chat/mensaje", { mensaje }),
};
