export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 32 32" aria-hidden="true" className="size-8">
        <rect x="1" y="1" width="30" height="30" rx="3" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M8 23.5V13.2a8 8 0 0 1 16 0v10.3" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M12.2 23.5v-8.2a3.8 3.8 0 0 1 7.6 0v8.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </svg>
      <span className="leading-none">
        <span className="block font-serif text-[1.15rem] tracking-[0.14em]">ROMA</span>
        <span className="block text-[10px] tracking-[0.32em] opacity-60">PACK</span>
      </span>
    </span>
  );
}
