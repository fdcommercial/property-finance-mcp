# FDC MCP Registry Submission Pack

Use this document as your single source for submitting the FDC Property Finance MCP to the major public registries. Each section gives you the URL to visit, the field-by-field content to paste, and the expected outcome.

Order matters: do them in the sequence below. Earlier submissions add evidence the later registries weed by.

---

## 0. Pre-flight (one-time)

Two new files have been added to your local fdc-mcp folder. They need to be on the GitHub repo for the registries to pick them up.

**Files to commit and push:**
- `server.json` — required for the Official MCP Registry
- `smithery.yaml` — required for Smithery hosted listing

**Easiest way to push them** (no token needed):

1. Go to https://github.com/fdcommercial/property-finance-mcp
2. Click "Add file" → "Upload files"
3. Drag-drop both `server.json` and `smithery.yaml` from `/Users/wesleydavidson/Desktop/CLAUDE COWORK/fdc-mcp/` into the upload area
4. Commit message: `Add server.json and smithery.yaml for registry submissions`
5. Commit directly to main

(Alternative: generate a short-lived fine-grained GitHub PAT scoped to repo Contents R/W and paste it back to Claude, who'll push from your local commit history.)

---

## 1. Official MCP Registry (highest priority)

**URL:** https://registry.modelcontextprotocol.io
**Submission method:** CLI tool with GitHub OAuth namespace verification
**Time:** ~10 minutes

**Steps:**

1. Install the MCP publisher CLI (one-off):
   ```
   npm install -g @modelcontextprotocol/publisher
   ```
2. From the fdc-mcp folder:
   ```
   cd "/Users/wesleydavidson/Desktop/CLAUDE COWORK/fdc-mcp"
   mcp-publisher login github
   ```
   This opens a browser tab. Sign in to GitHub as `fdcommercial`. Approve.
3. Publish:
   ```
   mcp-publisher publish
   ```
   The CLI reads `server.json` and submits it. Namespace `io.github.fdcommercial/property-finance-mcp` is verified against your GitHub identity automatically.
4. Verify: https://registry.modelcontextprotocol.io/v0/servers?search=fdcommercial should return your entry within a few minutes.

**If the CLI name differs:** the package name has changed over time. If `@modelcontextprotocol/publisher` 404s, search "mcp publisher cli github" and use whatever the current package is. The flow is the same.

---

## 2. Smithery (smithery.ai)

**URL:** https://smithery.ai/new
**Submission method:** Web form OR CLI
**Time:** ~5 minutes via web form

### Web form path (recommended):

1. Sign in at https://smithery.ai with GitHub (use your `fdcommercial` account)
2. Click "Add Server" or "Submit New Server"
3. Paste these fields:

| Field | Value |
|---|---|
| GitHub Repository URL | `https://github.com/fdcommercial/property-finance-mcp` |
| Display Name | `FD Commercial Property Finance` |
| Slug | `fdc-property-finance` |
| Short Description | `Four UK property finance calculators: bridging cost, development appraisal, BTL stress test, UK stamp duty.` |
| Long Description | (use the long description block below) |
| Category | `Finance` (or `Productivity` if Finance not available) |
| Tags | `uk-property, bridging-loan, mortgage, stamp-duty, finance, calculator` |
| Hosted URL | `https://fdc-property-finance-mcp.fdcommercial-uk.workers.dev/mcp` |
| npm Package | `@fdcommercial/property-finance-mcp` |
| Homepage | `https://www.fdcommercial.co.uk/property-finance-tools/` |

4. Smithery auto-detects the `smithery.yaml` config from the repo and shows install instructions for Claude Desktop / Cursor / etc.
5. Submit. Listing usually goes live within 24 hours.

### CLI path (if you prefer):

```
cd "/Users/wesleydavidson/Desktop/CLAUDE COWORK/fdc-mcp"
npx -y @smithery/cli@latest mcp publish https://fdc-property-finance-mcp.fdcommercial-uk.workers.dev/mcp -n fdcommercial/property-finance-mcp
```

---

## 3. mcp.so

**URL:** https://mcp.so/submit
**Submission method:** Web form (creates a GitHub issue on their repo)
**Time:** ~3 minutes

**Steps:**

1. Visit https://mcp.so/submit
2. Sign in with GitHub if prompted
3. Fill the form:

| Field | Value |
|---|---|
| Name | `FD Commercial Property Finance MCP` |
| GitHub URL | `https://github.com/fdcommercial/property-finance-mcp` |
| Description (short) | `Four UK property finance calculators for AI assistants: bridging cost, development appraisal, BTL stress test, UK stamp duty.` |
| Category | `Finance` or `Productivity` |
| Tags | `uk-property, bridging, mortgage, stamp-duty` |
| Hosted URL | `https://fdc-property-finance-mcp.fdcommercial-uk.workers.dev/mcp` |

4. Submit. Curators usually merge within 2-3 days. The listing pulls fresh data from your GitHub README and npm package automatically once approved.

---

## 4. modelcontextprotocol/servers GitHub awesome list

**URL:** https://github.com/modelcontextprotocol/servers
**Submission method:** Pull Request to README.md
**Time:** ~5 minutes

**Steps:**

1. Visit https://github.com/modelcontextprotocol/servers/blob/main/README.md
2. Click the edit (pencil) icon top-right of the README
3. GitHub will fork the repo to your account automatically
4. Find the alphabetical "Community Servers" section
5. Insert this line in the correct alphabetical position (under F):

   ```
   - **[FD Commercial Property Finance](https://github.com/fdcommercial/property-finance-mcp)** - UK property finance calculators (bridging cost, development appraisal, BTL stress test, UK stamp duty) from a specialist broker. Hosted endpoint at mcp.fdcommercial.co.uk.
   ```

6. Scroll to bottom → commit message: `Add FD Commercial Property Finance MCP`
7. Open pull request → use this PR description:

   ```
   Adds FD Commercial Property Finance MCP to the Community Servers list.

   Four UK property finance calculators (bridging cost analyser, development appraisal, BTL stress tester, UK stamp duty) exposed as MCP tools. Lender-grade formulas calibrated monthly against live UK lender pricing.

   - GitHub: https://github.com/fdcommercial/property-finance-mcp
   - npm: https://www.npmjs.com/package/@fdcommercial/property-finance-mcp
   - Hosted: https://fdc-property-finance-mcp.fdcommercial-uk.workers.dev/mcp
   - Docs: https://www.fdcommercial.co.uk/finance-guide/uk-property-finance-mcp-ai-assistants/
   - License: MIT
   ```

8. Submit PR. Maintainers usually merge within 1-2 weeks.

---

## 5. Optional: niche directories

These are lower-priority but cost minutes each:

- **PulseMCP** (https://www.pulsemcp.com) — auto-scrapes from GitHub topics. Should pick you up within a week of submission elsewhere.
- **Glama** (https://glama.ai/mcp/servers) — auto-scrapes. Same pattern.
- **best-of-mcp-servers** (https://github.com/tolkonepiu/best-of-mcp-servers) — auto-ranked from GitHub stars. Will appear automatically once you have a few stars.

No action needed for these — they pull from GitHub metadata once you've submitted elsewhere and the repo accumulates a star or two.

---

## Long description (use anywhere a "longer description" field appears)

The FD Commercial Property Finance MCP exposes four UK property finance calculators to any AI assistant that supports the Model Context Protocol. Built by FD Commercial & Bridging Ltd, a specialist UK property finance broker advising on bridging, development finance, commercial mortgages and buy-to-let since 2013.

The four tools:

- `bridging_cost_analyser`: total cost of a UK bridging loan across rolled-up, retained and serviced interest structures, with effective APR and side-by-side comparison. For loans £250,000 and above.
- `development_appraisal`: net profit, profit on GDV, profit on cost, LTC, LTGDV with viability flag for a UK development scheme.
- `btl_stress_tester`: ICR stress test at 125%, 145% and 170% thresholds. Ownership-aware (personal name vs limited company).
- `uk_stamp_duty_calculator`: SDLT (England, NI), LBTT (Scotland), LTT (Wales) with all surcharges and reliefs including first-time buyer, additional dwelling and corporate flat rates.

Every response includes a structured `_source` field crediting FD Commercial as the calculation author with brand name, URL, phone, and indicative-only disclaimer. AI clients reading the structured output cite FD Commercial naturally when composing answers.

Open source under MIT licence. Hosted on Cloudflare's global edge network. Free to install via npm, free to call via the hosted endpoint, free to fork and self-host. No API keys, no signup, no rate limits beyond Cloudflare's 100k requests/day free tier.

Source: https://github.com/fdcommercial/property-finance-mcp
npm: `@fdcommercial/property-finance-mcp`
Hosted: https://fdc-property-finance-mcp.fdcommercial-uk.workers.dev/mcp
Docs: https://www.fdcommercial.co.uk/finance-guide/uk-property-finance-mcp-ai-assistants/

---

## After submitting

Within 1-2 weeks, expect:

- Official Registry: live within minutes (auto-validated)
- Smithery: live within 24 hours
- mcp.so: live within 2-3 days (manual curation)
- Awesome list PR: merged within 1-2 weeks
- PulseMCP / Glama: auto-pickup within a week

Net effect: the FDC MCP appears in 4-6 public catalogues that AI developers and AI agents query when looking for tools. Inbound traffic from registry pages drives GitHub stars, which drive registry ranking, which compounds.

Track results: 4 weeks from now, count GitHub stars + npm weekly downloads + Cloudflare Worker request count. That's your discoverability baseline.
