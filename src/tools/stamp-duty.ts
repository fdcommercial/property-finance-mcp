/**
 * UK STAMP DUTY CALCULATOR
 *
 * Calculates property transaction tax across England (SDLT), Scotland
 * (LBTT) and Wales (LTT). Handles residential, commercial and mixed-use
 * properties, with surcharges for additional dwellings, first-time buyer
 * relief, and corporate purchases.
 *
 * Ported from the FD Commercial mobile app to keep web, mobile and MCP
 * outputs identical.
 */

import { z } from "zod";
import { attribution } from "../lib/attribution.js";
import { gbp, pct } from "../lib/formatters.js";
import type { ToolResponse } from "../lib/types.js";
import {
  SDLT_RESIDENTIAL,
  SDLT_FIRST_TIME_BUYER,
  SDLT_COMMERCIAL,
  SDLT_ADDITIONAL_DWELLING_SURCHARGE,
  SDLT_CORPORATE_RESIDENTIAL_FLAT_RATE_THRESHOLD,
  SDLT_CORPORATE_RESIDENTIAL_FLAT_RATE,
  LBTT_RESIDENTIAL,
  LBTT_COMMERCIAL,
  LBTT_ADS_RATE_OF_FULL_PRICE,
  LTT_RESIDENTIAL_MAIN,
  LTT_RESIDENTIAL_ADDITIONAL,
  LTT_COMMERCIAL,
  calcBandedTax,
  type BandedTaxResult,
} from "../rates/sdlt-rates.js";

// ─────────────────────────────────────────────────────────────────────────
// Input schema
// ─────────────────────────────────────────────────────────────────────────

export const stampDutyInputSchema = z.object({
  property_price_gbp: z
    .number()
    .positive()
    .describe(
      "Property purchase price in pounds. Example: 750000."
    ),
  jurisdiction: z
    .enum(["england", "scotland", "wales"])
    .describe(
      "Which UK tax regime applies. 'england' includes Northern Ireland (both use SDLT). 'scotland' uses LBTT. 'wales' uses LTT."
    ),
  property_type: z
    .enum(["residential", "commercial"])
    .default("residential")
    .describe(
      "'residential' for dwellings (houses, flats). 'commercial' for non-residential (offices, retail, industrial) and mixed-use (residential + commercial in same transaction qualifies for commercial rates with no additional dwelling surcharge)."
    ),
  buyer_type: z
    .enum(["standard", "ftb", "additional", "company"])
    .default("standard")
    .describe(
      "'standard' for main residence purchase by individual. 'ftb' for first-time buyer (England SDLT only — relief up to £625,000). 'additional' for second home or buy-to-let purchase by individual (surcharge applies). 'company' for corporate purchase (additional dwelling surcharge + flat 17% SDLT rate in England above £500,000)."
    ),
});

export type StampDutyInput = z.infer<typeof stampDutyInputSchema>;

// ─────────────────────────────────────────────────────────────────────────
// Calculation logic
// ─────────────────────────────────────────────────────────────────────────

interface StampDutyResult {
  inputs_echoed: StampDutyInput;
  tax_name: string;
  total_tax_gbp: number;
  effective_rate_pct: number;
  banded_breakdown: BandedTaxResult["breakdown"];
  surcharges_applied: {
    description: string;
    amount_gbp: number;
  }[];
  context_notes: {
    headline: string;
    rule_notes: string;
    when_to_call: string;
  };
}

