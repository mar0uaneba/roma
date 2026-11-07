import { Reveal } from "@/components/motion/reveal";

export function PageIntro({ eyebrow, title, lead }: { eyebrow: string; title: string; lead?: string }) {
  return (
    <Reveal className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -start-40 size-[28rem] rounded-full bg-kraft/20 blur-[110px]"
      />
      <p className="relative flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-gold">
        <span className="line-grow h-px w-10 bg-current opacity-70" aria-hidden="true" />
        {eyebrow}
      </p>
      <h1 className="relative mt-5 max-w-3xl font-serif text-5xl leading-[1.02] tracking-tight text-ink md:text-6xl xl:text-[4.5rem]">{title}</h1>
      {lead ? <p className="relative mt-6 max-w-xl text-lg leading-8 text-muted">{lead}</p> : null}
      <div aria-hidden="true" className="relative mt-10 flex items-center gap-3">
        <span className="line-grow h-px flex-1 bg-gradient-to-r from-ink/25 via-line to-transparent rtl:bg-gradient-to-l" />
        <span className="size-1.5 rotate-45 bg-accent" />
      </div>
    </Reveal>
  );
}
