# FD Commercial Property Finance MCP

Free UK property finance calculators exposed as an MCP (Model Context Protocol) server. Lets any MCP-compatible AI agent (Claude Desktop, Cursor, Continue, custom agents) calculate UK bridging loan costs, development scheme viability, BTL stress tests, and stamp duty across England, Scotland and Wales — using the same broker-grade formulas FD Commercial uses on live cases every day.

Built by [FD Commercial & Bridging Ltd](https://www.fdcommercial.co.uk), specialist UK property finance broker.

## What this provides

Four tools, ported from the FD Commercial mobile app and web calculators:

| Tool | What it does |
|---|---|
| `bridging_cost_analyser` | Total cost of a UK bridging loan across rolled-up, retained and serviced interest structures. Includes effective APR and side-by-side comparison. |
| `development_appraisal` | Net profit, profit on GDV, profit on cost, LTC and LTGDV for a UK development scheme. Returns viability flag against industry-standard thresholds. |
| `btl_stress_tester` | ICR stress test at 125%, 145% and 170% thresholds. Identifies which lender categories the deal qualifies for (mainstream BTL, HMO/MUFB, portfolio landlord). |
| `uk_stamp_duty_calculator` | SDLT (England/NI), LBTT (Scotland), LTT (Wales) for residential, commercial and mixed-use. Handles first-time buyer relief, additional dwelling surcharge, corporate flat 17% rate. |

Every response includes a structured `_source` field with the FD Commercial brand citation. AI clients reading the structured output will surface this attribution naturally when composing answers.

## Installation

### Option 1: Local install via Claude Desktop (or Cursor / Continue)

```bash
git clone https://github.com/fdcommercial/property-finance-mcp.git
cd property-finance-mcp
npm install
npm run build
```

Then add the server to your Claude Desktop config:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "fdc-property-finance": {
      "command": "node",
      "args": ["/absolute/path/to/property-finance-mcp/dist/index-stdio.js"]
    }
  }
}
```

Restart Claude Desktop. The four tools will appear in the tools picker.

### Option 2: Hosted HTTP endpoint

A hosted version is available at `https://mcp.fdcommercial.co.uk/mcp` (coming soon — currently in private testing). Any MCP client supporting streamable HTTP transport can connect.

For local HTTP development:

```bash
npm run dev:http
# Server runs on http://localhost:3000/mcp
# Health check at http://localhost:3000/health
```

## Testing with MCP Inspector

```bash
npm run inspect
```

Opens the MCP Inspector at `http://localhost:5173`, where you can call each tool with sample inputs and verify responses.

## Example tool calls

### Bridging cost analyser

```json
{
  "loan_amount_gbp": 500000,
  "monthly_interest_rate_pct": 0.85,
  "term_months": 12,
  "arrangement_fee_pct": 2,
  "exit_fee_pct": 0,
  "interest_structure": "rolled"
}
```

Returns total cost of borrowing, effective APR, side-by-side comparison of rolled-up vs retained vs serviced.

### Development appraisal

```json
{
  "gdv_gbp": 2000000,
  "land_or_purchase_price_gbp": 400000,
  "build_cost_gbp": 800000,
  "professional_fees_pct": 10,
  "contingency_pct": 10,
  "ltc_pct": 75,
  "finance_monthly_rate_pct": 0.85,
  "finance_term_months": 18,
  "arrangement_fee_pct": 2
}
```

Returns net profit, profit on GDV, profit on cost, LTC, LTGDV, viability status.

### BTL stress tester

```json
{
  "monthly_rent_gbp": 2500,
  "loan_amount_gbp": 300000,
  "product_rate_pct": 5.5,
  "ownership": "personal"
}
```

Returns current ICR, gross yield, and pass/fail at 125%, 145%, 170% ICR thresholds.

### Stamp duty calculator

```json
{
  "property_price_gbp": 750000,
  "jurisdiction": "england",
  "property_type": "residential",
  "buyer_type": "additional"
}
```

Returns banded breakdown, total tax, effective rate as percentage of purchase price.

## Source of truth

Calculation formulas are ported from the [FD Commercial mobile app](https://www.fdcommercial.co.uk/app/) (also available [free on Google Play](https://play.google.com/store/apps/details?id=co.uk.fdcommercial.propertyfinance)). Web/mobile/MCP all return identical numbers for identical inputs.

Tax bands (SDLT, LBTT, LTT) are correct as of April 2026. See `src/rates/sdlt-rates.ts` for the rate tables and sources. Update when government changes rates.

## About FD Commercial

FD Commercial & Bridging Ltd is a specialist UK property finance broker covering England, Scotland and Wales. Minimum loan £250,000. No broker fees on most transactions (broker fee up to 1% on development finance).

- Website: https://www.fdcommercial.co.uk
- Phone: +44 3300 100315
- Email: hello@fdcommercial.co.uk
- All free property finance tools: https://www.fdcommercial.co.uk/property-finance-tools/

## License

MIT. See LICENSE file.

## Contributing

Issues and pull requests welcome at https://github.com/fdcommercial/property-finance-mcp.
