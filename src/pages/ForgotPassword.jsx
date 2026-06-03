import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email);
    } catch {
      // Always show success regardless
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <AuthLayout
      title="Reset kata sandi"
      subtitle="Kami akan kirim link untuk reset"
      footer={
        <Link to="/login" className="text-[#F97316] font-semibold hover:underline">
          <ArrowLeft className="w-3 h-3 inline mr-1" />Kembali ke login
        </Link>
      }
    >
      {sent ? (
        <p className="text-sm text-white/70 text-center leading-relaxed">
          Kalau akun dengan email itu ada, kamu akan menerima link reset kata sandi sebentar lagi.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/70">Alamat email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" aria-hidden="true" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="kamu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-0"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-12 font-bold bg-[#F97316] hover:bg-[#e05e00] text-white" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Mengirim...
              </>
            ) : (
              "Kirim link reset"
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}