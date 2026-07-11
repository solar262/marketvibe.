import Link from "next/link";
import { CheckCircle2, CircleAlert, CircleDashed } from "lucide-react";
import { getSupabaseAdmin, supabaseConnectionStatus } from "@/lib/supabase";

type SetupItem = {
  name: string;
  required: boolean;
  status: "Connected" | "Degraded" | "Blocked";
  explanation: string;
  setupLocation: string;
  maskedCredential: string;
  lastSuccessfulTest: string;
  ownerAction: string;
};

function mask(value: string | undefined, label: string) {
  if (!value?.trim()) return `${label}: missing`;
  const clean = value.trim();
  return clean.length <= 8 ? `${label}: present` : `${label}: ${clean.slice(0, 4)}...${clean.slice(-4)}`;
}

async function providerItems(): Promise<SetupItem[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  const { data } = await supabase
    .from("marketvibe_provider_configurations")
    .select("provider_name,health_status,health_message,credential_state,last_successful_run")
    .order("provider_name", { ascending: true });
  return (data || []).map((provider) => ({
    name: String(provider.provider_name),
    required: ["Uploaded XLSX and CSV files", "Company websites"].includes(String(provider.provider_name)),
    status: String(provider.health_status) as SetupItem["status"],
    explanation: String(provider.health_message || "Provider state is persisted."),
    setupLocation: "/admin/setup",
    maskedCredential: `credential_state: ${provider.credential_state}`,
    lastSuccessfulTest: provider.last_successful_run ? String(provider.last_successful_run) : "No successful run recorded",
    ownerAction: provider.health_status === "Operational" ? "No action required." : "Configure provider credentials or disable this provider.",
  }));
}

export default async function SetupWizardPage() {
  const supabase = supabaseConnectionStatus();
  const baseItems: SetupItem[] = [
    {
      name: "Supabase connection",
      required: true,
      status: supabase.serverWritesEnabled ? "Connected" : "Blocked",
      explanation: supabase.serverWritesEnabled ? `Server writes are enabled for ${supabase.host}.` : "Supabase URL and service-role key are required for durable pipeline state.",
      setupLocation: ".env.local / Vercel Project Settings",
      maskedCredential: `${supabase.hasUrl ? "NEXT_PUBLIC_SUPABASE_URL: present" : "NEXT_PUBLIC_SUPABASE_URL: missing"}; ${supabase.hasServiceRoleKey ? `${supabase.serviceRoleKeyEnvName}: present` : `${supabase.serviceRoleKeyEnvName}: missing`}`,
      lastSuccessfulTest: supabase.serverWritesEnabled ? "Current server-side check" : "No successful server-write check",
      ownerAction: supabase.serverWritesEnabled ? "No action required." : "Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    },
    {
      name: "Application URL",
      required: true,
      status: process.env.NEXT_PUBLIC_APP_URL ? "Connected" : "Degraded",
      explanation: process.env.NEXT_PUBLIC_APP_URL ? "Public app URL is configured." : "Delivery links will fall back to the production default.",
      setupLocation: ".env.local / Vercel Project Settings",
      maskedCredential: mask(process.env.NEXT_PUBLIC_APP_URL, "NEXT_PUBLIC_APP_URL"),
      lastSuccessfulTest: process.env.NEXT_PUBLIC_APP_URL ? "Current environment check" : "Not configured",
      ownerAction: process.env.NEXT_PUBLIC_APP_URL ? "No action required." : "Set NEXT_PUBLIC_APP_URL to the deployed MarketVibe domain.",
    },
    {
      name: "Scheduler secret",
      required: true,
      status: process.env.CRON_SECRET ? "Connected" : "Blocked",
      explanation: process.env.CRON_SECRET ? "Cron routes can require a bearer secret." : "Cron routes requiring authentication cannot run securely without CRON_SECRET.",
      setupLocation: ".env.local / Vercel Project Settings",
      maskedCredential: mask(process.env.CRON_SECRET, "CRON_SECRET"),
      lastSuccessfulTest: process.env.CRON_SECRET ? "Current environment check" : "Not configured",
      ownerAction: process.env.CRON_SECRET ? "No action required." : "Set CRON_SECRET and configure Vercel Cron authorization.",
    },
    {
      name: "Email provider",
      required: false,
      status: process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL ? "Connected" : "Blocked",
      explanation: process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL ? "Transactional email credentials are present." : "Email delivery and outreach sending remain blocked until sender identity is configured.",
      setupLocation: ".env.local / Brevo",
      maskedCredential: `${mask(process.env.BREVO_API_KEY, "BREVO_API_KEY")}; ${mask(process.env.BREVO_SENDER_EMAIL, "BREVO_SENDER_EMAIL")}`,
      lastSuccessfulTest: process.env.BREVO_API_KEY ? "Environment credential present" : "Not configured",
      ownerAction: "Verify sender domain, reply-to, unsubscribe secret, webhook verification, and daily send limit before activation.",
    },
    {
      name: "Stripe connection",
      required: false,
      status: process.env.STRIPE_SECRET_KEY ? "Connected" : "Blocked",
      explanation: process.env.STRIPE_SECRET_KEY ? "Stripe secret is present." : "Billing and entitlement checks that require Stripe are blocked, but discovery and scoring can continue.",
      setupLocation: ".env.local / Stripe Dashboard",
      maskedCredential: mask(process.env.STRIPE_SECRET_KEY, "STRIPE_SECRET_KEY"),
      lastSuccessfulTest: process.env.STRIPE_SECRET_KEY ? "Environment credential present" : "Not configured",
      ownerAction: "Configure Stripe products and webhook signing secret before selling live products.",
    },
  ];
  const items = [...baseItems, ...await providerItems()];

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-violet-700">Operational readiness</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">Setup Wizard</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Required and optional services with exact setup locations, masked credential state, and owner actions.
          </p>
        </div>
        <Link href="/admin/setup" className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Test connections</Link>
      </div>

      <section className="mt-6 grid gap-4">
        {items.map((item) => {
          const Icon = item.status === "Connected" ? CheckCircle2 : item.status === "Degraded" ? CircleDashed : CircleAlert;
          return (
            <article key={`${item.name}-${item.setupLocation}`} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.required ? "Required" : "Optional"}</p>
                  <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold text-slate-950">
                    <Icon className={item.status === "Connected" ? "h-5 w-5 text-emerald-700" : item.status === "Degraded" ? "h-5 w-5 text-amber-700" : "h-5 w-5 text-red-700"} />
                    {item.name}
                  </h2>
                </div>
                <span className="w-fit rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{item.status}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.explanation}</p>
              <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                <p><span className="font-semibold text-slate-950">Setup location:</span> {item.setupLocation}</p>
                <p><span className="font-semibold text-slate-950">Credential:</span> {item.maskedCredential}</p>
                <p><span className="font-semibold text-slate-950">Last test:</span> {item.lastSuccessfulTest}</p>
                <p><span className="font-semibold text-slate-950">Owner action:</span> {item.ownerAction}</p>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
