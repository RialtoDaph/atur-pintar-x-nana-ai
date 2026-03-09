export default function AdminPageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-[#1A1A1A]">{title}</h1>
        {subtitle && <p className="text-sm text-[#8FA4C8] mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}