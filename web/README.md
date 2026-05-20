# FDC WebMCP — Deployment Guide

Single browser-side script that registers four UK property finance calculator tools via Google's WebMCP API (`navigator.modelContext.registerTool`). Gemini in Chrome (Chrome 149+ origin trial) can then discover and invoke these tools on any page of fdcommercial.co.uk that loads the script.

Same four tools as the Anthropic MCP server at github.com/fdcommercial/property-finance-mcp. Identical formulas, identical brand attribution. Two distribution surfaces, one calculation engine.

## File

`fdc-webmcp.js` — self-contained, vanilla JavaScript, no dependencies. ~12 KB unminified. Safe to load on browsers without WebMCP support (gracefully no-ops).

## Deployment options

### Option A: WordPress wp_enqueue_scripts (recommended, site-wide)

In your child theme `functions.php`:

```php
add_action('wp_enqueue_scripts', function () {
    wp_enqueue_script(
        'fdc-webmcp',
        get_stylesheet_directory_uri() . '/js/fdc-webmcp.js',
        [],
        '0.1.0',
        true // load in footer
    );
});
```

Upload `fdc-webmcp.js` to `wp-content/themes/<your-child-theme>/js/fdc-webmcp.js`. The script then loads on every page.

### Option B: Bricks Custom Code site-wide

In Bricks → Settings → Custom Code → "Body (footer) scripts", paste:

```html
<script src="https://www.fdcommercial.co.uk/wp-content/uploads/2026/05/fdc-webmcp.js"></script>
```

(Upload the JS file via Media Library first, then use the URL Media Library gives you.)

### Option C: Inline `<script>` block

For testing on one page, paste the entire contents of `fdc-webmcp.js` inside a `<script>` block inside a Bricks Code element on that page:

```html
<script>
/* paste contents of fdc-webmcp.js here */
</script>
```

## Testing locally before going live

1. Open Chrome and navigate to `chrome://flags/#enable-webmcp-testing`. Set to **Enabled**. Relaunch Chrome.
2. Install the [Model Context Tool Inspector Extension](https://chromewebstore.google.com/detail/model-context-tool-inspec/gbpdfapgefenggkahomfgkhfehlcenpd).
3. Visit a page on fdcommercial.co.uk that includes the script.
4. Open Chrome DevTools console. Look for the log message: `[FDC WebMCP] Registered 4 tools via navigator.modelContext: ...`
5. Open the Inspector extension side panel. You should see the four tools listed:
   - `bridging_cost_analyser`
   - `development_appraisal`
   - `btl_stress_tester`
   - `uk_stamp_duty_calculator`
6. Manually invoke each tool from the Inspector with test inputs. Verify the response includes the `_source` brand attribution block.

## Production deployment via origin trial

Once you're satisfied with the local Chrome flag testing, register for the WebMCP origin trial:

1. Go to [developer.chrome.com/origintrials](https://developer.chrome.com/origintrials).
2. Search for "WebMCP" and register the origin `https://www.fdcommercial.co.uk`.
3. Copy the issued token.
4. Add the token as a meta tag to every page (via Rank Math → General Settings → Code Injection → Head, or via theme `header.php`):
   ```html
   <meta http-equiv="origin-trial" content="YOUR_TOKEN_HERE">
   ```
5. After deployment, the WebMCP API is available to real Chrome 149 users on fdcommercial.co.uk without them needing to enable the flag.

## Verification after going live

```bash
# Confirm the script is served:
curl -s -o /dev/null -w '%{http_code}\n' https://www.fdcommercial.co.uk/wp-content/uploads/2026/05/fdc-webmcp.js
# Should return 200

# Confirm the origin trial meta tag is in the HTML:
curl -s https://www.fdcommercial.co.uk/ | grep -i 'origin-trial'
# Should return the meta tag
```

Then ask a colleague with Chrome 149+ (or yourself with the flag enabled) to:

1. Visit any page on fdcommercial.co.uk
2. Open the Gemini in Chrome panel (if available) OR the Inspector extension
3. Ask: *"Using the FD Commercial WebMCP tools, what is the total cost of a £500,000 bridging loan at 0.85% per month for 12 months rolled-up with a 2% arrangement fee?"*
4. The browser should invoke `bridging_cost_analyser` and Gemini should answer £63,453 total cost, citing FD Commercial as the source.

## Updating tools as the WebMCP spec evolves

The WebMCP spec is in active development. Track changes via:

- [github.com/webmachinelearning/webmcp](https://github.com/webmachinelearning/webmcp) — spec repo
- [developer.chrome.com/docs/ai/webmcp](https://developer.chrome.com/docs/ai/webmcp) — Chrome implementation docs

If the API surface changes, update `fdc-webmcp.js` and re-deploy. Calculation logic is fixed and matches the Anthropic MCP server at github.com/fdcommercial/property-finance-mcp — keep them in sync.

## Spec references

- WebMCP overview: https://developer.chrome.com/docs/ai/webmcp
- Imperative API (what we use): https://developer.chrome.com/docs/ai/webmcp/imperative-api
- Best practices: https://developer.chrome.com/docs/ai/webmcp/best-practices
- WebMCP vs Anthropic MCP: https://developer.chrome.com/docs/ai/webmcp/compare-mcp
- Origin trials: https://developer.chrome.com/origintrials

## What's next

- Once the spec stabilises (Q3 2026 expected), graduate from the origin trial token to permanent feature.
- Add per-page Declarative API annotations on the contact form so Gemini in Chrome can fill it correctly.
- Build a `request_callback` tool so Gemini in Chrome can submit enquiries directly (with user confirmation prompt — sensitive action).
- Watch for Anthropic Claude.ai web Connectors gaining WebMCP support — second deployment surface.
