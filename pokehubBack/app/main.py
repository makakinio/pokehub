from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.routers import (
    users,
    auth,
    pokemon,
    movimientos,
    pokemon_movimientos,
    pokemon_usuarios,
    movimientos_pokemon_usuario,
    equipos,
    categorias,
    productos,
    inventario_usuario,
    pedidos_tienda,
    detalle_pedido,
    config_usuarios,
    chat,
)



app = FastAPI(title="PokeHub API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parents[1]
MEDIA_DIR = BASE_DIR / "media"

app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")

app.include_router(users.router)
app.include_router(auth.router)
app.include_router(pokemon.router)
app.include_router(movimientos.router)
app.include_router(pokemon_movimientos.router)
app.include_router(pokemon_usuarios.router)
app.include_router(movimientos_pokemon_usuario.router)
app.include_router(equipos.router)
app.include_router(categorias.router)
app.include_router(productos.router)
app.include_router(inventario_usuario.router)
app.include_router(pedidos_tienda.router)
app.include_router(detalle_pedido.router)
app.include_router(config_usuarios.router)
app.include_router(chat.router)


@app.get("/")
def root():
    return {"message": "PokeHub API funcionando"}