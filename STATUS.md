# Current State

- Lifecycle: TEMPLATE
- Foundation status: READY
- Foundation v2 merge: `26951f5b25759ad96bcf5d6c789acf6aaff9badd`
- Foundation v3 implementation PR: #5
- Foundation v3 reviewed head: `4980e136f3e950b204a22c76a2b102318a9dc6ac`
- Foundation v3 implementation merge: `e81a3f8130362f587bd6b30c565e8f2a796da9e5`
- Manifest schema: v3
- Local v3 clean-commit validation: GREEN
- Independent v3 PR validation: GREEN — run `33799443775`, job `100794968972`
- Post-implementation `main` validation: GREEN — run `33799511017`, job `100795206032`
- Local direct-default-branch guard: VERIFIED BLOCKING

## Verified v3 foundation
- Deterministic context map/compiler resolves lifecycle, scope and manifest-referenced sources into a hashed pack with a literal completion marker.
- Context freshness detects source drift and revision drift; local feature pushes require a current full/all receipt.
- Baseline context mappings are machine-enforced so derived projects may extend but cannot silently weaken the inherited reading contract.
- Mandatory quality-policy flags are schema-locked to true rather than optional booleans.
- VERIFY and later require tracked project quality evidence with PASS overall/challenger status and no `UNSET`/`PENDING` placeholders.
- Project UI design contracts cover surface intent/hierarchy, equivalent-component behavior, terminology, content stress and platform/windowing/adaptive behavior.
- Design/experience verification includes AI-default/removal audit, realistic-content/environment stress and a fresh-eyes challenger review.
- Derived-project CI must run repository validation, context integrity and deterministic context resolution.
- Template adversarial tests reject schema/status drift, incomplete context/design activation, disabled mandatory gates, weakened context maps, incomplete VERIFY evidence and stale/revision-mismatched context packs.
- `.editorconfig` establishes cross-platform UTF-8/LF text behavior; clean-restore and pre-commit/untracked secret-scan expectations are explicit.

## Current priority
Foundation v3 is ready for normal template use. Future template changes should be intentional maintenance through the same context, adversarial-test, PR and CI discipline; ordinary product work belongs in repositories derived from this template.

## Platform constraint
GitHub server-side rulesets/classic branch protection remain unavailable for this private repository on the current plan. The versioned local pre-push guard remains defense-in-depth; PR + green independent CI is mandatory policy. Enable server-side protection if the plan/visibility later supports it.

## Known blockers
None for normal template use.
