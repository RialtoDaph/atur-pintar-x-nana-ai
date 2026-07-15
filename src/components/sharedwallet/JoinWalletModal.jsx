import { useState } from "react";
import { X, UserPlus, Loader2 } from "lucide-react";

export default function JoinWalletModal({ onClose, onJoin }) {
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joining, setJoining] = useState(false);

  async function handleJoin() {
    if (joinCode.length !== 8) return;
    setJoining(true);
    setJoinError("");
    const err = await onJoin(joinCode);
    if (err) setJoinError(err);
    setJoining(false);
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-xl py-16">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#F2F4F7]">
          <p className="font-bold text-[#1A1A1A]">Masukkan Kode Undangan</p>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#F2F4F7]">
            <X className="w-5 h-5 text-[#8FA4C8]" />
          </button>
        </div>
        <div className="px-5 py-5 space-y-3 my-3">
          <p className="text-sm text-[#8FA4C8]">Minta kode undangan 8 karakter dari owner dompet bersama.</p>
          <input value={joinCode} onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(""); }}
            placeholder="Contoh: AB1C2D3E" maxLength={8}
            className="w-full px-4 py-3 bg-[#F2F4F7] rounded-xl text-xl font-bold tracking-[0.4em] text-center text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#F97316]/30 uppercase" />
          {joinError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
              <p className="text-sm text-red-600 font-medium">{joinError}</p>
            </div>
          )}
        </div>
        <div className="px-5 pb-6" style={{ paddingBottom: 'calc(1.5rem + max(0px, env(safe-area-inset-bottom)))' }}>
          <button onClick={handleJoin} disabled={joining || joinCode.length !== 8}
            className="w-full py-3.5 bg-[#F97316] text-white rounded-2xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Bergabung
          </button>
        </div>
      </div>
    </div>
  );
}