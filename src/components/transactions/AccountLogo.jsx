/**
 * AccountLogo - Display account/institution logo
 * Shows logo_url as 32x32px image with fallback to emoji icon
 */
export default function AccountLogo({ logoUrl, icon, bgColor = "#FF6A00" }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt="Logo"
        className="w-8 h-8 rounded-full object-contain bg-white"
      />
    );
  }

  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-base font-semibold text-white flex-shrink-0"
      style={{ backgroundColor: bgColor }}
    >
      {icon || "🏦"}
    </div>
  );
}