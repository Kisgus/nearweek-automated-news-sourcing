# NEARWEEK Automated News Sourcing

Prior NEARWEEK work on automated AI x crypto news sourcing and editorial
workflow design.

This repo is part of the public work map behind the current SAIBA direction:
public ecosystem signals become structured source material, humans review the
output, and approved items can move into content or distribution workflows.

## Status

Prior work / public archive.

The repo is useful as a technical and product reference. Treat deployment notes,
automation scripts, and integration docs as historical context, not as a current
production runbook.

## What It Explored

- Monitoring public crypto and AI x crypto signals across X, ecosystem accounts,
  GitHub, and curated source lists.
- Turning noisy public updates into draft newsletters, reports, and social
  content candidates.
- Routing candidate content through Buffer, Telegram, GitHub, Zapier, and local
  webhook-style workflows.
- Keeping a manual approval step before public distribution.
- Comparing lightweight automation glue against more durable pipeline
  architecture.

## Repository Map

| Path | Purpose |
| --- | --- |
| `src/` | Express/webhook server and integration glue. |
| `scripts/` | Experiments for X/Twitter sourcing, newsletters, Buffer/Zapier-style routing, and media processing. |
| `configs/` | Historical config examples for content streams and routing decisions. |
| `docs/` | Implementation notes, scaling analysis, and integration write-ups. |
| `reports/` | Example/generated output from prior runs. |

## What It Proves

| Area | Proof |
| --- | --- |
| Ecosystem intelligence | Public signals can be turned into reusable source material instead of disappearing in feeds. |
| Content workflow | Automation helps most when it prepares drafts and context, not when it bypasses editorial judgment. |
| Distribution ops | Buffer, Telegram, GitHub, Zapier, and webhooks can form a lightweight content operations loop. |
| Bridge to SAIBA | The same pattern now appears in Agency OS and Link2Post: source signal -> draft -> human approval -> queued distribution -> receipt. |

## Public-Safe Boundary

This repo is not presented as a live autopublishing system.

- Human review is expected before publishing.
- Old performance targets should be read as experiment goals, not guaranteed
  production metrics.
- API keys, webhook secrets, account IDs, and live channel IDs should not be
  committed.
- Customer-facing or public social posts should not be sent automatically.

## Local Inspection

Install dependencies and inspect scripts locally:

```bash
npm install
npm run health
npm run test
```

Some scripts expect local environment variables or historical integrations and
may need adaptation before reuse.

## Environment Template

Use `.env.example` as the public template. Keep real values in a local secret
store such as 1Password, GitHub Actions secrets, or the deployment platform.

## Related

- [Gus profile](https://github.com/Kisgus)
- [SAIBA Agency OS](https://github.com/Kisgus/saiba-agency-os)
- [Customer Event Flywheel](https://github.com/Kisgus/customer-event-flywheel)
- [UserOwned.AI](https://github.com/Kisgus/userowned-ai)
