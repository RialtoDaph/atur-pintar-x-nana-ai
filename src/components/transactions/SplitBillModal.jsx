import { useState, useEffect } from "react";
import { X, Plus, Users, Equal, List, Mail } from "lucide-react";
import { formatRupiah } from "@/components/utils/formatRupiah";
import { base44 } from "@/api/base44Client";
import { useAppSettings } from "@/components/utils/useAppSettings";

export default function SplitBillModal({ receiptData, onClose, onConfirm }) {
  const { t } = useAppSettings();
  const [participants, setParticipants] = useState([{ name: "Saya", email: "" }]);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [splitMode, setSplitMode] = useState("equal");
  const [items, setItems] = useState(
    (receiptData.items || []).map(item => ({ ...item, allocated_to: [] }))
  );
  const [appUsers, setAppUsers] = useState([]);
  const [inviting, setInviting] = useState(null);

  useEffect(() => {
    base44.entities.User.list().then(setAppUsers).catch(() => {});
  }, []);

  function addParticipant() {
    const name = newName.trim();
    if (!name || participants.find(p => p.name === name)) return;
    setParticipants(p => [...p, { name, email: newEmail.trim() }]);
    setNewName("");
    setNewEmail("");
  }

  function addFromAppUser(user) {
    const name = user.full_name;
    if (participants.find(p => p.name === name)) return;
    setParticipants(p => [...p, { name, email: user.email }]);
  }

  function removeParticipant(name) {
    setParticipants(p => p.filter(n => n.name !== name));
    setItems(prev => prev.map(item => ({
      ...item,
      allocated_to: item.allocated_to.filter(n => n !== name)
    })));
  }

  async function inviteParticipant(email) {
    if (!email) return;
    setInviting(email);
    await base44.users.inviteUser(email, "user");
    setInviting(null);
  }

  function toggleItemAllocation(itemIdx, person) {
    setItems(prev => prev.map((item, i) => {
      if (i !== itemIdx) return item;
      const already = item.allocated_to.includes(person);
      return {
        ...item,
        allocated_to: already
          ? item.allocated_to.filter(n => n !== person)
          : [...item.allocated_to, person]
      };
    }));
  }

  function calcShares() {
    const names = participants.map(p => p.name);
    if (splitMode === "equal") {
      const perPerson = names.length > 0 ? receiptData.total_amount / names.length : 0;
      return participants.map(p => ({ ...p, amount: perPerson }));
    } else {
      const shares = {};
      names.forEach(n => shares[n] = 0);
      items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        const people = item.allocated_to.length > 0 ? item.allocated_to : names;
        const perPerson = itemTotal / people.length;
        people.forEach(n => { if (shares[n] !== undefined) shares[n] += perPerson; });
      });
      const taxPerPerson = (receiptData.tax_amount || 0) / Math.max(names.length, 1);
      return participants.map(p => ({ ...p, amount: (shares[p.name] || 0) + taxPerPerson }));
    }
  }

  const shares = calcShares();

  function handleConfirm() {
    onConfirm({ splitMode, participants, shares, items, receiptData });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-3xl px-6 pt-6 pb-4 border-b border-[#E2E8F0] z-10">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">🧾</span>
              <h2 className="text-lg font-bold text-[#1A1A1A]">{t('split_bill')}</h2>
            </div>
            <button onClick={onClose} className="text-[#8FA4C8] hover:text-[#1A1A1A] transition-colors tap-highlight-fix">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-[#8FA4C8] font-medium">
            {receiptData.store_name} · {formatRupiah(receiptData.total_amount)}
            {receiptData.tax_amount > 0 && ` (${t('tax')}: ${formatRupiah(receiptData.tax_amount)})`}
          </p>
        </div>

        <div className="px-6 py-4 space-y-5">
          {/* Split Mode */}
          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2 block">{t('split_mode')}</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSplitMode("equal")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all tap-highlight-fix ${
                  splitMode === "equal" ? "border-[#FF6A00] bg-[#FF6A00]/10 text-[#FF6A00]" : "border-[#E2E8F0] text-[#4A5568] bg-[#F8FAFC]"
                }`}
              >
                <Equal className="w-4 h-4" /> {t('equal_split')}
              </button>
              <button
                onClick={() => setSplitMode("itemized")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all tap-highlight-fix ${
                  splitMode === "itemized" ? "border-[#FF6A00] bg-[#FF6A00]/10 text-[#FF6A00]" : "border-[#E2E8F0] text-[#4A5568] bg-[#F8FAFC]"
                }`}
              >
                <List className="w-4 h-4" /> {t('itemized_split')}
              </button>
            </div>
          </div>

          {/* Participants */}
          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2 block">
              <Users className="w-3 h-3 inline mr-1" /> {t('participants')}
            </label>

            {/* App users quick-add */}
            {appUsers.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] text-[#8FA4C8] mb-1.5 font-medium">{t('from_app_contacts')}:</p>
                <div className="flex flex-wrap gap-1.5">
                  {appUsers.filter(u => !participants.find(p => p.email === u.email)).map(u => (
                    <button key={u.id} onClick={() => addFromAppUser(u)}
                      className="flex items-center gap-1.5 text-xs bg-[#F2F4F7] hover:bg-[#FF6A00]/10 hover:border-[#FF6A00] border border-[#E2E8F0] rounded-full px-2.5 py-1 transition-all">
                      <span className="w-4 h-4 rounded-full bg-[#FF6A00] text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                        {u.full_name?.[0]?.toUpperCase() || "?"}
                      </span>
                      <span className="text-[#1A1A1A] font-medium">{u.full_name}</span>
                      <Plus className="w-3 h-3 text-[#8FA4C8]" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-2">
              {participants.map(p => (
                <div key={p.name} className="flex items-center gap-1 bg-[#F2F4F7] rounded-full px-3 py-1">
                  <span className="text-xs font-medium text-[#1A1A1A]">{p.name}</span>
                  {p.name !== "Saya" && (
                    <>
                      {p.email && (
                        <button onClick={() => inviteParticipant(p.email)} disabled={inviting === p.email}
                          title={`Invite ${p.email}`}
                          className="text-[#8FA4C8] hover:text-[#FF6A00] transition-colors ml-0.5">
                          <Mail className="w-3 h-3" />
                        </button>
                      )}
                      <button onClick={() => removeParticipant(p.name)} className="text-[#9B9B9B] hover:text-red-500 transition-colors ml-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  className="flex-1 border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-white tap-highlight-fix"
                  placeholder={t('friend_name')}
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addParticipant()}
                />
                <button onClick={addParticipant} disabled={!newName.trim()}
                  className="px-4 py-3 rounded-xl bg-[#0A0A0A] text-white disabled:opacity-40 hover:bg-[#333] transition-colors tap-highlight-fix">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <input
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-white tap-highlight-fix"
                placeholder={t('email_optional')}
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Items (for itemized mode) */}
          {splitMode === "itemized" && (
            <div>
              <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2 block">{t('item_allocation')}</label>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="border border-[#E2E8F0] rounded-xl p-3 bg-[#F8FAFC]">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-semibold text-[#1A1A1A]">{item.name}</p>
                        <p className="text-xs text-[#8FA4C8]">{item.quantity}x · {formatRupiah(item.price)}</p>
                      </div>
                      <p className="text-sm font-bold text-[#1A1A1A]">{formatRupiah(item.price * item.quantity)}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {participants.map(p => (
                        <button
                          key={p.name}
                          onClick={() => toggleItemAllocation(idx, p.name)}
                          className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                            item.allocated_to.includes(p.name)
                              ? "bg-[#FF6A00] border-[#FF6A00] text-white"
                              : "bg-white border-[#E2E8F0] text-[#4A5568] hover:border-[#FF6A00]"
                          }`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                    {item.allocated_to.length === 0 && (
                      <p className="text-[10px] text-[#F5A623] mt-1">⚠ {t('not_allocated_equal_split')}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2 block">{t('summary')}</label>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl divide-y divide-[#F2F4F7]">
              {shares.map(s => (
                <div key={s.name} className="flex justify-between items-center px-4 py-3">
                  <div>
                    <span className="text-sm font-medium text-[#1A1A1A]">{s.name}</span>
                    {s.name !== "Saya" && <span className="ml-2 text-[10px] text-[#8FA4C8]">→ {t('iou_will_be_created')}</span>}
                  </div>
                  <span className="text-sm font-bold text-[#FF6A00]">{formatRupiah(s.amount)}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-[#8FA4C8] mt-2">* {t('iou_appear_debts_page')}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white rounded-b-3xl px-6 pb-6 pt-3 border-t border-[#E2E8F0]">
          <button
            onClick={handleConfirm}
            disabled={participants.length === 0}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-[#FF6A00] hover:bg-[#e05e00] disabled:opacity-40 transition-colors tap-highlight-fix"
          >
            {t('confirm_record_transaction')}
          </button>
        </div>
      </div>
    </div>
  );
}