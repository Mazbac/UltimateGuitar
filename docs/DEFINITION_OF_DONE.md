# Definition of Done

A feature/release is done only when every applicable item below is satisfied with current evidence. Not-applicable items require an explicit reason. Model confidence or a green happy-path test cannot substitute for missing evidence.

## Product
- Accepted user outcome works end-to-end, including meaningful edge/error states.
- Scope/non-goals and changed assumptions are reflected in durable repository state.
- Applicable golden journeys succeed through the real product surface.

## Context integrity
- Manifest/schema/lifecycle checks pass.
- Required repository context was resolved deterministically and read through the context-pack completion marker for the affected scopes.
- `STATUS.md` and durable project sources reflect current project meaning and do not contradict stronger technical evidence.
- Material architecture, product, security and design decisions/preferences needed by replacement chats are persisted.

## Engineering
- Clean checkout/bootstrap works from documented prerequisites.
- Formatting/lint/type/schema/config checks pass where applicable.
- Unit/integration tests pass; critical journeys have E2E coverage proportional to risk.
- Build/package succeeds without relying on untracked local files or undeclared local dependency residue.
- No unexplained runtime, browser console or relevant network errors.
## Security
- Threat-model impact reviewed.
- Authorization/input/data handling are tested at relevant trust boundaries.
- Applicable dependency, secret and static/security scans are green; local secret protection covers relevant pre-commit/untracked candidates.
- No unresolved high/critical security finding.

## Design / UX
- Project design system, component contracts and component strategy are respected; no unexplained one-off visual/interaction/terminology patterns.
- Every material surface has deliberate intent/hierarchy and platform/windowing/adaptive behavior where applicable.
- Accessibility and applicable environment/resize/zoom/text-scaling/input checks pass.
- Empty/minimal/normal/excessive content plus loading/error/disabled/destructive and realistic long/awkward data states are deliberate where applicable.
- AI-default/removal audit has challenged unnecessary repetition, decoration, controls, color/icon/motion use and inconsistent geometry.
- Current visual evidence covers material surfaces/high-risk states rather than only a convenient representative default screen.

## Professional product experience
- First-use path reaches the intended first useful outcome without unnecessary technical configuration.
- Defaults, permissions, onboarding, terminology, feedback, progress and recovery are appropriate for the target audience.
- Avoidable developer/internal implementation details are not exposed to ordinary users.
- Performance/perceived progress on critical journeys is acceptable for the product context.
- Applicable install, update/migration, repair/reset, uninstall/data handling and reinstall journeys behave deliberately and professionally.
## Evidence and challenger
- At lifecycle VERIFY and later, `quality.evidence` points to a tracked project evidence source with no `UNSET`/`PENDING` placeholders.
- Evidence states what was actually exercised, where visual/runtime/test artifacts live, and what was explicitly not applicable.
- A fresh-eyes challenger review actively searched for hidden assumptions, generic AI patterns, missing states, consistency gaps, platform/lifecycle violations and evidence omissions.
- No unresolved challenger release blocker remains.

## Release
- Clean/reproducible install or deployment is verified.
- Upgrade/migration and rollback are verified when data/runtime changes require them.
- Version/release notes and artifact/source revision match.
- Release artifact/distribution passes representative golden-journey smoke tests.
- Current independent CI/gates are green for the revision being released; stale textual claims are not release evidence.
