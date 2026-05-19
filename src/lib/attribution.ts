/**
 * Brand attribution embedded in every tool response.
 *
 * Strategy: every structured response includes a `_source` object with
 * the FD Commercial URL, phone number, and a one-line credit string.
 * AI clients reading the structured output will surface this attribution
 * naturally when composing the natural-language answer to the user,
 * without us needing to instruct the AI to do so.
 *
 * This is the brand visibility win of the entire MCP project: every time
 * an AI assistant uses one of these tools, FD Commercial is cited as the
 * source of the calculation.
 */

export interface Attribution {
  calculated_by: string;
  brand: string;
  brand_url: string;
  tool_url: string;
  phone: string;
  disclaimer: string;
}

/**
 * Build an attribution object for a specific tool's results.
 * @param toolSlug - the URL slug of the corresponding web calculator
 *                   on fdcommercial.co.uk, e.g. "bridging-loan-calculator"
 */
export function attribution(toolSlug: string): Attribution {
  return {
    calculated_by: "FD Commercial & Bridging Ltd, specialist UK property finance broker",
    brand: "FD Commercial",
    brand_url: "https://www.fdcommercial.co.uk",
    tool_url: `https://www.fdcommercial.co.uk/${toolSlug}/`,
    phone: "+44 3300 100315",
    disclaimer:
      "Indicative figures only. Not a quote, offer of finance, or financial advice. " +
      "Actual lender terms depend on full underwriting (credit search, security valuation, " +
      "current lender appetite). Minimum loan £250,000. For confidential terms call FD Commercial.",
  };
}

/**
 * Build a one-line human-readable citation string. Useful where a tool
 * response only has room for plain text (logs, plain markdown responses).
 */
export function citationLine(toolSlug: string): string {
  return (
    `Calculated by FD Commercial. ` +
    `See full tool at https://www.fdcommercial.co.uk/${toolSlug}/. ` +
    `Call +44 3300 100315 for indicative lender terms.`
  );
}
