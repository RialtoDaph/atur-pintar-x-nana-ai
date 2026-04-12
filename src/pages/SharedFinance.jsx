import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Plus, Copy, UserPlus, Crown, X, Check, Loader2, Link, Trash2, UserMinus } from "lucide-react";
import { toast } from "sonner";
import PremiumGate from "@/components/subscription/PremiumGate";

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function Avatar({ email, size = 7 }) {
  return (
    <div className={`w-${size} h-${size} rounded-full bg-[#FF6A00] flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
      {email ? email[0].toUpperCase() : "?"}
    </div>
  );
}

function WalletCard({ wallet, currentUserEmail, onLeave, onKickMember, onDelete }) {
  const isOwner = wallet.owner_email === currentUserEmail;
  const [kickConfirm, setKickConfirm] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const members = wallet.members || [];

  function handleKick(email) {
    setKickConfirm(email);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{wallet.icon || "👨‍👩‍👧"}</span>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-[#1A1A1A]">{wallet.name}</p>
              {isOwner && (
                <span className="text-[10px] bg-amber-100 text-amber-600 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Crown className="w-2.5 h-2.5" /> Owner
                </span>
              )}
            </div>
            {wallet.description && <p className="text-xs text-[#8FA4C8] mt-0.5">{wallet.description}</p>}
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2">Anggota ({members.length})</p>
        <div className="space-y-2">
          {members.map(email => (
            <div key={email} className="flex items-center gap-2">
              <Avatar email={email} />
              <span className="text-sm text-[#1A1A1A] flex-1 truncate">{email}</span>
              {email === wallet.owner_email && <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
              {isOwner && email !== currentUserEmail && (
                <button
                  onClick={() => handleKick(email)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-colors flex-shrink-0"
                >
                  <UserMinus className="w-3 h-3" /> Keluarkan
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Kick confirm */}
      {kickConfirm && (
        <div className="mb-3 bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm font-semibold text-red-700 mb-2">Keluarkan <strong>{kickConfirm}</strong> dari wallet ini?</p>
          <div className="flex gap-2">
            <button
              onClick={() => { onKickMember(wallet, kickConfirm); setKickConfirm(null); }}
              className="flex-1 py-2 bg-red-500 text-white rounded-xl text-xs font-bold"
            >
              Ya, Keluarkan
            </button>
            <button
              onClick={() => setKickConfirm(null)}
              className="flex-1 py-2 bg-[#F2F4F7] text-[#8FA4C8] rounded-xl text-xs font-bold"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Invite Code */}
      {isOwner && wallet.invite_code && (
        <div className="bg-[#F2F4F7] rounded-xl p-3 flex items-center justify-between gap-3 mb-3">
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

      {/* Owner delete / Member leave */}
      {isOwner ? (
        !deleteConfirm ? (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="w-full mt-1 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Hapus Wallet
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-xs text-red-700 font-semibold mb-1">⚠️ Menghapus wallet akan menghapus semua data terkait. Tindakan ini tidak bisa dibatalkan.</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => { onDelete(wallet); setDeleteConfirm(false); }}
                className="flex-1 py-2 bg-red-500 text-white rounded-xl text-xs font-bold"
              >
                Ya, Hapus
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 py-2 bg-[#F2F4F7] text-[#8FA4C8] rounded-xl text-xs font-bold"
              >
                Batal
              </button>
            </div>
          </div>
        )
      ) : (
        <button
          onClick={() => onLeave(wallet)}
          className="w-full mt-1 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors"
        >
          Keluar dari Dompet
        </button>
      )}
    </div>
  );
}

function TransactionList({ txs, currentUserEmail }) {
  const [filter, setFilter] = useState("all");

  const filtered = txs.filter(tx => {
    if (filter === "mine") return tx.created_by === currentUserEmail;
    if (filter === "others") return tx.created_by !== currentUserEmail;
    return true;
  });

  // Contribution summary per member
  const contrib = {};
  txs.forEach(tx => {
    if (!contrib[tx.created_by]) contrib[tx.created_by] = 0;
    contrib[tx.created_by] += tx.amount || 0;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-[#F2F4F7]">
        <p className="text-sm font-bold text-[#1A1A1A] mb-3">Transaksi Anggota</p>
        <div className="flex gap-2">
          {[["all", "Semua"], ["mine", "Saya"], ["others", "Anggota"]].map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${filter === key ? "bg-[#FF6A00] text-white" : "bg-[#F2F4F7] text-[#8FA4C8]"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      {Object.keys(contrib).length > 1 && (
        <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#F2F4F7]">
          <p className="text-[10px] font-bold text-[#8FA4C8] uppercase tracking-wider mb-2">Kontribusi per Anggota</p>
          <div className="space-y-1.5">
            {Object.entries(contrib).map(([email, total]) => (
              <div key={email} className="flex items-center gap-2">
                <Avatar email={email} size={5} />
                <span className="text-xs text-[#1A1A1A] flex-1 truncate">{email.split('@')[0]}</span>
                <span className="text-xs font-bold text-[#1A1A1A]">Rp {total.toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="divide-y divide-[#F2F4F7]">
        {filtered.length === 0 ? (
          <p className="text-center text-[#8FA4C8] text-sm py-8">Tidak ada transaksi</p>
        ) : filtered.map(tx => (
          <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
            <Avatar email={tx.created_by} size={8} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1A1A1A] truncate">{tx.note || tx.category || 'Transaksi'}</p>
              <p className="text-[10px] text-[#8FA4C8]">
                {tx.created_by?.split('@')[0]} · {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
              {tx.type === 'income' ? '+' : '−'}Rp {tx.amount?.toLocaleString('id-ID')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SharedFinance() {
  const [user, setUser] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wallets, setWallets] = useState([]);
  const [sharedTxs, setSharedTxs] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "", icon: "👨‍👩‍👧", inviteEmail: "" });
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [saving, setSaving] = useState(false);
  const [joining, setJoining] = useState(false);

  const ICONS = ["👨‍👩‍👧", "💑", "👫", "🏠", "💍", "👨‍👩‍👧‍👦", "🤝", "❤️"];

  useEffect(() => {
    base44.auth.me().then(async u => {
      setUser(u);
      const userPremium = u?.subscription_plan &&
        ["premium_monthly", "premium_yearly"].includes(u.subscription_plan) &&
        u?.subscription_status === "active";
      if (userPremium) {
        setIsPremium(true);
        setLoading(false);
      } else {
        try {
          const subs = await base44.entities.Subscription.filter({ created_by: u.email });
          const activeSub = subs?.find(s => s.status === "active" &&
            ["premium_monthly", "premium_yearly"].includes(s.plan));
          setIsPremium(!!activeSub);
        } catch {
          setIsPremium(false);
        }
        setLoading(false);
      }
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user || !isPremium) return;
    loadWallets();
  }, [user, isPremium]);

  async function loadWallets() {
    const all = await base44.entities.SharedWallet.list();
    const mine = all.filter(w =>
      (w.members || []).includes(user.email) || w.owner_email === user.email
    );
    setWallets(mine);
    if (mine.length > 0) {
      const allMembers = [...new Set(mine.flatMap(w => w.members || []))];
      const txsArr = await Promise.all(
        allMembers.map(email =>
          base44.entities.Transaction.filter({ created_by: email }, "-date", 20).catch(() => [])
        )
      );
      const merged = txsArr.flat().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 40);
      setSharedTxs(merged);
    }
  }

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
    setJoinError("");
    setJoining(true);
    const all = await base44.entities.SharedWallet.list();
    const target = all.find(w => w.invite_code === joinCode.trim().toUpperCase());
    if (!target) {
      setJoinError("Kode undangan tidak valid atau sudah kedaluwarsa");
      setJoining(false);
      return;
    }
    if ((target.members || []).includes(user.email)) {
      setJoinError("Anda sudah tergabung di wallet ini");
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
    setJoinError("");
    setJoining(false);
    toast.success(`Berhasil bergabung ke "${target.name}"!`);
    loadWallets();
  }

  async function handleLeave(wallet) {
    if (!user) return;
    await base44.entities.SharedWallet.update(wallet.id, {
      members: (wallet.members || []).filter(e => e !== user.email),
    });
    setWallets(prev => prev.filter(w => w.id !== wallet.id));
    toast.success("Kamu telah keluar dari dompet bersama");
  }

  async function handleKickMember(wallet, email) {
    await base44.entities.SharedWallet.update(wallet.id, {
      members: (wallet.members || []).filter(e => e !== email),
    });
    setWallets(prev => prev.map(w => w.id === wallet.id
      ? { ...w, members: (w.members || []).filter(e => e !== email) }
      : w
    ));
    toast.success(`${email} berhasil dikeluarkan dari wallet`);
  }

  async function handleDelete(wallet) {
    await base44.entities.SharedWallet.delete(wallet.id);
    setWallets(prev => prev.filter(w => w.id !== wallet.id));
    setSharedTxs([]);
    toast.success("Wallet berhasil dihapus");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F4F7] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#F2F4F7] border-t-[#FF6A00] rounded-full animate-spin" />
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-[#F2F4F7] pb-10">
        <div className="bg-[#0A0A0A] px-5 pt-10 pb-6">
          <div className="max-w-2xl mx-auto">
            <p className="text-[#8FA4C8] text-sm font-medium">Keuangan Bersama</p>
            <h1 className="text-white text-2xl font-bold mt-0.5">Shared Finance</h1>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-5 mt-6 space-y-4">
          <PremiumGate user={user} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-10">
      <div className="bg-[#0A0A0A] px-5 pt-10 pb-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-[#8FA4C8] text-sm font-medium">Keuangan Bersama</p>
          <h1 className="text-white text-2xl font-bold mt-0.5">Shared Finance</h1>
          <p className="text-[#8FA4C8] text-sm mt-2">Kelola keuangan bersama pasangan atau keluarga.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 mt-5 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setShowCreate(true)}
            className="bg-[#FF6A00] text-white py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> Buat Dompet
          </button>
          <button onClick={() => { setShowJoin(true); setJoinError(""); }}
            className="bg-white border border-[#E2E8F0] text-[#1A1A1A] py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm">
            <Link className="w-4 h-4 text-[#FF6A00]" /> Masukkan Kode
          </button>
        </div>

        {wallets.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <Users className="w-12 h-12 text-[#E2E8F0] mx-auto mb-3" />
            <p className="text-[#1A1A1A] font-semibold">Belum ada dompet bersama</p>
            <p className="text-[#8FA4C8] text-sm mt-1">Buat dompet bersama atau masukkan kode undangan</p>
          </div>
        ) : (
          wallets.map(w => (
            <WalletCard
              key={w.id}
              wallet={w}
              currentUserEmail={user?.email}
              onLeave={handleLeave}
              onKickMember={handleKickMember}
              onDelete={handleDelete}
            />
          ))
        )}

        {sharedTxs.length > 0 && (
          <TransactionList txs={sharedTxs} currentUserEmail={user?.email} />
        )}
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
              <input
                value={createForm.inviteEmail}
                onChange={e => setCreateForm(f => ({ ...f, inviteEmail: e.target.value }))}
                placeholder="Undang via email (opsional)"
                type="email"
                className="w-full px-4 py-3 bg-[#F2F4F7] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#FF6A00]/30"
              />
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
              <button onClick={() => { setShowJoin(false); setJoinError(""); }} className="p-2 rounded-xl hover:bg-[#F2F4F7]">
                <X className="w-5 h-5 text-[#8FA4C8]" />
              </button>
            </div>
            <div className="px-5 py-5 space-y-3">
              <p className="text-sm text-[#8FA4C8]">Minta kode undangan 8 karakter dari owner dompet bersama.</p>
              <input
                value={joinCode}
                onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinError(""); }}
                placeholder="Contoh: AB1C2D3E"
                maxLength={8}
                className="w-full px-4 py-3 bg-[#F2F4F7] rounded-xl text-xl font-bold tracking-[0.4em] text-center text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#FF6A00]/30 uppercase"
              />
              {joinError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                  <p className="text-sm text-red-600 font-medium">{joinError}</p>
                </div>
              )}
            </div>
            <div className="px-5 pb-6">
              <button onClick={handleJoin} disabled={joining || joinCode.length !== 8}
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