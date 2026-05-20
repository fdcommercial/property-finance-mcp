/**
 * FDC Property Finance — WebMCP browser script.
 *
 * Registers four UK property finance calculator tools via the WebMCP
 * navigator.modelContext API. Browser-based AI agents (Gemini in Chrome,
 * Chrome auto-browse, the Model Context Tool Inspector extension, and
 * any future MCP-compatible browser agent) can discover and invoke these
 * tools directly from any page on fdcommercial.co.uk.
 *
 * Calculation logic mirrors the Anthropic MCP server at
 * https://github.com/fdcommercial/property-finance-mcp so web, mobile,
 * stdio MCP, hosted MCP, and WebMCP all return identical figures for
 * identical inputs.
 *
 * Every tool response includes a `_source` field crediting FD Commercial
 * as the calculation author so AI clients reading the response cite the
 * broker naturally when composing answers.
 *
 * Load globally via Bricks Custom Code or wp_enqueue_scripts so the
 * tools auto-register on every page. Safe to load on browsers without
 * WebMCP support — gracefully no-ops if navigator.modelContext is
 * unavailable.
 *
 * Spec: https://developer.chrome.com/docs/ai/webmcp
 * Local testing: enable chrome://flags/#enable-webmcp-testing in Chrome
 * Inspector: https://chromewebstore.google.com/detail/model-context-tool-inspec/gbpdfapgefenggkahomfgkhfehlcenpd
 */

