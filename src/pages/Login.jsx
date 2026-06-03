import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import AppleIcon from "@/components/AppleIcon";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Email atau kata sandi tidak valid");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", "/");
  };

  const handleApple = () => {
    base44.auth.loginWithProvider("apple", "/");
  };

  return (
    <AuthLayout
      title="Selamat datang kembali"
      subtitle="Masuk ke akun kamu"
      footer={
        <>
          Belum punya akun?{" "}
          <Link to="/register" className="text-[#F97316] font-semibold hover:underline">
            Daftar di sini
          </Link>
        </>
      }
    >
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-semibold mb-3 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        Lanjut dengan Google
      </Button>

      <Button
        variant="outline"
        className="w-full h-12 text-sm font-semibold mb-6 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
        onClick={handleApple}
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-white/70">Kata Sandi</Label>
            <Link to="/forgot-password" className="text-xs text-[#F97316] hover:underline">
              Lupa kata sandi?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-0"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-bold bg-[#F97316] hover:bg-[#e05e00] text-white" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Memproses...
            </>
          ) : (
            "Masuk"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}