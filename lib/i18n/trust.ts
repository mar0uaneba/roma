import type { Locale } from "@/lib/i18n/config";

/**
 * Trust copy. Every line is a verifiable fact about Roma Pack (legal identity,
 * cash on delivery, free quote, custom printing). No invented reviews or numbers.
 */
const fr = {
  barLabel: "Nos engagements",
  items: [
    { title: "Société enregistrée", text: "SARL AU · RC Rabat {rc} · ICE {ice}" },
    { title: "Paiement à la livraison", text: "Vous réglez à la réception de votre commande." },
    { title: "Devis gratuit", text: "Sans engagement, réponse les jours ouvrés." },
    { title: "Standard ou à votre marque", text: "Formats disponibles et impression sur mesure." },
  ],
  heroBadges: ["Société marocaine enregistrée", "Paiement à la livraison", "Devis gratuit"],
  identityEyebrow: "Identité",
  identityTitle: "Une entreprise marocaine, enregistrée et identifiable.",
  identityText:
    "Vous savez avec qui vous travaillez. Nos informations légales sont publiques et vérifiables auprès du registre du commerce.",
  identityCardTitle: "Fiche d'identité",
  identityRows: {
    legalName: "Raison sociale",
    legalForm: "Forme juridique",
    ice: "ICE",
    rc: "Registre du commerce",
    court: "Tribunal",
    capital: "Capital social",
    incorporated: "Immatriculation",
    activity: "Activité",
  },
  legalFormValue: "SARL AU",
  courtValue: "Tribunal de commerce de Rabat",
  incorporatedValue: "17 juillet 2026",
  activityValue: "Négoce d'emballages",
  identityLink: "Mentions légales",
  sealLabel: "Roma Pack, société enregistrée à Rabat",
  productTrust: ["Paiement à la livraison", "Devis gratuit, sans engagement", "Société enregistrée au Maroc"],
  verified: "Entreprise vérifiable",
};

export type Trust = typeof fr;

const ar: Trust = {
  barLabel: "التزاماتنا",
  items: [
    { title: "شركة مسجّلة", text: "SARL AU · السجل التجاري بالرباط {rc} · ICE {ice}" },
    { title: "الدفع عند التسليم", text: "تؤدّون المبلغ عند استلام طلبيتكم." },
    { title: "عرض سعر مجاني", text: "دون التزام، والرد في أيام العمل." },
    { title: "قياسي أو بعلامتكم", text: "مقاسات متوفرة وطباعة حسب الطلب." },
  ],
  heroBadges: ["شركة مغربية مسجّلة", "الدفع عند التسليم", "عرض سعر مجاني"],
  identityEyebrow: "الهوية",
  identityTitle: "شركة مغربية، مسجّلة ومعروفة الهوية.",
  identityText: "تعرفون مع من تتعاملون. معلوماتنا القانونية علنية ويمكن التحقق منها لدى السجل التجاري.",
  identityCardTitle: "بطاقة التعريف",
  identityRows: {
    legalName: "الاسم التجاري",
    legalForm: "الشكل القانوني",
    ice: "ICE",
    rc: "السجل التجاري",
    court: "المحكمة",
    capital: "رأس المال",
    incorporated: "تاريخ التسجيل",
    activity: "النشاط",
  },
  legalFormValue: "ش.ذ.م.م بشريك وحيد (SARL AU)",
  courtValue: "المحكمة التجارية بالرباط",
  incorporatedValue: "17 يوليوز 2026",
  activityValue: "تجارة مواد التغليف",
  identityLink: "الإشعار القانوني",
  sealLabel: "روما باك، شركة مسجّلة بالرباط",
  productTrust: ["الدفع عند التسليم", "عرض سعر مجاني دون التزام", "شركة مسجّلة بالمغرب"],
  verified: "شركة يمكن التحقق منها",
};

export function getTrust(locale: Locale): Trust {
  return locale === "ar" ? ar : fr;
}
