/**
 * AccountLogo - Simple logo display
 * Shows logo_url directly, no fallback complexity
 */
export default function AccountLogo({ logoUrl, size = "w-8 h-8" }) {
  if (!logoUrl) return null;
  
  return (
    <img
      src={logoUrl}
      alt="Logo"
      className={`${size} object-contain`}
      loading="lazy"
    />
  );
}