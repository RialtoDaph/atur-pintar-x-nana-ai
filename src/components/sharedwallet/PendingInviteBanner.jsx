export default function PendingInviteBanner({ wallets, userEmail, onAccept, onDecline }) {
  const invites = wallets.filter((w) =>
    (w.pending_invites || []).includes(userEmail) &&
    !(w.members || []).includes(userEmail)
  );
  if (invites.length === 0) return null;
  return (
    <div className="space-y-2">
      {invites.map((w) => (
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
      ))}
    </div>
  );
}