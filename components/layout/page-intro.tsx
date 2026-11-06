import { Reveal } from "@/components/motion/reveal";

export function PageIntro({ eyebrow, title, lead }: { eyebrow: string; title: string; lead?: string }) {
  return (
    <Reveal>
      <p className="flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-gold">
        <span className="h-px w-8 bg-current opacity-60" aria-hidden="true" />
        {eyebrow}
      </p>
      <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-[1.02] tracking-tight text-ink md:text-6xl">{title}</h1>
      {lead ? <p className="mt-5 max-w-xl leading-7 text-muted">{lead}</p> : null}
    </Reveal>
  );
}
