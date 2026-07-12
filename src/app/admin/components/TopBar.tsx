export default function TopBar() {
  return (
    <div
      className="px-4 py-3 flex items-center gap-2 sticky top-0 z-20"
      style={{ background: "#C8111A" }}
    >
      <div className="w-2 h-2 rounded-full bg-white/50" />
      <div className="text-white text-sm font-semibold">
        ☕ Heraa Coffee · Admin
      </div>
      <div className="ml-auto text-white/60 text-[10px]">v1.0</div>
    </div>
  );
}
