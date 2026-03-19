import { useAppSettings } from "@/components/utils/useAppSettings";
import DateInput from "@/components/utils/DateInput";

export default function TransactionFormInputs({ form, setForm, t }) {
  const { settings } = useAppSettings();

  const formatCurrencyInput = (val) => {
    const numStr = val.replace(new RegExp("\\" + settings.thousand_separator, "g"), "").replace(settings.decimal_separator, ".");
    const num = parseFloat(numStr) || 0;
    const intPart = Math.floor(num);
    const intStr = intPart.toString().split('').reverse();
    const grouped = [];
    for (let i = 0; i < intStr.length; i++) {
      if (i > 0 && i % 3 === 0) grouped.push(settings.thousand_separator);
      grouped.push(intStr[i]);
    }
    return grouped.reverse().join('');
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Amount */}
      <div className="mb-5">
        <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">{t('amount')}</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8FA4C8] font-medium text-base">{settings.currency_symbol}</span>
          <input
            autoFocus type="text" inputMode="numeric"
            className="w-full border border-[#E2E8F0] rounded-xl pl-12 pr-4 py-3.5 text-2xl font-bold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
            placeholder="0"
            value={form.amount}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9.,]/g, "");
              setForm({ ...form, amount: formatCurrencyInput(val) });
            }}
          />
        </div>
      </div>

      {/* Note & Date */}
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">{t('note_optional')}</label>
          <input
            className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC] tap-highlight-fix"
            placeholder={t('note_placeholder')}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </div>
        <DateInput
          value={form.date}
          onChange={(date) => setForm({ ...form, date })}
          label={t('date')}
        />
      </div>


    </div>
  );
}