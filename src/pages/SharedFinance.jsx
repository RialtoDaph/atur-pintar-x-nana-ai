import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Plus, Copy, UserPlus, Crown, X, Check, Loader2, Link, Mail } from "lucide-react";
import { toast } from "sonner";

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function WalletCard({ wallet, currentUserEmail, onLeave }) {
  const isOwner = wallet.owner_email === currentUserEmail;
  const memberCount = (wallet.members || []).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{wallet.icon || "👨‍👩‍👧"}</span>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-[#1A1A1A]">{wallet.name}</p>
              {isOwner && <span className="text-[10px] bg-amber-100 text-amber-600 font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Crown className="w-2.5 h-2.5" /> Owner</span>}
            </div>
            {wallet.description && <p className="text-xs text-[#8FA4C8] mt-0.5">{wallet.description}</p>}
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2">Anggota ({memberCount})</p>
        <div className="space-y-2">
          {(wallet.members || []).map(email => (
            <div key={email} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#FF6A00] flex items-center justify-center text-white text-xs font-bold">
                {email[0].toUpperCase()}
              </div>
              <span className="text-sm text-[#1A1A1A] flex-1">{email}</span>
              {email === wallet.owner_email && <Crown className="w-3.5 h-3.5 text-amber-400" />}
            </div>
          ))}
          {(wallet.pending_invites || []).map(email => (
            <div key={email} className="flex items-center gap-2 opacity-60">
              <div className="w-7 h-7 rounded-full bg-[#E2E8F0] flex items-center justify-center text-[#8FA4C8] text-xs font-bold">
                {email[0].toUpperCase()}
              </div>
              <span className="text-sm text-[#8FA4C8] flex-1">{email}</span>
              <span className="text-[10px] bg-[#F2F4F7] text-[#8FA4C8] px-2 py-0.5 rounded-full">Menunggu</span>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Code */}
      {isOwner && wallet.invite_code && (
        <div className="bg-[#F2F4F7] rounded-xl p-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-[#8FA4C8]">Kode Undangan</p>
            <p className="font-bold text-[#1A1A1A] text-lg tracking-widest">{wallet.invite_code}</p>
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(wallet.invite_code); toast.success("Kode disalin!"); }}
            className="p-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            <Copy className="w-4 h-4 text-[#FF6A00]" />
          </button>
        </div>
      )}

      {!isOwner && (
        <button
          onClick={() => onLeave(wallet)}
          className="w-full mt-3 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors"
        >
          Keluar dari Dompet
        </button>
      )}
    </div>
  );
}

export default function SharedFinance() {
  const [user, setUser] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "", icon: "👨‍👩‍👧", inviteEmail: "" });
  const [joinCode, setJoinCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async u => {
      setUser(u);
      // Load all wallets: owned + member of
      const all = await base44.entities.SharedWallet.list();
      const mine = all.filter(w =>
        (w.members || []).includes(u.email) || w.owner_email === u.email
      );
      setWallets(mine);
    }).finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!createForm.name.trim() || !user) return;
    setSaving(true);
    const invites = createForm.inviteEmail.trim() ? [createForm.inviteEmail.trim()] : [];
    const wallet = await base44.entities.SharedWallet.create({
      name: createForm.name,
      description: createForm.description,
      icon: createForm.icon,
      owner_email: user.email,
      members: [user.email],
      pending_invites: invites,
      invite_code: generateCode(),
    });
    setWallets(prev => [...prev, wallet]);
    setShowCreate(false);
    setCreateForm({ name: "", description: "", icon: "👨‍👩‍👧", inviteEmail: "" });
    setSaving(false);
    toast.success("Dompet bersama berhasil dibuat!");
  }

  async function handleJoin() {
    if (!joinCode.trim() || !user) return;
    setJoining(true);
    const all = await base44.entities.SharedWallet.list();
    const target = all.find(w => w.invite_code === joinCode.trim().toUpperCase());
    if (!target) {
      toast.error("Kode undangan tidak ditemukan");
      setJoining(false);
      return;
    }
    if ((target.members || []).includes(user.email)) {
      toast.info("Kamu sudah bergabung di dompet ini");
      setJoining(false);
      return;
    }
    const updated = await base44.entities.SharedWallet.update(target.id, {
      members: [...(target.members || []), user.email],
      pending_invites: (target.pending_invites || []).filter(e => e !== user.email),
    });
    setWallets(prev => [...prev, updated]);
    setShowJoin(false);
    setJoinCode("");
    setJoining(false);
    toast.success(`Berhasil bergabung ke "${target.name}"!`);
  }

  async function handleLeave(wallet) {
    if (!user) return;
    await base44.entities.SharedWallet.update(wallet.id, {
      members: (wallet.members || []).filter(e => e !== user.email),
    });
    setWallets(prev => prev.filter(w => w.id !== wallet.id));
    toast.success("Kamu telah keluar dari dompet bersama");
  }

  const ICONS = ["👨‍👩‍👧", "💑", "👫", "🏠", "💍", "👨‍👩‍👧‍👦", "🤝", "❤️"];

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-10">
      <div className="bg-[#0A0A0A] px-5 pt-10 pb-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-[#8FA4C8] text-sm font-medium">Keuangan Bersama</p>
          <h1 className="text-white text-2xl font-bold mt-0.5">Shared Finance</h1>
          <p className="text-[#8FA4C8] text-sm mt-2">Kelola keuangan bersama pasangan atau keluarga dalam satu dompet.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 mt-5 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowCreate(true)}
            className="bg-[#FF6A00] text-white py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Buat Dompet
          </button>
          <button
            onClick={() => setShowJoin(true)}
            className="bg-white border border-[#E2E8F0] text-[#1A1A1A] py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
          >
            <Link className="w-4 h-4 text-[#FF6A00]" /> Masukkan Kode
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#F2F4F7] border-t-[#FF6A00] rounded-full animate-spin" />
          </div>
        ) : wallets.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <Users className="w-12 h-12 text-[#E2E8F0] mx-auto mb-3" />
            <p className="text-[#1A1A1A] font-semibold">Belum ada dompet bersama</p>
            <p className="text-[#8FA4C8] text-sm mt-1">Buat dompet bersama pasangan atau keluarga, atau masukkan kode undangan</p>
          </div>
        ) : (
          wallets.map(w => (
            <WalletCard key={w.id} wallet={w} currentUserEmail={user?.email} onLeave={handleLeave} />
          ))
        )}

        {/* Info */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-[#FF6A00]/20">
          <p className="text-xs font-bold text-[#FF6A00] uppercase tracking-widest mb-2">✨ Fitur Shared Finance</p>
          <ul className="space-y-1.5 text-sm text-[#1A1A1A]">
            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> Buat dompet bersama untuk pasangan atau keluarga</li>
            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> Undang anggota via kode atau email</li>
            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#8FA4C8] flex-shrink-0 mt-0.5" /> Lihat transaksi bersama (segera hadir)</li>
            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#8FA4C8] flex-shrink-0 mt-0.5" /> Budget bersama & goals bersama (segera hadir)</li>
          </ul>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-xl">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#F2F4F7]">
              <p className="font-bold text-[#1A1A1A]">Buat Dompet Bersama</p>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-xl hover:bg-[#F2F4F7]"><X className="w-5 h-5 text-[#8FA4C8]" /></button>
            </div>
            <div className="px-5 py-4 space-y-4">
              {/* Icon Picker */}
              <div className="flex gap-2 flex-wrap">
                {ICONS.map(ic => (
                  <button key={ic} onClick={() => setCreateForm(f => ({ ...f, icon: ic }))}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center ${createForm.icon === ic ? "ring-2 ring-[#FF6A00] bg-[#FF6A00]/10" : "bg-[#F2F4F7]"}`}>
                    {ic}
                  </button>
                ))}
              </div>
              <input
                value={createForm.name}
                onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nama dompet (e.g., Keuangan Keluarga)"
                className="w-full px-4 py-3 bg-[#F2F4F7] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#FF6A00]/30"
              />
              <input
                value={createForm.description}
                onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Deskripsi (opsional)"
                className="w-full px-4 py-3 bg-[#F2F4F7] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#FF6A00]/30"
              />
              <div>
                <p className="text-xs text-[#8FA4C8] mb-1.5">Undang anggota pertama (opsional)</p>
                <input
                  value={createForm.inviteEmail}
                  onChange={e => setCreateForm(f => ({ ...f, inviteEmail: e.target.value }))}
                  placeholder="Email pasangan atau keluarga"
                  type="email"
                  className="w-full px-4 py-3 bg-[#F2F4F7] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#FF6A00]/30"
                />
              </div>
            </div>
            <div className="px-5 pb-6">
              <button onClick={handleCreate} disabled={saving || !createForm.name.trim()}
                className="w-full py-3.5 bg-[#FF6A00] text-white rounded-2xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Buat Dompet Bersama
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Modal */}
      {showJoin && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-xl">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#F2F4F7]">
              <p className="font-bold text-[#1A1A1A]">Masukkan Kode Undangan</p>
              <button onClick={() => setShowJoin(false)} className="p-2 rounded-xl hover:bg-[#F2F4F7]"><X className="w-5 h-5 text-[#8FA4C8]" /></button>
            </div>
            <div className="px-5 py-5 space-y-4">
              <p className="text-sm text-[#8FA4C8]">Minta kode undangan 6 karakter dari owner dompet bersama.</p>
              <input
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Contoh: AB1C2D"
                maxLength={6}
                className="w-full px-4 py-3 bg-[#F2F4F7] rounded-xl text-xl font-bold tracking-[0.4em] text-center text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#FF6A00]/30 uppercase"
              />
            </div>
            <div className="px-5 pb-6">
              <button onClick={handleJoin} disabled={joining || joinCode.length !== 6}
                className="w-full py-3.5 bg-[#FF6A00] text-white rounded-2xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Bergabung
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}