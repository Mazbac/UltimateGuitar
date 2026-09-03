## Outcome
Describe the user/product outcome, not only files changed.

## Verification evidence
- [ ] Relevant static/build checks pass.
- [ ] Relevant unit/integration/E2E/golden-journey tests pass.
- [ ] Regression coverage was added for fixed defects where practical.
- [ ] Clean bootstrap/build impact was checked.
- [ ] `node .automation/context-integrity.mjs` passes.
- [ ] Required quality evidence is current for this candidate when lifecycle requires it.

## Context continuity
- [ ] The required context pack was generated/read completely for the affected scopes.
- [ ] Durable product/architecture/design decisions or preferences were persisted where needed.
- [ ] `STATUS.md`, `PLAN.md`, `RISKS.md`, `DECISIONS.md` and referenced sources were updated when affected.
- [ ] No stale status claim contradicts stronger Git/CI/runtime evidence.

## Security
- [ ] Threat-model impact reviewed.
- [ ] Authorization/input/secret/dependency risks checked as applicable.
- [ ] No unresolved high/critical security finding.
## Design / product experience (if applicable)
- [ ] Project design system/component contracts and platform conventions were respected.
- [ ] Surface intent/hierarchy, terminology, component geometry and action hierarchy were audited for unexplained drift.
- [ ] Relevant responsive/windowing, accessibility, content-stress and UI states were exercised.
- [ ] AI-default/removal audit was completed: decorative/repeated/unnecessary elements were challenged.
- [ ] Current visual evidence covers material user-facing surfaces/states rather than only a convenient representative screen.
- [ ] Setup/defaults/errors/recovery and applicable install/update/uninstall behavior were reviewed.

## Challenger review
- [ ] A fresh-eyes review actively searched for reasons the candidate should not ship.
- [ ] Material maturity/evidence gaps were fixed or explicitly justified as not applicable.
- [ ] No unresolved challenger release blocker remains.

## Release / recovery
- [ ] Migration/upgrade and rollback implications reviewed.
- [ ] Applicable installer/updater/uninstaller/reinstall paths were checked.
- [ ] Release evidence applies to the revision/artifact being proposed.

Not-applicable items require a short reason in the PR description.
