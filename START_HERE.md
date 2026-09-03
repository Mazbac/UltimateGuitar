# Start Here

Use this repository for one project only. Do not import assumptions or rules from other repositories unless the user explicitly asks.

## New project prompt
`Use this repository as the source of truth. Read AGENTS.md and resolve the required repository context before work. I will describe what I want in natural language. Own the technical work end-to-end through a secure, professional, consumer-ready, tested release. Preserve cross-chat consistency and do not make me the technical intermediary.`

## Deterministic first-run / resume sequence
1. Read `AGENTS.md` and `.project/manifest.json` so the repository contract and context compiler location are known.
2. When local Git is available, run `node .automation/bootstrap.mjs` once for the clone.
3. Run `node .automation/context-pack.mjs`; read `.tmp/context-pack.md` completely through `=== CONTEXT PACK COMPLETE ===`.
4. Run `node .automation/doctor.mjs`, `node .automation/validate.mjs`, `node .automation/context-integrity.mjs` and `node .automation/context-pack.mjs --check`.
5. Inspect Git status, branches, open PRs and current CI before trusting textual status claims.
6. Reconcile contradictions using `docs/CONTEXT_INTEGRITY.md` before making changes.
7. Before material domain work, regenerate the pack with applicable scopes such as `--scope ui,design`, `security`, `migration`, `testing`, `release` or `all` when uncertain.
8. If manifest mode is `template`, enter discovery and turn raw natural-language intent into a bounded first useful release.
9. Choose architecture, stack, product-experience strategy and UI design approach only after product constraints are understood.
10. Activate project mode using `docs/PROJECT_ACTIVATION.md`; project mode must become machine-valid before substantial implementation.
11. Work through `docs/SDLC.md`, keep durable state current, and produce explicit quality evidence before VERIFY.

## Resume prompt
`Resume this repository. Resolve and read the current repository context pack completely, inspect GitHub/working-tree/current CI evidence, reconcile contradictions, preserve accepted product/design decisions and continue autonomously from the highest-priority unfinished verified step.`

A replacement chat must not need the previous transcript. If prior conversation contains durable information not yet persisted, persist it at the next safe checkpoint.
