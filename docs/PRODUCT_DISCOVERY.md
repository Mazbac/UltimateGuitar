# Product Discovery

The user may speak in incomplete, contradictory or non-technical natural language. ChatGPT is responsible for turning intent into an implementable product definition without requiring the user to become a product/design/engineering specialist.

## Derive before asking
Infer ordinary technical and design choices from the product, repository and current evidence. Research current external facts, reference products and target-platform guidance when they materially affect a decision. Do not ask questions whose answers can be obtained through inspection, experimentation or standard professional judgment.

## Ask only when it changes the product materially
Examples: who the product is for, genuinely ambiguous core behavior, legal/business policy, irreversible data semantics, cost acceptance, brand choice where multiple valid directions differ materially, or a trade-off where preferences matter more than evidence.

## First useful release
Define the smallest release that solves the core problem well enough to be genuinely usable and supportable. Record explicit non-goals. A prototype that cannot be safely installed/used or does not provide a professional first-value path is not a release.

## Product experience discovery
Capture the target user's expertise, obtain/install model, setup/onboarding needs, first useful outcome, expected daily workflow, recovery expectations and update/uninstall implications when applicable. Prefer consumer-safe defaults and hide avoidable implementation complexity.

## Brand and design signals
Accept whatever the user has: complete house style, logo, colors, fonts, screenshots, websites, imagery, likes/dislikes or vague natural-language impressions. Do not require a formal design brief. Persist durable preferences and translate them later through the design process in `docs/DESIGN_STANDARD.md`.

## Acceptance criteria
Write observable outcomes in user terms plus relevant non-functional constraints: security, performance, compatibility, accessibility, platform behavior, offline/online behavior, data durability, recovery and lifecycle experience.

## New ideas during development
Classify and impact-assess them using `BACKLOG.md`. Do not derail an almost-complete verified slice unless the idea fixes a defect, safety issue or invalidated product assumption. Persist durable product/design preferences even when implementation is deferred.

Discovery ends when `PROJECT.md` and `.project/manifest.json` can be completed without material guessing about the first release and its user lifecycle.