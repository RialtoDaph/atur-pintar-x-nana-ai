export default function Avatar({ email, size = 7 }) {
  const colors = ["#F97316", "#4F7CFF", "#22C55E", "#A855F7", "#EC4899", "#14B8A6"];
  const colorIdx = email ? email.charCodeAt(0) % colors.length : 0;
  const px = size * 4;
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ width: px, height: px, backgroundColor: colors[colorIdx], fontSize: size <= 6 ? 10 : 12 }}>
      {email ? email[0].toUpperCase() : "?"}
    </div>
  );
}