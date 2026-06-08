import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import AppleIcon from "@/components/AppleIcon";
import { toast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Link as RouterLink } from "react-router-dom";
import ConsentModal from "@/components/auth/ConsentModal";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [consentProvider, setConsentProvider] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!agreed) {
      setError("Kamu harus menyetujui Kebijakan Privasi & Ketentuan Layanan");
      return;
    }
    if (password !== confirmPassword) {
      setError("Kata sandi tidak cocok");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Pendaftaran gagal");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Kode verifikasi tidak valid");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({
        title: "Kode terkirim",
        description: "Cek email kamu untuk kode baru.",
      });
    } catch (err) {
      setError(err.message || "Gagal mengirim ulang kode");
    }
  };

  const handleSocialConfirm = () => {
    const provider = consentProvider;
    setConsentProvider(null);
    if (provider) base44.auth.loginWithProvider(provider, "/");
  };

  if (showOtp) {
    return (
      <AuthLayout
        title="Verifikasi email kamu"
        subtitle={`Kami kirim kode ke ${email}`}
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}
        <div className="flex justify-center mb-6">
          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={setOtpCode}
            autoFocus
            autoComplete="one-time-code"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button
          className="w-full h-12 font-bold bg-[#F97316] hover:bg-[#e05e00] text-white"
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Memverifikasi...
            </>
          ) : (
            "Verifikasi"
          )}
        </Button>
        <p className="text-center text-sm text-white/50 mt-4">
          Belum menerima kode?{" "}
          <button onClick={handleResend} className="text-[#F97316] font-semibold hover:underline">
            Kirim ulang
          </button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Buat akun kamu"
      subtitle="Daftar gratis untuk mulai"
      footer={
        <>
          Sudah punya akun?{" "}
          <Link to="/login" className="text-[#F97316] font-semibold hover:underline">
            Masuk di sini
          </Link>
        </>
      }
    >
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-semibold mb-3 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
        onClick={() => setConsentProvider("google")}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        Lanjut dengan Google
      </Button>

      <Button
        variant="outline"
        className="w-full h-12 text-sm font-semibold mb-6 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
        onClick={() => setConsentProvider("apple")}
      >
        <AppleIcon className="w-5 h-5 mr-2" />
        Lanjut dengan Apple
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#1B1B1B] px-3 text-white/40">atau</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white/70">Email</Label>
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
        <div className="space-y-2">
          <Label htmlFor="password" className="text-white/70">Kata Sandi</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-0"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm" className="text-white/70">Konfirmasi Kata Sandi</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-0"
              required
            />
          </div>
        </div>
        <div className="flex items-start gap-2.5 pt-1">
          <Checkbox
            id="agree-terms-register"
            checked={agreed}
            onCheckedChange={(v) => setAgreed(v === true)}
            className="mt-0.5 border-white/30 data-[state=checked]:bg-[#F97316] data-[state=checked]:border-[#F97316]"
          />
          <Label htmlFor="agree-terms-register" className="text-xs text-white/60 leading-relaxed font-normal cursor-pointer">
            Saya setuju dengan{" "}
            <RouterLink to="/PrivacyPolicy" target="_blank" rel="noopener noreferrer" className="text-[#F97316] hover:underline">
              Kebijakan Privasi
            </RouterLink>{" "}
            dan{" "}
            <RouterLink to="/TermsOfService" target="_blank" rel="noopener noreferrer" className="text-[#F97316] hover:underline">
              Ketentuan Layanan
            </RouterLink>
          </Label>
        </div>

        <Button type="submit" className="w-full h-12 font-bold bg-[#F97316] hover:bg-[#e05e00] text-white disabled:opacity-50" disabled={loading || !agreed}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Membuat akun...
            </>
          ) : (
            "Daftar Sekarang"
          )}
        </Button>
      </form>

      <ConsentModal
        open={!!consentProvider}
        provider={consentProvider}
        onClose={() => setConsentProvider(null)}
        onConfirm={handleSocialConfirm}
      />
    </AuthLayout>
  );
}