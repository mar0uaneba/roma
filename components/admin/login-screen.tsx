"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand/logo";

export function LoginScreen({
  configured,
  accessDenied,
}: {
  configured: boolean;
  accessDenied: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(accessDenied ? "Ce compte n'a pas le rôle administrateur." : null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createBrowserSupabase();
    if (!supabase) return;
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const { error: signError } = await supabase.auth.signInWithPassword({
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
    });
    setPending(false);
    if (signError) {
      setError("Connexion refusée. Vérifiez l'e-mail et le mot de passe.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-between bg-ink px-8 py-10 text-background">
        <Link href="/fr" className="text-background" aria-label="Retour au site">
          <Logo />
        </Link>
        <div>
          <h1 className="font-serif text-5xl leading-tight">Administration</h1>
          <p className="mt-4 max-w-sm text-sm leading-6 text-background/70">
            Demandes de devis, catalogue publié et état des intégrations.
          </p>
        </div>
        <p className="text-xs text-background/50">Accès réservé au rôle admin.</p>
      </div>
      <div className="flex items-center px-6 py-16">
        <div className="mx-auto w-full max-w-md">
          {configured ? (
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" autoComplete="username" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input id="password" name="password" type="password" autoComplete="current-password" required />
              </div>
              {error ? <p className="text-sm text-accent">{error}</p> : null}
              <Button type="submit" disabled={pending}>{pending ? "Connexion…" : "Entrer"}</Button>
            </form>
          ) : (
            <div className="space-y-4 text-sm leading-6">
              <h2 className="font-serif text-3xl text-ink">Supabase n&apos;est pas connecté</h2>
              <p>La connexion administrateur ne peut pas fonctionner tant que les variables du projet ne sont pas renseignées.</p>
              <ol className="list-decimal space-y-2 pl-5 text-muted">
                <li>Copiez <code>.env.example</code> vers <code>.env.local</code>.</li>
                <li>Ajoutez l&apos;URL et la clé anon Supabase.</li>
                <li>Exécutez <code>supabase/migrations/001_init.sql</code>.</li>
                <li>Créez un utilisateur, puis passez son rôle à admin.</li>
              </ol>
              <Button asChild variant="outline">
                <Link href="/admin">Voir l&apos;interface en lecture seule</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
