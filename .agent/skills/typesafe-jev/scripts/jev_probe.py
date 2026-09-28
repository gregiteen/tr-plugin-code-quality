#!/usr/bin/env python3
"""Live smoke test of TypeSafe's Jev decision model through OpenRouter.

Usage:
    python3 jev_probe.py --model <id> [--secret TR_REF] [--endpoint URL]

Key: OPENROUTER_API_KEY, or --secret <ref> read with `npx total-recall secret get`
from the current directory's brain. The key is never printed. Model: --model or
JEV_MODEL. Prints the model version, answers and usage; exits 0 when the answer
is the expected one.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

DEFAULT_ENDPOINT = "https://openrouter.ai/api/v1/systemone"
STATE = "Looks great, send it out today please!"
QUESTIONS = {
    "intent": {
        "type": "choice",
        "instructions": "What does this reply to a draft email ask for?",
        "criteria": {
            "approve": "Send it as it is",
            "changes": "Change something first",
            "unclear": "Can't tell",
        },
    },
    "urgent": {"type": "noul", "instructions": "Does the reply sound urgent?"},
}


def read_key(secret_ref: str) -> str:
    key = os.getenv("OPENROUTER_API_KEY", "").strip()
    if key or not secret_ref:
        return key
    try:
        out = subprocess.run(
            ["npx", "total-recall", "secret", "get", secret_ref],
            capture_output=True,
            text=True,
            timeout=90,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        print(f"Could not read the secret: {exc}", file=sys.stderr)
        return ""
    lines = [ln.strip() for ln in out.stdout.splitlines() if ln.strip()]
    return lines[-1] if out.returncode == 0 and lines else ""


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--model", default=os.getenv("JEV_MODEL", ""))
    parser.add_argument("--secret", default="")
    parser.add_argument("--endpoint", default=DEFAULT_ENDPOINT)
    args = parser.parse_args()
    key = read_key(args.secret)
    if not key:
        print("No key: set OPENROUTER_API_KEY or pass --secret.", file=sys.stderr)
        return 2
    if not args.model:
        print("No model: pass --model (check the OpenRouter model page).", file=sys.stderr)
        return 2
    body = json.dumps({"model": args.model, "state": STATE, "questions": QUESTIONS})
    req = urllib.request.Request(
        args.endpoint,
        data=body.encode(),
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
    except urllib.error.HTTPError as exc:
        print(f"HTTP {exc.code}: {exc.read().decode()[:500]}", file=sys.stderr)
        return 1
    except (urllib.error.URLError, TimeoutError, ValueError) as exc:
        print(f"Request failed: {exc}", file=sys.stderr)
        return 1
    print(json.dumps({k: data.get(k) for k in ("model", "answers", "usage")}, indent=2))
    ok = ((data.get("answers") or {}).get("intent") or {}).get("choice") == "approve"
    print("PASS" if ok else "UNEXPECTED: expected intent=approve", file=sys.stderr)
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
