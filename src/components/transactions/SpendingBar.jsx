import { useMemo } from "react";

export default function SpendingBar({ transactions, categories }) {
  const data = useMemo(() => {
    const expenses = transactions.filter(t => t.type === "expense");
    const total = expenses.reduce((s, t) => s + (t.amount || 0), 0);
    if (total === 0) return null;

    const byCategory = {};
    expenses.forEach(t => {
      const key = t.category || "other";
      byCategory[key] = (byCategory[key] || 0) + (t.amount || 0);
    });

    const items = Object.entries(byCategory)
      .map(([key, amount]) => {
        const cat = categories.find(c => c.id === key || c.name?.toLowerCase() === key?.toLowerCase());
        return {
          key,
          amount,
          pct: Math.round((amount / total) * 100),
          color: cat?.color || "#95A5A6",
          label: cat?.name || key,
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);

    return { items, total };
  }, [transactions, categories]);

  if (!data) return null;

  return (
    <div className="mt-3">
      {/* Bar */}
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
        {data.items.map(item => (
          <div
            key={item.key}
            style={{ width: `${item.pct}%`, backgroundColor: item.color }}
            className="rounded-full"
          />
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {data.items.map(item => (
          <div key={item.key} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-[10px] text-[#8FA4C8]">{item.label} {item.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}