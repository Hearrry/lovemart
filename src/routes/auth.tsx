import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Store } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Apni Dukaan" },
      {
        name: "description",
        content: "Sign in or create your shop account to manage billing, stock and udhaar.",
      },
      { property: "og:title", content: "Sign in — Apni Dukaan" },
      { property: "og:description", content: "Your shop account for billing, stock and udhaar." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center">
        <div className="panel space-y-2 p-5 text-center">
          <h1 className="text-lg font-semibold">Account setup pending</h1>
          <p className="text-sm text-muted-foreground">
            Add your project URL and key to the .env file, then reload this page to sign in.
          </p>
        </div>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    if (!email || password.length < 6) {
      toast.error("Email aur 6+ characters ka password likhein");
      return;
    }
    setBusy(true);
    try {
      if (mode === "in") {
        await signIn(email, password);
        navigate({ to: "/" });
      } else {
        const { needsConfirmation } = await signUp(email, password, {
          shop_name: String(fd.get("shop_name") || "My Shop"),
          owner_name: String(fd.get("owner_name") || ""),
        });
        if (needsConfirmation) {
          toast.success("Account banaya", {
            description: "Check your email and confirm to sign in.",
          });
          setMode("in");
        } else {
          navigate({ to: "/" });
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-10">
      <div className="mb-6 flex items-center gap-2.5">
        <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Store className="size-5" />
        </span>
        <span>
          <span className="block text-base font-semibold">Apni Dukaan</span>
          <span className="block text-xs text-muted-foreground">
            Billing, stock aur udhaar — ek jagah
          </span>
        </span>
      </div>

      <h1 className="text-2xl font-semibold">
        {mode === "in" ? "Sign in" : "Create your shop"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {mode === "in"
          ? "Apne dukaan account mein dakhil hon."
          : "Naya account banayein aur dukaan shuru karein."}
      </p>

      <form className="mt-5 space-y-4" onSubmit={onSubmit}>
        {mode === "up" && (
          <div className="panel space-y-4 p-4">
            <Field label="Shop name" name="shop_name" placeholder="Gulshan Kiryana Store" />
            <Field label="Your name" name="owner_name" placeholder="Zoya Khan" />
          </div>
        )}
        <div className="panel space-y-4 p-4">
          <Field label="Email" name="email" type="email" placeholder="you@example.com" />
          <Field label="Password" name="password" type="password" placeholder="••••••••" />
        </div>
        <Button type="submit" disabled={busy} className="h-12 w-full rounded-xl">
          {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === "in" ? "up" : "in")}
        className="mt-4 text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={type === "password" ? "current-password" : "on"}
        className="h-11 rounded-xl border-border bg-surface"
      />
    </div>
  );
}
