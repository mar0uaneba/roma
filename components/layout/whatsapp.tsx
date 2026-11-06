import { getDictionary, type Locale } from "@/lib/i18n";
import { WhatsAppIcon } from "@/components/brand/whatsapp-icon";
import { whatsappHref } from "@/lib/site";

export function WhatsAppButton({ lang }: { lang: Locale }) {
  const t = getDictionary(lang);
  const href = whatsappHref(t.contact.whatsappMessage);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed bottom-5 end-5 z-30 inline-flex items-center gap-2 rounded-full bg-[#1f6b45] py-3 pe-5 ps-4 text-sm font-medium text-white shadow-[0_18px_40px_-12px_rgba(31,107,69,0.6)] transition-transform duration-300 hover:-translate-y-0.5"
    >
      <WhatsAppIcon className="size-5 transition-transform duration-300 group-hover:scale-110" />
      {t.common.whatsapp}
      <span className="sr-only">{t.common.whatsappSr}</span>
    </a>
  );
}
