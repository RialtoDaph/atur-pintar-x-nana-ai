import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, X } from "lucide-react";
import { formatRupiah } from "@/components/utils/formatRupiah";

export default function FinancialCalendar({ transactions, debts, goals }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expanded, setExpanded] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const dayOffset = i - startingDayOfWeek;
    if (dayOffset < 0 || dayOffset >= daysInMonth) return null;
    return dayOffset + 1;
  });

  const dayData = useMemo(() => {
    const data = {};

    transactions.forEach((tx) => {
      const txDate = new Date(tx.date);
      if (txDate.getMonth() === month && txDate.getFullYear() === year) {
        const day = txDate.getDate();
        if (!data[day]) data[day] = { income: 0, expense: 0, events: [] };
        if (tx.type === "income") data[day].income += tx.amount;
        else if (tx.type === "expense") data[day].expense += tx.amount;
      }
    });

    debts.forEach((debt) => {
      if (!debt.due_date) return;
      const dueDate = new Date(debt.due_date);
      if (dueDate.getMonth() === month && dueDate.getFullYear() === year) {
        const day = dueDate.getDate();
        if (!data[day]) data[day] = { income: 0, expense: 0, events: [] };
        data[day].events.push({ type: "debt", title: `Tagihan: ${debt.name}`, amount: debt.monthly_payment, icon: "💳" });
      }
    });

    goals.forEach((goal) => {
      if (!goal.deadline) return;
      const deadline = new Date(goal.deadline);
      if (deadline.getMonth() === month && deadline.getFullYear() === year) {
        const day = deadline.getDate();
        if (!data[day]) data[day] = { income: 0, expense: 0, events: [] };
        data[day].events.push({ type: "goal", title: `Target: ${goal.name}`, amount: goal.target_amount - (goal.current_amount || 0), icon: "🎯" });
      }
    });

    return data;
  }, [month, year, transactions, debts, goals]);

  const monthName = new Date(year, month, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  const weekDays = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const today = new Date();

  const handleDayClick = (day) => {
    if (!day || !dayData[day]) return;
    setSelectedDay(selectedDay === day ? null : day);
  };

  // Reset selected day when month changes
  const prevMonth = () => { setSelectedDay(null); setCurrentDate(new Date(year, month - 1, 1)); };
  const nextMonth = () => { setSelectedDay(null); setCurrentDate(new Date(year, month + 1, 1)); };

  const selectedData = selectedDay ? dayData[selectedDay] : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6A00] to-[#FF9A3C] flex items-center justify-center flex-shrink-0">
            <span className="text-sm">📅</span>
          </div>
          <div>
            <p className="text-sm font-bold text-[#1A1A1A]">Kalender Keuangan</p>
            <p className="text-xs text-[#8FA4C8]">Klik tanggal untuk detail</p>
          </div>
        </div>
        <button onClick={() => setExpanded(e => !e)} className="text-[#8FA4C8] hover:text-[#1A1A1A] transition-colors tap-highlight-fix">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {expanded && (
        <div className="px-4 sm:px-5 pb-5 border-t border-[#E2E8F0] pt-4 space-y-3">
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-1 hover:bg-[#F2F4F7] rounded-lg transition-colors">
                <ChevronLeft className="w-4 h-4 text-[#8FA4C8]" />
              </button>
              <span className="text-sm font-semibold text-[#0A0A0A] min-w-[130px] text-center">{monthName}</span>
              <button onClick={nextMonth} className="p-1 hover:bg-[#F2F4F7] rounded-lg transition-colors">
                <ChevronRight className="w-4 h-4 text-[#8FA4C8]" />
              </button>
            </div>
            {/* Legend */}
            <div className="flex gap-2 text-[10px]">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#00C9A7]" /><span className="text-[#8FA4C8]">In</span></div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#FF6B6B]" /><span className="text-[#8FA4C8]">Out</span></div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#FF6A00]" /><span className="text-[#8FA4C8]">Event</span></div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-[9px] font-semibold text-[#8FA4C8] py-1">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                const data = day ? dayData[day] : null;
                const hasIncome = data?.income > 0;
                const hasExpense = data?.expense > 0;
                const hasEvents = data?.events?.length > 0;
                const isToday = day && day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                const isSelected = day === selectedDay;
                const hasData = hasIncome || hasExpense || hasEvents;

                return (
                  <button
                    key={i}
                    onClick={() => handleDayClick(day)}
                    disabled={!day || !hasData}
                    className={`aspect-square rounded-lg p-1 flex flex-col items-center justify-between transition-all tap-highlight-fix ${
                      !day ? "bg-transparent cursor-default" :
                      isSelected ? "bg-[#FF6A00] ring-2 ring-[#FF6A00]/40 shadow-sm" :
                      isToday ? "bg-[#FF6A00]/10 border border-[#FF6A00]" :
                      hasData ? "bg-[#F2F4F7] hover:bg-[#E2E8F0] cursor-pointer" :
                      "bg-[#F2F4F7] cursor-default"
                    }`}
                  >
                    {day && (
                      <>
                        <span className={`font-semibold text-[9px] leading-none mt-0.5 ${
                          isSelected ? "text-white" : isToday ? "text-[#FF6A00]" : "text-[#0A0A0A]"
                        }`}>
                          {day}
                        </span>
                        <div className="flex gap-0.5 mb-0.5">
                          {hasIncome && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white/80" : "bg-[#00C9A7]"}`} />}
                          {hasExpense && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white/80" : "bg-[#FF6B6B]"}`} />}
                          {hasEvents && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white/80" : "bg-[#FF6A00]"}`} />}
                        </div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail Panel — only visible when a day is selected */}
          {selectedDay && selectedData && (
            <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0] animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-[#1A1A1A]">
                  {new Date(year, month, selectedDay).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
                </p>
                <button onClick={() => setSelectedDay(null)} className="text-[#8FA4C8] hover:text-[#1A1A1A] tap-highlight-fix">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedData.income > 0 && (
                  <div className="bg-[#00C9A7]/10 rounded-lg px-3 py-1.5 flex-1 min-w-[80px]">
                    <p className="text-[9px] text-[#00C9A7] font-semibold">Pemasukan</p>
                    <p className="text-xs font-bold text-[#00C9A7]">{formatRupiah(selectedData.income)}</p>
                  </div>
                )}
                {selectedData.expense > 0 && (
                  <div className="bg-[#FF6B6B]/10 rounded-lg px-3 py-1.5 flex-1 min-w-[80px]">
                    <p className="text-[9px] text-[#FF6B6B] font-semibold">Pengeluaran</p>
                    <p className="text-xs font-bold text-[#FF6B6B]">{formatRupiah(selectedData.expense)}</p>
                  </div>
                )}
                {selectedData.events.map((event, i) => (
                  <div key={i} className="bg-[#FF6A00]/10 rounded-lg px-3 py-1.5 flex-1 min-w-[100px]">
                    <p className="text-[9px] text-[#FF6A00] font-semibold">{event.icon} {event.title}</p>
                    {event.amount > 0 && <p className="text-xs font-bold text-[#FF6A00]">{formatRupiah(event.amount)}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}