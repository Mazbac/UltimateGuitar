# Autonomous ChatGPT Project Template

A stack-neutral source-of-truth repository for building software with normal ChatGPT + GitHub + Desktop Commander, with the user acting as product owner rather than technical intermediary.

## Core guarantee target
The template targets **session invariance plus evidence-based product maturity**: a replacement ChatGPT session should reconstruct substantially the same durable product meaning and next priority, resolve the context required for the current task, and be unable to advance release lifecycle merely by claiming a review occurred.

## What this template provides
- Deterministic lifecycle/task-aware context resolution through `.project/context-map.json` and `.automation/context-pack.mjs`, including source hashes and an explicit EOF/completion marker.
- Durable project memory, source precedence and context reconciliation.
- Product discovery from raw natural-language intent, including incomplete brand/design input.
- Architecture and decision records before irreversible complexity.
- Professional Product Experience requirements across first use, daily use, failure recovery and applicable install/update/uninstall lifecycle.
- Product-design methodology with reference-class/platform research, surface intent, project design systems/tokens, component contracts, terminology and realistic-content stress without forcing one visual style/library.
- AI-default/removal auditing and fresh-eyes challenger review for user-facing maturity.
- Secure-development requirements and explicit threat modelling.
- Risk-based unit/integration/E2E/security/accessibility/visual/golden-journey testing plus tracked project quality evidence at VERIFY.
- Schema-driven manifest, lifecycle/context/evidence gates and adversarial template canaries.
- Git/PR/CI quality gates, reproducible release/recovery rules and a hard Definition of Done.
## Start
Read `START_HERE.md`, then `AGENTS.md`. On a local clone, activate repository hooks, generate/read the deterministic context pack, run doctor/validator/context-integrity/freshness checks, and only then change project state.

## Design philosophy
The template owns the design/proof process; each project owns its design language. Reuse proven interaction behavior, own the product design, respect platform conventions, challenge unexamined AI/framework defaults, and treat setup/error/update/uninstall experience as part of release quality.

## Git safety
This private repository's current GitHub plan does not expose server-side rulesets or classic branch protection. A versioned pre-push hook blocks accidental local direct pushes to `main`/`master`; PR + green independent CI remains mandatory policy. Enable server-side protection when available.

The stack never chooses the product. Technology, component libraries, concrete UI geometry and distribution mechanisms are selected after product constraints are understood.
