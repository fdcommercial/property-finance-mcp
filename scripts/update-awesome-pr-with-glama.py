#!/usr/bin/env python3
"""Update the awesome-mcp-servers PR with the Glama score badge."""

import os
import sys
import json
import base64
import urllib.request
import urllib.error

TOKEN = os.environ["GITHUB_TOKEN"]
FORK_REPO = "fdcommercial/awesome-mcp-servers"
BRANCH = "add-fdc-property-finance-mcp"

# Old entry (just the link + emojis, no badge)
OLD_ENTRY = (
    "- [fdcommercial/property-finance-mcp]"
    "(https://github.com/fdcommercial/property-finance-mcp) 📇 ☁️ 🏠 - "
    "UK property finance calculators: bridging cost (rolled-up / retained / serviced), "
    "development appraisal (LTC, LTGDV, viability), BTL stress test (125%, 145%, 170% ICR), "
    "and UK stamp duty (SDLT, LBTT, LTT). "
    "Built by [FD Commercial](https://www.fdcommercial.co.uk), a specialist UK property finance broker. "
    "Install via `npx -y @fdcommercial/property-finance-mcp` or call the hosted endpoint."
)

# New entry (link + glama badge + emojis)
NEW_ENTRY = (
    "- [fdcommercial/property-finance-mcp]"
    "(https://github.com/fdcommercial/property-finance-mcp) "
    "[![fdcommercial/property-finance-mcp MCP server]"
    "(https://glama.ai/mcp/servers/fdcommercial/property-finance-mcp/badges/score.svg)]"
    "(https://glama.ai/mcp/servers/fdcommercial/property-finance-mcp) "
    "📇 ☁️ 🏠 - "
    "UK property finance calculators: bridging cost (rolled-up / retained / serviced), "
    "development appraisal (LTC, LTGDV, viability), BTL stress test (125%, 145%, 170% ICR), "
    "and UK stamp duty (SDLT, LBTT, LTT). "
    "Built by [FD Commercial](https://www.fdcommercial.co.uk), a specialist UK property finance broker. "
    "Install via `npx -y @fdcommercial/property-finance-mcp` or call the hosted endpoint."
)


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
    print(f"Fetching README from {FORK_REPO}:{BRANCH}")
    status, data = api(f"/repos/{FORK_REPO}/contents/README.md?ref={BRANCH}")
    if status != 200:
        print(f"ERROR: {status} {data}")
        return 1
    sha = data["sha"]
    content = base64.b64decode(data["content"]).decode()
    print(f"  sha {sha[:12]}, size {len(content)} chars")

    if OLD_ENTRY not in content:
        print("ERROR: old entry not found in README — already updated, or entry format differs")
        # Search for fdcommercial entry to debug
        for i, line in enumerate(content.split("\n")):
            if "fdcommercial" in line.lower():
                print(f"  line {i+1}: {line[:200]}")
        return 1

    new_content = content.replace(OLD_ENTRY, NEW_ENTRY)
    print(f"  replaced — new size {len(new_content)} chars (delta +{len(new_content) - len(content)})")

    print("Committing badge update")
    encoded = base64.b64encode(new_content.encode()).decode()
    status, data = api(
        f"/repos/{FORK_REPO}/contents/README.md",
        method="PUT",
        body={
            "message": "Add Glama score badge to FD Commercial entry",
            "content": encoded,
            "sha": sha,
            "branch": BRANCH,
            "committer": {"name": "FD Commercial", "email": "hello@fdcommercial.co.uk"},
        },
    )
    if status not in (200, 201):
        print(f"ERROR: {status} {data}")
        return 1
    print(f"  commit sha: {data['commit']['sha'][:12]}")
    print(f"  PR will auto-update — bot should re-run within 1-2 minutes")
    return 0


if __name__ == "__main__":
    sys.exit(main())
