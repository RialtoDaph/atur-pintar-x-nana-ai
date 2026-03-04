import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const STRIPE_PRICE_ID = "price_1P8z8eL3VzLEzNQwHn8vQkOx"; // Replace with your actual Stripe price ID
const MONTHLY_PRICE = 3900; // Rp 39,000 in cents for Stripe

export default function CheckoutButton({ user }) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    if (!user) {
      await base44.auth.redirectToLogin();
      return;
    }

    setLoading(true);
    try {
      // Create checkout session
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a Stripe checkout session for premium subscription. 
        User email: ${user.email}
        Price: IDR 39,000/month
        Return the Stripe checkout URL.`,
      });

      // For now, show a placeholder - in production, you'd use Stripe.js
      window.open("https://stripe.com", "_blank");
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setLoading(false);
    }
  }

  const isPremium = user?.subscription_status === "premium";
  const isExpired =
    user?.subscription_end_date &&
    new Date(user.subscription_end_date) < new Date();

  if (isPremium && !isExpired) {
    return (
      <Button disabled className="w-full bg-[#10B981] hover:bg-[#0a9967] text-white">
        ✓ Premium Active
      </Button>
    );
  }

  return (
    <Button
      onClick={handleCheckout}
      disabled={loading}
      className="w-full bg-[#FF6A00] hover:bg-[#e05e00] text-white"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : isExpired ? (
        "Renew Premium"
      ) : (
        "Upgrade to Premium"
      )}
    </Button>
  );
}