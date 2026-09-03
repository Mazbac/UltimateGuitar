# Quality Evidence

Create a project-specific `QUALITY_EVIDENCE.md` from this template before lifecycle `VERIFY`. Evidence must describe what was actually exercised, not only restate requirements.

- Overall status: PENDING
- Challenger status: PENDING
- Candidate/revision context: UNSET

## Outcome and golden journeys
- User outcome evidence: UNSET
- Golden journeys exercised: UNSET
- Important failure/recovery journeys: UNSET

## Engineering and security evidence
- Static/build/test evidence: UNSET
- Security/threat-model evidence: UNSET
- Clean environment/reproducibility evidence: UNSET

## Product experience evidence
- First-use/defaults/feedback/recovery evidence: UNSET
- Lifecycle install/update/reset/uninstall evidence when applicable: UNSET
- Performance/perceived-progress evidence when applicable: UNSET
## UI / interaction evidence
Use `not-applicable` only when no meaningful UI exists.
- Surface coverage and primary intent: UNSET
- Visual evidence locations: UNSET
- Responsive/windowing/platform behavior: UNSET
- Accessibility/input evidence: UNSET
- Empty/loading/error/destructive/content-stress evidence: UNSET
- Design-system/component/terminology consistency audit: UNSET
- AI-default/removal audit: UNSET

## Challenger review
A fresh-eyes review must actively search for reasons the candidate should not ship: hidden assumptions, generic AI patterns, inconsistent behavior, weak hierarchy, confusing terminology, missing states, platform violations, lifecycle friction, security/recovery gaps and evidence omissions.

- Challenger reviewer/context: UNSET
- Material gaps found: UNSET
- Fixes or explicit non-applicable rationale: UNSET
- Remaining release blockers: UNSET

## Evidence integrity
- Evidence refers to the current candidate or explicitly identifies any older fixture/baseline.
- Screenshots support visual judgment but do not replace semantic/state assertions.
- A reproduced deterministic defect receives regression coverage where practical.
- `PENDING` or `UNSET` is not permitted once lifecycle reaches `VERIFY`.
