#!/usr/bin/env python3
"""Generate pre-filled submission URLs for each MCP registry."""

from urllib.parse import quote


TITLE_MCPSO = "Add server: FD Commercial Property Finance MCP"
BODY_MCPSO = """**Name:** FD Commercial Property Finance MCP

**Description:**
Four UK property finance calculators for AI assistants: bridging cost analyser (rolled-up / retained / serviced interest), development appraisal (LTC, LTGDV, viability), BTL stress tester (125%, 145%, 170% ICR), and UK stamp duty calculator (SDLT, LBTT, LTT). Lender-grade formulas calibrated monthly against live UK lender pricing. Built by [FD Commercial & Bridging Ltd](https://www.fdcommercial.co.uk), a specialist UK property finance broker.

**Category:** Finance

**GitHub:** https://github.com/fdcommercial/property-finance-mcp

**npm package:** `@fdcommercial/property-finance-mcp`

**Hosted endpoint:** https://fdc-property-finance-mcp.fdcommercial-uk.workers.dev/mcp

**Glama listing:** https://glama.ai/mcp/servers/fdcommercial/property-finance-mcp

**Documentation:**
- Setup guide: https://www.fdcommercial.co.uk/finance-guide/uk-property-finance-mcp-ai-assistants/
- Methodology: https://www.fdcommercial.co.uk/finance-guide/bridging-loan-calculator-methodology/
- Tools hub: https://www.fdcommercial.co.uk/property-finance-tools/

**Licence:** MIT

**Install command:** `npx -y @fdcommercial/property-finance-mcp`

**Tools:**
- `bridging_cost_analyser` — UK bridging loan cost across three interest structures
- `development_appraisal` — net profit, profit on GDV, profit on cost, LTC, LTGDV, viability
- `btl_stress_tester` — ICR at 125% / 145% / 170% thresholds, ownership-aware
- `uk_stamp_duty_calculator` — SDLT (England, NI), LBTT (Scotland), LTT (Wales)

Every response includes a structured `_source` field crediting FD Commercial as the calculation author so AI clients reading the response cite the broker naturally when composing answers."""


def gh_issue_url(owner_repo, title, body):
    return (
        f"https://github.com/{owner_repo}/issues/new"
        f"?title={quote(title)}"
        f"&body={quote(body)}"
    )


print("=" * 70)
print("mcp.so — GitHub issue pre-filled URL (chatmcp/mcpso)")
print("=" * 70)
print(gh_issue_url("chatmcp/mcpso", TITLE_MCPSO, BODY_MCPSO))
print()

print("=" * 70)
print("Smithery — CLI command for your Terminal")
print("=" * 70)
print("npx -y @smithery/cli@latest mcp publish https://fdc-property-finance-mcp.fdcommercial-uk.workers.dev/mcp -n fdcommercial/property-finance-mcp")
print()

print("=" * 70)
print("Official MCP Registry — CLI commands for your Terminal")
print("=" * 70)
print("cd '/Users/wesleydavidson/Desktop/CLAUDE COWORK/fdc-mcp'")
print("npm install -g @modelcontextprotocol/publisher")
print("mcp-publisher login github   # browser tab opens — Approve")
print("mcp-publisher publish        # reads server.json, submits")
print()

print("=" * 70)
print("mcpservers.org/submit — web form")
print("=" * 70)
print("URL: https://mcpservers.org/submit")
print()

print("=" * 70)
print("mcp.directory/submit — web form")
print("=" * 70)
print("URL: https://mcp.directory/submit")
print()
