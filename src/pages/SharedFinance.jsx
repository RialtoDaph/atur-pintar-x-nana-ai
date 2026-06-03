import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Plus, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import PremiumGate from "@/components/subscription/PremiumGate";
import WalletCard from "@/components/sharedwallet/WalletCard";
import PendingInviteBanner from "@/components/sharedwallet/PendingInviteBanner";
import AddSharedTxModal from "@/components/sharedwallet/AddSharedTxModal";
import CreateWalletModal from "@/components/sharedwallet/CreateWalletModal";
import JoinWalletModal from "@/components/sharedwallet/JoinWalletModal";

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

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
        } catch { setIsPremium(false); }
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

    const memberWallets = mine.filter((w) => (w.members || []).includes(user.email) || w.owner_email === user.email);
    const txMap = {};
    await Promise.all(memberWallets.map(async (w) => {
      const txs = await base44.entities.SharedWalletTransaction.filter({ wallet_id: w.id }, "-date", 50).catch(() => []);
      txMap[w.id] = txs || [];
    }));
    setWalletTxsMap(txMap);
  }

  async function handleCreate(form) {
    const invites = form.inviteEmail.trim() ? [form.inviteEmail.trim()] : [];
    const wallet = await base44.entities.SharedWallet.create({
      name: form.name,
      description: form.description,
      icon: form.icon,
      owner_email: user.email,
      members: [user.email],
      pending_invites: invites,
      invite_code: generateCode(),
      balance: 0
    });
    setWallets((prev) => [...prev, wallet]);
    setWalletTxsMap((prev) => ({ ...prev, [wallet.id]: [] }));
    setShowCreate(false);
    toast.success("Dompet bersama berhasil dibuat!");
  }

  async function handleJoin(code) {
    try {
      const res = await base44.functions.invoke("joinSharedWallet", { invite_code: code.trim().toUpperCase() });
      const data = res?.data || {};
      if (!data.success) return data.error || "Kode undangan tidak valid";
      const updated = data.wallet;
      setWallets((prev) => prev.some((w) => w.id === updated.id) ? prev.map((w) => w.id === updated.id ? updated : w) : [...prev, updated]);
      setWalletTxsMap((prev) => ({ ...prev, [updated.id]: [] }));
      setShowJoin(false);
      toast.success(`Berhasil bergabung ke "${updated.name}"!`);
      loadAll();
      return null;
    } catch (e) {
      return e?.response?.data?.error || "Kode undangan tidak valid";
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
    if ((wallet.members || []).includes(email)) { toast.error("Email sudah menjadi anggota"); return; }
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
      pending_invites: (wallet.pending_invites || []).filter((e) => e !== email)
    });
    setWallets((prev) => prev.map((w) => w.id === wallet.id ? updated : w));
    toast.success(`${email} berhasil dikeluarkan`);
  }

  async function handleDelete(wallet) {
    const txs = await base44.entities.SharedWalletTransaction.filter({ wallet_id: wallet.id }).catch(() => []);
    await Promise.all((txs || []).map((t) => base44.entities.SharedWalletTransaction.delete(t.id).catch(() => {})));
    await base44.entities.SharedWallet.delete(wallet.id);
    setWallets((prev) => prev.filter((w) => w.id !== wallet.id));
    setWalletTxsMap((prev) => { const next = { ...prev }; delete next[wallet.id]; return next; });
    toast.success("Wallet berhasil dihapus");
  }

  async function handleAddTransaction(txData) {
    const tx = await base44.entities.SharedWalletTransaction.create(txData);
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
          <button onClick={() => setShowJoin(true)}
            className="bg-white border border-[#E2E8F0] text-[#1A1A1A] py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm">
            <LinkIcon className="w-4 h-4 text-[#F97316]" /> Masukkan Kode
          </button>
        </div>

        {memberWallets.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <Users className="w-12 h-12 text-[#E2E8F0] mx-auto mb-3" />
            <p className="text-[#1A1A1A] font-semibold">Belum ada dompet bersama</p>
            <p className="text-[#8FA4C8] text-sm mt-1">Buat dompet bersama atau masukkan kode undangan</p>
          </div>
        ) : (
          memberWallets.map((w) => (
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
          ))
        )}
      </div>

      {showCreate && <CreateWalletModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
      {showJoin && <JoinWalletModal onClose={() => setShowJoin(false)} onJoin={handleJoin} />}
      {addTxWallet && (
        <AddSharedTxModal
          wallet={addTxWallet}
          user={user}
          onClose={() => setAddTxWallet(null)}
          onSave={handleAddTransaction} />
      )}
    </div>
  );
}