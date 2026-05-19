/**
 * Shared types used across multiple tools.
 */

import type { Attribution } from "./attribution.js";

/**
 * Every tool's structured response wraps its specific output with this
 * envelope. The `_source` attribution travels with every result and is
 * how AI clients learn to cite FD Commercial when surfacing the answer.
 */
export interface ToolResponse<T> {
  result: T;
  _source: Attribution;
}

/**
 * The three interest structures used on UK bridging loans. The single
 * largest decision a borrower makes that the headline rate hides.
 */
export type InterestStructure = "rolled" | "retained" | "serviced";

/**
 * UK jurisdictions for property transaction tax. Each has its own tax
 * regime: SDLT (England/NI), LBTT (Scotland), LTT (Wales).
 */
export type UkJurisdiction = "england" | "scotland" | "wales";

/**
 * Property type for stamp duty purposes. Commercial rates are uniformly
 * lower than residential and carry no additional dwelling surcharge.
 */
export type PropertyType = "residential" | "commercial";

/**
 * Buyer profile for stamp duty surcharge purposes.
 */
export type BuyerType = "standard" | "ftb" | "additional" | "company";

/**
 * Ownership structure for BTL purposes — affects ICR stress test multiplier.
 */
export type Ownership = "personal" | "ltd";
