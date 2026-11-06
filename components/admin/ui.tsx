import { CheckCircle2, CircleX, Info, TriangleAlert } from "lucide-react";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* Server-safe building blocks for the admin. Client pieces live in ./client.tsx. */

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-adm-text md:text-[1.7rem]">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-adm-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({
  title,
  action,
  children,
  className,
  padded = true,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={cn("rounded-xl border border-adm-line bg-adm-panel", className)}>
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-adm-line px-5 py-3.5">
          <h2 className="text-sm font-medium text-adm-text">{title}</h2>
          {action}
        </header>
      ) : null}
      <div className={padded ? "p-5" : undefined}>{children}</div>
    </section>
  );
}

export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const points = values
    .map((value, index) => `${(index / (values.length - 1)) * 100},${30 - ((value - min) / span) * 28 - 1}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={cn("h-8 w-full", className)} aria-hidden="true">
      <polyline points={points} fill="none" stroke="var(--color-adm-accent)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function Stat({
  label,
  value,
  delta,
  hint,
  series,
  tone,
}: {
  label: string;
  value: string;
  delta?: number | null;
  hint?: string;
  series?: number[];
  tone?: "default" | "green" | "red";
}) {
  return (
    <div className="rounded-xl border border-adm-line bg-adm-panel p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-adm-muted">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className={cn("text-2xl font-semibold tabular-nums", tone === "green" && "text-adm-green", tone === "red" && "text-adm-red")}>{value}</p>
        {typeof delta === "number" && Number.isFinite(delta) ? (
          <span className={cn("text-xs font-medium tabular-nums", delta >= 0 ? "text-adm-green" : "text-adm-red")}>
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(0)}%
          </span>
        ) : null}
      </div>
      {hint ? <p className="mt-1 text-xs text-adm-muted">{hint}</p> : null}
      {series ? <Sparkline values={series} className="mt-3" /> : null}
    </div>
  );
}

export function Tabs({ items, active }: { items: { key: string; label: string; href: string; count?: number }[]; active: string }) {
  return (
    <nav className="mb-4 flex gap-1 overflow-x-auto border-b border-adm-line" aria-label="Tabs">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={cn(
            "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm transition-colors",
            item.key === active ? "border-adm-accent text-adm-text" : "border-transparent text-adm-muted hover:text-adm-text",
          )}
          aria-current={item.key === active ? "page" : undefined}
        >
          {item.label}
          {typeof item.count === "number" && item.count > 0 ? (
            <span className="rounded-full bg-adm-raised px-1.5 py-0.5 text-[11px] tabular-nums text-adm-muted">{item.count}</span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}

export function BarList({ items, format = (value) => String(value) }: { items: { label: ReactNode; value: number; href?: string }[]; format?: (value: number) => string }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  if (items.length === 0) return <Empty title="Nothing yet" />;
  return (
    <ul className="space-y-2">
      {items.map((item, index) => {
        const inner = (
          <div className="relative overflow-hidden rounded-md px-3 py-2">
            <div className="absolute inset-y-0 left-0 rounded-md bg-adm-accent/12" style={{ width: `${(item.value / max) * 100}%` }} />
            <div className="relative flex items-center justify-between gap-3 text-sm">
              <span className="truncate">{item.label}</span>
              <span className="shrink-0 tabular-nums text-adm-muted">{format(item.value)}</span>
            </div>
          </div>
        );
        return <li key={index}>{item.href ? <Link href={item.href} className="block hover:opacity-80">{inner}</Link> : inner}</li>;
      })}
    </ul>
  );
}

/** Dependency-free SVG area chart. */
export function AreaChart({ data, format = (value) => String(value), height = 180 }: { data: { label: string; value: number }[]; format?: (value: number) => string; height?: number }) {
  if (data.length === 0) return <Empty title="No data for this period" />;
  const width = 600;
  const max = Math.max(...data.map((point) => point.value), 1);
  const step = data.length > 1 ? width / (data.length - 1) : width;
  const y = (value: number) => height - 18 - (value / max) * (height - 34);
  const line = data.map((point, index) => `${index * step},${y(point.value)}`).join(" L ");
  const area = `M 0,${height - 18} L ${line} L ${(data.length - 1) * step},${height - 18} Z`;
  const ticks = [0, Math.floor((data.length - 1) / 2), data.length - 1].filter((value, index, list) => list.indexOf(value) === index);
  const total = data.reduce((sum, point) => sum + point.value, 0);

  return (
    <figure>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={`Total ${format(total)}`}>
        <defs>
          <linearGradient id="adm-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-adm-accent)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-adm-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line key={ratio} x1="0" x2={width} y1={y(max * ratio)} y2={y(max * ratio)} stroke="var(--color-adm-line)" strokeDasharray="3 5" />
        ))}
        <path d={area} fill="url(#adm-area)" />
        <path d={`M ${line}`} fill="none" stroke="var(--color-adm-accent)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {data.map((point, index) => (
          <circle key={point.label} cx={index * step} cy={y(point.value)} r="2.5" fill="var(--color-adm-accent)">
            <title>{`${point.label}: ${format(point.value)}`}</title>
          </circle>
        ))}
        {ticks.map((index) => (
          <text
            key={index}
            x={index * step}
            y={height - 2}
            fontSize="11"
            fill="var(--color-adm-muted)"
            textAnchor={index === 0 ? "start" : index === data.length - 1 ? "end" : "middle"}
          >
            {data[index]?.label}
          </text>
        ))}
      </svg>
    </figure>
  );
}

const tones = {
  green: "bg-adm-green/10 text-adm-green ring-adm-green/25",
  amber: "bg-adm-amber/10 text-adm-amber ring-adm-amber/25",
  red: "bg-adm-red/10 text-adm-red ring-adm-red/25",
  blue: "bg-adm-blue/10 text-adm-blue ring-adm-blue/25",
  gray: "bg-white/5 text-adm-muted ring-white/10",
  orange: "bg-adm-accent/10 text-adm-accent ring-adm-accent/25",
} as const;

export type Tone = keyof typeof tones;

export function StatusBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", tones[tone])}>{children}</span>;
}

export function Notice({ tone = "blue", title, children }: { tone?: "blue" | "amber" | "red" | "green"; title?: string; children: ReactNode }) {
  const Icon = tone === "green" ? CheckCircle2 : tone === "red" ? CircleX : tone === "amber" ? TriangleAlert : Info;
  return (
    <div className={cn("flex gap-3 rounded-xl px-4 py-3 text-sm ring-1 ring-inset", tones[tone])}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="text-adm-text/90">
        {title ? <p className="font-medium">{title}</p> : null}
        <div className={title ? "mt-0.5 text-adm-muted" : undefined}>{children}</div>
      </div>
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-adm-line px-6 py-10 text-center">
      <p className="text-sm font-medium text-adm-text">{title}</p>
      {children ? <div className="mt-1 text-sm text-adm-muted">{children}</div> : null}
    </div>
  );
}

/** Messages passed back after an action with ?ok= or ?err=. */
export function Flash({ ok, err }: { ok?: string | string[]; err?: string | string[] }) {
  const success = typeof ok === "string" ? ok : null;
  const error = typeof err === "string" ? err : null;
  if (!success && !error) return null;
  return <div className="mb-4">{error ? <Notice tone="red">{error}</Notice> : <Notice tone="green">{success}</Notice>}</div>;
}

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost"; size?: "sm" | "md" }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function buttonClass(variant: "primary" | "secondary" | "danger" | "ghost" = "secondary", size: "sm" | "md" = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
    size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm",
    variant === "primary" && "bg-adm-accent text-[#140a04] hover:bg-adm-accent-strong",
    variant === "secondary" && "border border-adm-line bg-adm-raised text-adm-text hover:border-adm-muted/50",
    variant === "danger" && "border border-adm-red/30 bg-adm-red/10 text-adm-red hover:bg-adm-red/20",
    variant === "ghost" && "text-adm-muted hover:bg-white/5 hover:text-adm-text",
    className,
  );
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-xs font-medium text-adm-muted">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-adm-muted/80">{hint}</span> : null}
    </label>
  );
}

export function KeyValue({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="divide-y divide-adm-line text-sm">
      {items.map(([key, value]) => (
        <div key={key} className="flex items-start justify-between gap-4 py-2">
          <dt className="text-adm-muted">{key}</dt>
          <dd className="text-end">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Table({ head, children, minWidth = "40rem" }: { head: ReactNode[]; children: ReactNode; minWidth?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-adm-line text-xs uppercase tracking-[0.1em] text-adm-muted">
            {head.map((cell, index) => (
              <th key={index} className="whitespace-nowrap px-4 py-2.5 font-medium">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-adm-line">{children}</tbody>
      </table>
    </div>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="h-8 w-48 animate-pulse rounded-md bg-adm-raised" />
      <div className="grid gap-4 md:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <div key={key} className="h-24 animate-pulse rounded-xl bg-adm-panel" />
        ))}
      </div>
      <p className="sr-only">{label}</p>
    </div>
  );
}
