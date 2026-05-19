/**
 * UK property transaction tax rate bands as of April 2026.
 *
 * - England / Northern Ireland: Stamp Duty Land Tax (SDLT)
 * - Scotland: Land and Buildings Transaction Tax (LBTT)
 * - Wales: Land Transaction Tax (LTT)
 *
 * Sources:
 * - HMRC SDLT rates: https://www.gov.uk/stamp-duty-land-tax/residential-property-rates
 * - Revenue Scotland LBTT: https://www.revenue.scot/taxes/land-buildings-transaction-tax
 * - Welsh Revenue Authority LTT: https://www.gov.wales/land-transaction-tax-rates-and-bands
 *
 * Surcharges noted on each table. Update when government changes rates.
 * Last reviewed: April 2026.
 */

export interface Band {
  /** Upper threshold of this band, in pounds. Use Infinity for top band. */
  threshold: number;
  /** Rate as decimal: 0.05 = 5% */
  rate: number;
}

// ─────────────────────────────────────────────────────────────────────────
// ENGLAND / NORTHERN IRELAND — SDLT
// ─────────────────────────────────────────────────────────────────────────

/** Standard residential SDLT bands (main residence, not first-time buyer) */
export const SDLT_RESIDENTIAL: Band[] = [
  { threshold: 250000, rate: 0 },
  { threshold: 925000, rate: 0.05 },
  { threshold: 1500000, rate: 0.1 },
  { threshold: Infinity, rate: 0.12 },
];

/**
 * First-time buyer relief: 0% up to £425,000, 5% on £425k-£625k.
 * Property must be £625,000 or below to qualify. Above £625k, standard
 * residential bands apply with no relief.
 */
export const SDLT_FIRST_TIME_BUYER: Band[] = [
  { threshold: 425000, rate: 0 },
  { threshold: 625000, rate: 0.05 },
];

/** Non-residential and mixed-use SDLT bands. No surcharge for additional. */
export const SDLT_COMMERCIAL: Band[] = [
  { threshold: 150000, rate: 0 },
  { threshold: 250000, rate: 0.02 },
  { threshold: Infinity, rate: 0.05 },
];

/**
 * Additional dwelling surcharge (England). Applied on top of standard
 * residential bands for buyers purchasing additional property or buyers
 * who own other residential property worldwide.
 *
 * Note: increased from 3% to 5% effective 31 October 2024 (Autumn Budget).
 * Set to 0.05 here. Confirm current rate with HMRC before relying.
 */
export const SDLT_ADDITIONAL_DWELLING_SURCHARGE = 0.05;

/**
 * Corporate purchases of residential property above £500,000 by non-natural
 * persons attract a flat 17% rate (single flat rate, not banded). Below
 * £500,000, standard additional-dwelling rates apply.
 */
export const SDLT_CORPORATE_RESIDENTIAL_FLAT_RATE_THRESHOLD = 500000;
export const SDLT_CORPORATE_RESIDENTIAL_FLAT_RATE = 0.17;

// ─────────────────────────────────────────────────────────────────────────
// SCOTLAND — LBTT
// ─────────────────────────────────────────────────────────────────────────

export const LBTT_RESIDENTIAL: Band[] = [
  { threshold: 145000, rate: 0 },
  { threshold: 250000, rate: 0.02 },
  { threshold: 325000, rate: 0.05 },
  { threshold: 750000, rate: 0.1 },
  { threshold: Infinity, rate: 0.12 },
];

export const LBTT_COMMERCIAL: Band[] = [
  { threshold: 150000, rate: 0 },
  { threshold: 250000, rate: 0.01 },
  { threshold: Infinity, rate: 0.05 },
];

/**
 * Additional Dwelling Supplement (Scotland): 8% of the FULL purchase
 * price (not banded). Applied as a single flat amount on top of standard
 * LBTT. Effective from 5 December 2024 (was 6% before that date).
 */
export const LBTT_ADS_RATE_OF_FULL_PRICE = 0.08;

// ─────────────────────────────────────────────────────────────────────────
// WALES — LTT
// ─────────────────────────────────────────────────────────────────────────

/** Main residential LTT (Wales) - from 10 October 2022 */
export const LTT_RESIDENTIAL_MAIN: Band[] = [
  { threshold: 225000, rate: 0 },
  { threshold: 400000, rate: 0.06 },
  { threshold: 750000, rate: 0.075 },
  { threshold: 1500000, rate: 0.1 },
  { threshold: Infinity, rate: 0.12 },
];

/**
 * Higher residential rates (Wales) - for additional dwellings.
 * Effective from 11 December 2024. Separate banded table, NOT a
 * surcharge added to the main rates.
 */
export const LTT_RESIDENTIAL_ADDITIONAL: Band[] = [
  { threshold: 180000, rate: 0.05 },
  { threshold: 250000, rate: 0.085 },
  { threshold: 400000, rate: 0.1 },
  { threshold: 750000, rate: 0.125 },
  { threshold: 1500000, rate: 0.15 },
  { threshold: Infinity, rate: 0.17 },
];

export const LTT_COMMERCIAL: Band[] = [
  { threshold: 225000, rate: 0 },
  { threshold: 250000, rate: 0.01 },
  { threshold: 1000000, rate: 0.05 },
  { threshold: Infinity, rate: 0.06 },
];

// ─────────────────────────────────────────────────────────────────────────
// Banded tax calculator
// ─────────────────────────────────────────────────────────────────────────

export interface BandBreakdown {
  band_from_gbp: number;
  band_to_gbp: number | "above";
  rate_pct: number;
  taxable_amount_in_band_gbp: number;
  tax_in_band_gbp: number;
}

export interface BandedTaxResult {
  total_tax_gbp: number;
  breakdown: BandBreakdown[];
}

/**
 * Calculate banded tax: apply each band's rate to the portion of the
 * purchase price falling within that band. This is the standard UK
 * property transaction tax calculation method.
 *
 * @param price - purchase price in pounds
 * @param bands - array of tax bands (must be in ascending threshold order)
 * @param surchargeOnEachBand - optional flat surcharge applied to every band's rate
 */
export function calcBandedTax(
  price: number,
  bands: Band[],
  surchargeOnEachBand = 0
): BandedTaxResult {
  let totalTax = 0;
  let previousThreshold = 0;
  const breakdown: BandBreakdown[] = [];

  for (let i = 0; i < bands.length; i++) {
    const band = bands[i];
    if (price <= previousThreshold) break;

    const upperOfThisBand =
      band.threshold === Infinity
        ? price
        : Math.min(price, band.threshold);
    const taxableInBand = upperOfThisBand - previousThreshold;
    const effectiveRate = band.rate + surchargeOnEachBand;
    const taxInBand = taxableInBand * effectiveRate;

    totalTax += taxInBand;

    breakdown.push({
      band_from_gbp: previousThreshold,
      band_to_gbp: band.threshold === Infinity ? "above" : band.threshold,
      rate_pct: Number((effectiveRate * 100).toFixed(2)),
      taxable_amount_in_band_gbp: Math.round(taxableInBand),
      tax_in_band_gbp: Math.round(taxInBand),
    });

    previousThreshold = band.threshold;
    if (price <= band.threshold) break;
  }

  return {
    total_tax_gbp: Math.round(totalTax),
    breakdown,
  };
}
