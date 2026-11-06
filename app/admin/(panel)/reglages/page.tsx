import { site } from "@/lib/site";
import { isResendConfigured, isSupabaseConfigured } from "@/lib/supabase/env";

export default function Page() {
  const checks = [
    ["Supabase", isSupabaseConfigured(), "Enregistre les devis et le catalogue."],
    ["Resend", isResendConfigured(), "Envoie la notification interne d'une demande."],
    ["WhatsApp", Boolean(site.whatsapp), "Affiche le bouton et les liens de conversation."],
    ["E-mail public", Boolean(site.email), "Affiché sur le site et les pages légales."],
    ["Téléphone", Boolean(site.phone), "Affiché sur le site."],
    ["Adresse", Boolean(site.address), "Affichée en plus de Rabat."],
  ] as const;

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-4xl text-ink">Réglages</h1>
      <p className="max-w-2xl text-sm text-muted">
        Ces indicateurs lisent la configuration du serveur. Ils ne montrent aucune clé. Le détail des variables est dans <code>.env.example</code> et le README.
      </p>
      <ul className="divide-y divide-line rounded-lg border border-line bg-card">
        {checks.map(([name, ok, detail]) => (
          <li key={name} className="flex items-start justify-between gap-6 px-5 py-4">
            <div>
              <p className="font-medium">{name}</p>
              <p className="text-sm text-muted">{detail}</p>
            </div>
            <p className={ok ? "text-sm text-[#1f6b45]" : "text-sm text-accent"}>{ok ? "Configuré" : "Absent"}</p>
          </li>
        ))}
      </ul>
      <div className="text-sm text-muted">
        <p>ICE {site.ice}</p>
        <p>RC {site.rc} · {site.city}</p>
      </div>
    </div>
  );
}
