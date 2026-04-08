import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const ADVICE_TYPES = [
  { id: "budgeting", label: "Perencanaan Anggaran", description: "Tips mengelola anggaran bulanan" },
  { id: "savings", label: "Tabungan", description: "Strategi menabung dan target tabungan" },
  { id: "investments", label: "Investasi", description: "Saran tentang instrumen investasi" },
  { id: "debt_management", label: "Manajemen Utang", description: "Strategi pembayaran utang" },
  { id: "spending_analysis", label: "Analisis Pengeluaran", description: "Insight tentang pola pengeluaran" },
  { id: "goals", label: "Target Keuangan", description: "Rekomendasi untuk mencapai tujuan" },
];

export default function NanaPreferencesSettings() {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    loadPreferences();
  }, [user]);

  async function loadPreferences() {
    setLoading(true);
    try {
      const prefs = await base44.entities.NanaPreferences.filter({ created_by: user.email });
      if (prefs && prefs.length > 0) {
        setPreferences(prefs[0]);
      } else {
        setPreferences({
          tone: "santai",
          preferred_advice_types: ["budgeting", "savings", "spending_analysis"],
          frequency_preference: "weekly",
        });
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    } finally {
      setLoading(false);
    }
  }

  async function savePreferences() {
    setSaving(true);
    try {
      if (preferences.id) {
        await base44.entities.NanaPreferences.update(preferences.id, preferences);
      } else {
        // Check if a record already exists for this user
        const existing = await base44.entities.NanaPreferences.filter({ created_by: user.email });
        if (existing && existing.length > 0) {
          // Update the existing record instead of creating a new one
          await base44.entities.NanaPreferences.update(existing[0].id, preferences);
        } else {
          await base44.entities.NanaPreferences.create(preferences);
        }
      }
      await loadPreferences();
    } catch (error) {
      console.error("Error saving preferences:", error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-[#FF6A00]" />
        </CardContent>
      </Card>
    );
  }

  if (!preferences) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personalisasi Nana AI</CardTitle>
        <CardDescription>Sesuaikan cara Nana AI berkomunikasi dan jenis saran yang Anda terima</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tone Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Nada Komunikasi</Label>
          <Select value={preferences.tone} onValueChange={(value) => setPreferences({ ...preferences, tone: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="santai">Santai - Percakapan yang rileks dan friendly</SelectItem>
              <SelectItem value="formal">Formal - Komunikasi profesional dan terstruktur</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Frequency Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Frekuensi Saran</Label>
          <Select value={preferences.frequency_preference} onValueChange={(value) => setPreferences({ ...preferences, frequency_preference: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Setiap Hari</SelectItem>
              <SelectItem value="weekly">Setiap Minggu</SelectItem>
              <SelectItem value="monthly">Setiap Bulan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Advice Types Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Jenis Saran yang Diutamakan</Label>
          <p className="text-xs text-[#8FA4C8] mb-3">Pilih topik yang ingin Anda terima saran lebih sering</p>
          <div className="space-y-2">
            {ADVICE_TYPES.map((type) => (
              <div key={type.id} className="flex items-start gap-3 p-3 rounded-lg border border-[#2D2D2D] hover:border-[#FF6A00]/30 transition-colors">
                <Checkbox
                  id={type.id}
                  checked={preferences.preferred_advice_types.includes(type.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setPreferences({
                        ...preferences,
                        preferred_advice_types: [...preferences.preferred_advice_types, type.id],
                      });
                    } else {
                      setPreferences({
                        ...preferences,
                        preferred_advice_types: preferences.preferred_advice_types.filter((id) => id !== type.id),
                      });
                    }
                  }}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor={type.id} className="text-sm font-medium cursor-pointer">
                    {type.label}
                  </Label>
                  <p className="text-xs text-[#8FA4C8]">{type.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={savePreferences}
          disabled={saving}
          className="w-full bg-[#FF6A00] hover:bg-[#e05e00] text-white"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Menyimpan...
            </>
          ) : (
            "Simpan Preferensi"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}