import { Plus } from "lucide-react";

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item, index) => (
        <details key={item.q} className="group" open={index === 0}>
          <summary className="flex cursor-pointer items-center justify-between gap-6 py-6 text-start">
            <span className="font-serif text-xl text-ink transition-colors group-hover:text-accent md:text-2xl">{item.q}</span>
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-line transition-[transform,background-color,color] duration-300 group-open:rotate-45 group-open:bg-ink group-open:text-background">
              <Plus className="size-4" aria-hidden="true" />
            </span>
          </summary>
          <p className="max-w-2xl pb-6 leading-7 text-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
