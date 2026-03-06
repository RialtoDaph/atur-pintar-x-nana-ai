import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { formatRupiah } from "@/components/utils/formatRupiah";

export default function FinancialCalendar({ transactions, debts, goals }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get calendar days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const dayOffset = i - startingDayOfWeek;
    if (dayOffset < 0 || dayOffset >= daysInMonth) return null;
    return dayOffset + 1;
  });

  // Build day data
  const dayData = useMemo(() => {
    const data = {};

    // Add transactions
    transactions.forEach((tx) => {
      const txDate = new Date(tx.date);
      if (txDate.getMonth() === month && txDate.getFullYear() === year) {
        const day = txDate.getDate();
        if (!data[day]) data[day] = { income: 0, expense: 0, events: [] };
        if (tx.type === "income") data[day].income += tx.amount;
        else if (tx.type === "expense") data[day].expense += tx.amount;
      }
    });

    // Add debt due dates
    debts.forEach((debt) => {
      const dueDate = new Date(debt.due_date);
      if (dueDate.getMonth() === month && dueDate.getFullYear() === year) {
        const day = dueDate.getDate();
        if (!data[day]) data[day] = { income: 0, expense: 0, events: [] };
        data[day].events.push({
          type: "debt",
          title: `Tagihan: ${debt.name}`,
          amount: debt.monthly_payment,
          icon: "💳",
        });
      }
    });

    // Add goal deadlines
    goals.forEach((goal) => {
      if (goal.deadline) {
        const deadline = new Date(goal.deadline);
        if (deadline.getMonth() === month && deadline.getFullYear() === year) {
          const day = deadline.getDate();
          if (!data[day]) data[day] = { income: 0, expense: 0, events: [] };
          data[day].events.push({
            type: "goal",
            title: `Target: ${goal.name}`,
            amount: goal.target_amount - (goal.current_amount || 0),
            icon: "🎯",
          });
        }
      }
    });

    return data;
  }, [month, year, transactions, debts, goals]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthName = new Date(year, month, 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  const weekDays = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  return (
    <div className="bg-white rounded-2xl shadow-sm">
      {/* Header - Collapsible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-[#F2F4F7] transition-colors rounded-2xl"
      >
        <h2 className="font-bold text-[#0A0A0A] text-base">Kalender Keuangan</h2>
        <ChevronDown className={`w-5 h-5 text-[#8FA4C8] transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Content - Expandable */}
      {isOpen && (
        <div className="px-4 pb-4 border-t border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-4 mt-4">
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-1 hover:bg-[#F2F4F7] rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-[#8FA4C8]" />
              </button>
              <span className="text-sm font-semibold text-[#0A0A0A] min-w-[100px] text-center">
                {monthName}
              </span>
              <button
                onClick={nextMonth}
                className="p-1 hover:bg-[#F2F4F7] rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-[#8FA4C8]" />
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-2 flex-wrap mb-3 pb-3 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#00C9A7]" />
              <span className="text-[9px] text-[#8FA4C8]">Income</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#FF6B6B]" />
              <span className="text-[9px] text-[#8FA4C8]">Expense</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#FF6A00]" />
              <span className="text-[9px] text-[#8FA4C8]">Event</span>
            </div>
          </div>

          {/* Calendar Grid */}
          <div>
            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-[9px] font-semibold text-[#8FA4C8] py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                const data = day ? dayData[day] : null;
                const hasIncome = data && data.income > 0;
                const hasExpense = data && data.expense > 0;
                const hasEvents = data && data.events && data.events.length > 0;
                const today = new Date();
                const isToday =
                  day &&
                  day === today.getDate() &&
                  month === today.getMonth() &&
                  year === today.getFullYear();

                return (
                  <div
                    key={i}
                    className={`aspect-square rounded p-1 text-[9px] flex flex-col justify-between transition-colors ${
                      !day
                        ? "bg-transparent"
                        : isToday
                        ? "bg-[#FF6A00]/10 border border-[#FF6A00]"
                        : "bg-[#F2F4F7] hover:bg-[#E2E8F0]"
                    }`}
                  >
                    {day && (
                      <>
                        <span
                          className={`font-semibold text-[8px] ${
                            isToday ? "text-[#FF6A00]" : "text-[#0A0A0A]"
                          }`}
                        >
                          {day}
                        </span>

                        {/* Indicator dots */}
                        <div className="flex gap-0.5 flex-wrap">
                          {hasIncome && (
                            <div className="w-1 h-1 rounded-full bg-[#00C9A7]" />
                          )}
                          {hasExpense && (
                            <div className="w-1 h-1 rounded-full bg-[#FF6B6B]" />
                          )}
                          {hasEvents && (
                            <div className="w-1 h-1 rounded-full bg-[#FF6A00]" />
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day details */}
          <div className="mt-4 pt-3 border-t border-[#E2E8F0]">
            <p className="text-[9px] text-[#8FA4C8] mb-2">Pilih tanggal untuk detail</p>
            <DayDetailSelector dayData={dayData} monthYear={{ month, year }} />
          </div>
        </div>
      )}
    </div>
  );
}

function DayDetailSelector({ dayData, monthYear }) {
  const [selectedDay, setSelectedDay] = useState(null);

  const daysWithData = Object.keys(dayData)
    .filter((day) => dayData[day].income > 0 || dayData[day].expense > 0 || dayData[day].events.length > 0)
    .sort((a, b) => a - b);

  if (!daysWithData.length) {
    return (
      <p className="text-xs text-[#8FA4C8] text-center py-6">
        Tidak ada transaksi atau event di bulan ini
      </p>
    );
  }

  const currentDay = selectedDay || daysWithData[0];
  const data = dayData[currentDay];

  return (
    <>
      {/* Day selector buttons */}
      <div className="flex gap-1 flex-wrap mb-2">
        {daysWithData.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(Number(day))}
            className={`px-2 py-1 rounded text-[9px] font-medium transition-colors ${
              Number(day) === currentDay
                ? "bg-[#FF6A00] text-white"
                : "bg-[#F2F4F7] text-[#8FA4C8] hover:bg-[#E2E8F0]"
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Day details */}
      <div className="space-y-2">
        {data.income > 0 && (
          <div className="bg-[#00C9A7]/10 rounded p-2">
            <p className="text-[9px] text-[#00C9A7] font-semibold mb-0.5">Pendapatan</p>
            <p className="text-xs font-bold text-[#00C9A7]">{formatRupiah(data.income)}</p>
          </div>
        )}

        {data.expense > 0 && (
          <div className="bg-[#FF6B6B]/10 rounded p-2">
            <p className="text-[9px] text-[#FF6B6B] font-semibold mb-0.5">Pengeluaran</p>
            <p className="text-xs font-bold text-[#FF6B6B]">{formatRupiah(data.expense)}</p>
          </div>
        )}

        {data.events.map((event, i) => (
          <div key={i} className="bg-[#FF6A00]/10 rounded p-2">
            <p className="text-[9px] text-[#FF6A00] font-semibold mb-0.5">
              {event.icon} {event.title}
            </p>
            <p className="text-xs font-bold text-[#FF6A00]">{formatRupiah(event.amount)}</p>
          </div>
        ))}
      </div>
    </>
  );
}