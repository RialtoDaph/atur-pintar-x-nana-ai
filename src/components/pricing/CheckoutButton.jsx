import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Midtrans configuration
const MIDTRANS_CLIENT_KEY = process.env.REACT_APP_MIDTRANS_CLIENT_KEY || "YOUR_MIDTRANS_CLIENT_KEY";
const MIDTRANS_URL_SANDBOX = "https://app.sandbox.midtrans.com/snap/snap.js";
const MIDTRANS_URL_PRODUCTION = "https://app.midtrans.com/snap/snap.js";
const SUBSCRIPTION_PRICE = 39000; // IDR 39,000

export default function CheckoutButton({ user }) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    if (!user) {
      await base44.auth.redirectToLogin();
      return;
    }

    setLoading(true);
    try {
      // Create Midtrans transaction
      const transactionDetails = {
        order_id: `order-${user.id}-${Date.now()}`,
        gross_amount: SUBSCRIPTION_PRICE,
      };

      const customerDetails = {
        first_name: user.full_name,
        email: user.email,
      };

      // Request snap token from server
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a Midtrans Snap token for a subscription payment.
        
Payment Details:
- Order ID: ${transactionDetails.order_id}
- Amount: IDR ${transactionDetails.gross_amount} (monthly subscription)
- Customer Name: ${customerDetails.first_name}
- Customer Email: ${customerDetails.email}

Return a JSON with: {"snap_token": "...token..."}`,
        response_json_schema: {
          type: "object",
          properties: {
            snap_token: { type: "string" },
          },
        },
      });

      if (response.snap_token) {
        // Load Snap.js dynamically
        const script = document.createElement("script");
        script.src = MIDTRANS_URL_SANDBOX;
        script.async = true;
        script.onload = () => {
          window.snap.pay(response.snap_token, {
            onSuccess: (result) => {
              // Payment success - update user subscription
              base44.auth.updateMe({
                subscription_status: "premium",
                subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split("T")[0],
                midtrans_customer_id: result.customer_id || user.id,
                midtrans_subscription_id: result.order_id,
              });
              window.location.href = "/dashboard?payment=success";
            },
            onPending: () => {
              alert("Pembayaran sedang diproses");
            },
            onError: (result) => {
              console.error("Payment error:", result);
              alert("Pembayaran gagal. Silakan coba lagi.");
            },
            onClose: () => {
              alert("Anda menutup Snap. Silakan coba lagi.");
            },
          });
        };
        document.head.appendChild(script);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Gagal memproses checkout. Silakan coba lagi.");
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