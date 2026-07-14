# Navigator CSV Operator Runbook

Use this workflow when an operator needs to turn a clean Sales Navigator or CRM-sourced list into MarketVibe supply.

## Source Rules

- Use CRM Sync, an approved CRM export, a permitted export tool, or the MarketVibe CSV template.
- Do not upload cookies, browser exports, private profile HTML, scraped pages, or credentials.
- Do not claim buyer intent unless the row includes a public signal URL or public signal text.

## CSV Columns

Minimum valid row:

- `Company Name`
- One source reference: `Company Website`, `Company Domain`, `Public Signal URL`, `Company LinkedIn URL`, or `LinkedIn Profile URL`

Recommended columns:

- `Location`
- `Country`
- `City`
- `Industry`
- `Company Size`
- `Public Signal URL`
- `Public Signal Text`
- `Source Note`

Optional person columns:

- `First Name`
- `Last Name`
- `Full Name`
- `Job Title`
- `Email`
- `Phone`

## MarketVibe Steps

1. Open `/admin/import`.
2. Click `Template` if the source CSV needs the MarketVibe column layout.
3. Click `Upload CSV/XLSX`.
4. Check the validation counters.
5. Leave `Approve valid source-backed rows after import` enabled for clean exports.
6. Click `Import valid rows`.
7. Rejected rows need correction before re-upload.
8. Profile-only rows stay pending and need manual review.

## Quality Standard

Delivery-ready rows should be `approved` and have `public_signal_verified` or `website_verified` evidence. The import flow automatically skips duplicates and invalid rows.