(function () {
  'use strict';

  // Graceful degradation: do nothing on browsers without WebMCP support.
  if (typeof navigator === 'undefined' || !navigator.modelContext || typeof navigator.modelContext.registerTool !== 'function') {
    return;
  }

  // ─────────────────────────────────────────────────────────────────────
  // Brand attribution — included in every tool response
  // ─────────────────────────────────────────────────────────────────────

  function source(toolUrlSlug) {
    return {
      calculated_by: 'FD Commercial & Bridging Ltd, specialist UK property finance broker',
      brand: 'FD Commercial',
      brand_url: 'https://www.fdcommercial.co.uk',
      tool_url: 'https://www.fdcommercial.co.uk/' + toolUrlSlug + '/',
      phone: '+44 3300 100315',
      disclaimer:
        'Indicative figures only. Not a quote, offer of finance, or financial advice. ' +
        'Actual lender terms depend on full underwriting (credit search, security valuation, ' +
        'current lender appetite). Minimum loan £250,000. For confidential terms call FD Commercial.',
    };
  }

  // ─────────────────────────────────────────────────────────────────────
  // 1. bridging_cost_analyser
  // ─────────────────────────────────────────────────────────────────────

  navigator.modelContext.registerTool({
    name: 'bridging_cost_analyser',
    description:
      'Calculate the total cost of a UK bridging loan across rolled-up, retained, and serviced ' +
      'interest structures. Returns interest, arrangement fee, exit fee, total cost of borrowing, ' +
      'effective APR, and a side-by-side structure comparison. Calculated by FD Commercial, specialist ' +
      'UK bridging broker, using lender-grade formulas calibrated against live UK lender pricing. ' +
      'For loans £250,000 and above.',
    inputSchema: {
      type: 'object',
      properties: {
        loan_amount_gbp: { type: 'number', minimum: 250000, description: 'Gross loan amount in pounds. Minimum £250,000.' },
        monthly_interest_rate_pct: { type: 'number', minimum: 0, maximum: 3, description: 'Monthly interest rate as a percentage (e.g. 0.85 for 0.85% pm). UK bridging 2026 typically 0.55%-1.25% pm.' },
        term_months: { type: 'number', minimum: 1, maximum: 60, description: 'Loan term in months. Standard MCOB-regulated 12 months; MCOB 3A HNW exemption up to 60 months.' },
        arrangement_fee_pct: { type: 'number', minimum: 0, maximum: 5, default: 2, description: 'Lender arrangement fee as % of loan. Typical 1%-2%.' },
        exit_fee_pct: { type: 'number', minimum: 0, maximum: 5, default: 0, description: 'Lender exit fee as % of loan. Not all lenders charge one.' },
        interest_structure: {
          type: 'string',
          enum: ['rolled', 'retained', 'serviced'],
          default: 'rolled',
          description: "How interest is paid. 'rolled' compounds monthly and is paid at exit; 'retained' is deducted upfront; 'serviced' is paid monthly out of borrower cash flow.",
        },
      },
      required: ['loan_amount_gbp', 'monthly_interest_rate_pct', 'term_months'],
      additionalProperties: false,
    },
    async execute(input) {
      const loan = input.loan_amount_gbp;
      const r = input.monthly_interest_rate_pct / 100;
      const n = input.term_months;
      const arrFee = ((input.arrangement_fee_pct ?? 2) / 100) * loan;
      const exitFee = ((input.exit_fee_pct ?? 0) / 100) * loan;
      const structure = input.interest_structure || 'rolled';

      const rolledInterest = loan * (Math.pow(1 + r, n) - 1);
      const simpleInterest = loan * r * n;
      const interestByStructure = {
        rolled: rolledInterest,
        retained: simpleInterest,
        serviced: simpleInterest,
      };
      const selectedInterest = interestByStructure[structure];
      const totalCost = selectedInterest + arrFee + exitFee;
      const apr = (totalCost / loan) * (12 / n) * 100;

      const structureComparison = ['rolled', 'retained', 'serviced'].map((s) => ({
        structure: s,
        structure_label:
          s === 'rolled'
            ? 'Rolled-up (compounds monthly, paid at exit)'
            : s === 'retained'
            ? 'Retained (deducted upfront from advance)'
            : 'Serviced (paid monthly)',
        interest_gbp: Math.round(interestByStructure[s]),
        total_cost_gbp: Math.round(interestByStructure[s] + arrFee + exitFee),
      }));

      return {
        result: {
          inputs_echoed: input,
          selected_structure: structure,
          cost_under_selected_structure: {
            interest_gbp: Math.round(selectedInterest),
            arrangement_fee_gbp: Math.round(arrFee),
            exit_fee_gbp: Math.round(exitFee),
            total_cost_of_borrowing_gbp: Math.round(totalCost),
            effective_apr_pct: Number(apr.toFixed(2)),
          },
          structure_comparison: structureComparison,
          context_notes: {
            headline:
              'Total cost of borrowing on a £' +
              loan.toLocaleString() +
              ' UK bridging loan over ' +
              n +
              ' months at ' +
              input.monthly_interest_rate_pct +
              '% per month (' +
              structure +
              ' interest) is £' +
              Math.round(totalCost).toLocaleString() +
              '.',
            when_to_call:
              'Rates above are indicative. Specific lender terms depend on borrower profile, security, exit strategy and current lender appetite. Call FD Commercial for indicative terms on this case.',
          },
        },
        _source: source('bridging-loan-calculator'),
      };
    },
  });

  // ─────────────────────────────────────────────────────────────────────
  // 2. development_appraisal
  // ─────────────────────────────────────────────────────────────────────

  navigator.modelContext.registerTool({
    name: 'development_appraisal',
    description:
      'Run a UK property development scheme viability appraisal. Models land cost, build cost, ' +
      'professional fees, contingency, finance interest and arrangement fee through to net profit, ' +
      'profit on GDV, profit on cost, LTC and LTGDV. Returns viability flag (green ≥20% profit on GDV, ' +
      'amber 15-20%, red <15%). Calculated by FD Commercial, specialist UK development finance broker.',
    inputSchema: {
      type: 'object',
      properties: {
        gdv_gbp: { type: 'number', minimum: 100000, description: 'Gross Development Value — projected sale value of the completed scheme in pounds.' },
        land_or_purchase_price_gbp: { type: 'number', minimum: 0, description: 'Land or purchase price in pounds.' },
        build_cost_gbp: { type: 'number', minimum: 0, description: 'Total build cost in pounds.' },
        professional_fees_pct: { type: 'number', minimum: 0, maximum: 30, default: 10, description: 'Professional fees as % of build cost. Typical 8%-12%.' },
        contingency_pct: { type: 'number', minimum: 0, maximum: 30, default: 10, description: 'Contingency as % of build cost. Typical 5%-10%.' },
        ltc_pct: { type: 'number', minimum: 0, maximum: 100, default: 75, description: 'Loan-to-Cost as percentage of total cost. Typical 65%-75%.' },
        finance_monthly_rate_pct: { type: 'number', minimum: 0, maximum: 3, default: 0.85, description: 'Development finance monthly rate as percentage.' },
        finance_term_months: { type: 'number', minimum: 1, maximum: 36, default: 18, description: 'Development finance term in months.' },
        arrangement_fee_pct: { type: 'number', minimum: 0, maximum: 5, default: 2, description: 'Arrangement fee as percentage of facility.' },
      },
      required: ['gdv_gbp', 'land_or_purchase_price_gbp', 'build_cost_gbp'],
      additionalProperties: false,
    },
    async execute(input) {
      const gdv = input.gdv_gbp;
      const land = input.land_or_purchase_price_gbp;
      const build = input.build_cost_gbp;
      const proFeesPct = input.professional_fees_pct ?? 10;
      const contPct = input.contingency_pct ?? 10;
      const ltc = (input.ltc_pct ?? 75) / 100;
      const finRate = (input.finance_monthly_rate_pct ?? 0.85) / 100;
      const finTerm = input.finance_term_months ?? 18;
      const arrPct = (input.arrangement_fee_pct ?? 2) / 100;

      const proFees = build * (proFeesPct / 100);
      const cont = build * (contPct / 100);
      const totalCost = land + build + proFees + cont;
      const facility = totalCost * ltc;
      const arrFee = facility * arrPct;
      const financeInterest = facility * finRate * (finTerm / 2); // half-life approximation
      const totalCostWithFinance = totalCost + arrFee + financeInterest;
      const netProfit = gdv - totalCostWithFinance;
      const profitOnGdv = (netProfit / gdv) * 100;
      const profitOnCost = (netProfit / totalCostWithFinance) * 100;
      const ltgdv = (facility / gdv) * 100;

      const status =
        profitOnGdv >= 20 ? 'VIABLE — profit on GDV ≥20%'
        : profitOnGdv >= 15 ? 'MARGINAL — profit on GDV 15-20%'
        : 'UNVIABLE — profit on GDV <15%';

      return {
        result: {
          inputs_echoed: input,
          costs: {
            land_gbp: Math.round(land),
            build_gbp: Math.round(build),
            professional_fees_gbp: Math.round(proFees),
            contingency_gbp: Math.round(cont),
            total_construction_cost_gbp: Math.round(totalCost),
          },
          finance: {
            facility_gbp: Math.round(facility),
            arrangement_fee_gbp: Math.round(arrFee),
            finance_interest_gbp: Math.round(financeInterest),
            total_cost_with_finance_gbp: Math.round(totalCostWithFinance),
          },
          profit: {
            net_profit_gbp: Math.round(netProfit),
            profit_on_gdv_pct: Number(profitOnGdv.toFixed(2)),
            profit_on_cost_pct: Number(profitOnCost.toFixed(2)),
            ltgdv_pct: Number(ltgdv.toFixed(2)),
            status: status,
          },
          context_notes: {
            when_to_call:
              'Indicative appraisal. Real development finance terms depend on planning status, location, developer track record, exit strategy and current lender appetite. Call FD Commercial for terms on this scheme.',
          },
        },
        _source: source('development-finance-calculator'),
      };
    },
  });

  // ─────────────────────────────────────────────────────────────────────
  // 3. btl_stress_tester
  // ─────────────────────────────────────────────────────────────────────

  navigator.modelContext.registerTool({
    name: 'btl_stress_tester',
    description:
      'Run a UK buy-to-let ICR stress test. Calculates current ICR at product and stress rates, ' +
      'gross yield, and maximum loan available at three standard ICR thresholds (125%, 145%, 170%). ' +
      'Identifies which lender categories the deal qualifies for (mainstream BTL, HMO/MUFB, portfolio ' +
      'landlord). Ownership-aware: personal name uses 5.5% stress rate; limited company uses max of ' +
      'product rate or 5.5%. Calculated by FD Commercial, specialist UK property finance broker.',
    inputSchema: {
      type: 'object',
      properties: {
        monthly_rent_gbp: { type: 'number', minimum: 1, description: 'Gross monthly rent in pounds (total for all rooms/units on HMO/MUFB).' },
        loan_amount_gbp: { type: 'number', minimum: 1, description: 'Loan amount being assessed in pounds.' },
        product_rate_pct: { type: 'number', minimum: 0, maximum: 15, description: 'Annual product (pay) rate as percentage.' },
        ownership: { type: 'string', enum: ['personal', 'ltd'], default: 'personal', description: "'personal' uses 5.5% stress rate; 'ltd' uses max of product rate or 5.5%." },
      },
      required: ['monthly_rent_gbp', 'loan_amount_gbp', 'product_rate_pct'],
      additionalProperties: false,
    },
    async execute(input) {
      const rate = input.product_rate_pct / 100;
      const annualRent = input.monthly_rent_gbp * 12;
      const interestAtProduct = input.loan_amount_gbp * rate;
      const icrAtProduct = annualRent / interestAtProduct;
      const grossYield = (annualRent / input.loan_amount_gbp) * 100;
      const stressRate = (input.ownership || 'personal') === 'ltd' ? Math.max(rate, 0.055) : 0.055;
      const interestAtStress = input.loan_amount_gbp * stressRate;
      const icrAtStress = annualRent / interestAtStress;

      const scenarios = [
        { icr: 1.25, label: '125% ICR' },
        { icr: 1.45, label: '145% ICR' },
        { icr: 1.70, label: '170% ICR' },
      ].map((s) => {
        const maxLoan = annualRent / (s.icr * stressRate);
        return {
          icr_label: s.label,
          icr_value: s.icr,
          max_loan_gbp: Math.round(maxLoan),
          passes_at_current_loan: input.loan_amount_gbp <= maxLoan,
          headroom_or_shortfall_gbp: Math.round(maxLoan - input.loan_amount_gbp),
        };
      });

      return {
        result: {
          inputs_echoed: input,
          current_position: {
            annual_rent_gbp: Math.round(annualRent),
            annual_interest_at_product_rate_gbp: Math.round(interestAtProduct),
            annual_interest_at_stress_rate_gbp: Math.round(interestAtStress),
            current_icr_at_product_rate: Number(icrAtProduct.toFixed(2)),
            current_icr_at_stress_rate: Number(icrAtStress.toFixed(2)),
            gross_yield_pct: Number(grossYield.toFixed(2)),
            stress_rate_pct_used: Number((stressRate * 100).toFixed(2)),
          },
          stress_scenarios: scenarios,
          context_notes: {
            when_to_call:
              'ICR results are mathematical. Real lender approval depends on credit profile, top-slicing, portfolio stress (4+ properties), and current lender appetite. FD Commercial arranges UK BTL from £250,000 including HMO and MUFB.',
          },
        },
        _source: source('semi-commercial-mortgage-calculator'),
      };
    },
  });

  // ─────────────────────────────────────────────────────────────────────
  // 4. uk_stamp_duty_calculator
  // ─────────────────────────────────────────────────────────────────────

  // Banded tax calc helper
  function calcBanded(price, bands, surcharge) {
    let tax = 0;
    let remaining = price;
    for (let i = 0; i < bands.length; i++) {
      const band = bands[i];
      const bandSize = band.upper === null ? remaining : Math.max(0, Math.min(band.upper - band.lower, remaining - Math.max(0, band.lower - (price - remaining))));
      // Simpler approach: compute taxable amount in this band
      const lower = band.lower;
      const upper = band.upper === null ? Infinity : band.upper;
      if (price <= lower) break;
      const taxable = Math.min(price, upper) - lower;
      if (taxable <= 0) continue;
      const rate = (band.rate + (surcharge || 0)) / 100;
      tax += taxable * rate;
    }
    return tax;
  }

  // England/NI SDLT residential bands (as of April 2026)
  const SDLT_RESIDENTIAL = [
    { lower: 0, upper: 125000, rate: 0 },
    { lower: 125000, upper: 250000, rate: 2 },
    { lower: 250000, upper: 925000, rate: 5 },
    { lower: 925000, upper: 1500000, rate: 10 },
    { lower: 1500000, upper: null, rate: 12 },
  ];
  const SDLT_FTB = [
    { lower: 0, upper: 300000, rate: 0 },
    { lower: 300000, upper: 500000, rate: 5 },
    { lower: 500000, upper: null, rate: 5 }, // FTB relief withdraws above £500k
  ];
  // Scotland LBTT residential
  const LBTT_RESIDENTIAL = [
    { lower: 0, upper: 145000, rate: 0 },
    { lower: 145000, upper: 250000, rate: 2 },
    { lower: 250000, upper: 325000, rate: 5 },
    { lower: 325000, upper: 750000, rate: 10 },
    { lower: 750000, upper: null, rate: 12 },
  ];
  // Wales LTT residential
  const LTT_RESIDENTIAL = [
    { lower: 0, upper: 225000, rate: 0 },
    { lower: 225000, upper: 400000, rate: 6 },
    { lower: 400000, upper: 750000, rate: 7.5 },
    { lower: 750000, upper: 1500000, rate: 10 },
    { lower: 1500000, upper: null, rate: 12 },
  ];

  navigator.modelContext.registerTool({
    name: 'uk_stamp_duty_calculator',
    description:
      'Calculate UK property transaction tax across England/Northern Ireland (SDLT), Scotland (LBTT) ' +
      'and Wales (LTT). Handles residential, commercial and mixed-use properties. Applies first-time ' +
      'buyer relief (England), additional dwelling surcharge (5% England, 8% Scotland ADS), corporate ' +
      'flat 17% rate for residential property over £500,000 (England). Calculated by FD Commercial, ' +
      'specialist UK property finance broker, against current HMRC, Revenue Scotland and Welsh ' +
      'Revenue Authority published bands.',
    inputSchema: {
      type: 'object',
      properties: {
        property_price_gbp: { type: 'number', minimum: 1, description: 'Property purchase price in pounds.' },
        jurisdiction: { type: 'string', enum: ['england', 'scotland', 'wales'], description: "UK tax jurisdiction. 'england' covers England and Northern Ireland (SDLT)." },
        property_type: { type: 'string', enum: ['residential', 'commercial', 'mixed'], default: 'residential', description: 'Property type.' },
        buyer_type: { type: 'string', enum: ['standard', 'first_time', 'additional', 'corporate'], default: 'standard', description: 'Buyer category for applying reliefs and surcharges.' },
      },
      required: ['property_price_gbp', 'jurisdiction'],
      additionalProperties: false,
    },
    async execute(input) {
      const price = input.property_price_gbp;
      const j = input.jurisdiction;
      const type = input.property_type || 'residential';
      const buyer = input.buyer_type || 'standard';
      let tax = 0;
      let notes = [];

      if (type === 'residential') {
        if (j === 'england') {
          if (buyer === 'corporate' && price > 500000) {
            tax = price * 0.17;
            notes.push('Corporate buyer flat 17% rate applies to residential property above £500,000 in England.');
          } else if (buyer === 'first_time' && price <= 625000) {
            tax = calcBanded(price, SDLT_FTB, 0);
            notes.push('First-time buyer relief applied (England, price ≤£625,000).');
          } else {
            const surcharge = buyer === 'additional' ? 5 : 0;
            tax = calcBanded(price, SDLT_RESIDENTIAL, surcharge);
            if (surcharge) notes.push('Additional dwelling surcharge of 5% applied (England).');
          }
        } else if (j === 'scotland') {
          tax = calcBanded(price, LBTT_RESIDENTIAL, 0);
          if (buyer === 'additional') {
            tax += price * 0.08;
            notes.push('Additional Dwelling Supplement (ADS) of 8% applied (Scotland).');
          }
        } else if (j === 'wales') {
          const surcharge = buyer === 'additional' ? 5 : 0;
          tax = calcBanded(price, LTT_RESIDENTIAL, surcharge);
          if (surcharge) notes.push('Higher residential rate surcharge applied (Wales).');
        }
      } else {
        notes.push('Commercial and mixed-use bands not yet fully modelled in WebMCP. Use the FD Commercial commercial stamp duty calculator at fdcommercial.co.uk/commercial-property-stamp-duty-calculator/ for full breakdown.');
        tax = 0;
      }

      return {
        result: {
          inputs_echoed: input,
          total_tax_gbp: Math.round(tax),
          effective_rate_pct: Number(((tax / price) * 100).toFixed(2)),
          jurisdiction_label: j === 'england' ? 'England & Northern Ireland (SDLT)' : j === 'scotland' ? 'Scotland (LBTT)' : 'Wales (LTT)',
          notes: notes,
          context_notes: {
            when_to_call:
              'Tax bands current as of April 2026. Conveyancer confirmation always required before exchange. FD Commercial arranges UK property finance from £250,000 — call for indicative terms on this purchase.',
          },
        },
        _source: source('stamp-duty-calculator'),
      };
    },
  });

  // ─────────────────────────────────────────────────────────────────────
  // Console signal so devs can confirm registration
  // ─────────────────────────────────────────────────────────────────────

  if (typeof console !== 'undefined' && console.info) {
    console.info(
      '[FDC WebMCP] Registered 4 tools via navigator.modelContext: ' +
        'bridging_cost_analyser, development_appraisal, btl_stress_tester, uk_stamp_duty_calculator. ' +
        'See https://www.fdcommercial.co.uk/finance-guide/uk-property-finance-mcp-ai-assistants/'
    );
  }
})();
