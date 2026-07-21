# MarketVibe Sales Navigator Companion

Local browser companion for turning permitted visible Sales Navigator results into MarketVibe CSV/import rows.

## Isolated always-on browser

Use `START-DEDICATED-NAVIGATOR.cmd` for the dedicated Navigator browser. It
uses `C:\MarketVibe\Profiles\SalesNavigator`, loads only this fixed extension,
and does not share tabs or extension state with ordinary Edge use.

The first launch requires one-time sign-in to LinkedIn Sales Navigator and the
MarketVibe admin import page. After those sessions are established, run
`INSTALL-NAVIGATOR-WATCHDOG.ps1` once. Windows then launches the isolated
browser at sign-in and checks it every five minutes. The finder resumes from
its persisted active state after a browser restart.

Do not load the older copy under `Downloads\marketvibe_navigator_companion` in
this profile. It is a different extension and can conflict with this workflow.

The finder is tuned for MarketVibe supply leads: builders, construction firms, contractors, property developers, luxury real-estate companies, estate agents, and decision-makers inside those businesses. It is not tuned to collect marketing agencies, lead-generation agencies, SEO agencies, or consultants as leads.

## Install

1. Open Chrome or Edge.
2. Go to `chrome://extensions` or `edge://extensions`.
3. Enable Developer mode.
4. Click Load unpacked.
5. Select this folder:
   `C:\marketvibe-pro\browser-extension\sales-navigator-companion`

## Use

1. Log in to LinkedIn Sales Navigator in the same browser.
2. Open any Sales Navigator people search page.
3. Use the MarketVibe panel in the bottom-right:
   - `Start finder` opens property/construction buyer searches and collects in conservative batches.
   - The companion pauses after a safe batch instead of forcing hundreds of page moves in one run.
   - If Sales Navigator shows `Too Many Requests`, the companion stops and starts a cooldown.
   - `Capture visible` stores qualified visible result cards from the current page.
   - `Scroll + capture` scrolls loaded visible results, then captures.
   - `Send to MarketVibe` opens the MarketVibe import page and automatically imports the captured batch.
   - `Download CSV` creates a backup file only. Normal operation does not require finding or uploading a file.
   - `Open import portal` opens `https://www.marketvibe1.com/admin/import` without auto-importing.
4. Stay logged in to MarketVibe admin in the same browser.
5. After `Send to MarketVibe`, the import page runs MarketVibe preview, dedupe, validation, and source-backed auto-approval, then clears the local captured batch.

## Boundaries

- Captures visible result cards only.
- Does not collect LinkedIn cookies, credentials, hidden API responses, or private messages.
- Does not bypass login, rate limits, captchas, or platform restrictions.
- Do not run continuous back-to-back batches. Import the current batch, wait, and only restart after Sales Navigator is normal again.
- Email and phone fields remain blank unless supplied by a permitted export or public source.
