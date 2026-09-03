# Context Integrity and Session Invariance

The repository must make important project truth reconstructable without prior chat history and must deterministically resolve the sources required for the current work.

## Primary invariant
Given the same repository revision and available tooling, competent replacement ChatGPT sessions should reconstruct substantially the same product intent, current state, architecture, design language, security boundaries, open risks and next engineering priority.

This is session invariance. Exact wording or implementation choices may differ; durable project meaning must not.

## No hidden project state
Information that can materially change future work must not live only in chat. Persist it in the appropriate repository source: product intent in `PROJECT.md`, technical boundaries in `ARCHITECTURE.md`, durable rationale in `DECISIONS.md`, current verified state in `STATUS.md`, ordered work in `PLAN.md`, hazards in `RISKS.md`, deferred scope in `BACKLOG.md`, UI design language in the manifest-referenced design system, and verification results in the manifest-referenced quality evidence when required.

## Deterministic context resolution
Do not expect a replacement model to remember which files are relevant. `.project/context-map.json` defines always-required, lifecycle, scope and manifest-referenced context. `node .automation/context-pack.mjs` compiles that state into one ordered pack with source hashes and a completion marker.

Before material work, read the generated pack completely. If the final marker is absent because tool output or file reading was truncated, context loading is incomplete. Use `--scope all` when the task spans domains or applicability is uncertain. See `docs/CONTEXT_RESOLUTION.md`.
## Source precedence
When sources disagree, reconcile in this order:
1. Live technical evidence: working tree, runtime state, CI, tests and deployed/release evidence.
2. Machine-readable owned state: `.project/manifest.json`, context map and project configuration.
3. Durable contracts: `PROJECT.md`, `ARCHITECTURE.md`, `DECISIONS.md`, security/design/experience artifacts.
4. Execution memory and evidence: `STATUS.md`, `PLAN.md`, `RISKS.md`, `BACKLOG.md`, quality evidence.
5. Chat history and conversational summaries.

A lower-precedence source must never silently override stronger evidence. Investigate the conflict, repair durable state and continue from the reconciled truth.

## Durable input classification
ChatGPT classifies meaningful user input without asking the user to maintain project records:
- ephemeral instruction: affects only the current action;
- durable project decision: changes future product, architecture, security, operations or release behavior and must be persisted;
- durable product/design preference: changes future user experience or visual/interaction direction and must be persisted in the appropriate design/product source.

## Decision continuity
Accepted durable decisions remain authoritative until evidence or requirements justify change. Do not silently rewrite history. Supersede a decision with a new decision that identifies what changed and why.
## Resume reconciliation
Every replacement session generates and completely reads the current default context pack, inspects Git/branches/open PRs/current CI, runs repository validation when a working tree is available, reconciles contradictions, and only then continues from the highest-priority unfinished verified step. Generate task-scoped context before entering material work in a specific domain.

## Checkpoint rule
Before ending meaningful work, persist changes that future sessions need. A chat summary is never the only copy of a decision, blocker, migration instruction, design preference or verified state.

## Machine enforcement
`node .automation/context-integrity.mjs` validates machine-checkable invariants. `node .automation/context-pack.mjs --check` verifies that the latest generated pack still matches its recorded sources. Neither can prove semantic comprehension, so design/evidence/challenger reviews remain necessary. Context-integrity failures block lifecycle advancement and release.
