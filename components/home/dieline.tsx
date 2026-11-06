"use client";

import { motion, useReducedMotion } from "motion/react";

const cuts = [
  "M50 120 H450 V300 H50 Z",
  "M50 128 L24 140 L24 280 L50 292",
  "M50 120 V48 Q50 40 58 40 H162 Q170 40 170 48 V120",
  "M58 40 Q60 18 80 18 H140 Q160 18 162 40",
  "M170 120 L178 86 Q180 80 186 80 H234 Q240 80 242 86 L250 120",
  "M370 120 L378 86 Q380 80 386 80 H434 Q440 80 442 86 L450 120",
  "M250 300 V372 Q250 380 258 380 H362 Q370 380 370 372 V300",
  "M258 380 Q260 402 280 402 H340 Q360 402 362 380",
  "M170 300 L178 334 Q180 340 186 340 H234 Q240 340 242 334 L250 300",
  "M370 300 L378 334 Q380 340 386 340 H434 Q440 340 442 334 L450 300",
];

const folds = ["M170 120 V300", "M250 120 V300", "M370 120 V300", "M50 120 H170", "M250 300 H370", "M50 128 V292", "M58 40 H162", "M258 380 H362"];

/** An unfolded tuck-end box template that draws itself when scrolled into view. */
export function Dieline({ className, label }: { className?: string; label: string }) {
  const reduce = useReducedMotion();
  const ease = [0.65, 0, 0.35, 1] as const;

  return (
    <svg viewBox="0 0 474 440" className={className} role="img" aria-label={label}>
      <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
        {cuts.map((d, index) => (
          <motion.path
            key={d}
            d={d}
            initial={reduce ? false : { pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true, margin: "0px 0px -15% 0px" }}
            transition={{ duration: 1.4, ease, delay: index * 0.12 }}
          />
        ))}
      </g>
      <motion.g
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1"
        strokeDasharray="5 5"
        initial={reduce ? false : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 1.5 }}
      >
        {folds.map((d) => (
          <path key={d} d={d} />
        ))}
      </motion.g>
      <motion.g
        initial={reduce ? false : { opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 1.9 }}
      >
        <g transform="translate(110 196)" fill="none" stroke="currentColor">
          <path d="M-12 18V4a12 12 0 0 1 24 0v14" strokeWidth="1.5" />
          <path d="M-6 18V7a6 6 0 0 1 12 0v11" stroke="var(--accent)" strokeWidth="1.3" />
        </g>
        <text x="110" y="240" textAnchor="middle" fontSize="13" letterSpacing="3" fill="currentColor" style={{ fontFamily: "var(--font-fraunces)" }}>
          ROMA
        </text>
        <text x="110" y="255" textAnchor="middle" fontSize="7" letterSpacing="4" fill="currentColor" opacity="0.6">
          PACK
        </text>
        <g stroke="currentColor" strokeWidth="0.8" opacity="0.45">
          <path d="M50 424 H450" />
          <path d="M50 418 V430 M450 418 V430" />
          <path d="M466 120 V300 M460 120 H472 M460 300 H472" />
        </g>
        <text x="250" y="436" textAnchor="middle" fontSize="8" letterSpacing="2" fill="currentColor" opacity="0.6">
          L · l · h
        </text>
        <g fill="currentColor" opacity="0.12">
          <path d="M260 130h100v160H260z" />
        </g>
      </motion.g>
    </svg>
  );
}
