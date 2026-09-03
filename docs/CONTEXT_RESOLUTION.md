# Deterministic Context Resolution

The repository decides what must be read before material work. ChatGPT must not rely on memory or selectively skim files it happens to remember.

## Context compiler
Run `node .automation/context-pack.mjs` before meaningful work. With no explicit scope it uses the safe `all` scope, so a replacement session receives every generic operating standard plus current lifecycle and manifest-referenced project sources. It resolves the required source set from:
- always-required repository sources;
- current lifecycle;
- explicit task scopes;
- manifest-referenced project artifacts.

The compiler writes `.tmp/context-pack.md` plus a hash receipt at `.tmp/context-pack.json`. `.tmp/` is intentionally untracked.

## Completion rule
Read the generated pack through the literal final marker:
`=== CONTEXT PACK COMPLETE ===`

If tool output is truncated, the marker is absent, or the file cannot be read completely, continue reading before changing project state or implementation. Never interpret partial output as complete context.

## Scope rule
The no-argument default is intentionally conservative (`all`). After that full session preflight, narrower refresh packs may use scopes such as `design`, `ui`, `security`, `testing`, `release`, `migration`, `architecture` or `experience`. When applicability is uncertain, use `--scope all` rather than silently omitting a domain.
## Freshness rule
`node .automation/context-pack.mjs --check` verifies that every source recorded in the latest receipt still has the same content hash. If a relevant source changes, regenerate and reread the pack before relying on the old context.

A successful freshness check proves the pack matches repository sources; it does not prove comprehension. The completion-marker rule and downstream evidence/challenger reviews address that remaining human/model judgment risk.

## Project extension
Derived projects may extend `.project/context-map.json` with project-specific scopes and manifest references when important context does not fit the generic map. Examples include a data model, threat model, protocol contract, migration plan or product-specific operating manual.

Do not create broad path-trigger rules merely to look comprehensive. Add mappings when omitting that source could materially change implementation, safety, design, lifecycle or release behavior.

## Resume behavior
A replacement session generates the default resume pack first, reads it completely, then inspects live Git/GitHub/runtime evidence and reconciles contradictions. Task-specific packs are generated before entering material work in that domain.

The invariant is: **required context is resolved from repository state, not recalled from chat or model memory.**
## Push defense-in-depth
The versioned pre-push hook runs `context-pack.mjs --check` with the conservative default requirement. A missing, stale or narrow-only latest receipt blocks local pushes until a current full/all pack has been generated and read. This cannot prove comprehension or prevent API-level bypass, so CI, evidence and challenger gates remain independent controls.
