"use client";

import { Eye, Send } from "lucide-react";
import { useState } from "react";
import { SubmitButton } from "@/components/admin/client";
import { buttonClass } from "@/components/admin/ui";

type Locale = "fr" | "ar";

type Context = { product: string | null; quantity: string | null; phone: string; city: string | null };

/** Starting points for the most common replies. The admin edits the text before sending. */
function templates(locale: Locale, context: Context) {
  const product = context.product ?? (locale === "ar" ? "المنتج المطلوب" : "le produit demandé");
  const quantity = context.quantity ?? (locale === "ar" ? "الكمية المطلوبة" : "la quantité demandée");
  if (locale === "ar") {
    return [
      {
        label: "Offer (AR)",
        text: `شكراً على طلبكم. هذا اقتراحنا بخصوص ${product}:\n\n- المرجع: \n- الكمية: ${quantity}\n- السعر للوحدة: \n- المجموع: \n- أجل التسليم: \n\nالدفع يتم عند التسليم. أخبرونا إن كنتم ترغبون في تأكيد الطلب.`,
      },
      {
        label: "Need details (AR)",
        text: `شكراً على طلبكم. لنقدّم لكم عرضاً دقيقاً، هل يمكنكم تحديد:\n\n- المقاس أو الأبعاد المطلوبة\n- الكمية في كل طلبية\n- مدينة التسليم${context.city ? ` (${context.city}؟)` : ""}\n\nوسنعود إليكم بعرض السعر في أقرب وقت.`,
      },
      {
        label: "Call back (AR)",
        text: `شكراً على طلبكم. نودّ مناقشته معكم هاتفياً لفهم حاجتكم جيداً. متى يمكننا الاتصال بكم على الرقم ${context.phone}؟`,
      },
    ];
  }
  return [
    {
      label: "Offer",
      text: `Merci pour votre demande. Voici notre proposition pour ${product} :\n\n- Référence : \n- Quantité : ${quantity}\n- Prix unitaire : \n- Total : \n- Délai de livraison : \n\nLe paiement se fait à la livraison. Dites-nous si vous souhaitez confirmer la commande.`,
    },
    {
      label: "Need details",
      text: `Merci pour votre demande. Pour vous faire une offre précise, pouvez-vous nous indiquer :\n\n- le format ou les dimensions souhaités\n- la quantité par commande\n- la ville de livraison${context.city ? ` (${context.city} ?)` : ""}\n\nNous revenons vers vous avec le devis dès réception.`,
    },
    {
      label: "Call back",
      text: `Merci pour votre demande. Nous aimerions en parler avec vous pour bien comprendre votre besoin. À quel moment pouvons-nous vous appeler au ${context.phone} ?`,
    },
  ];
}

export function ReplyComposer({
  quoteId,
  locale,
  defaultSubject,
  customerName,
  customerEmail,
  context,
  action,
}: {
  quoteId: string;
  locale: Locale;
  defaultSubject: string;
  customerName: string;
  customerEmail: string;
  context: Context;
  action: (form: FormData) => void | Promise<void>;
}) {
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState("");
  const dir = locale === "ar" ? "rtl" : "ltr";

  const preview = () => {
    const query = new URLSearchParams({ subject, message });
    window.open(`/admin/quotes/${quoteId}/preview?${query.toString()}`, "_blank", "noopener");
  };

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={quoteId} />
      <p className="text-sm text-adm-muted">
        To <span className="text-adm-text">{customerName}</span> · {customerEmail} · in {locale === "ar" ? "Arabic" : "French"}
      </p>
      <div className="flex flex-wrap gap-2">
        {templates(locale, context).map((template) => (
          <button
            key={template.label}
            type="button"
            onClick={() => setMessage(template.text)}
            className="rounded-full border border-adm-line px-3 py-1 text-xs text-adm-muted transition-colors hover:border-adm-accent hover:text-adm-text"
          >
            {template.label}
          </button>
        ))}
      </div>
      <label className="block">
        <span className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-adm-muted">Subject</span>
        <input name="subject" value={subject} onChange={(event) => setSubject(event.target.value)} required className="admin-input" dir={dir} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-adm-muted">Message</span>
        <textarea
          name="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required
          dir={dir}
          className="admin-input min-h-64 font-[inherit] leading-6"
          placeholder={locale === "ar" ? "اكتب ردك هنا…" : "Écrivez votre réponse ici…"}
        />
        <span className="mt-1.5 block text-xs text-adm-muted">
          The greeting, Roma Pack signature, WhatsApp button and a recap of the request are added automatically, in the website&apos;s style.
        </span>
      </label>
      <div className="flex flex-wrap gap-2">
        <SubmitButton pendingLabel="Sending…">
          <Send className="size-4" aria-hidden="true" /> Send reply
        </SubmitButton>
        <button type="button" onClick={preview} className={buttonClass("secondary")}>
          <Eye className="size-4" aria-hidden="true" /> Preview e-mail
        </button>
      </div>
    </form>
  );
}
