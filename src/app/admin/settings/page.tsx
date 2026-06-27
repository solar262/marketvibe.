import { businessTypes, countries, leadSettings } from "@/lib/lead-engine";
import { inputClass } from "@/lib/ui";

export default function AdminSettingsPage() {
  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-semibold text-slate-950">Admin Settings</h1>
      <p className="mt-2 text-slate-600">Control pricing, lead limits, outreach safety, and allowed markets.</p>
      <form className="mt-6 grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium">Daily send limit<input className={inputClass} type="number" defaultValue={leadSettings.dailySendLimit} /></label>
          <label className="grid gap-1 text-sm font-medium">Email sending<input className={inputClass} defaultValue={leadSettings.emailSendingEnabled ? "on" : "off"} /></label>
          <label className="grid gap-1 text-sm font-medium">Free lead limit<input className={inputClass} type="number" defaultValue={leadSettings.freeLeadLimit} /></label>
          <label className="grid gap-1 text-sm font-medium">One-off report price EUR<input className={inputClass} type="number" defaultValue={leadSettings.reportPrice} /></label>
          <label className="grid gap-1 text-sm font-medium">Starter price EUR/month<input className={inputClass} type="number" defaultValue={leadSettings.starterPrice} /></label>
          <label className="grid gap-1 text-sm font-medium">Pro price EUR/month<input className={inputClass} type="number" defaultValue={leadSettings.proPrice} /></label>
        </div>
        <label className="grid gap-1 text-sm font-medium">Countries allowed<textarea rows={3} className={inputClass} defaultValue={countries.join(", ")} /></label>
        <label className="grid gap-1 text-sm font-medium">Business categories allowed<textarea rows={4} className={inputClass} defaultValue={businessTypes.join(", ")} /></label>
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Automated sending is off by default. Enable it only after sender identity, unsubscribe handling, suppression list, repeat-contact prevention, and rate limits are configured.
        </div>
        <button type="button" className="w-fit rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Save settings</button>
      </form>
    </main>
  );
}