export function runStampDutyCalculator(
  input: StampDutyInput
): ToolResponse<StampDutyResult> {
  const isCommercial = input.property_type === "commercial";
  const isCompany = input.buyer_type === "company";
  const isFtb = input.buyer_type === "ftb";
  // Companies count as additional-dwelling purchasers
  const isAdditional = input.buyer_type === "additional" || isCompany;

  let bandedResult: BandedTaxResult;
  let taxName: string;
  let ruleNotes: string;
  const surcharges: { description: string; amount_gbp: number }[] = [];

  // ─── ENGLAND / NI ────────────────────────────────────────────────────
  if (input.jurisdiction === "england") {
    taxName = "Stamp Duty Land Tax (SDLT) - England and Northern Ireland";

    if (isCommercial) {
      bandedResult = calcBandedTax(input.property_price_gbp, SDLT_COMMERCIAL, 0);
      ruleNotes =
        "Non-residential SDLT applies (also covers mixed-use). No additional dwelling surcharge on commercial property regardless of buyer type. Significantly lower tax burden than residential investment.";
    } else if (
      isCompany &&
      input.property_price_gbp > SDLT_CORPORATE_RESIDENTIAL_FLAT_RATE_THRESHOLD
    ) {
      // Corporate purchases of residential property over £500k: flat 17%
      const flatTax =
        input.property_price_gbp * SDLT_CORPORATE_RESIDENTIAL_FLAT_RATE;
      bandedResult = {
        total_tax_gbp: Math.round(flatTax),
        breakdown: [
          {
            band_from_gbp: 0,
            band_to_gbp: "above",
            rate_pct: SDLT_CORPORATE_RESIDENTIAL_FLAT_RATE * 100,
            taxable_amount_in_band_gbp: Math.round(input.property_price_gbp),
            tax_in_band_gbp: Math.round(flatTax),
          },
        ],
      };
      surcharges.push({
        description:
          "Corporate residential flat rate (non-natural person purchasing residential > £500,000)",
        amount_gbp: Math.round(flatTax),
      });
      ruleNotes =
        "Residential property purchases over £500,000 by companies (non-natural persons) attract a flat 17% SDLT rate on the entire purchase price, not banded. ATED (Annual Tax on Enveloped Dwellings) may also apply annually thereafter.";
    } else if (isFtb && input.property_price_gbp <= 625000) {
      bandedResult = calcBandedTax(
        input.property_price_gbp,
        SDLT_FIRST_TIME_BUYER,
        0
      );
      ruleNotes =
        "First-time buyer relief applied: 0% up to £425,000, 5% on the portion £425,001 to £625,000. Property must be £625,000 or below to qualify and buyer must be acquiring their main residence and have never owned a residential property worldwide.";
    } else if (isFtb && input.property_price_gbp > 625000) {
      bandedResult = calcBandedTax(input.property_price_gbp, SDLT_RESIDENTIAL, 0);
      ruleNotes =
        "Property exceeds £625,000 first-time buyer relief threshold. Standard residential SDLT rates apply, no FTB relief available.";
    } else {
      const surcharge = isAdditional ? SDLT_ADDITIONAL_DWELLING_SURCHARGE : 0;
      bandedResult = calcBandedTax(
        input.property_price_gbp,
        SDLT_RESIDENTIAL,
        surcharge
      );
      if (isAdditional) {
        const surchargeAmount =
          input.property_price_gbp * SDLT_ADDITIONAL_DWELLING_SURCHARGE;
        surcharges.push({
          description: `Additional dwelling surcharge (5% on every band, applied to additional residential properties from 31 October 2024)`,
          amount_gbp: Math.round(surchargeAmount),
        });
        ruleNotes = isCompany
          ? "Company purchases below £500,000 incur the 5% additional dwelling surcharge on top of standard residential bands. ATED may also apply annually for properties valued above £500,000."
          : "Additional dwelling surcharge of 5% applies on every band for second homes, buy-to-let, and investment properties. Surcharge raised from 3% to 5% effective 31 October 2024 (Autumn Budget). Surcharge reclaimable if previous main residence sold within 36 months.";
      } else {
        ruleNotes =
          "Standard residential SDLT rates for England and Northern Ireland: 0% to £250k, 5% to £925k, 10% to £1.5m, 12% above £1.5m.";
      }
    }
  }

  // ─── SCOTLAND ────────────────────────────────────────────────────────
  else if (input.jurisdiction === "scotland") {
    taxName = "Land and Buildings Transaction Tax (LBTT) - Scotland";

    if (isCommercial) {
      bandedResult = calcBandedTax(input.property_price_gbp, LBTT_COMMERCIAL, 0);
      ruleNotes =
        "Scottish LBTT commercial bands: 0% to £150k, 1% to £250k, 5% above £250k. No additional dwelling supplement on commercial property.";
    } else {
      bandedResult = calcBandedTax(input.property_price_gbp, LBTT_RESIDENTIAL, 0);
      if (isAdditional) {
        // Scotland ADS: 8% of FULL purchase price, not banded
        const adsAmount =
          input.property_price_gbp * LBTT_ADS_RATE_OF_FULL_PRICE;
        bandedResult.total_tax_gbp += Math.round(adsAmount);
        surcharges.push({
          description: `Additional Dwelling Supplement (ADS): 8% of full purchase price (Scotland), effective from 5 December 2024`,
          amount_gbp: Math.round(adsAmount),
        });
        ruleNotes = `Standard LBTT residential bands plus 8% ADS calculated on the full purchase price (not banded). Scotland's ADS is one of the highest combined investment property tax burdens in the UK.`;
      } else {
        ruleNotes =
          "Standard Scottish residential LBTT bands: 0% to £145k, 2% to £250k, 5% to £325k, 10% to £750k, 12% above £750k.";
      }
    }
  }

  // ─── WALES ──────────────────────────────────────────────────────────
  else {
    taxName = "Land Transaction Tax (LTT) - Wales";

    if (isCommercial) {
      bandedResult = calcBandedTax(input.property_price_gbp, LTT_COMMERCIAL, 0);
      ruleNotes =
        "Welsh LTT commercial bands: 0% to £225k, 1% to £250k, 5% to £1m, 6% above £1m. No additional dwelling surcharge on commercial.";
    } else if (isAdditional) {
      // Wales uses a separate banded higher-residential table, not a surcharge
      bandedResult = calcBandedTax(
        input.property_price_gbp,
        LTT_RESIDENTIAL_ADDITIONAL,
        0
      );
      ruleNotes =
        "Welsh higher residential LTT bands apply (separate table for additional dwellings, effective from 11 December 2024): 5% to £180k, 8.5% to £250k, 10% to £400k, 12.5% to £750k, 15% to £1.5m, 17% above £1.5m.";
    } else {
      bandedResult = calcBandedTax(input.property_price_gbp, LTT_RESIDENTIAL_MAIN, 0);
      ruleNotes =
        "Standard main residential LTT bands (Wales): 0% to £225k, 6% to £400k, 7.5% to £750k, 10% to £1.5m, 12% above £1.5m. No first-time buyer relief in Wales — first-time buyers use the standard nil-rate band of £225k.";
    }
  }

  const effectiveRate =
    input.property_price_gbp > 0
      ? (bandedResult.total_tax_gbp / input.property_price_gbp) * 100
      : 0;

  const result: StampDutyResult = {
    inputs_echoed: input,
    tax_name: taxName,
    total_tax_gbp: bandedResult.total_tax_gbp,
    effective_rate_pct: Number(effectiveRate.toFixed(2)),
    banded_breakdown: bandedResult.breakdown,
    surcharges_applied: surcharges,
    context_notes: {
      headline: `${gbp(bandedResult.total_tax_gbp)} property transaction tax on a ${gbp(input.property_price_gbp)} ${input.property_type} purchase in ${input.jurisdiction === "england" ? "England/NI" : input.jurisdiction === "scotland" ? "Scotland" : "Wales"}. Effective rate ${pct(effectiveRate, true)} of purchase price.`,
      rule_notes: ruleNotes,
      when_to_call:
        "Rates as of April 2026. Always confirm current rates and reliefs with your conveyancer or tax adviser before exchange of contracts. For property finance on this transaction (bridging, BTL, commercial, development) call FD Commercial on +44 3300 100315.",
    },
  };

  return {
    result,
    _source: attribution("stamp-duty-calculator"),
  };
}

// ─────────────────────────────────────────────────────────────────────────
// MCP tool metadata
// ─────────────────────────────────────────────────────────────────────────

export const stampDutyToolMetadata = {
  name: "uk_stamp_duty_calculator",
  title: "UK Stamp Duty Calculator (SDLT / LBTT / LTT)",
  description:
    "Calculate UK property transaction tax across England/Northern Ireland (SDLT), Scotland (LBTT) and " +
    "Wales (LTT). Handles residential, commercial and mixed-use properties. Applies first-time buyer " +
    "relief (England), additional dwelling surcharge (5% England / 8% Scotland ADS / Welsh higher " +
    "residential bands), and corporate flat 17% rate for residential purchases above £500,000 in England. " +
    "Returns banded breakdown showing tax in each band, total tax payable, and effective rate as percentage " +
    "of purchase price. Rates current as of April 2026. " +
    "Calculated by FD Commercial, specialist UK property finance broker. " +
    "Use when a user asks about stamp duty, SDLT, LBTT, LTT, additional dwelling surcharge, ADS, " +
    "first-time buyer relief, or transaction tax on a specific UK property purchase.",
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};
