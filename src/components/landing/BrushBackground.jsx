// Radial gradient overlay tanpa CSS `filter: blur` (yg bikin lag di mobile).
// Gradient sudah punya soft falloff alami, jadi hasil visual mirip tapi GPU-friendly.
export default function BrushBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0, willChange: "auto" }}>
      <div
        className="absolute"
        style={{
          top: "-10%",
          left: "-15%",
          width: "70vw",
          height: "55vh",
          background: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(255,106,0,0.22) 0%, rgba(255,106,0,0.08) 40%, transparent 70%)",
          transform: "rotate(-18deg) translateZ(0)"
        }} />
      <div
        className="absolute"
        style={{
          top: "25%",
          right: "-20%",
          width: "65vw",
          height: "50vh",
          background: "radial-gradient(ellipse 55% 45% at 50% 50%, rgba(255,179,71,0.18) 0%, rgba(255,106,0,0.06) 45%, transparent 75%)",
          transform: "rotate(15deg) translateZ(0)"
        }} />
      <div
        className="absolute"
        style={{
          bottom: "-10%",
          left: "10%",
          width: "60vw",
          height: "45vh",
          background: "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(255,106,0,0.14) 0%, rgba(255,106,0,0.04) 50%, transparent 80%)",
          transform: "rotate(-8deg) translateZ(0)"
        }} />
    </div>
  );
}