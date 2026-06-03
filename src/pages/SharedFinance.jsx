import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Plus, Copy, UserPlus, Crown, X, Check, Loader2, Link, Trash2, UserMinus, ArrowDownCircle, ArrowUpCircle, ChevronDown, ChevronUp, Bell } from "lucide-react";
import { toast } from "sonner";
import PremiumGate from "@/components/subscription/PremiumGate";

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function Avatar({ email, size = 7 }) {
  const colors = ["#F97316", "#4F7CFF", "#22C55E", "#A855F7", "#EC4899", "#14B8A6"];
  const colorIdx = email ? email.charCodeAt(0) % colors.length : 0;
  const px = size * 4; // tailwind unit (4px) → literal pixels
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ width: px, height: px, backgroundColor: colors[colorIdx], fontSize: size <= 6 ? 10 : 12 }}>
      
      {email ? email[0].toUpperCase() : "?"}
    </div>);

}

// ─── Add Transaction Modal ────────────────────────────────────────────────────
function AddSharedTxModal({ wallet, user, onClose, onSave }) {
  const [form, setForm] = useState({ type: "expense", amount: "", note: "", date: new Date().toISOString().split("T")[0] });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.amount || isNaN(parseFloat(form.amount))) return;
    setSaving(true);
    const amount = parseFloat(form.amount);
    await onSave({
      wallet_id: wallet.id,
      type: form.type,
      amount,
      note: form.note,
      date: form.date,
      paid_by_email: user.email,
      paid_by_name: user.full_name || user.email.split("@")[0]
    });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#F2F4F7]">
          <p className="font-bold text-[#1A1A1A]">Tambah Transaksi</p>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#F2F4F7]"><X className="w-5 h-5 text-[#8FA4C8]" /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2">
            {["expense", "income"].map((tp) =>
            <button
              key={tp}
              onClick={() => setForm((f) => ({ ...f, type: tp }))}
              className={`py-2.5 rounded-xl text-sm font-bold transition-colors ${form.type === tp ?
              tp === "income" ? "bg-green-500 text-white" : "bg-red-500 text-white" :
              "bg-[#F2F4F7] text-[#8FA4C8]"}`}>
              
                {tp === "income" ? "💰 Pemasukan" : "💸 Pengeluaran"}
              </button>
            )}
          </div>
          <input
            type="number"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            placeholder="Jumlah (Rp)"
            className="w-full px-4 py-3 bg-[#F2F4F7] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#F97316]/30" />
          
          <input
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            placeholder="Catatan (opsional)"
            className="w-full px-4 py-3 bg-[#F2F4F7] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#F97316]/30" />
          
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="w-full px-4 py-3 bg-[#F2F4F7] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#F97316]/30" />
          
        </div>
        <div className="px-5 pb-6">
          <button
            onClick={handleSave}
            disabled={saving || !form.amount}
            className="w-full py-3.5 bg-[#F97316] text-white rounded-2xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Simpan Transaksi
          </button>
        </div>
      </div>
    </div>);

}

