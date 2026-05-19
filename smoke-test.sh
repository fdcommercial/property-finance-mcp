#!/bin/bash
# FDC MCP — Smoke test all 4 tools end-to-end.
# Pure bash/sed, no python3 or jq required. Fails loudly if anything breaks.
# Run from the fdc-mcp folder: ./smoke-test.sh

set -e
cd "$(dirname "$0")"

if [ ! -d "dist" ]; then
  echo "dist/ missing. Run: npm install && npm run build"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: 'node' not on PATH. Install Node.js from nodejs.org or via brew install node"
  exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  FDC PROPERTY FINANCE MCP — SMOKE TEST"
echo "  Node: $(node --version)"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Send three lines to the MCP server (init, initialized notification, tool call)
# Capture stdout, filter to just the id:2 response (which is the tool result)
run_mcp() {
  local result
  result=$(printf '%s\n%s\n%s\n' \
    '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"smoke-test","version":"0.0.1"}}}' \
    '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
    "$1" \
    | node dist/index-stdio.js 2>/dev/null | grep '"id":2')
  if [ -z "$result" ]; then
    echo "    ERROR: no response from MCP server"
    return 1
  fi
  echo "$result"
}

# Extract a numeric or string field from JSON using sed (works without jq)
field() {
  local json="$1" key="$2"
  # Matches "key":number, "key":"value", or "key":bool
  echo "$json" | sed -n "s/.*\"$key\":\([0-9.]*\).*/\1/p" | head -1
}

field_str() {
  local json="$1" key="$2"
  echo "$json" | sed -n "s/.*\"$key\":\"\([^\"]*\)\".*/\1/p" | head -1
}

PASS=0
FAIL=0

echo "─── Test 0: tools/list (should register 4 tools) ───────────────"
LIST=$(printf '%s\n%s\n%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"t","version":"0.0.1"}}}' \
  '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
  | node dist/index-stdio.js 2>/dev/null | grep '"id":2')
TOOL_COUNT=$(echo "$LIST" | grep -o '"name":"[a-z_]*"' | wc -l | tr -d ' ')
echo "    Registered tools: $TOOL_COUNT"
echo "$LIST" | grep -o '"name":"[a-z_]*"' | sed 's/"name":"\(.*\)"/      • \1/'
if [ "$TOOL_COUNT" -eq 4 ]; then PASS=$((PASS+1)); else FAIL=$((FAIL+1)); echo "    ✗ EXPECTED 4 TOOLS, GOT $TOOL_COUNT"; fi
echo ""

echo "─── Test 1: bridging_cost_analyser ─────────────────────────────"
echo "    £500k @ 0.85% pm, 12 months, rolled-up, 2% arr fee"
R1=$(run_mcp '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"bridging_cost_analyser","arguments":{"loan_amount_gbp":500000,"monthly_interest_rate_pct":0.85,"term_months":12,"arrangement_fee_pct":2,"exit_fee_pct":0,"interest_structure":"rolled"}}}')
TOTAL=$(field "$R1" "total_cost_of_borrowing_gbp")
INT=$(field "$R1" "interest_gbp")
APR=$(field "$R1" "effective_apr_pct")
BRAND=$(field_str "$R1" "brand")
echo "    Total cost:    £$TOTAL"
echo "    Interest:      £$INT"
echo "    Effective APR: $APR%"
echo "    Brand:         $BRAND"
if [ "$TOTAL" = "63453" ]; then PASS=$((PASS+1)); echo "    ✓ matches expected £63,453"; else FAIL=$((FAIL+1)); echo "    ✗ EXPECTED £63,453, GOT £$TOTAL"; fi
echo ""

echo "─── Test 2: development_appraisal ──────────────────────────────"
echo "    £2m GDV, £400k land, £800k build, 75% LTC, 0.85% pm, 18 mo"
R2=$(run_mcp '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"development_appraisal","arguments":{"gdv_gbp":2000000,"land_or_purchase_price_gbp":400000,"build_cost_gbp":800000,"professional_fees_pct":10,"contingency_pct":10,"ltc_pct":75,"finance_monthly_rate_pct":0.85,"finance_term_months":18,"arrangement_fee_pct":2}}}')
PROFIT=$(field "$R2" "net_profit_gbp")
PROGDV=$(field "$R2" "profit_on_gdv_pct")
VIA=$(field_str "$R2" "status")
echo "    Net profit:    £$PROFIT"
echo "    Profit on GDV: $PROGDV%"
echo "    Viability:     $VIA"
if [ "$PROFIT" = "463540" ]; then PASS=$((PASS+1)); echo "    ✓ matches expected £463,540"; else FAIL=$((FAIL+1)); echo "    ✗ EXPECTED £463,540, GOT £$PROFIT"; fi
echo ""

echo "─── Test 3: btl_stress_tester ──────────────────────────────────"
echo "    £300k loan, £2,500/mo rent, 5.5% rate, personal name"
R3=$(run_mcp '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"btl_stress_tester","arguments":{"monthly_rent_gbp":2500,"loan_amount_gbp":300000,"product_rate_pct":5.5,"ownership":"personal"}}}')
ICR=$(field "$R3" "current_icr_at_stress_rate")
YIELD=$(field "$R3" "gross_yield_pct")
echo "    Current ICR:   ${ICR}x"
echo "    Gross yield:   $YIELD%"
if [ "$ICR" = "1.82" ]; then PASS=$((PASS+1)); echo "    ✓ matches expected 1.82x ICR"; else FAIL=$((FAIL+1)); echo "    ✗ EXPECTED 1.82x, GOT ${ICR}x"; fi
echo ""

echo "─── Test 4: uk_stamp_duty_calculator ───────────────────────────"
echo "    England, £750k residential, additional dwelling"
R4=$(run_mcp '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"uk_stamp_duty_calculator","arguments":{"property_price_gbp":750000,"jurisdiction":"england","property_type":"residential","buyer_type":"additional"}}}')
TAX=$(field "$R4" "total_tax_gbp")
ER=$(field "$R4" "effective_rate_pct")
echo "    Total tax:     £$TAX"
echo "    Effective:     $ER%"
if [ "$TAX" = "62500" ]; then PASS=$((PASS+1)); echo "    ✓ matches expected £62,500"; else FAIL=$((FAIL+1)); echo "    ✗ EXPECTED £62,500, GOT £$TAX"; fi
echo ""

echo "════════════════════════════════════════════════════════════════"
echo "  RESULTS: $PASS PASSED, $FAIL FAILED"
echo "════════════════════════════════════════════════════════════════"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo "Some tests failed. Check the output above for the broken tool."
  exit 1
fi

echo "✓ MCP is working. All 5 tests passed."
echo ""
echo "Next steps:"
echo "  1. To open the visual MCP Inspector (web UI):"
echo "       npx @modelcontextprotocol/inspector node dist/index-stdio.js"
echo "     (If 'npx: command not found' — fix Node install first, see chat.)"
echo ""
echo "  2. To use the MCP in Claude Desktop, see README.md install section."
