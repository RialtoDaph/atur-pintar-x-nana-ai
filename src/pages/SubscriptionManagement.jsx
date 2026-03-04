import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Check, X, AlertCircle } from "lucide-react";
import { formatRupiah } from "@/components/utils/formatRupiah";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export default function SubscriptionManagement() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        setError(null);
      } catch (err) {
        console.error("Failed to load user:", err);
        setError("Unable to load subscription data");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const handleCancelSubscription = async () => {
    setCanceling(true);
    try {
      await base44.auth.updateMe({
        subscription_status: "canceled",
      });

      const updatedUser = await base44.auth.me();
      setUser(updatedUser);
      setShowCancelDialog(false);
      setError(null);
    } catch (err) {
      console.error("Failed to cancel subscription:", err);
      setError("Gagal membatalkan subscription. Silakan coba lagi.");
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F4F7]">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF6A00]" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-[#F2F4F7] p-4 sm:p-8 flex items-center justify-center">
        <div className="max-w-md bg-white rounded-2xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Terjadi Kesalahan</h2>
          <p className="text-gray-600 mb-4">{error || "Tidak dapat memuat data subscription"}</p>
          <Button onClick={() => window.location.reload()} className="w-full bg-[#FF6A00] hover:bg-[#e05e00]">
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  const isPremium = user?.subscription_status === "premium";
  const isCanceled = user?.subscription_status === "canceled";
  const isExpired = user?.subscription_end_date && new Date(user.subscription_end_date) < new Date();
  const daysRemaining = user?.subscription_end_date
    ? Math.ceil((new Date(user.subscription_end_date) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  const formattedEndDate = user?.subscription_end_date
    ? format(new Date(user.subscription_end_date), "EEEE, dd MMMM yyyy", { locale: idLocale })
    : "-";

  return (
    <div className="min-h-screen bg-[#F2F4F7] p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kelola Subscription</h1>
          <p className="text-gray-600">Lihat dan kelola subscription premium Anda</p>
        </div>

        <Card className="bg-white border border-gray-200 rounded-2xl p-8 mb-6 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Plan Saat Ini</h2>
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${isPremium && !isExpired ? "bg-[#10B981]" : "bg-gray-400"}`} />
                <p className="text-gray-600">
                  {isPremium && !isExpired
                    ? "Premium Active"
                    : isCanceled
                    ? "Dibatalkan"
                    : isExpired
                    ? "Expired"
                    : "Free"}
                </p>
              </div>
            </div>
            {isPremium && !isExpired && (
              <span className="bg-[#10B981] text-white px-3 py-1 rounded-full text-sm font-medium">
                ✓ Active
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Harga Bulanan</p>
              <p className="text-xl font-bold text-gray-900">{formatRupiah(39000)}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Tanggal Perpanjangan</p>
              <p className="text-lg font-bold text-gray-900">{formattedEndDate}</p>
            </div>

            {isPremium && !isExpired && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Hari Tersisa</p>
                <p className="text-xl font-bold text-gray-900">{Math.max(0, daysRemaining)} hari</p>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <div className="flex items-center gap-2">
                {isPremium && !isExpired ? (
                  <>
                    <Check className="w-5 h-5 text-[#10B981]" />
                    <p className="font-medium text-gray-900">Aktif</p>
                  </>
                ) : isCanceled ? (
                  <>
                    <X className="w-5 h-5 text-red-500" />
                    <p className="font-medium text-gray-900">Dibatalkan</p>
                  </>
                ) : isExpired ? (
                  <>
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    <p className="font-medium text-gray-900">Expired</p>
                  </>
                ) : (
                  <>
                    <X className="w-5 h-5 text-gray-400" />
                    <p className="font-medium text-gray-900">Free</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Fitur Premium</h3>
            <ul className="space-y-3">
              {[
                "Akses ke semua analytics dan insights",
                "Smart alerts untuk pengeluaran dan budget",
                "Manajemen investasi dan utang lanjutan",
                "Saran keuangan dari AI Nana",
                "Laporan keuangan mendalam",
              ].map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3 text-gray-700">
                  <Check className="w-5 h-5 text-[#10B981] flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <div className="space-y-3">
          {isPremium && !isExpired && !isCanceled && (
            <Button
              onClick={() => setShowCancelDialog(true)}
              variant="outline"
              className="w-full py-6 text-base border-red-200 text-red-600 hover:bg-red-50"
            >
              Batalkan Subscription
            </Button>
          )}

          {(isCanceled || isExpired) && (
            <Button
              onClick={() => (window.location.href = "/pricing")}
              className="w-full py-6 text-base bg-[#FF6A00] hover:bg-[#e05e00] text-white"
            >
              Perpanjang Subscription
            </Button>
          )}
        </div>

        {isPremium && !isExpired && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Pembayaran Otomatis</p>
              <p>
                Subscription Anda akan otomatis diperpanjang pada {formattedEndDate}. Anda dapat membatalkan kapan saja.
              </p>
            </div>
          </div>
        )}

        {isCanceled && (
          <div className="mt-6 bg-gray-50 border border-gray-300 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-900">
              <p className="font-medium mb-1">Subscription Dibatalkan</p>
              <p>Akses premium Anda telah dihentikan. Perpanjang subscription untuk mengakses fitur premium lagi.</p>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan kehilangan akses ke semua fitur premium segera. Anda masih dapat menggunakan semua fitur free.
              <p className="mt-3 font-medium text-gray-900">
                Akses premium berakhir pada: {formattedEndDate}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel disabled={canceling}>Tidak, Jangan Batalkan</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={canceling}
              className="bg-red-600 hover:bg-red-700"
            >
              {canceling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Membatalkan...
                </>
              ) : (
                "Ya, Batalkan Subscription"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}