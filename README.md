# This package has moved

The property finance calculators in this repository are now maintained as part of the Fox Davidson MCP server.

- **npm:** [`@foxdavidson/property-mortgage-mcp`](https://www.npmjs.com/package/@foxdavidson/property-mortgage-mcp)
- **Source:** [github.com/foxdavidson/property-mortgage-mcp](https://github.com/foxdavidson/property-mortgage-mcp)
- **Hosted endpoint:** `https://fd-property-mortgage-mcp.fdcommercial-uk.workers.dev/mcp`

The new server includes every tool that was here (`bridging_cost_analyser`, `development_appraisal`, `btl_stress_tester`, `uk_stamp_duty_calculator`) plus a high net worth mortgage qualification check and a full UK bridging loan calculator.

The old hosted endpoint, `https://fdc-property-finance-mcp.fdcommercial-uk.workers.dev/mcp`, keeps working and now serves the same tools, so existing connectors do not need changing.

To install locally:

```json
"fd-property-mortgage": { "command": "npx", "args": ["-y", "@foxdavidson/property-mortgage-mcp"] }
```

This repository is no longer updated.
