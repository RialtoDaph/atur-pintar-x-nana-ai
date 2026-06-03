import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Kata sandi tidak cocok");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken, newPassword });
      window.location.href = "/login";
    } catch (err) {
      setError(err.message || "Gagal mereset kata sandi");
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <AuthLayout
        title="Link tidak valid"
        subtitle="Link reset kata sandi ini hilang atau tidak valid"
        footer={
          <Link to="/forgot-password" className="text-[#F97316] font-semibold hover:underline">
            Minta link baru
          </Link>
        }
      >
        <p className="text-sm text-white/70 text-center leading-relaxed">
          Link yang kamu pakai sepertinya tidak lengkap. Silakan minta link reset kata sandi yang baru.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Kata sandi baru"
      subtitle="Masukkan kata sandi baru kamu"
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-white/70">Kata Sandi Baru</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              autoFocus
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
        <Button type="submit" className="w-full h-12 font-bold bg-[#F97316] hover:bg-[#e05e00] text-white" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Mereset...
            </>
          ) : (
            "Reset kata sandi"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}