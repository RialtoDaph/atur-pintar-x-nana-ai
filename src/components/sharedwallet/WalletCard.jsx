import { useState } from "react";
import { Plus, Copy, UserPlus, Crown, Trash2, UserMinus, ArrowDownCircle, ArrowUpCircle, ChevronDown, ChevronUp, Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Avatar from "./Avatar";

export default function WalletCard({ wallet, currentUserEmail, walletTxs, onLeave, onKickMember, onDelete, onInvite, onAddTx }) {
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

  const contribs = {};
  walletTxs.forEach((t) => {
    const key = t.paid_by_email || t.created_by;
    if (!contribs[key]) contribs[key] = { income: 0, expense: 0 };
    if (t.type === "income") contribs[key].income += t.amount || 0;
    else contribs[key].expense += t.amount || 0;
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
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{wallet.icon || "👨‍👩‍👧"}</span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
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
          <button
            onClick={() => onAddTx(wallet)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F97316] text-white text-xs font-bold flex-shrink-0">
            <Plus className="w-3.5 h-3.5" /> Transaksi
          </button>
        </div>

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

        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest">Anggota ({members.length})</p>
            {isOwner && (
              <button
                onClick={() => setShowInviteInput((v) => !v)}
                className="text-[10px] font-bold text-[#F97316] flex items-center gap-0.5">
                <UserPlus className="w-3 h-3" /> Undang
              </button>
            )}
          </div>
          <div className="space-y-1.5">
            {members.map((email) => (
              <div key={email} className="flex items-center gap-2">
                <Avatar email={email} size={6} />
                <span className="text-xs text-[#1A1A1A] flex-1 truncate">{email}</span>
                {email === wallet.owner_email && <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                {isOwner && email !== currentUserEmail && (
                  <button onClick={() => setKickConfirm(email)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-colors flex-shrink-0">
                    <UserMinus className="w-3 h-3" /> Keluarkan
                  </button>
                )}
              </div>
            ))}
            {pending.length > 0 && (
              <div className="mt-1">
                <p className="text-[10px] text-[#8FA4C8] font-semibold mb-1">Menunggu ({pending.length})</p>
                {pending.map((email) => (
                  <div key={email} className="flex items-center gap-2 opacity-60">
                    <Avatar email={email} size={5} />
                    <span className="text-xs text-[#8FA4C8] truncate">{email}</span>
                    <Bell className="w-3 h-3 text-[#8FA4C8]" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {showInviteInput && (
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
          )}
        </div>

        {isOwner && wallet.invite_code && (
          <div className="bg-[#F2F4F7] rounded-xl p-3 flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-xs text-[#8FA4C8]">Kode Undangan</p>
              <p className="font-bold text-[#1A1A1A] text-base tracking-widest">{wallet.invite_code}</p>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(wallet.invite_code); toast.success("Kode disalin!"); }}
              className="p-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
              <Copy className="w-4 h-4 text-[#F97316]" />
            </button>
          </div>
        )}

        {kickConfirm && (
          <div className="mb-3 bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-sm font-semibold text-red-700 mb-2">Keluarkan <strong>{kickConfirm}</strong>?</p>
            <div className="flex gap-2">
              <button onClick={() => { onKickMember(wallet, kickConfirm); setKickConfirm(null); }}
                className="flex-1 py-2 bg-red-500 text-white rounded-xl text-xs font-bold">Ya, Keluarkan</button>
              <button onClick={() => setKickConfirm(null)}
                className="flex-1 py-2 bg-[#F2F4F7] text-[#8FA4C8] rounded-xl text-xs font-bold">Batal</button>
            </div>
          </div>
        )}

        {walletTxs.length > 0 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-between py-2 text-xs font-semibold text-[#8FA4C8]">
            <span>Transaksi ({walletTxs.length})</span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {expanded && walletTxs.length > 0 && (
        <div className="border-t border-[#F2F4F7]">
          {Object.keys(contribs).length > 1 && (
            <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#F2F4F7]">
              <p className="text-[10px] font-bold text-[#8FA4C8] uppercase tracking-wider mb-2">Kontribusi Anggota</p>
              <div className="space-y-1.5">
                {Object.entries(contribs).map(([email, { income, expense }]) => (
                  <div key={email} className="flex items-center gap-2">
                    <Avatar email={email} size={5} />
                    <span className="text-xs text-[#1A1A1A] flex-1 truncate">{email.split('@')[0]}</span>
                    <span className="text-[10px] text-green-600 font-bold">+{(income / 1000).toFixed(0)}rb</span>
                    <span className="text-[10px] text-red-500 font-bold">-{(expense / 1000).toFixed(0)}rb</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="divide-y divide-[#F2F4F7]">
            {walletTxs.slice(0, 20).map((tx) => (
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
            ))}
          </div>
        </div>
      )}

      <div className="px-4 pb-4">
        {isOwner ? (
          !deleteConfirm ? (
            <button onClick={() => setDeleteConfirm(true)}
              className="w-full mt-1 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
              <Trash2 className="w-4 h-4" /> Hapus Wallet
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-xs text-red-700 font-semibold mb-1">⚠️ Menghapus wallet akan menghapus semua data terkait.</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => { onDelete(wallet); setDeleteConfirm(false); }}
                  className="flex-1 py-2 bg-red-500 text-white rounded-xl text-xs font-bold">Ya, Hapus</button>
                <button onClick={() => setDeleteConfirm(false)}
                  className="flex-1 py-2 bg-[#F2F4F7] text-[#8FA4C8] rounded-xl text-xs font-bold">Batal</button>
              </div>
            </div>
          )
        ) : (
          <button onClick={() => onLeave(wallet)}
            className="w-full mt-1 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors">
            Keluar dari Dompet
          </button>
        )}
      </div>
    </div>
  );
}