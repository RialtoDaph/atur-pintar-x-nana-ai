import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const NANA_AVATAR = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/7708b64f5_generated_image.png";

export default function NanaCtaButton({ message }) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.stopPropagation();
    // Store the prefilled message for Nana page to pick up
    sessionStorage.setItem("nana_prefilled_message", message);
    navigate(createPageUrl("Nana"));
  };

  return (
    <button
      onClick={handleClick}
      title="Tanya Nana AI"
      className="w-7 h-7 rounded-full overflow-hidden border-2 border-[#F97316] shadow-md flex-shrink-0 tap-highlight-fix hover:scale-110 active:scale-95 transition-transform"
      style={{ boxShadow: "0 2px 8px rgba(249,115,22,0.35)" }}
    >
      <img src={NANA_AVATAR} alt="Nana" className="w-full h-full object-cover" />
    </button>
  );
}