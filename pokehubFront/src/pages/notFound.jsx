import { usePageMusic } from "../hooks/usePageMusic.js";
import temaPrincipalMusic from "../assets/audio/temas/temaPrincipal.mp3";

function NotFound() {
  usePageMusic(temaPrincipalMusic);

  return (
    <>
      <h1>ERROR</h1>
      <br />
      <h1>PÁGINA NO ENCONTRADA</h1>
    </>
  );
}

export default NotFound;
