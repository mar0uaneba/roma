import Image from "next/image";

/** Roma Pack logo: the official RP emblem with the wordmark. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image src="/brand/emblem.png" alt="" width={40} height={40} priority className="size-9 shrink-0 rounded-full shadow-[0_0_0_1px_rgba(166,132,86,0.35)] md:size-10" />
      <span className="leading-none">
        <span className="block font-serif text-[1.15rem] tracking-[0.14em]">ROMA</span>
        <span className="block text-[10px] tracking-[0.32em] opacity-60">PACK</span>
      </span>
    </span>
  );
}
