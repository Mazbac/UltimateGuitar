# Test Strategy

Testing follows risk, behavior and release experience, not a coverage percentage alone.

## Layers
- Contract/context: manifest schema, lifecycle prerequisites, deterministic context-map/pack resolution, required durable sources and drift checks.
- Static: formatting, linting, type/schema validation and build/config checks.
- Unit: deterministic business rules, transformations and edge cases.
- Integration: database/filesystem/network boundaries, migrations and external adapters with controlled dependencies.
- E2E: critical user journeys through the real application surface.
- Security: authorization boundaries, hostile/malformed inputs and dependency/secret scanning.
- UI: accessibility assertions, responsive/windowing/adaptive behavior, realistic-content stress, console/network cleanliness and visual regression where stable.
- Product experience: setup/onboarding, sane defaults, feedback/errors/recovery, platform conventions and lifecycle behavior.
- Release lifecycle: clean bootstrap/install, upgrade/migration, built-artifact smoke test, rollback, uninstall/reinstall and data cleanup/preservation where applicable.
- Challenger: independent/fresh-eyes attempt to find missing states, hidden assumptions, maturity gaps and evidence omissions.

## Golden journeys
Every project defines a small set of user-value journeys in the manifest before BUILD. Prefer new-user first value, returning-user primary task, representative failure/recovery and lifecycle journeys where applicable. Automate the highest-risk/most-repeatable parts and supplement with direct inspection when automation cannot judge product maturity.

## Adversarial product-state testing
Exercise applicable empty/minimal/normal/excessive content, long/awkward data, invalid input, denial/cancellation, delayed dependencies, restart/resume, offline/timeout, destructive actions and platform/environment extremes. The project chooses applicable dimensions; silent omission is not evidence.
## Regression rule
A reproduced defect gets a failing automated test before or alongside the fix whenever technically reasonable. Product-experience, context-drift and deterministic visual/state defects receive regression coverage too. If a defect cannot be made deterministic, add it to the explicit review/evidence contract instead of pretending it is covered.

## UI automation and visual evidence
For web software, use semantic locators (role/label/text/test-id) rather than pixel coordinates. Test additional browser engines when compatibility matters. Capture traces/screenshots on failure and inspect browser console/network errors. Screenshots support visual judgment; they do not replace state assertions.

Current visual evidence should cover material surfaces and high-risk states declared by the project. Do not infer complete UI review from one convenient default-size screenshot.

## Clean-environment rule
CI and release verification must install/restore declared dependencies from a clean checkout unless a validated immutable cache explicitly supplies them. Do not use local build residue or skip restore merely because the developer machine already has generated dependency state.

## Security-scan scope
Secret scanning intended to protect a developer working tree must consider tracked files plus relevant untracked, non-ignored candidate files. A scan limited to already tracked files can miss a secret before first commit. CI still scans the committed candidate independently.

## Evidence reliability
Tests must be deterministic enough to act as gates. Fix flaky tests or underlying races; do not normalize rerunning until green. Project manifest and CI name the exact verification commands used as release evidence. At VERIFY, `quality.evidence` records the exercised matrices, current results and challenger review.

## Template adversarial testing
The template itself maintains positive and negative canaries. Changes to governance/enforcement must prove that the valid template passes and representative invalid states are rejected, including context drift, incomplete context resolution, disabled mandatory quality gates, incomplete design activation and missing/incomplete VERIFY evidence.
