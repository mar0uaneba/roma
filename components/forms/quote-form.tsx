"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Info, Loader2, Send } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { useI18n } from "@/components/i18n/locale-provider";
import { WhatsAppIcon } from "@/components/brand/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { site, whatsappHref } from "@/lib/site";
import { quoteSchema, type QuoteInput } from "@/lib/validations";

type QuoteResponse = {
  ok: boolean;
  persisted?: "saved" | "unconfigured" | "failed" | "ignored";
  emailed?: "sent" | "unconfigured" | "failed" | "skipped";
  message: string;
};

type Option = { label: string; value: string };

const selectClass =
  "h-12 w-full appearance-none rounded-md border border-line bg-card bg-[length:12px] bg-no-repeat px-3 pe-9 text-sm outline-none transition-colors focus:border-accent bg-[position:right_0.9rem_center] rtl:bg-[position:left_0.9rem_center]";
const chevron =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='%236d645b' stroke-width='1.5'/%3E%3C/svg%3E\")";

export function QuoteForm({
  products,
  categories,
  sectors,
  initialProduct = "",
}: {
  products: Option[];
  categories: Option[];
  sectors: Option[];
  initialProduct?: string;
}) {
  const { lang, t } = useI18n();
  const [result, setResult] = useState<QuoteResponse | null>(null);
  const [submitted, setSubmitted] = useState<QuoteInput | null>(null);
  const form = useForm<QuoteInput>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      company: "",
      contactName: "",
      email: "",
      phone: "",
      city: "",
      sector: sectors[0]?.value ?? "",
      product: initialProduct,
      quantity: "",
      message: "",
      companyWebsite: "",
      locale: lang,
    },
  });

  const errors = form.formState.errors;
  const errorText = (message?: string) =>
    message ? ((t.form.errors as Record<string, string>)[message] ?? message) : undefined;

  const composed = composeMessage(t.form, submitted);
  const whatsapp = whatsappHref(composed);

  async function onSubmit(input: QuoteInput) {
    setSubmitted(input);
    setResult(null);
    try {
      const response = await fetch("/api/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, locale: lang }),
      });
      const payload = (await response.json()) as QuoteResponse;
      setResult(payload);
      if (payload.persisted === "saved") form.reset({ ...form.getValues(), message: "", quantity: "", product: "" });
    } catch {
      setResult({ ok: false, message: t.form.networkError });
    }
  }

  const saved = result?.persisted === "saved" || result?.persisted === "ignored";

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="relative space-y-5" noValidate>
      <input type="hidden" {...form.register("locale")} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t.form.company} error={errorText(errors.company?.message)} htmlFor="company" required>
          <Input id="company" autoComplete="organization" aria-invalid={Boolean(errors.company)} {...form.register("company")} />
        </Field>
        <Field label={t.form.contactName} error={errorText(errors.contactName?.message)} htmlFor="contactName" required>
          <Input id="contactName" autoComplete="name" aria-invalid={Boolean(errors.contactName)} {...form.register("contactName")} />
        </Field>
        <Field label={t.form.email} error={errorText(errors.email?.message)} htmlFor="email" required>
          <Input id="email" type="email" dir="ltr" autoComplete="email" aria-invalid={Boolean(errors.email)} {...form.register("email")} />
        </Field>
        <Field label={t.form.phone} error={errorText(errors.phone?.message)} htmlFor="phone" required>
          <Input id="phone" type="tel" dir="ltr" autoComplete="tel" placeholder="+212 6…" aria-invalid={Boolean(errors.phone)} {...form.register("phone")} />
        </Field>
        <Field label={t.form.city} error={errorText(errors.city?.message)} htmlFor="city">
          <Input id="city" autoComplete="address-level2" {...form.register("city")} />
        </Field>
        <Field label={t.form.sector} error={errorText(errors.sector?.message)} htmlFor="sector" required>
          <select id="sector" className={selectClass} style={{ backgroundImage: chevron }} {...form.register("sector")}>
            {sectors.map((sector) => (
              <option key={sector.value} value={sector.value}>
                {sector.label}
              </option>
            ))}
            <option value="Autre">{t.form.sectorOther}</option>
          </select>
        </Field>
        <Field label={t.form.product} error={errorText(errors.product?.message)} htmlFor="product">
          <select id="product" className={selectClass} style={{ backgroundImage: chevron }} {...form.register("product")}>
            <option value="">{t.form.productUnknown}</option>
            {products.map((product) => (
              <option key={product.value} value={product.value}>
                {product.label}
              </option>
            ))}
            {categories.map((category) => (
              <option key={category.value} value={`Gamme : ${category.value}`}>
                {t.form.rangePrefix}
                {category.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t.form.quantity} error={errorText(errors.quantity?.message)} htmlFor="quantity">
          <Input id="quantity" placeholder={t.form.quantityPlaceholder} {...form.register("quantity")} />
        </Field>
      </div>
      <Field label={t.form.message} error={errorText(errors.message?.message)} htmlFor="message" required>
        <Textarea id="message" placeholder={t.form.messagePlaceholder} aria-invalid={Boolean(errors.message)} {...form.register("message")} />
      </Field>
      <div className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0" aria-hidden="true">
        <label htmlFor="companyWebsite">{t.form.honeypot}</label>
        <input id="companyWebsite" tabIndex={-1} autoComplete="off" {...form.register("companyWebsite")} />
      </div>
      <Button type="submit" size="lg" disabled={form.formState.isSubmitting} className="w-full sm:w-auto">
        {form.formState.isSubmitting ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="size-4 rtl:-scale-x-100" aria-hidden="true" />
        )}
        {form.formState.isSubmitting ? t.form.sending : t.form.submit}
      </Button>
      <AnimatePresence>
        {result ? (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`flex gap-3 rounded-md border px-4 py-4 text-sm leading-6 ${saved ? "border-[#1f6b45]/30 bg-[#eef6f1]" : "border-gold/40 bg-[#f7f1e4]"}`}
          >
            {saved ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#1f6b45]" aria-hidden="true" />
            ) : (
              <Info className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden="true" />
            )}
            <div>
              <p>{result.message}</p>
              {!saved ? (
                <div className="mt-3 flex flex-wrap gap-4">
                  {whatsapp ? (
                    <a href={whatsapp} className="inline-flex items-center gap-2 font-medium underline" target="_blank" rel="noopener noreferrer">
                      <WhatsAppIcon className="size-4" />
                      {t.form.openWhatsapp}
                    </a>
                  ) : null}
                  {site.email ? (
                    <a
                      href={`mailto:${site.email}?subject=${encodeURIComponent(t.form.emailSubject)}&body=${encodeURIComponent(composed)}`}
                      className="font-medium underline"
                    >
                      {t.form.sendEmail}
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>
        {label}
        {required ? (
          <span className="text-accent" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </Label>
      {children}
      {error ? (
        <p className="text-sm text-accent" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function composeMessage(labels: { composeHello: string; company: string; contactName: string; phone: string; email: string; city: string; sector: string; product: string; quantity: string }, values: QuoteInput | null) {
  if (!values) return labels.composeHello;
  return [
    labels.composeHello,
    "",
    `${labels.company} : ${values.company || ""}`,
    `${labels.contactName} : ${values.contactName || ""}`,
    `${labels.phone} : ${values.phone || ""}`,
    `${labels.email} : ${values.email || ""}`,
    `${labels.city} : ${values.city || ""}`,
    `${labels.sector} : ${values.sector || ""}`,
    `${labels.product} : ${values.product || ""}`,
    `${labels.quantity} : ${values.quantity || ""}`,
    "",
    values.message || "",
  ].join("\n");
}
