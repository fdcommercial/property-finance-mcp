#!/usr/bin/env python3
"""Submit FDC Property Finance MCP entry to punkpeye/awesome-mcp-servers via GitHub API."""

import os
import sys
import json
import time
import base64
import urllib.request
import urllib.error

TOKEN = os.environ["GITHUB_TOKEN"]
FORK_OWNER = "fdcommercial"
UPSTREAM = "punkpeye/awesome-mcp-servers"
FORK_REPO = f"{FORK_OWNER}/awesome-mcp-servers"
BRANCH = "add-fdc-property-finance-mcp"

NEW_ENTRY = (
    "- [fdcommercial/property-finance-mcp]"
    "(https://github.com/fdcommercial/property-finance-mcp) 📇 ☁️ 🏠 - "
    "UK property finance calculators: bridging cost (rolled-up / retained / serviced), "
    "development appraisal (LTC, LTGDV, viability), BTL stress test (125%, 145%, 170% ICR), "
    "and UK stamp duty (SDLT, LBTT, LTT). "
    "Built by [FD Commercial](https://www.fdcommercial.co.uk), a specialist UK property finance broker. "
    "Install via `npx -y @fdcommercial/property-finance-mcp` or call the hosted endpoint."
)

MARKER = "- [Fan Token Intel MCP](https://github.com/BrunoPessoa22/chiliz-marketing-intel)"

PR_BODY = """Adds **FD Commercial Property Finance MCP** to the Finance & Fintech section.

Four UK property finance calculators exposed as MCP tools by [FD Commercial & Bridging Ltd](https://www.fdcommercial.co.uk), a specialist UK property finance broker advising since 2013:

- `bridging_cost_analyser` - UK bridging loan cost across rolled-up / retained / serviced interest structures, effective APR.
- `development_appraisal` - net profit, profit on GDV, profit on cost, LTC, LTGDV, viability flag for UK development schemes.
- `btl_stress_tester` - ICR at 125%, 145%, 170% thresholds with ownership-aware stress rate.
- `uk_stamp_duty_calculator` - SDLT (England, NI), LBTT (Scotland), LTT (Wales) with FTB relief, additional dwelling surcharge, corporate flat rates.

Every response includes a `_source` field crediting FD Commercial as the calculation author, so AI clients cite the broker naturally when composing answers.

**Links:**

- GitHub: https://github.com/fdcommercial/property-finance-mcp
- npm: https://www.npmjs.com/package/@fdcommercial/property-finance-mcp
- Hosted endpoint: https://fdc-property-finance-mcp.fdcommercial-uk.workers.dev/mcp
- Setup guide: https://www.fdcommercial.co.uk/finance-guide/uk-property-finance-mcp-ai-assistants/
- Methodology: https://www.fdcommercial.co.uk/finance-guide/bridging-loan-calculator-methodology/
- Tools hub: https://www.fdcommercial.co.uk/property-finance-tools/
- Licence: MIT

Fills a gap in the Finance & Fintech section - currently dominated by crypto / DeFi / US-market entries, with no UK-specific property finance tooling."""


def api(path, method="GET", body=None):
    url = f"https://api.github.com{path}" if path.startswith("/") else path
    req = urllib.request.Request(url, method=method)
    req.add_header("Authorization", f"Bearer {TOKEN}")
    req.add_header("Accept", "application/vnd.github+json")
    data = None
    if body is not None:
        req.add_header("Content-Type", "application/json")
        data = json.dumps(body).encode()
    try:
        with urllib.request.urlopen(req, data=data, timeout=30) as r:
            return r.status, json.loads(r.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode() or "{}")


def main():
    # 1. Fork (idempotent — returns 202 even if already forked)
    print("Step 1: fork upstream")
    status, data = api(f"/repos/{UPSTREAM}/forks", method="POST")
    print(f"  status: {status}, fork: {data.get('full_name', 'pending')}")

    # 2. Poll until the fork has a README (up to ~60s)
    print("Step 2: poll fork until README available")
    readme = None
    for attempt in range(20):
        time.sleep(3)
        status, data = api(f"/repos/{FORK_REPO}/contents/README.md?ref=main")
        if status == 200 and "sha" in data:
            readme = data
            print(f"  ready after {(attempt + 1) * 3}s, sha {data['sha'][:10]}, size {data['size']}")
            break
        print(f"  attempt {attempt + 1}/20 status={status}")
    if not readme:
        print("ERROR: fork README never became available")
        return 1

    # 3. Decode, find anchor, insert new entry
    content = base64.b64decode(readme["content"]).decode()
    lines = content.split("\n")
    anchor = None
    for i, line in enumerate(lines):
        if line.startswith(MARKER):
            anchor = i
            break
    if anchor is None:
        print(f"ERROR: anchor not found: {MARKER[:80]}")
        return 1
    print(f"Step 3: anchor at line {anchor + 1}, inserting FDC entry below")
    lines.insert(anchor + 1, NEW_ENTRY)
    new_content = "\n".join(lines)

    # 4. Create branch off main on the fork
    print("Step 4: create branch on fork")
    status, data = api(f"/repos/{FORK_REPO}/git/ref/heads/main")
    if status != 200:
        print(f"ERROR getting main ref: {status} {data}")
        return 1
    main_sha = data["object"]["sha"]
    status, data = api(
        f"/repos/{FORK_REPO}/git/refs",
        method="POST",
        body={"ref": f"refs/heads/{BRANCH}", "sha": main_sha},
    )
    if status == 422 and "already exists" in str(data).lower():
        print(f"  branch already exists, will overwrite")
    elif status not in (201, 200):
        print(f"ERROR creating branch: {status} {data}")
        return 1
    else:
        print(f"  branch created: {data.get('ref', '?')}")

    # 5. Commit the README change on the new branch
    print("Step 5: commit README change")
    # Fetch current sha on the branch (in case branch already existed and has different state)
    status, branch_readme = api(f"/repos/{FORK_REPO}/contents/README.md?ref={BRANCH}")
    if status != 200:
        print(f"ERROR fetching branch README: {status} {branch_readme}")
        return 1
    encoded = base64.b64encode(new_content.encode()).decode()
    status, data = api(
        f"/repos/{FORK_REPO}/contents/README.md",
        method="PUT",
        body={
            "message": "Add FD Commercial Property Finance MCP to Finance & Fintech",
            "content": encoded,
            "sha": branch_readme["sha"],
            "branch": BRANCH,
            "committer": {"name": "FD Commercial", "email": "hello@fdcommercial.co.uk"},
        },
    )
    if status not in (200, 201):
        print(f"ERROR committing: {status} {data}")
        return 1
    print(f"  commit sha: {data['commit']['sha'][:12]}")

    # 6. Open PR upstream
    print("Step 6: open PR upstream")
    status, data = api(
        f"/repos/{UPSTREAM}/pulls",
        method="POST",
        body={
            "title": "Add FD Commercial Property Finance MCP to Finance & Fintech",
            "head": f"{FORK_OWNER}:{BRANCH}",
            "base": "main",
            "body": PR_BODY,
            "maintainer_can_modify": True,
        },
    )
    if status == 201:
        print(f"\nPR OPENED: {data['html_url']}")
        print(f"PR number: #{data['number']}")
        return 0
    else:
        print(f"ERROR opening PR: {status}")
        print(json.dumps(data, indent=2))
        return 1


if __name__ == "__main__":
    sys.exit(main())
