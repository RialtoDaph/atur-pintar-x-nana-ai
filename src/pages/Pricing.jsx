import { useState } from "react";
import { Check, X, ChevronDown, ChevronUp, Lock, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Pricing() {
  const [expandedFaq, setExpandedFaq] = useState(null);

  const features = {
    free: [
      { name: "Manual transaction tracking", included: true },
      { name: "Basic analytics", included: true },
      { name: "Monthly summary", included: true },
      { name: "Limited AI insights", included: true },
      { name: "AI spending analysis", included: false },
      { name: "Subscription detection", included: false },
      { name: "Cashflow forecast", included: false },
      { name: "Smart alerts", included: false },
      { name: "Goal prediction", included: false },
      { name: "Export PDF report", included: false },
    ],
    premium: [
      { name: "Manual transaction tracking", included: true },
      { name: "Basic analytics", included: true },
      { name: "Monthly summary", included: true },
      { name: "Limited AI insights", included: true },
      { name: "AI spending analysis", included: true },
      { name: "Subscription detection", included: true },
      { name: "Cashflow forecast", included: true },
      { name: "Smart alerts", included: true },
      { name: "Goal prediction", included: true },
      { name: "Export PDF report", included: true },
    ],
  };

  const faqItems = [
    {
      question: "What happens after upgrade?",
      answer: "Setelah upgrade ke Premium, kamu akan langsung mendapatkan akses ke semua fitur AI-powered seperti spending analysis, subscription detection, dan smart alerts. Data transaksi kamu sudah tersimpan, jadi insight premium akan langsung diterapkan.",
    },
    {
      question: "Can I cancel anytime?",
      answer: "Ya, kamu bisa cancel subscription kapan saja tanpa penalti atau biaya tersembunyi. Jika cancel di tengah bulan, kamu masih bisa menikmati akses Premium hingga akhir periode billing kamu.",
    },
    {
      question: "Is my data secure?",
      answer: "Semua data kamu dienkripsi dengan standar bank (AES-256) dan disimpan di server aman kami. Kami tidak pernah membagikan data pribadi atau finansial kamu kepada pihak ketiga. Privasi kamu adalah prioritas utama kami.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F2F4F7]">
      {/* Hero Section */}
      <section className="px-4 py-16 sm:py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold text-[#1A1A1A] mb-6 leading-tight">
            Upgrade Your Financial Control
          </h1>
          <p className="text-lg sm:text-xl text-[#8FA4C8] mb-8 leading-relaxed">
            Unlock AI insights and stop money leaks.
          </p>
          <Button className="bg-[#FF6A00] hover:bg-[#e05e00] text-white px-8 py-6 text-base font-semibold rounded-xl">
            Start Premium Now
          </Button>
        </div>
      </section>

      {/* Pricing Cards Section */}
      <section className="px-4 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm border border-[#E2E8F0] hover:shadow-md transition-all duration-300 flex flex-col">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-[#1A1A1A] mb-2">Free Plan</h3>
                <p className="text-[#8FA4C8] text-sm">Untuk pemula yang ingin mulai track keuangan</p>
              </div>

              <div className="mb-8">
                <p className="text-4xl font-bold text-[#1A1A1A]">
                  Rp 0
                  <span className="text-lg text-[#8FA4C8] font-normal"> / bulan</span>
                </p>
              </div>

              <Button className="w-full mb-8 bg-white border-2 border-[#E2E8F0] text-[#1A1A1A] hover:bg-[#F9FAFB]">
                Continue Free
              </Button>

              {/* Features List */}
              <div className="space-y-4 flex-1">
                <p className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-wider mb-4">Included features</p>
                {features.free.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-[#FF6A00] flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-[#D1D5DB] flex-shrink-0 mt-0.5" />
                    )}
                    <span className={feature.included ? "text-[#1A1A1A] text-sm" : "text-[#D1D5DB] text-sm"}>
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Premium Plan */}
            <div className="bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] rounded-2xl p-8 sm:p-10 shadow-lg border border-[#FF6A00]/30 hover:shadow-xl transition-all duration-300 flex flex-col lg:scale-105 lg:origin-center">
              <div className="mb-6">
                <div className="inline-block bg-[#FF6A00] text-white px-4 py-1 rounded-full text-xs font-bold mb-4">
                  Most Popular
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Premium Plan</h3>
                <p className="text-[#8FA4C8] text-sm">Kontrol penuh atas finansialmu dengan AI</p>
              </div>

              <div className="mb-8">
                <p className="text-4xl font-bold text-white">
                  Rp 39.000
                  <span className="text-lg text-[#8FA4C8] font-normal"> / bulan</span>
                </p>
              </div>

              <Button className="w-full mb-8 bg-[#FF6A00] hover:bg-[#e05e00] text-white">
                Upgrade to Premium
              </Button>

              {/* Features List */}
              <div className="space-y-4 flex-1">
                <p className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-wider mb-4">All features included</p>
                {features.premium.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-[#FF6A00] flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-[#3D3D3D] flex-shrink-0 mt-0.5" />
                    )}
                    <span className={feature.included ? "text-white text-sm" : "text-[#3D3D3D] text-sm"}>
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="px-4 py-12 sm:py-16 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {/* Cancel Anytime */}
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <Zap className="w-6 h-6 text-[#FF6A00]" />
              </div>
              <h4 className="font-semibold text-[#1A1A1A] mb-1">Cancel Anytime</h4>
              <p className="text-sm text-[#8FA4C8]">Tidak ada komitmen jangka panjang atau penalti tersembunyi</p>
            </div>

            {/* Secure Payment */}
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <Lock className="w-6 h-6 text-[#FF6A00]" />
              </div>
              <h4 className="font-semibold text-[#1A1A1A] mb-1">Secure Payment</h4>
              <p className="text-sm text-[#8FA4C8]">Pembayaran aman dengan enkripsi tingkat bank</p>
            </div>

            {/* Privacy */}
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <Shield className="w-6 h-6 text-[#FF6A00]" />
              </div>
              <h4 className="font-semibold text-[#1A1A1A] mb-1">Your Data is Private</h4>
              <p className="text-sm text-[#8FA4C8]">Data kamu tidak akan pernah dibagikan ke pihak ketiga</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 py-12 sm:py-16">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {faqItems.map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#F9FAFB] transition-colors"
                >
                  <h3 className="text-left font-semibold text-[#1A1A1A]">{item.question}</h3>
                  {expandedFaq === idx ? (
                    <ChevronUp className="w-5 h-5 text-[#FF6A00] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#8FA4C8] flex-shrink-0" />
                  )}
                </button>

                {expandedFaq === idx && (
                  <div className="px-6 py-4 bg-[#F9FAFB] border-t border-[#E2E8F0]">
                    <p className="text-[#6B7280] leading-relaxed">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="px-4 py-16 sm:py-24 text-center bg-[#0A0A0A]">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to take control of your finances?
          </h2>
          <p className="text-lg text-[#8FA4C8] mb-8">
            Upgrade to Premium dan nikmati akses ke AI financial advisor yang personal untuk kamu.
          </p>
          <Button className="bg-[#FF6A00] hover:bg-[#e05e00] text-white px-8 py-6 text-base font-semibold rounded-xl">
            Start Premium Now
          </Button>
        </div>
      </section>
    </div>
  );
}