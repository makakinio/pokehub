export default function PokeBallSVG({ size = 40 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-label="Pokéball"
      role="img"
    >
      {/* Mitad superior — roja */}
      <path d="M 10,50 A 40,40 0 0,1 90,50 Z" fill="#e3000b" />

      {/* Mitad inferior — blanca */}
      <path d="M 10,50 A 40,40 0 0,0 90,50 Z" fill="#ffffff" />

      {/* Línea horizontal central */}
      <line x1="10" y1="50" x2="90" y2="50" stroke="#1a0a0a" strokeWidth="5" />

      {/* Botón central — aro exterior */}
      <circle cx="50" cy="50" r="13" fill="#1a0a0a" />

      {/* Botón central — aro blanco */}
      <circle cx="50" cy="50" r="9" fill="#ffffff" />

      {/* Botón central — núcleo */}
      <circle cx="50" cy="50" r="5" fill="#e8e0e0" />

      {/* Borde exterior */}
      <circle cx="50" cy="50" r="40" fill="none" stroke="#1a0a0a" strokeWidth="5" />
    </svg>
  );
}