// ─── Wallet Card ─────────────────────────────────────────────────────────────
function WalletCard({ wallet, currentUserEmail, walletTxs, onLeave, onKickMember, onDelete, onInvite, onAddTx }) {
  const isOwner = wallet.owner_email === currentUserEmail;
  const [expanded, setExpanded] = useState(false);
  const [kickConfirm, setKickConfirm] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [showInviteInput, setShowInviteInput] = useState(false);

  const members = wallet.members || [];
  const pending = wallet.pending_invites || [];
  const totalIncome = walletTxs.filter((t) => t.type === "income").reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpense = walletTxs.filter((t) => t.type === "expense").reduce((s, t) => s + (t.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  // Contributions by member
  const contribs = {};
  walletTxs.forEach((t) => {
    const key = t.paid_by_email || t.created_by;
    if (!contribs[key]) contribs[key] = { income: 0, expense: 0 };
    if (t.type === "income") contribs[key].income += t.amount || 0;else
    contribs[key].expense += t.amount || 0;
  });

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    await onInvite(wallet, inviteEmail.trim());
    setInviteEmail("");
    setShowInviteInput(false);
    setInviting(false);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{wallet.icon || "👨‍👩‍👧"}</span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-[#1A1A1A]">{wallet.name}</p>
                {isOwner &&
                <span className="text-[10px] bg-amber-100 text-amber-600 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Crown className="w-2.5 h-2.5" /> Owner
                  </span>
                }
              </div>
              {wallet.description && <p className="text-xs text-[#8FA4C8] mt-0.5">{wallet.description}</p>}
            </div>
          </div>
          <button
            onClick={() => onAddTx(wallet)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F97316] text-white text-xs font-bold flex-shrink-0">
            
            <Plus className="w-3.5 h-3.5" /> Transaksi
          </button>
        </div>

        {/* Balance summary */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-[#F8FAFC] rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-[#8FA4C8]">Saldo</p>
            <p className={`text-sm font-black ${balance >= 0 ? "text-green-600" : "text-red-500"}`}>
              Rp {Math.abs(balance).toLocaleString("id-ID")}
            </p>
          </div>
          <div className="bg-[#F8FAFC] rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-[#8FA4C8]">Masuk</p>
            <p className="text-sm font-black text-green-600">Rp {(totalIncome / 1000).toFixed(0)}rb</p>
          </div>
          <div className="bg-[#F8FAFC] rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-[#8FA4C8]">Keluar</p>
            <p className="text-sm font-black text-red-500">Rp {(totalExpense / 1000).toFixed(0)}rb</p>
          </div>
        </div>

        {/* Members */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest">Anggota ({members.length})</p>
            {isOwner &&
            <button
              onClick={() => setShowInviteInput((v) => !v)}
              className="text-[10px] font-bold text-[#F97316] flex items-center gap-0.5">
              
                <UserPlus className="w-3 h-3" /> Undang
              </button>
            }
          </div>
          <div className="space-y-1.5">
            {members.map((email) =>
            <div key={email} className="flex items-center gap-2">
                <Avatar email={email} size={6} />
                <span className="text-xs text-[#1A1A1A] flex-1 truncate">{email}</span>
                {email === wallet.owner_email && <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                {isOwner && email !== currentUserEmail &&
              <button onClick={() => setKickConfirm(email)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-colors flex-shrink-0">
                    <UserMinus className="w-3 h-3" /> Keluarkan
                  </button>
              }
              </div>
            )}
            {/* Pending invites */}
            {pending.length > 0 &&
            <div className="mt-1">
                <p className="text-[10px] text-[#8FA4C8] font-semibold mb-1">Menunggu ({pending.length})</p>
                {pending.map((email) =>
              <div key={email} className="flex items-center gap-2 opacity-60">
                    <Avatar email={email} size={5} />
                    <span className="text-xs text-[#8FA4C8] truncate">{email}</span>
                    <Bell className="w-3 h-3 text-[#8FA4C8]" />
                  </div>
              )}
              </div>
            }
          </div>

          {/* Invite input */}
          {showInviteInput &&
          <div className="mt-2 flex gap-2">
              <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@contoh.com"
              type="email"
              className="flex-1 px-3 py-2 bg-[#F2F4F7] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#F97316]/30" />
            
              <button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail.trim()}
              className="px-3 py-2 bg-[#F97316] text-white rounded-xl text-xs font-bold disabled:opacity-50">
              
                {inviting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Kirim"}
              </button>
            </div>
          }
        </div>

        {/* Invite Code */}
        {isOwner && wallet.invite_code &&
        <div className="bg-[#F2F4F7] rounded-xl p-3 flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-xs text-[#8FA4C8]">Kode Undangan</p>
              <p className="font-bold text-[#1A1A1A] text-base tracking-widest">{wallet.invite_code}</p>
            </div>
            <button
            onClick={() => {navigator.clipboard.writeText(wallet.invite_code);toast.success("Kode disalin!");}}
            className="p-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
            
              <Copy className="w-4 h-4 text-[#F97316]" />
            </button>
          </div>
        }

        {/* Kick confirm */}
        {kickConfirm &&
        <div className="mb-3 bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-sm font-semibold text-red-700 mb-2">Keluarkan <strong>{kickConfirm}</strong>?</p>
            <div className="flex gap-2">
              <button onClick={() => {onKickMember(wallet, kickConfirm);setKickConfirm(null);}}
            className="flex-1 py-2 bg-red-500 text-white rounded-xl text-xs font-bold">Ya, Keluarkan</button>
              <button onClick={() => setKickConfirm(null)}
            className="flex-1 py-2 bg-[#F2F4F7] text-[#8FA4C8] rounded-xl text-xs font-bold">Batal</button>
            </div>
          </div>
        }

        {/* Expand transactions */}
        {walletTxs.length > 0 &&
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between py-2 text-xs font-semibold text-[#8FA4C8]">
          
            <span>Transaksi ({walletTxs.length})</span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        }
      </div>

      {/* Expanded transaction list */}
      {expanded && walletTxs.length > 0 &&
      <div className="border-t border-[#F2F4F7]">
          {/* Contribution per member */}
          {Object.keys(contribs).length > 1 &&
        <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#F2F4F7]">
              <p className="text-[10px] font-bold text-[#8FA4C8] uppercase tracking-wider mb-2">Kontribusi Anggota</p>
              <div className="space-y-1.5">
                {Object.entries(contribs).map(([email, { income, expense }]) =>
            <div key={email} className="flex items-center gap-2">
                    <Avatar email={email} size={5} />
                    <span className="text-xs text-[#1A1A1A] flex-1 truncate">{email.split('@')[0]}</span>
                    <span className="text-[10px] text-green-600 font-bold">+{(income / 1000).toFixed(0)}rb</span>
                    <span className="text-[10px] text-red-500 font-bold">-{(expense / 1000).toFixed(0)}rb</span>
                  </div>
            )}
              </div>
            </div>
        }
          <div className="divide-y divide-[#F2F4F7]">
            {walletTxs.slice(0, 20).map((tx) =>
          <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${tx.type === "income" ? "bg-green-100" : "bg-red-100"}`}>
                  {tx.type === "income" ?
              <ArrowDownCircle className="w-4 h-4 text-green-600" /> :
              <ArrowUpCircle className="w-4 h-4 text-red-500" />
              }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A1A1A] truncate">{tx.note || (tx.type === "income" ? "Pemasukan" : "Pengeluaran")}</p>
                  <p className="text-[10px] text-[#8FA4C8]">
                    {tx.paid_by_name || tx.paid_by_email?.split("@")[0]} · {new Date(tx.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <span className={`text-sm font-bold ${tx.type === "income" ? "text-green-600" : "text-red-500"}`}>
                  {tx.type === "income" ? "+" : "−"}Rp {(tx.amount || 0).toLocaleString("id-ID")}
                </span>
              </div>
          )}
          </div>
        </div>
      }

      {/* Delete/Leave */}
      <div className="px-4 pb-4">
        {isOwner ?
        !deleteConfirm ?
        <button onClick={() => setDeleteConfirm(true)}
        className="w-full mt-1 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
              <Trash2 className="w-4 h-4" /> Hapus Wallet
            </button> :

        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-xs text-red-700 font-semibold mb-1">⚠️ Menghapus wallet akan menghapus semua data terkait.</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => {onDelete(wallet);setDeleteConfirm(false);}}
            className="flex-1 py-2 bg-red-500 text-white rounded-xl text-xs font-bold">Ya, Hapus</button>
                <button onClick={() => setDeleteConfirm(false)}
            className="flex-1 py-2 bg-[#F2F4F7] text-[#8FA4C8] rounded-xl text-xs font-bold">Batal</button>
              </div>
            </div> :


        <button onClick={() => onLeave(wallet)}
        className="w-full mt-1 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors">
            Keluar dari Dompet
          </button>
        }
      </div>
    </div>);

}

// ─── Pending Invite Banner ────────────────────────────────────────────────────
function PendingInviteBanner({ wallets, userEmail, onAccept, onDecline }) {
  const invites = wallets.filter((w) =>
  (w.pending_invites || []).includes(userEmail) &&
  !(w.members || []).includes(userEmail)
  );
  if (invites.length === 0) return null;
  return (
    <div className="space-y-2">
      {invites.map((w) =>
      <div key={w.id} className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl flex-shrink-0">{w.icon || "👨‍👩‍👧"}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#1A1A1A]">Undangan: {w.name}</p>
            <p className="text-xs text-[#8FA4C8]">dari {w.owner_email}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => onAccept(w)} className="px-3 py-1.5 bg-green-500 text-white rounded-xl text-xs font-bold">Terima</button>
            <button onClick={() => onDecline(w)} className="px-3 py-1.5 bg-[#F2F4F7] text-[#8FA4C8] rounded-xl text-xs font-bold">Tolak</button>
          </div>
        </div>
      )}
    </div>);

}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SharedFinance() {
  const [user, setUser] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wallets, setWallets] = useState([]);
  const [allWalletsForInvite, setAllWalletsForInvite] = useState([]);
  const [walletTxsMap, setWalletTxsMap] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [addTxWallet, setAddTxWallet] = useState(null);
  const [createForm, setCreateForm] = useState({ name: "", description: "", icon: "👨‍👩‍👧", inviteEmail: "" });
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [saving, setSaving] = useState(false);
  const [joining, setJoining] = useState(false);

  const ICONS = ["👨‍👩‍👧", "💑", "👫", "🏠", "💍", "👨‍👩‍👧‍👦", "🤝", "❤️"];

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      const userPremium = u?.subscription_plan &&
      ["premium_monthly", "premium_yearly"].includes(u.subscription_plan) &&
      u?.subscription_status === "active";
      if (userPremium) {
        setIsPremium(true);
      } else {
        try {
          const subs = await base44.entities.Subscription.filter({ created_by: u.email });
          const activeSub = subs?.find((s) => s.status === "active" && ["premium_monthly", "premium_yearly"].includes(s.plan));
          setIsPremium(!!activeSub);
        } catch {setIsPremium(false);}
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user || !isPremium) return;
    loadAll();
  }, [user, isPremium]);

  async function loadAll() {
    const all = await base44.entities.SharedWallet.list();
    setAllWalletsForInvite(all);
    const mine = all.filter((w) =>
    (w.members || []).includes(user.email) ||
    w.owner_email === user.email ||
    (w.pending_invites || []).includes(user.email)
    );
    setWallets(mine);

    // Load SharedWalletTransactions for each wallet the user is a member of
    const memberWallets = mine.filter((w) => (w.members || []).includes(user.email) || w.owner_email === user.email);
    const txMap = {};
    await Promise.all(memberWallets.map(async (w) => {
      const txs = await base44.entities.SharedWalletTransaction.filter({ wallet_id: w.id }, "-date", 50).catch(() => []);
      txMap[w.id] = txs || [];
    }));
    setWalletTxsMap(txMap);
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
      balance: 0
    });
    setWallets((prev) => [...prev, wallet]);
    setWalletTxsMap((prev) => ({ ...prev, [wallet.id]: [] }));
    setShowCreate(false);
    setCreateForm({ name: "", description: "", icon: "👨‍👩‍👧", inviteEmail: "" });
    setSaving(false);
    toast.success("Dompet bersama berhasil dibuat!");
  }

  async function handleJoin() {
    if (!joinCode.trim() || !user) return;
    setJoinError("");
    setJoining(true);
    try {
      const res = await base44.functions.invoke("joinSharedWallet", { invite_code: joinCode.trim().toUpperCase() });
      const data = res?.data || {};
      if (!data.success) {
        setJoinError(data.error || "Kode undangan tidak valid");
        setJoining(false);
        return;
      }
      const updated = data.wallet;
      setWallets((prev) => prev.some((w) => w.id === updated.id) ? prev.map((w) => w.id === updated.id ? updated : w) : [...prev, updated]);
      setWalletTxsMap((prev) => ({ ...prev, [updated.id]: [] }));
      setShowJoin(false);
      setJoinCode("");
      setJoinError("");
      toast.success(`Berhasil bergabung ke "${updated.name}"!`);
      loadAll();
    } catch (e) {
      setJoinError(e?.response?.data?.error || "Kode undangan tidak valid");
    } finally {
      setJoining(false);
    }
  }

  async function handleAcceptInvite(wallet) {
    const updated = await base44.entities.SharedWallet.update(wallet.id, {
      members: [...(wallet.members || []), user.email],
      pending_invites: (wallet.pending_invites || []).filter((e) => e !== user.email)
    });
    setWallets((prev) => prev.map((w) => w.id === wallet.id ? updated : w));
    setWalletTxsMap((prev) => ({ ...prev, [wallet.id]: [] }));
    toast.success(`Bergabung ke "${wallet.name}"!`);
    loadAll();
  }

  async function handleDeclineInvite(wallet) {
    await base44.entities.SharedWallet.update(wallet.id, {
      pending_invites: (wallet.pending_invites || []).filter((e) => e !== user.email)
    });
    setWallets((prev) => prev.filter((w) => !(w.id === wallet.id && !(w.members || []).includes(user.email))));
    toast.success("Undangan ditolak");
  }

  async function handleInvite(wallet, email) {
    if ((wallet.members || []).includes(email)) {toast.error("Email sudah menjadi anggota");return;}
    const updated = await base44.entities.SharedWallet.update(wallet.id, {
      pending_invites: [...new Set([...(wallet.pending_invites || []), email])]
    });
    setWallets((prev) => prev.map((w) => w.id === wallet.id ? updated : w));
    toast.success(`Undangan dikirim ke ${email}`);
  }

  async function handleLeave(wallet) {
    await base44.entities.SharedWallet.update(wallet.id, {
      members: (wallet.members || []).filter((e) => e !== user.email)
    });
    setWallets((prev) => prev.filter((w) => w.id !== wallet.id));
    toast.success("Kamu telah keluar dari dompet bersama");
  }

  async function handleKickMember(wallet, email) {
    const updated = await base44.entities.SharedWallet.update(wallet.id, {
      members: (wallet.members || []).filter((e) => e !== email),
      // Also clear from pending_invites so kicked user can't re-accept a stale invite
      pending_invites: (wallet.pending_invites || []).filter((e) => e !== email)
    });
    setWallets((prev) => prev.map((w) => w.id === wallet.id ? updated : w));
    toast.success(`${email} berhasil dikeluarkan`);
  }

  async function handleDelete(wallet) {
    // Cascade: delete all SharedWalletTransaction first to prevent orphans
    const txs = await base44.entities.SharedWalletTransaction.filter({ wallet_id: wallet.id }).catch(() => []);
    await Promise.all((txs || []).map((t) => base44.entities.SharedWalletTransaction.delete(t.id).catch(() => {})));
    await base44.entities.SharedWallet.delete(wallet.id);
    setWallets((prev) => prev.filter((w) => w.id !== wallet.id));
    setWalletTxsMap((prev) => {const next = { ...prev };delete next[wallet.id];return next;});
    toast.success("Wallet berhasil dihapus");
  }

  async function handleAddTransaction(txData) {
    const tx = await base44.entities.SharedWalletTransaction.create(txData);
    // Re-fetch authoritative list to avoid race conditions on rapid double-submit
    const allTxs = await base44.entities.SharedWalletTransaction.filter({ wallet_id: txData.wallet_id }, "-date", 200).catch(() => [tx]);
    setWalletTxsMap((prev) => ({ ...prev, [txData.wallet_id]: allTxs }));
    const income = allTxs.filter((t) => t.type === "income").reduce((s, t) => s + (t.amount || 0), 0);
    const expense = allTxs.filter((t) => t.type === "expense").reduce((s, t) => s + (t.amount || 0), 0);
    await base44.entities.SharedWallet.update(txData.wallet_id, { balance: income - expense });
    toast.success("Transaksi ditambahkan!");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F4F7] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#F2F4F7] border-t-[#F97316] rounded-full animate-spin" />
      </div>);

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
      </div>);

  }

  const memberWallets = wallets.filter((w) => (w.members || []).includes(user?.email) || w.owner_email === user?.email);

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
        {/* Pending invites banner */}
        <PendingInviteBanner
          wallets={allWalletsForInvite}
          userEmail={user?.email}
          onAccept={handleAcceptInvite}
          onDecline={handleDeclineInvite} />
        

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setShowCreate(true)}
          className="bg-[#F97316] text-white py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> Buat Dompet
          </button>
          <button onClick={() => {setShowJoin(true);setJoinError("");}}
          className="bg-white border border-[#E2E8F0] text-[#1A1A1A] py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm">
            <Link className="w-4 h-4 text-[#F97316]" /> Masukkan Kode
          </button>
        </div>

        {memberWallets.length === 0 ?
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <Users className="w-12 h-12 text-[#E2E8F0] mx-auto mb-3" />
            <p className="text-[#1A1A1A] font-semibold">Belum ada dompet bersama</p>
            <p className="text-[#8FA4C8] text-sm mt-1">Buat dompet bersama atau masukkan kode undangan</p>
          </div> :

        memberWallets.map((w) =>
        <WalletCard
          key={w.id}
          wallet={w}
          currentUserEmail={user?.email}
          walletTxs={walletTxsMap[w.id] || []}
          onLeave={handleLeave}
          onKickMember={handleKickMember}
          onDelete={handleDelete}
          onInvite={handleInvite}
          onAddTx={setAddTxWallet} />

        )
        }
      </div>

      {/* Create Modal */}
      {showCreate &&
      <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-xl">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#F2F4F7]">
              <p className="font-bold text-[#1A1A1A]">Buat Dompet Bersama</p>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-xl hover:bg-[#F2F4F7]"><X className="w-5 h-5 text-[#8FA4C8]" /></button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="flex gap-2 flex-wrap">
                {ICONS.map((ic) =>
              <button key={ic} onClick={() => setCreateForm((f) => ({ ...f, icon: ic }))}
              className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center ${createForm.icon === ic ? "ring-2 ring-[#F97316] bg-[#F97316]/10" : "bg-[#F2F4F7]"}`}>
                    {ic}
                  </button>
              )}
              </div>
              <input value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Nama dompet (e.g., Keuangan Keluarga)"
            className="w-full px-4 py-3 bg-[#F2F4F7] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#F97316]/30" />
              <input value={createForm.description} onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Deskripsi (opsional)"
            className="w-full px-4 py-3 bg-[#F2F4F7] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#F97316]/30" />
              <input value={createForm.inviteEmail} onChange={(e) => setCreateForm((f) => ({ ...f, inviteEmail: e.target.value }))}
            placeholder="Undang via email (opsional)" type="email"
            className="w-full px-4 py-3 bg-[#F2F4F7] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#F97316]/30" />
            </div>
            <div className="px-5 pb-6">
              <button onClick={handleCreate} disabled={saving || !createForm.name.trim()}
            className="w-full py-3.5 bg-[#F97316] text-white rounded-2xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Buat Dompet Bersama
              </button>
            </div>
          </div>
        </div>
      }

      {/* Join Modal */}
      {showJoin &&
      <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-xl py-16">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#F2F4F7]">
              <p className="font-bold text-[#1A1A1A]">Masukkan Kode Undangan</p>
              <button onClick={() => {setShowJoin(false);setJoinError("");}} className="p-2 rounded-xl hover:bg-[#F2F4F7]">
                <X className="w-5 h-5 text-[#8FA4C8]" />
              </button>
            </div>
            <div className="px-5 py-5 space-y-3 my-3">
              <p className="text-sm text-[#8FA4C8]">Minta kode undangan 8 karakter dari owner dompet bersama.</p>
              <input value={joinCode} onChange={(e) => {setJoinCode(e.target.value.toUpperCase());setJoinError("");}}
            placeholder="Contoh: AB1C2D3E" maxLength={8}
            className="w-full px-4 py-3 bg-[#F2F4F7] rounded-xl text-xl font-bold tracking-[0.4em] text-center text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#F97316]/30 uppercase" />
              {joinError &&
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                  <p className="text-sm text-red-600 font-medium">{joinError}</p>
                </div>
            }
            </div>
            <div className="px-5 pb-6">
              <button onClick={handleJoin} disabled={joining || joinCode.length !== 8}
            className="w-full py-3.5 bg-[#F97316] text-white rounded-2xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Bergabung
              </button>
            </div>
          </div>
        </div>
      }

      {/* Add Transaction Modal */}
      {addTxWallet &&
      <AddSharedTxModal
        wallet={addTxWallet}
        user={user}
        onClose={() => setAddTxWallet(null)}
        onSave={handleAddTransaction} />

      }
    </div>);

}